import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { generateSecureToken } from '../lib/crypto';
import { AuthenticatedRequest } from '../middleware/auth';

export class ScalesController {
  static async listCatalog(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const scales = await prisma.assessmentInstrument.findMany({
        orderBy: { acronym: 'asc' },
      });

      const formatted = scales.map((s) => ({
        id: s.id,
        acronym: s.acronym,
        name: s.name,
        category: s.category,
        description: s.description,
        whatItMeasures: s.whatItMeasures,
        authors: s.authors,
        reference: s.reference,
        itemCount: s.itemCount,
        scoringMethod: s.scoringMethod,
        targetAge: s.targetAge,
        instructions: s.instructions,
        canApplyOnline: s.canApplyOnline,
        hasAutoScoring: s.hasAutoScoring,
        usageConditions: s.usageConditions,
        verificationSource: s.verificationSource,
        cutoffs: JSON.parse(s.cutoffs),
      }));

      res.json({ scales: formatted });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao listar escalas.' });
    }
  }

  static async applyScale(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { patientId, instrumentId, validityDays = 7 } = req.body;

    try {
      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      const instrument = await prisma.assessmentInstrument.findUnique({ where: { id: instrumentId } });

      if (!patient || !instrument) {
        res.status(404).json({ error: 'Paciente ou instrumento não encontrado.' });
        return;
      }

      const secureToken = generateSecureToken();
      const expiresAt = new Date(Date.now() + validityDays * 86400000);

      const assignment = await prisma.assessmentAssignment.create({
        data: {
          patientId,
          instrumentId,
          secureToken,
          status: 'ENVIADO',
          expiresAt,
        },
      });

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const linkUrl = `${clientUrl}/responder/${secureToken}`;

      res.json({
        success: true,
        assignmentId: assignment.id,
        linkUrl,
        secureToken,
        expiresAt,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao gerar aplicação.' });
    }
  }

  static async getPatientHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { patientId } = req.params;

    try {
      const assignments = await prisma.assessmentAssignment.findMany({
        where: { patientId },
        orderBy: { sentAt: 'desc' },
        include: {
          instrument: { select: { id: true, acronym: true, name: true, category: true, itemCount: true } },
          response: { select: { id: true, totalScore: true, classification: true, completedAt: true } },
        },
      });

      const formatted = assignments.map((a) => {
        let currentStatus = a.status;
        if (currentStatus === 'ENVIADO' && new Date(a.expiresAt) < new Date()) {
          currentStatus = 'EXPIRADO';
        }
        return {
          id: a.id,
          secureToken: a.secureToken,
          instrumentId: a.instrument.id,
          instrumentAcronym: a.instrument.acronym,
          instrumentName: a.instrument.name,
          instrumentCategory: a.instrument.category,
          status: currentStatus,
          sentAt: a.sentAt,
          expiresAt: a.expiresAt,
          respondedAt: a.respondedAt,
          response: a.response
            ? {
                score: a.response.totalScore,
                classification: a.response.classification,
                completedAt: a.response.completedAt,
              }
            : null,
        };
      });

      const evolutionByScale: Record<
        string,
        {
          acronym: string;
          name: string;
          dataPoints: { date: string; timestamp: number; score: number; classification: string }[];
        }
      > = {};

      formatted
        .filter((item) => item.status === 'RESPONDIDO' && item.response)
        .sort(
          (a, b) =>
            new Date(a.respondedAt || a.sentAt).getTime() - new Date(b.respondedAt || b.sentAt).getTime()
        )
        .forEach((item) => {
          const acronym = item.instrumentAcronym;
          if (!evolutionByScale[acronym]) {
            evolutionByScale[acronym] = {
              acronym,
              name: item.instrumentName,
              dataPoints: [],
            };
          }

          const dateObj = new Date(item.respondedAt || item.sentAt);
          evolutionByScale[acronym].dataPoints.push({
            date: dateObj.toLocaleDateString('pt-BR'),
            timestamp: dateObj.getTime(),
            score: item.response!.score ?? 0,
            classification: item.response!.classification || 'Respondido',
          });
        });

      res.json({ assignments: formatted, evolutionByScale });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao buscar histórico de escalas.' });
    }
  }
}
