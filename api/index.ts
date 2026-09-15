/// <reference types="node" />
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import knex, { Knex } from 'knex';

// ─── Database (Supabase / PostgreSQL only on Vercel) ─────────────────────────
const DATABASE_URL = process.env.DATABASE_URL!;
const db: Knex = knex({
  client: 'pg',
  connection: {
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  },
  pool: { min: 0, max: 5 },
});

// ─── Crypto helpers (AES-256-GCM) ────────────────────────────────────────────
const ALGORITHM = 'aes-256-gcm';
function getKey(): Buffer {
  const k = process.env.ENCRYPTION_KEY!;
  if (/^[0-9a-fA-F]{64}$/.test(k)) return Buffer.from(k, 'hex');
  return crypto.createHash('sha256').update(k).digest();
}
function encrypt(text: string): string {
  if (!text) return '';
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: 16 });
  let enc = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
  return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${enc}`;
}
function decrypt(combined: string): string {
  if (!combined) return '';
  const parts = combined.split(':');
  if (parts.length !== 3) return combined;
  try {
    const [ivHex, authTagHex, encHex] = parts;
    const dec = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'), { authTagLength: 16 });
    dec.setAuthTag(Buffer.from(authTagHex, 'hex'));
    return dec.update(encHex, 'hex', 'utf8') + dec.final('utf8');
  } catch {
    return '[DADO RESTRITO]';
  }
}
function encryptJSON(data: unknown): string { return encrypt(JSON.stringify(data)); }
function decryptJSON<T>(c: string): T | null {
  const d = decrypt(c);
  if (!d || d.startsWith('[DADO RESTRITO')) return null;
  try { return JSON.parse(d) as T; } catch { return null; }
}

// ─── Audit ───────────────────────────────────────────────────────────────────
async function audit(action: string, userId?: string | null, details?: string | null, ip?: string | null) {
  try {
    await db('audit_logs').insert({
      id: crypto.randomUUID(), action,
      userId: userId || null, patientId: null,
      details: details ? details.substring(0, 300) : null,
      ipAddress: ip || null, userAgent: null,
      createdAt: new Date().toISOString(),
    });
  } catch { /* non-fatal */ }
}

// ─── Auth middleware ──────────────────────────────────────────────────────────
type AuthReq = Request & {
  user?: { id: string; email: string; name: string; twoFactorEnabled: boolean; }
}
async function authMiddleware(req: AuthReq, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) { res.status(401).json({ error: 'Token de autenticação não fornecido.' }); return; }
  const token = header.split(' ')[1];
  const secret = process.env.JWT_SECRET!;
  try {
    const payload = jwt.verify(token, secret) as { userId: string; email: string; sessionVersion: number };
    const user = await db('users').where({ id: payload.userId }).select('id', 'email', 'name', 'twoFactorEnabled', 'sessionVersion', 'lockedUntil').first();
    if (!user) { res.status(401).json({ error: 'Usuário não encontrado.' }); return; }
    if (user.sessionVersion !== payload.sessionVersion) { res.status(401).json({ error: 'Sessão revogada.' }); return; }
    req.user = { id: user.id, email: user.email, name: user.name, twoFactorEnabled: !!user.twoFactorEnabled };
    next();
  } catch { res.status(401).json({ error: 'Sessão inválida ou expirada.' }); }
}

// ─── Express App ─────────────────────────────────────────────────────────────
const app = express();
const CLIENT_URL = process.env.CLIENT_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app-psico-alpha.vercel.app';

app.use(cors({ origin: [CLIENT_URL, 'http://localhost:5173', /vercel\.app$/], credentials: true }));
app.use(express.json({ limit: '10mb' }));

// ─── Routes: Auth ─────────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 5;
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const ip = (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
  if (!email || !password) { res.status(400).json({ error: 'E-mail e senha são obrigatórios.' }); return; }
  const user = await db('users').where({ email: email.toLowerCase().trim() }).first();
  if (!user) {
    await bcrypt.compare('dummy123', '$2a$12$e8Y5tGzO9N5aYJ9N/bL4e.uG2hXm6Q2gU7.4lX2bU5.1nQ5nK.qye');
    await audit('LOGIN_FAILED', null, 'E-mail inexistente', ip);
    res.status(401).json({ error: 'Credenciais inválidas.' }); return;
  }
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const mins = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
    res.status(403).json({ error: `Conta bloqueada. Tente em ${mins} min.`, isLocked: true }); return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    const lockedUntil = attempts >= MAX_ATTEMPTS ? new Date(Date.now() + 15 * 60000).toISOString() : null;
    await db('users').where({ id: user.id }).update({ failedLoginAttempts: attempts, lockedUntil, updatedAt: new Date().toISOString() });
    await audit('LOGIN_FAILED', user.id, 'Senha incorreta', ip);
    res.status(401).json({ error: 'Credenciais inválidas.' }); return;
  }
  await db('users').where({ id: user.id }).update({ failedLoginAttempts: 0, lockedUntil: null, updatedAt: new Date().toISOString() });
  const token = jwt.sign({ userId: user.id, email: user.email, sessionVersion: user.sessionVersion }, process.env.JWT_SECRET!, { expiresIn: '8h' });
  await audit('LOGIN', user.id, 'Login efetuado com sucesso', ip);
  res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name, twoFactorEnabled: !!user.twoFactorEnabled } });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  const ip = (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
  if (!name?.trim()) { res.status(400).json({ error: 'Nome é obrigatório.' }); return; }
  if (!email?.trim() || !email.includes('@')) { res.status(400).json({ error: 'E-mail válido é obrigatório.' }); return; }
  if (!password || password.length < 8) { res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres.' }); return; }
  const cleanEmail = email.toLowerCase().trim();
  const existing = await db('users').where({ email: cleanEmail }).first();
  if (existing) { res.status(409).json({ error: 'Já existe uma conta com este e-mail.' }); return; }
  const passwordHash = await bcrypt.hash(password.trim(), 12);
  const userId = crypto.randomUUID();
  await db('users').insert({ id: userId, name: name.trim(), email: cleanEmail, passwordHash, twoFactorEnabled: false, sessionVersion: 1, failedLoginAttempts: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  const hasSett = await db('professional_settings').where({ id: 'default' }).first();
  if (!hasSett) await db('professional_settings').insert({ id: 'default', therapistName: name.trim(), crp: '00/00000', updatedAt: new Date().toISOString() });
  const token = jwt.sign({ userId, email: cleanEmail, sessionVersion: 1 }, process.env.JWT_SECRET!, { expiresIn: '8h' });
  await audit('USER_REGISTERED', userId, `Cadastro: ${cleanEmail}`, ip);
  res.status(201).json({ success: true, token, user: { id: userId, email: cleanEmail, name: name.trim(), twoFactorEnabled: false } });
});

app.get('/api/auth/me', authMiddleware as any, async (req: AuthReq, res) => {
  const settings = await db('professional_settings').where({ id: 'default' }).first();
  res.json({ user: req.user, settings: settings || { therapistName: req.user?.name, crp: '00/00000' } });
});

app.put('/api/auth/profile', authMiddleware as any, async (req: AuthReq, res) => {
  const user = req.user!;
  const { name, email } = req.body;
  if (!name?.trim()) { res.status(400).json({ error: 'Nome não pode ser vazio.' }); return; }
  if (!email?.trim() || !email.includes('@')) { res.status(400).json({ error: 'E-mail inválido.' }); return; }
  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail !== user.email) {
    const exists = await db('users').where({ email: cleanEmail }).whereNot({ id: user.id }).first();
    if (exists) { res.status(409).json({ error: 'E-mail já está em uso.' }); return; }
  }
  await db('users').where({ id: user.id }).update({ name: name.trim(), email: cleanEmail, updatedAt: new Date().toISOString() });
  const sett = await db('professional_settings').where({ id: 'default' }).first();
  if (sett && (sett.therapistName === user.name || !sett.therapistName)) {
    await db('professional_settings').where({ id: 'default' }).update({ therapistName: name.trim(), updatedAt: new Date().toISOString() });
  }
  await audit('PROFILE_UPDATED', user.id, `Perfil atualizado: ${name.trim()} (${cleanEmail})`);
  const dbUser = await db('users').where({ id: user.id }).first();
  const token = jwt.sign({ userId: user.id, email: cleanEmail, sessionVersion: dbUser.sessionVersion }, process.env.JWT_SECRET!, { expiresIn: '8h' });
  res.json({ success: true, token, user: { id: user.id, email: cleanEmail, name: name.trim(), twoFactorEnabled: !!dbUser.twoFactorEnabled }, message: 'Perfil atualizado!' });
});

app.put('/api/auth/change-password', authMiddleware as any, async (req: AuthReq, res) => {
  const user = req.user!;
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword) { res.status(400).json({ error: 'Senha atual é obrigatória.' }); return; }
  if (!newPassword || newPassword.length < 8) { res.status(400).json({ error: 'Nova senha deve ter ao menos 8 caracteres.' }); return; }
  const dbUser = await db('users').where({ id: user.id }).first();
  const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
  if (!valid) { res.status(400).json({ error: 'Senha atual incorreta.' }); return; }
  const newHash = await bcrypt.hash(newPassword.trim(), 12);
  const newVersion = (dbUser.sessionVersion || 1) + 1;
  await db('users').where({ id: user.id }).update({ passwordHash: newHash, sessionVersion: newVersion, failedLoginAttempts: 0, lockedUntil: null, updatedAt: new Date().toISOString() });
  await audit('PASSWORD_CHANGED', user.id, 'Senha alterada pelo usuário');
  const token = jwt.sign({ userId: user.id, email: dbUser.email, sessionVersion: newVersion }, process.env.JWT_SECRET!, { expiresIn: '8h' });
  res.json({ success: true, token, message: 'Senha alterada com sucesso! Outras sessões foram desconectadas.' });
});

// ─── Routes: Patients ─────────────────────────────────────────────────────────
app.get('/api/pacientes', authMiddleware as any, async (req: AuthReq, res) => {
  const q = (req.query.q as string)?.trim() || '';
  const status = (req.query.status as string) || 'ATIVO';
  let query = db('patients').select('patients.*',
    db.raw('(SELECT COUNT(*) FROM sessions WHERE sessions."patientId" = patients.id) as "totalSessions"'),
    db.raw('(SELECT COUNT(*) FROM assessment_assignments WHERE assessment_assignments."patientId" = patients.id) as "totalAssignments"'),
    db.raw('(SELECT "sessionDate" FROM sessions WHERE sessions."patientId" = patients.id ORDER BY "sessionDate" DESC LIMIT 1) as "lastSessionDate"')
  );
  if (status !== 'TODOS') query = query.where('patients.status', status);
  if (q) query = query.whereILike('patients.fullName', `%${q}%`);
  const patients = await query.orderBy('patients.fullName', 'asc');
  res.json({ patients: patients.map((p: any) => ({ ...p, notes: decrypt(p.notes || '') })) });
});

app.post('/api/pacientes', authMiddleware as any, async (req: AuthReq, res) => {
  const { fullName, birthDate, email, phone, notes } = req.body;
  if (!fullName?.trim() || !birthDate?.trim()) { res.status(400).json({ error: 'Nome e data de nascimento são obrigatórios.' }); return; }
  const id = crypto.randomUUID();
  await db('patients').insert({ id, fullName: fullName.trim(), birthDate, email: email || null, phone: phone || null, notes: notes ? encrypt(notes) : null, status: 'ATIVO', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  await audit('PATIENT_CREATED', req.user!.id, `Paciente criado: ${fullName}`);
  const patient = await db('patients').where({ id }).first();
  res.status(201).json({ patient: { ...patient, notes: decrypt(patient?.notes || '') } });
});

app.get('/api/pacientes/:id', authMiddleware as any, async (req: AuthReq, res) => {
  const patient = await db('patients').where({ id: req.params.id }).first();
  if (!patient) { res.status(404).json({ error: 'Paciente não encontrado.' }); return; }
  res.json({ patient: { ...patient, notes: decrypt(patient.notes || '') } });
});

app.put('/api/pacientes/:id', authMiddleware as any, async (req: AuthReq, res) => {
  const { fullName, birthDate, email, phone, notes } = req.body;
  await db('patients').where({ id: req.params.id }).update({ fullName, birthDate, email: email || null, phone: phone || null, notes: notes ? encrypt(notes) : null, updatedAt: new Date().toISOString() });
  await audit('PATIENT_UPDATED', req.user!.id, `Paciente atualizado: ${req.params.id}`);
  const patient = await db('patients').where({ id: req.params.id }).first();
  res.json({ patient: { ...patient, notes: decrypt(patient?.notes || '') } });
});

app.patch('/api/pacientes/:id', authMiddleware as any, async (req: AuthReq, res) => {
  const patient = await db('patients').where({ id: req.params.id }).first();
  if (!patient) { res.status(404).json({ error: 'Paciente não encontrado.' }); return; }
  const newStatus = patient.status === 'ATIVO' ? 'ARQUIVADO' : 'ATIVO';
  await db('patients').where({ id: req.params.id }).update({ status: newStatus, updatedAt: new Date().toISOString() });
  await audit(newStatus === 'ARQUIVADO' ? 'PATIENT_ARCHIVED' : 'PATIENT_UNARCHIVED', req.user!.id, `Paciente ${newStatus.toLowerCase()}`);
  res.json({ success: true, status: newStatus });
});

// ─── Routes: Sessions ─────────────────────────────────────────────────────────
app.get('/api/pacientes/:patientId/sessoes', authMiddleware as any, async (req: AuthReq, res) => {
  const sessions = await db('sessions').where({ patientId: req.params.patientId }).select(
    'sessions.*',
    db.raw('(SELECT "contentEncrypted" FROM session_notes WHERE session_notes."sessionId" = sessions.id LIMIT 1) as "noteEncrypted"'),
    db.raw('(SELECT "contentEncrypted" FROM medical_record_entries WHERE medical_record_entries."sessionId" = sessions.id LIMIT 1) as "recordEncrypted"')
  ).orderBy('sessionDate', 'desc');
  res.json({ sessions: sessions.map((s: any) => ({ ...s, note: s.noteEncrypted ? decrypt(s.noteEncrypted) : null, medicalRecord: s.recordEncrypted ? decrypt(s.recordEncrypted) : null })) });
});

app.post('/api/pacientes/:patientId/sessoes', authMiddleware as any, async (req: AuthReq, res) => {
  const { sessionDate, sessionTime, status = 'REALIZADA', rawNotes } = req.body;
  if (!sessionDate) { res.status(400).json({ error: 'Data é obrigatória.' }); return; }
  const sessionId = crypto.randomUUID();
  await db('sessions').insert({ id: sessionId, patientId: req.params.patientId, sessionDate, sessionTime: sessionTime || null, status, rawNotesEncrypted: rawNotes ? encrypt(rawNotes) : null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  await audit('SESSION_CREATED', req.user!.id, `Sessão criada: ${sessionDate}`);
  const session = await db('sessions').where({ id: sessionId }).first();
  res.status(201).json({ session });
});

app.put('/api/sessoes/:sessionId', authMiddleware as any, async (req: AuthReq, res) => {
  const { note, medicalRecord, rawNotes, status, sessionDate, sessionTime } = req.body;
  await db('sessions').where({ id: req.params.sessionId }).update({ status, sessionDate, sessionTime, rawNotesEncrypted: rawNotes ? encrypt(rawNotes) : null, updatedAt: new Date().toISOString() });
  if (note !== undefined) {
    const existing = await db('session_notes').where({ sessionId: req.params.sessionId }).first();
    if (existing) {
      await db('note_versions').insert({ id: crypto.randomUUID(), sessionNoteId: existing.id, contentEncrypted: existing.contentEncrypted, createdAt: new Date().toISOString() });
      await db('session_notes').where({ sessionId: req.params.sessionId }).update({ contentEncrypted: encrypt(note), updatedAt: new Date().toISOString() });
    } else {
      await db('session_notes').insert({ id: crypto.randomUUID(), sessionId: req.params.sessionId, contentEncrypted: encrypt(note), status: 'APROVADO', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    await audit('SESSION_NOTE_UPDATED', req.user!.id, `Nota sessão ${req.params.sessionId}`);
  }
  if (medicalRecord !== undefined) {
    const existing = await db('medical_record_entries').where({ sessionId: req.params.sessionId }).first();
    if (existing) {
      await db('record_versions').insert({ id: crypto.randomUUID(), recordEntryId: existing.id, contentEncrypted: existing.contentEncrypted, createdAt: new Date().toISOString() });
      await db('medical_record_entries').where({ sessionId: req.params.sessionId }).update({ contentEncrypted: encrypt(medicalRecord), updatedAt: new Date().toISOString() });
    } else {
      await db('medical_record_entries').insert({ id: crypto.randomUUID(), sessionId: req.params.sessionId, contentEncrypted: encrypt(medicalRecord), status: 'APROVADO', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    await audit('MEDICAL_RECORD_UPDATED', req.user!.id, `Prontuário sessão ${req.params.sessionId}`);
  }
  const session = await db('sessions').where({ id: req.params.sessionId }).first();
  const noteRow = await db('session_notes').where({ sessionId: req.params.sessionId }).first();
  const recordRow = await db('medical_record_entries').where({ sessionId: req.params.sessionId }).first();
  res.json({ session: { ...session, note: noteRow ? decrypt(noteRow.contentEncrypted) : null, medicalRecord: recordRow ? decrypt(recordRow.contentEncrypted) : null } });
});

// ─── Routes: Anamnesis ────────────────────────────────────────────────────────
app.get('/api/pacientes/:patientId/anamnese', authMiddleware as any, async (req: AuthReq, res) => {
  const row = await db('anamnesis').where({ patientId: req.params.patientId }).first();
  if (!row) { res.json({ anamnesis: null }); return; }
  res.json({ anamnesis: decryptJSON(row.dataEncrypted) });
});

app.post('/api/pacientes/:patientId/anamnese', authMiddleware as any, async (req: AuthReq, res) => {
  const existing = await db('anamnesis').where({ patientId: req.params.patientId }).first();
  const dataEncrypted = encryptJSON(req.body);
  if (existing) {
    await db('anamnesis').where({ patientId: req.params.patientId }).update({ dataEncrypted, updatedAt: new Date().toISOString() });
  } else {
    await db('anamnesis').insert({ id: crypto.randomUUID(), patientId: req.params.patientId, dataEncrypted, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  await audit('ANAMNESIS_SAVED', req.user!.id, `Anamnese salva para ${req.params.patientId}`);
  res.json({ success: true, anamnesis: req.body });
});

// ─── Routes: Scales ───────────────────────────────────────────────────────────
app.get('/api/escalas', authMiddleware as any, async (_req, res) => {
  const scales = await db('assessment_instruments').select('id', 'name', 'acronym', 'category', 'description', 'whatItMeasures', 'authors', 'reference', 'itemCount', 'scoringMethod', 'cutoffs', 'interpretationRules', 'targetAge', 'instructions', 'canApplyOnline', 'hasAutoScoring', 'usageConditions', 'verificationSource', 'items');
  res.json({ instruments: scales.map((s: any) => ({ ...s, cutoffs: typeof s.cutoffs === 'string' ? JSON.parse(s.cutoffs) : s.cutoffs, items: typeof s.items === 'string' ? JSON.parse(s.items) : s.items })) });
});

app.post('/api/escalas/aplicar', authMiddleware as any, async (req: AuthReq, res) => {
  const { patientId, instrumentId, expiresInHours = 72 } = req.body;
  const secureToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + expiresInHours * 3600000).toISOString();
  const id = crypto.randomUUID();
  await db('assessment_assignments').insert({ id, patientId, instrumentId, secureToken, status: 'ENVIADO', sentAt: new Date().toISOString(), expiresAt, respondedAt: null });
  await audit('ASSESSMENT_SENT', req.user!.id, `Escala enviada para ${patientId}`);
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || `https://app-psico-alpha.vercel.app`;
  res.json({ success: true, assignment: { id, secureToken, expiresAt }, link: `${APP_URL}/responder/${secureToken}` });
});

