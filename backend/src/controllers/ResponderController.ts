import { Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../lib/knex';
import { encryptJSON } from '../lib/crypto';
import { scoreAssessment } from '../lib/scales';

export class ResponderController {
  static async getByToken(req: Request, res: Response): Promise<void> {
    const { token } = req.params;

    try {
      const assignment = await db('assessment_assignments')
        .where({ secureToken: token })
        .first();

      if (!assignment) {
        res.status(404).json({ error: 'Questionário não encontrado ou link expirado.' });
        return;
      }

      if (assignment.status === 'RESPONDIDO') {
        res.status(400).json({ error: 'Este questionário já foi respondido e enviado com sucesso.' });
        return;
      }

      if (new Date(assignment.expiresAt) < new Date()) {
        await db('assessment_assignments')
          .where({ id: assignment.id })
          .update({ status: 'EXPIRADO' });
        res.status(410).json({ error: 'Este link de resposta expirou.' });
        return;
      }

      const instrument = await db('assessment_instruments')
        .where({ id: assignment.instrumentId })
        .first();

      if (!instrument) {
        res.status(404).json({ error: 'Instrumento associado não encontrado.' });
        return;
      }

      const items = JSON.parse(instrument.items);
      res.json({
        instrument: {
          acronym: instrument.acronym,
          name: instrument.name,
          category: instrument.category,
          instructions: instrument.instructions,
          itemCount: instrument.itemCount,
          items,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao carregar o questionário.' });
    }
  }

  static async submitAnswers(req: Request, res: Response): Promise<void> {
    const { token } = req.params;
    const { answers } = req.body as { answers: Record<number, number> };

    try {
      const assignment = await db('assessment_assignments')
        .where({ secureToken: token })
        .first();

      if (!assignment) {
        res.status(404).json({ error: 'Questionário não encontrado.' });
        return;
      }

      if (assignment.status === 'RESPONDIDO') {
        res.status(400).json({ error: 'Este questionário já foi finalizado.' });
        return;
      }

      const instrument = await db('assessment_instruments')
        .where({ id: assignment.instrumentId })
        .first();

      if (!instrument) {
        res.status(404).json({ error: 'Instrumento não encontrado.' });
        return;
      }

      const scaleDef = {
        acronym: instrument.acronym,
        name: instrument.name,
        category: instrument.category,
        description: instrument.description,
        whatItMeasures: instrument.whatItMeasures,
        authors: instrument.authors,
        reference: instrument.reference,
        itemCount: instrument.itemCount,
        scoringMethod: instrument.scoringMethod,
        targetAge: instrument.targetAge || '',
        instructions: instrument.instructions,
        usageConditions: instrument.usageConditions,
        verificationSource: instrument.verificationSource,
        cutoffs: JSON.parse(instrument.cutoffs),
        items: JSON.parse(instrument.items),
      };

      const { score, classification } = scoreAssessment(scaleDef, answers);

      await db.transaction(async (trx) => {
        await trx('assessment_responses').insert({
          id: crypto.randomUUID(),
          assignmentId: assignment.id,
          answersEncrypted: encryptJSON(answers),
          totalScore: score,
          classification,
          completedAt: new Date().toISOString(),
        });

        await trx('assessment_assignments')
          .where({ id: assignment.id })
          .update({
            status: 'RESPONDIDO',
            respondedAt: new Date().toISOString(),
          });
      });

      res.json({ success: true, message: 'Respostas registradas com sucesso!' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao processar as respostas.' });
    }
  }
}
