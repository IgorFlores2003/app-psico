import { Response } from 'express';
import crypto from 'crypto';
import { db } from '../lib/knex';
import { encrypt, decrypt } from '../lib/crypto';
import { createAuditLog } from '../lib/audit';
import { AuthenticatedRequest } from '../middleware/auth';

export class PatientsController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const q = (req.query.q as string)?.trim() || '';
    const status = (req.query.status as string) || 'ATIVO';

    try {
      let query = db('patients')
        .select(
          'patients.*',
          db.raw('(SELECT COUNT(*) FROM sessions WHERE sessions.patientId = patients.id) as totalSessions'),
          db.raw('(SELECT COUNT(*) FROM assessment_assignments WHERE assessment_assignments.patientId = patients.id) as totalAssignments'),
          db.raw('(SELECT sessionDate FROM sessions WHERE sessions.patientId = patients.id ORDER BY sessionDate DESC LIMIT 1) as lastSessionDate')
        );

      if (status !== 'TODOS') {
        query = query.where('patients.status', status);
      }

      if (q) {
        query = query.where('patients.fullName', 'like', `%${q}%`);
      }

      const patients = await query.orderBy('patients.fullName', 'asc');

      const sanitized = patients.map((p: any) => ({
        id: p.id,
        fullName: p.fullName,
        birthDate: p.birthDate,
        email: p.email,
        phone: p.phone,
        status: p.status,
        notes: p.notes ? decrypt(p.notes) : null,
        totalSessions: Number(p.totalSessions) || 0,
        totalAssignments: Number(p.totalAssignments) || 0,
        lastSessionDate: p.lastSessionDate || null,
        createdAt: p.createdAt,
      }));

      res.json({ patients: sanitized });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao listar pacientes.' });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { fullName, birthDate, email, phone, notes } = req.body;
    if (!fullName?.trim()) {
      res.status(400).json({ error: 'Nome completo é obrigatório.' });
      return;
    }
    if (!birthDate) {
      res.status(400).json({ error: 'Data de nascimento é obrigatória.' });
      return;
    }

    try {
      const id = crypto.randomUUID();
      const patient = {
        id,
        fullName: fullName.trim(),
        birthDate: birthDate.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        notes: notes?.trim() ? encrypt(notes.trim()) : null,
        status: 'ATIVO',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db('patients').insert(patient);

      await createAuditLog({
        action: 'PATIENT_CREATED',
        userId: req.user!.id,
        patientId: patient.id,
        details: 'Novo paciente cadastrado',
      });

      res.json({ success: true, patient });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao cadastrar paciente.' });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const patient = await db('patients').where({ id }).first();

      if (!patient) {
        res.status(404).json({ error: 'Paciente não encontrado.' });
        return;
      }

      const totalSessionsRes = await db('sessions').where({ patientId: id }).count<{ count: number }>('* as count').first();
      const totalAssignmentsRes = await db('assessment_assignments').where({ patientId: id }).count<{ count: number }>('* as count').first();

      const recentSessions = await db('sessions')
        .where({ patientId: id })
        .select('id', 'sessionDate', 'sessionTime', 'status')
        .orderBy('sessionDate', 'desc')
        .limit(5);

      const anamnesis = await db('anamnesis').where({ patientId: id }).select('updatedAt').first();

      res.json({
        patient: {
          id: patient.id,
          fullName: patient.fullName,
          birthDate: patient.birthDate,
          email: patient.email,
          phone: patient.phone,
          status: patient.status,
          notes: patient.notes ? decrypt(patient.notes) : null,
          totalSessions: Number(totalSessionsRes?.count) || 0,
          totalAssignments: Number(totalAssignmentsRes?.count) || 0,
          hasAnamnesis: !!anamnesis,
          anamnesisUpdatedAt: anamnesis?.updatedAt || null,
          recentSessions,
          createdAt: patient.createdAt,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao buscar dados do paciente.' });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { fullName, birthDate, email, phone, notes } = req.body;

    try {
      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      if (fullName !== undefined) updateData.fullName = fullName.trim();
      if (birthDate !== undefined) updateData.birthDate = birthDate.trim();
      if (email !== undefined) updateData.email = email?.trim() || null;
      if (phone !== undefined) updateData.phone = phone?.trim() || null;
      if (notes !== undefined) updateData.notes = notes ? encrypt(notes.trim()) : null;

      await db('patients').where({ id }).update(updateData);
      const updated = await db('patients').where({ id }).first();

      res.json({ success: true, patient: updated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao atualizar paciente.' });
    }
  }

  static async toggleArchive(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;

    try {
      await db('patients').where({ id }).update({
        status,
        updatedAt: new Date().toISOString(),
      });
      res.json({ success: true, status });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao alterar status.' });
    }
  }
}
