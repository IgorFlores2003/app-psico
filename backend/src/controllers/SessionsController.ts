import { Response } from 'express';
import crypto from 'crypto';
import { db } from '../lib/knex';
import { encrypt, decrypt } from '../lib/crypto';
import { createAuditLog } from '../lib/audit';
import { AuthenticatedRequest } from '../middleware/auth';

export class SessionsController {
  static async listByPatient(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { patientId } = req.params;

    try {
      const sessions = await db('sessions')
        .where({ patientId })
        .orderBy('sessionDate', 'desc');

      const sessionIds = sessions.map((s) => s.id);

      const sessionNotes = sessionIds.length
        ? await db('session_notes').whereIn('sessionId', sessionIds)
        : [];
      const noteIds = sessionNotes.map((n) => n.id);
      const noteVersions = noteIds.length
        ? await db('note_versions').whereIn('sessionNoteId', noteIds).orderBy('createdAt', 'desc')
        : [];

      const medicalRecords = sessionIds.length
        ? await db('medical_record_entries').whereIn('sessionId', sessionIds)
        : [];
      const recordIds = medicalRecords.map((r) => r.id);
      const recordVersions = recordIds.length
        ? await db('record_versions').whereIn('recordEntryId', recordIds).orderBy('createdAt', 'desc')
        : [];

      // Map versions to notes and records
      const noteVersionsMap = new Map<string, any[]>();
      noteVersions.forEach((v) => {
        if (!noteVersionsMap.has(v.sessionNoteId)) {
          noteVersionsMap.set(v.sessionNoteId, []);
        }
        noteVersionsMap.get(v.sessionNoteId)!.push(v);
      });

      const recordVersionsMap = new Map<string, any[]>();
      recordVersions.forEach((v) => {
        if (!recordVersionsMap.has(v.recordEntryId)) {
          recordVersionsMap.set(v.recordEntryId, []);
        }
        recordVersionsMap.get(v.recordEntryId)!.push(v);
      });

      const sessionNoteMap = new Map<string, any>();
      sessionNotes.forEach((sn) => {
        sessionNoteMap.set(sn.sessionId, {
          ...sn,
          versions: noteVersionsMap.get(sn.id) || [],
        });
      });

      const medicalRecordMap = new Map<string, any>();
      medicalRecords.forEach((mr) => {
        medicalRecordMap.set(mr.sessionId, {
          ...mr,
          versions: recordVersionsMap.get(mr.id) || [],
        });
      });

      const decrypted = sessions.map((s) => {
        const sNote = sessionNoteMap.get(s.id);
        const mRecord = medicalRecordMap.get(s.id);

        return {
          id: s.id,
          patientId: s.patientId,
          sessionDate: s.sessionDate,
          sessionTime: s.sessionTime,
          status: s.status,
          rawNotes: s.rawNotesEncrypted ? decrypt(s.rawNotesEncrypted) : null,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          sessionNote: sNote
            ? {
                id: sNote.id,
                content: decrypt(sNote.contentEncrypted),
                status: sNote.status,
                createdAt: sNote.createdAt,
                updatedAt: sNote.updatedAt,
                versions: sNote.versions.map((v: any) => ({
                  id: v.id,
                  content: decrypt(v.contentEncrypted),
                  reason: v.reason,
                  createdAt: v.createdAt,
                })),
              }
            : null,
          medicalRecordEntry: mRecord
            ? {
                id: mRecord.id,
                content: decrypt(mRecord.contentEncrypted),
                status: mRecord.status,
                createdAt: mRecord.createdAt,
                updatedAt: mRecord.updatedAt,
                versions: mRecord.versions.map((v: any) => ({
                  id: v.id,
                  content: decrypt(v.contentEncrypted),
                  reason: v.reason,
                  createdAt: v.createdAt,
                })),
              }
            : null,
        };
      });

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

      const sessionId = crypto.randomUUID();

      await db.transaction(async (trx) => {
        await trx('sessions').insert({
          id: sessionId,
          patientId,
          sessionDate,
          sessionTime: sessionTime || null,
          status,
          rawNotesEncrypted: encryptedRaw,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        if (encryptedNote) {
          await trx('session_notes').insert({
            id: crypto.randomUUID(),
            sessionId,
            contentEncrypted: encryptedNote,
            status: 'APROVADO',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        if (encryptedRecord) {
          await trx('medical_record_entries').insert({
            id: crypto.randomUUID(),
            sessionId,
            contentEncrypted: encryptedRecord,
            status: 'APROVADO',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      });

      await createAuditLog({
        action: 'SESSION_CREATED',
        userId: req.user!.id,
        patientId,
        details: `Sessão criada para a data ${sessionDate}`,
      });

      res.json({ success: true, sessionId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao salvar atendimento.' });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { sessionId } = req.params;
    const { sessionDate, sessionTime, status, sessionNote, medicalRecordEntry, editReason } = req.body;

    try {
      const session = await db('sessions').where({ id: sessionId }).first();
      if (!session) {
        res.status(404).json({ error: 'Sessão não encontrada.' });
        return;
      }

      const existingNote = await db('session_notes').where({ sessionId }).first();
      const existingRecord = await db('medical_record_entries').where({ sessionId }).first();

      await db.transaction(async (trx) => {
        const updateSessionData: any = { updatedAt: new Date().toISOString() };
        if (sessionDate) updateSessionData.sessionDate = sessionDate;
        if (sessionTime !== undefined) updateSessionData.sessionTime = sessionTime;
        if (status) updateSessionData.status = status;

        await trx('sessions').where({ id: sessionId }).update(updateSessionData);

        if (sessionNote !== undefined && existingNote) {
          const prevEnc = existingNote.contentEncrypted;
          if (decrypt(prevEnc) !== sessionNote.trim()) {
            await trx('note_versions').insert({
              id: crypto.randomUUID(),
              sessionNoteId: existingNote.id,
              contentEncrypted: prevEnc,
              reason: editReason || 'Edição posterior',
              createdAt: new Date().toISOString(),
            });
            await trx('session_notes').where({ id: existingNote.id }).update({
              contentEncrypted: encrypt(sessionNote.trim()),
              updatedAt: new Date().toISOString(),
            });
          }
        }

        if (medicalRecordEntry !== undefined && existingRecord) {
          const prevEnc = existingRecord.contentEncrypted;
          if (decrypt(prevEnc) !== medicalRecordEntry.trim()) {
            await trx('record_versions').insert({
              id: crypto.randomUUID(),
              recordEntryId: existingRecord.id,
              contentEncrypted: prevEnc,
              reason: editReason || 'Edição posterior',
              createdAt: new Date().toISOString(),
            });
            await trx('medical_record_entries').where({ id: existingRecord.id }).update({
              contentEncrypted: encrypt(medicalRecordEntry.trim()),
              updatedAt: new Date().toISOString(),
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
