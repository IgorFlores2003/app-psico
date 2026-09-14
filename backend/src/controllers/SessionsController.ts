import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { encrypt, decrypt } from '../lib/crypto';
import { createAuditLog } from '../lib/audit';
import { AuthenticatedRequest } from '../middleware/auth';

export class SessionsController {
  static async listByPatient(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { patientId } = req.params;

    try {
      const sessions = await prisma.session.findMany({
        where: { patientId },
        orderBy: { sessionDate: 'desc' },
        include: {
          sessionNote: { include: { versions: { orderBy: { createdAt: 'desc' } } } },
          medicalRecordEntry: { include: { versions: { orderBy: { createdAt: 'desc' } } } },
        },
      });

      const decrypted = sessions.map((s) => ({
        id: s.id,
        patientId: s.patientId,
        sessionDate: s.sessionDate,
        sessionTime: s.sessionTime,
        status: s.status,
        rawNotes: s.rawNotesEncrypted ? decrypt(s.rawNotesEncrypted) : null,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        sessionNote: s.sessionNote
          ? {
              id: s.sessionNote.id,
              content: decrypt(s.sessionNote.contentEncrypted),
              status: s.sessionNote.status,
              createdAt: s.sessionNote.createdAt,
              updatedAt: s.sessionNote.updatedAt,
              versions: s.sessionNote.versions.map((v) => ({
                id: v.id,
                content: decrypt(v.contentEncrypted),
                reason: v.reason,
                createdAt: v.createdAt,
              })),
            }
          : null,
        medicalRecordEntry: s.medicalRecordEntry
          ? {
              id: s.medicalRecordEntry.id,
              content: decrypt(s.medicalRecordEntry.contentEncrypted),
              status: s.medicalRecordEntry.status,
              createdAt: s.medicalRecordEntry.createdAt,
              updatedAt: s.medicalRecordEntry.updatedAt,
              versions: s.medicalRecordEntry.versions.map((v) => ({
                id: v.id,
                content: decrypt(v.contentEncrypted),
                reason: v.reason,
                createdAt: v.createdAt,
              })),
            }
          : null,
      }));

      res.json({ sessions: decrypted });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao buscar histórico de sessões.' });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { patientId } = req.params;
    const { sessionDate, sessionTime, status = 'REALIZADA', rawNotes, sessionNote, medicalRecordEntry } = req.body;

    if (!sessionDate) {
      res.status(400).json({ error: 'A data da sessão é obrigatória.' });
      return;
    }

    try {
      const encryptedRaw = rawNotes ? encrypt(rawNotes.trim()) : null;
      const encryptedNote = sessionNote ? encrypt(sessionNote.trim()) : '';
      const encryptedRecord = medicalRecordEntry ? encrypt(medicalRecordEntry.trim()) : '';

      const newSession = await prisma.$transaction(async (tx) => {
        const s = await tx.session.create({
          data: {
            patientId,
            sessionDate,
            sessionTime: sessionTime || null,
            status,
            rawNotesEncrypted: encryptedRaw,
          },
        });

        if (encryptedNote) {
          await tx.sessionNote.create({
            data: { sessionId: s.id, contentEncrypted: encryptedNote, status: 'APROVADO' },
          });
        }

        if (encryptedRecord) {
          await tx.medicalRecordEntry.create({
            data: { sessionId: s.id, contentEncrypted: encryptedRecord, status: 'APROVADO' },
          });
        }

        return s;
      });

      await createAuditLog({
        action: 'SESSION_CREATED',
        userId: req.user!.id,
        patientId,
        details: `Sessão criada para a data ${sessionDate}`,
      });

      res.json({ success: true, sessionId: newSession.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao salvar atendimento.' });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { sessionId } = req.params;
    const { sessionDate, sessionTime, status, sessionNote, medicalRecordEntry, editReason } = req.body;

    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { sessionNote: true, medicalRecordEntry: true },
      });

      if (!session) {
        res.status(404).json({ error: 'Sessão não encontrada.' });
        return;
      }

      await prisma.$transaction(async (tx) => {
        if (sessionDate || sessionTime !== undefined || status) {
          await tx.session.update({
            where: { id: sessionId },
            data: {
              sessionDate: sessionDate || undefined,
              sessionTime: sessionTime !== undefined ? sessionTime : undefined,
              status: status || undefined,
            },
          });
        }

        if (sessionNote !== undefined && session.sessionNote) {
          const prevEnc = session.sessionNote.contentEncrypted;
          if (decrypt(prevEnc) !== sessionNote.trim()) {
            await tx.noteVersion.create({
              data: {
                sessionNoteId: session.sessionNote.id,
                contentEncrypted: prevEnc,
                reason: editReason || 'Edição posterior',
              },
            });
            await tx.sessionNote.update({
              where: { id: session.sessionNote.id },
              data: { contentEncrypted: encrypt(sessionNote.trim()) },
            });
          }
        }

        if (medicalRecordEntry !== undefined && session.medicalRecordEntry) {
          const prevEnc = session.medicalRecordEntry.contentEncrypted;
          if (decrypt(prevEnc) !== medicalRecordEntry.trim()) {
            await tx.recordVersion.create({
              data: {
                recordEntryId: session.medicalRecordEntry.id,
                contentEncrypted: prevEnc,
                reason: editReason || 'Edição posterior',
              },
            });
            await tx.medicalRecordEntry.update({
              where: { id: session.medicalRecordEntry.id },
              data: { contentEncrypted: encrypt(medicalRecordEntry.trim()) },
            });
          }
        }
      });

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao atualizar sessão.' });
    }
  }
}
