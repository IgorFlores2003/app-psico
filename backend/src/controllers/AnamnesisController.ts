import { Response } from 'express';
import crypto from 'crypto';
import { db } from '../lib/knex';
import { encryptJSON, decryptJSON } from '../lib/crypto';
import { AuthenticatedRequest } from '../middleware/auth';

export class AnamnesisController {
  static async getByPatient(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { patientId } = req.params;

    try {
      const anamnesis = await db('anamnesis').where({ patientId }).first();
      if (!anamnesis) {
        res.json({ anamnesis: null });
        return;
      }
      const data = decryptJSON(anamnesis.dataEncrypted);
      res.json({
        anamnesis: {
          id: anamnesis.id,
          patientId: anamnesis.patientId,
          data: data || {},
          updatedAt: anamnesis.updatedAt,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao buscar anamnese.' });
    }
  }

  static async saveByPatient(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { patientId } = req.params;
    const { data } = req.body;

    try {
      const encrypted = encryptJSON(data || {});
      const existing = await db('anamnesis').where({ patientId }).first();

      let anamnesisId = existing?.id;

      if (existing) {
        await db('anamnesis').where({ id: existing.id }).update({
          dataEncrypted: encrypted,
          updatedAt: new Date().toISOString(),
        });
      } else {
        anamnesisId = crypto.randomUUID();
        await db('anamnesis').insert({
          id: anamnesisId,
          patientId,
          dataEncrypted: encrypted,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      res.json({ success: true, anamnesisId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao salvar anamnese.' });
    }
  }
}
