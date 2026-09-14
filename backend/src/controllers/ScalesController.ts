import { Response } from 'express';
import crypto from 'crypto';
import { db } from '../lib/knex';
import { generateSecureToken } from '../lib/crypto';
import { AuthenticatedRequest } from '../middleware/auth';

export class ScalesController {
  static async listCatalog(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const scales = await db('assessment_instruments').orderBy('acronym', 'asc');

      const formatted = scales.map((s: any) => ({
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
        canApplyOnline: !!s.canApplyOnline,
        hasAutoScoring: !!s.hasAutoScoring,
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
      const patient = await db('patients').where({ id: patientId }).first();
      const instrument = await db('assessment_instruments').where({ id: instrumentId }).first();

      if (!patient || !instrument) {
        res.status(404).json({ error: 'Paciente ou instrumento não encontrado.' });
        return;
      }

      const secureToken = generateSecureToken();
      const expiresAt = new Date(Date.now() + validityDays * 86400000);
      const assignmentId = crypto.randomUUID();

      await db('assessment_assignments').insert({
        id: assignmentId,
        patientId,
        instrumentId,
        secureToken,
        status: 'ENVIADO',
        sentAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      });

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const linkUrl = `${clientUrl}/responder/${secureToken}`;

      res.json({
        success: true,
        assignmentId,
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
      const assignments = await db('assessment_assignments')
        .where({ patientId })
        .orderBy('sentAt', 'desc');

      const instrumentIds = [...new Set(assignments.map((a: any) => a.instrumentId))];
      const instruments = instrumentIds.length
        ? await db('assessment_instruments').whereIn('id', instrumentIds)
        : [];
      const instrumentMap = new Map(instruments.map((i: any) => [i.id, i]));

      const assignmentIds = assignments.map((a: any) => a.id);
      const responses = assignmentIds.length
        ? await db('assessment_responses').whereIn('assignmentId', assignmentIds)
        : [];
      const responseMap = new Map(responses.map((r: any) => [r.assignmentId, r]));

      const formatted = assignments.map((a: any) => {
        let currentStatus = a.status;
        if (currentStatus === 'ENVIADO' && new Date(a.expiresAt) < new Date()) {
          currentStatus = 'EXPIRADO';
        }

        const inst = instrumentMap.get(a.instrumentId) || {};
        const resp = responseMap.get(a.id);

        return {
          id: a.id,
          secureToken: a.secureToken,
          instrumentId: inst.id,
          instrumentAcronym: inst.acronym,
          instrumentName: inst.name,
          instrumentCategory: inst.category,
          status: currentStatus,
          sentAt: a.sentAt,
          expiresAt: a.expiresAt,
          respondedAt: a.respondedAt,
          response: resp
            ? {
                score: resp.totalScore,
                classification: resp.classification,
                completedAt: resp.completedAt,
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
        .filter((item: any) => item.status === 'RESPONDIDO' && item.response)
        .sort(
          (a: any, b: any) =>
            new Date(a.respondedAt || a.sentAt).getTime() - new Date(b.respondedAt || b.sentAt).getTime()
        )
        .forEach((item: any) => {
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
