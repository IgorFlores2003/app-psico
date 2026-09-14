import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { encryptJSON } from '../lib/crypto';
import { scoreAssessment } from '../lib/scales';

export class ResponderController {
  static async getByToken(req: Request, res: Response): Promise<void> {
    const { token } = req.params;

    try {
      const assignment = await prisma.assessmentAssignment.findUnique({
        where: { secureToken: token },
        include: { instrument: true },
      });

      if (!assignment) {
        res.status(404).json({ error: 'Questionário não encontrado ou link expirado.' });
        return;
      }

      if (assignment.status === 'RESPONDIDO') {
        res.status(400).json({ error: 'Este questionário já foi respondido e enviado com sucesso.' });
        return;
      }

      if (new Date(assignment.expiresAt) < new Date()) {
        await prisma.assessmentAssignment.update({
          where: { id: assignment.id },
          data: { status: 'EXPIRADO' },
        });
        res.status(410).json({ error: 'Este link de resposta expirou.' });
        return;
      }

      const items = JSON.parse(assignment.instrument.items);
      res.json({
        instrument: {
          acronym: assignment.instrument.acronym,
          name: assignment.instrument.name,
          category: assignment.instrument.category,
          instructions: assignment.instrument.instructions,
          itemCount: assignment.instrument.itemCount,
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
      const assignment = await prisma.assessmentAssignment.findUnique({
        where: { secureToken: token },
        include: { instrument: true },
      });

      if (!assignment) {
        res.status(404).json({ error: 'Questionário não encontrado.' });
        return;
      }

      if (assignment.status === 'RESPONDIDO') {
        res.status(400).json({ error: 'Este questionário já foi finalizado.' });
        return;
      }

      const scaleDef = {
        acronym: assignment.instrument.acronym,
        name: assignment.instrument.name,
        category: assignment.instrument.category,
        description: assignment.instrument.description,
        whatItMeasures: assignment.instrument.whatItMeasures,
        authors: assignment.instrument.authors,
        reference: assignment.instrument.reference,
        itemCount: assignment.instrument.itemCount,
        scoringMethod: assignment.instrument.scoringMethod,
        targetAge: assignment.instrument.targetAge || '',
        instructions: assignment.instrument.instructions,
        usageConditions: assignment.instrument.usageConditions,
        verificationSource: assignment.instrument.verificationSource,
        cutoffs: JSON.parse(assignment.instrument.cutoffs),
        items: JSON.parse(assignment.instrument.items),
      };

      const { score, classification } = scoreAssessment(scaleDef, answers);

      await prisma.$transaction(async (tx) => {
        await tx.assessmentResponse.create({
          data: {
            assignmentId: assignment.id,
            answersEncrypted: encryptJSON(answers),
            totalScore: score,
            classification,
          },
        });

        await tx.assessmentAssignment.update({
          where: { id: assignment.id },
          data: {
            status: 'RESPONDIDO',
            respondedAt: new Date(),
          },
        });
      });

      res.json({ success: true, message: 'Respostas registradas com sucesso!' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao processar as respostas.' });
    }
  }
}
