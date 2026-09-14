import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export class SettingsController {
  static async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      let settings = await prisma.professionalSettings.findUnique({ where: { id: 'default' } });
      if (!settings) {
        settings = await prisma.professionalSettings.create({
          data: { id: 'default', therapistName: req.user!.name, crp: '00/00000' },
        });
      }

      const auditLogs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 40,
        select: { id: true, action: true, details: true, ipAddress: true, createdAt: true },
      });

      res.json({ settings, auditLogs, user: req.user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao carregar configurações.' });
    }
  }

  static async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { therapistName, crp, clinicName, headerText, footerText, watermarkText, showWatermark } = req.body;

    try {
      const updated = await prisma.professionalSettings.upsert({
        where: { id: 'default' },
        update: {
          therapistName: therapistName || req.user!.name,
          crp: crp || '00/00000',
          clinicName: clinicName || null,
          headerText: headerText || null,
          footerText: footerText || null,
          watermarkText: watermarkText || null,
          showWatermark: !!showWatermark,
        },
        create: {
          id: 'default',
          therapistName: therapistName || req.user!.name,
          crp: crp || '00/00000',
          clinicName: clinicName || null,
          headerText: headerText || null,
          footerText: footerText || null,
          watermarkText: watermarkText || null,
          showWatermark: !!showWatermark,
        },
      });

      res.json({ success: true, settings: updated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao atualizar configurações.' });
    }
  }
}
