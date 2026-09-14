import { Response } from 'express';
import { db } from '../lib/knex';
import { AuthenticatedRequest } from '../middleware/auth';

export class SettingsController {
  static async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      let settings = await db('professional_settings').where({ id: 'default' }).first();
      if (!settings) {
        settings = {
          id: 'default',
          therapistName: req.user!.name,
          crp: '00/00000',
          clinicName: null,
          headerText: null,
          footerText: null,
          watermarkText: null,
          showWatermark: false,
          updatedAt: new Date().toISOString(),
        };
        await db('professional_settings').insert(settings);
      }

      const auditLogs = await db('audit_logs')
        .select('id', 'action', 'details', 'ipAddress', 'createdAt')
        .orderBy('createdAt', 'desc')
        .limit(40);

      res.json({
        settings: {
          ...settings,
          showWatermark: !!settings.showWatermark,
        },
        auditLogs,
        user: req.user,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao carregar configurações.' });
    }
  }

  static async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { therapistName, crp, clinicName, headerText, footerText, watermarkText, showWatermark } = req.body;

    try {
      const existing = await db('professional_settings').where({ id: 'default' }).first();

      const data = {
        therapistName: therapistName || req.user!.name,
        crp: crp || '00/00000',
        clinicName: clinicName || null,
        headerText: headerText || null,
        footerText: footerText || null,
        watermarkText: watermarkText || null,
        showWatermark: !!showWatermark,
        updatedAt: new Date().toISOString(),
      };

      if (existing) {
        await db('professional_settings').where({ id: 'default' }).update(data);
      } else {
        await db('professional_settings').insert({ id: 'default', ...data });
      }

      const updated = await db('professional_settings').where({ id: 'default' }).first();

      res.json({
        success: true,
        settings: {
          ...updated,
          showWatermark: !!updated.showWatermark,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao atualizar configurações.' });
    }
  }
}