app.get('/api/escalas/paciente/:patientId', authMiddleware as any, async (req: AuthReq, res) => {
  const assignments = await db('assessment_assignments')
    .join('assessment_instruments', 'assessment_assignments.instrumentId', 'assessment_instruments.id')
    .leftJoin('assessment_responses', 'assessment_assignments.id', 'assessment_responses.assignmentId')
    .where('assessment_assignments.patientId', req.params.patientId)
    .select('assessment_assignments.*', 'assessment_instruments.name as instrumentName', 'assessment_instruments.acronym', 'assessment_responses.totalScore', 'assessment_responses.classification', 'assessment_responses.completedAt')
    .orderBy('assessment_assignments.sentAt', 'desc');
  res.json({ assignments });
});

// ─── Routes: Responder (public) ───────────────────────────────────────────────
app.get('/api/responder/:token', async (req, res) => {
  const assignment = await db('assessment_assignments').where({ secureToken: req.params.token }).first();
  if (!assignment) { res.status(404).json({ error: 'Link inválido ou não encontrado.' }); return; }
  if (assignment.status === 'RESPONDIDO') { res.status(410).json({ error: 'Este questionário já foi respondido.' }); return; }
  if (new Date(assignment.expiresAt) < new Date()) { res.status(410).json({ error: 'Este link expirou.' }); return; }
  const instrument = await db('assessment_instruments').where({ id: assignment.instrumentId }).first();
  if (!instrument) { res.status(404).json({ error: 'Instrumento não encontrado.' }); return; }
  const patient = await db('patients').where({ id: assignment.patientId }).select('id', 'fullName').first();
  res.json({ assignment, instrument: { ...instrument, items: typeof instrument.items === 'string' ? JSON.parse(instrument.items) : instrument.items, cutoffs: typeof instrument.cutoffs === 'string' ? JSON.parse(instrument.cutoffs) : instrument.cutoffs }, patient });
});

