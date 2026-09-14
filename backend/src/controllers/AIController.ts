import { Response } from 'express';
import { generateClinicalDocumentation, regenerateSessionNote, regenerateMedicalRecord } from '../lib/ai';
import { AuthenticatedRequest } from '../middleware/auth';

export class AIController {
  static async generate(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { rawContent, sessionDate } = req.body;

    if (!rawContent?.trim() || !sessionDate) {
      res.status(400).json({ error: 'Conteúdo e data da sessão são obrigatórios.' });
      return;
    }

    try {
      const result = await generateClinicalDocumentation(rawContent, sessionDate);
      res.json({
        success: true,
        sessionNote: result.sessionNote,
        medicalRecordEntry: result.medicalRecordEntry,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao gerar documentação com IA.' });
    }
  }

  static async regenerate(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { type, rawContent, sessionDate } = req.body;

    if (!rawContent?.trim() || !sessionDate) {
      res.status(400).json({ error: 'Conteúdo e data são obrigatórios.' });
      return;
    }

    try {
      let content = '';
      if (type === 'sessionNote') {
        content = await regenerateSessionNote(rawContent, sessionDate);
      } else if (type === 'medicalRecord') {
        content = await regenerateMedicalRecord(rawContent, sessionDate);
      } else {
        res.status(400).json({ error: 'Tipo inválido.' });
        return;
      }
      res.json({ success: true, content });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao regenerar documento.' });
    }
  }
}
