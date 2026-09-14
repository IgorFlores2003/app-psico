import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { encryptJSON, decryptJSON } from '../lib/crypto';
import { AuthenticatedRequest } from '../middleware/auth';

export class AnamnesisController {
  static async getByPatient(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { patientId } = req.params;

    try {
      const anamnesis = await prisma.anamnesis.findUnique({ where: { patientId } });
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
      const anamnesis = await prisma.anamnesis.upsert({
        where: { patientId },
        create: { patientId, dataEncrypted: encrypted },
        update: { dataEncrypted: encrypted },
      });
      res.json({ success: true, anamnesisId: anamnesis.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao salvar anamnese.' });
    }
  }
}