app.post('/api/responder/:token', async (req, res) => {
  const assignment = await db('assessment_assignments').where({ secureToken: req.params.token }).first();
  if (!assignment || assignment.status === 'RESPONDIDO' || new Date(assignment.expiresAt) < new Date()) { res.status(400).json({ error: 'Link inválido, expirado ou já respondido.' }); return; }
  const { answers, totalScore, classification } = req.body;
  await db('assessment_responses').insert({ id: crypto.randomUUID(), assignmentId: assignment.id, answersEncrypted: encryptJSON(answers), totalScore, classification, completedAt: new Date().toISOString() });
  await db('assessment_assignments').where({ id: assignment.id }).update({ status: 'RESPONDIDO', respondedAt: new Date().toISOString() });
  await audit('ASSESSMENT_ANSWERED', null, `Resposta recebida token ${req.params.token}`);
  res.json({ success: true, message: 'Respostas enviadas com sucesso!' });
});

// ─── Routes: Settings ─────────────────────────────────────────────────────────
app.get('/api/configuracoes', authMiddleware as any, async (req: AuthReq, res) => {
  let settings = await db('professional_settings').where({ id: 'default' }).first();
  if (!settings) {
    settings = { id: 'default', therapistName: req.user!.name, crp: '00/00000', clinicName: null, headerText: null, footerText: null, watermarkText: null, showWatermark: false, updatedAt: new Date().toISOString() };
    await db('professional_settings').insert(settings);
  }
  const auditLogs = await db('audit_logs').select('id', 'action', 'details', 'ipAddress', 'createdAt').orderBy('createdAt', 'desc').limit(40);
  res.json({ settings: { ...settings, showWatermark: !!settings.showWatermark }, auditLogs, user: req.user });
});

app.put('/api/configuracoes', authMiddleware as any, async (req: AuthReq, res) => {
  const { therapistName, crp, clinicName, headerText, footerText, watermarkText, showWatermark } = req.body;
  const data = { therapistName: therapistName || req.user!.name, crp: crp || '00/00000', clinicName: clinicName || null, headerText: headerText || null, footerText: footerText || null, watermarkText: watermarkText || null, showWatermark: !!showWatermark, updatedAt: new Date().toISOString() };
  const existing = await db('professional_settings').where({ id: 'default' }).first();
  if (existing) { await db('professional_settings').where({ id: 'default' }).update(data); }
  else { await db('professional_settings').insert({ id: 'default', ...data }); }
  await audit('SETTINGS_UPDATED', req.user!.id, 'Configurações atualizadas');
  const updated = await db('professional_settings').where({ id: 'default' }).first();
  res.json({ success: true, settings: { ...updated, showWatermark: !!updated?.showWatermark } });
});

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => { res.json({ status: 'ok', timestamp: new Date() }); });

export default app;
