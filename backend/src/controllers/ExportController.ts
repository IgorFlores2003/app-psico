import { Response } from 'express';
import * as XLSX from 'xlsx';
import { db } from '../lib/knex';
import { AuthenticatedRequest } from '../middleware/auth';

export class ExportController {
  static async exportHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { patientId, startDate, endDate, status, format } = req.query as {
      patientId?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
      format?: string;
    };

    if (!patientId) {
      res.status(400).json({ error: 'Paciente obrigatório.' });
      return;
    }

    try {
      const patient = await db('patients').where({ id: patientId }).first();
      if (!patient) {
        res.status(404).json({ error: 'Paciente não encontrado.' });
        return;
      }

      let query = db('sessions')
        .where({ patientId })
        .select('sessionDate', 'sessionTime', 'status')
        .orderBy('sessionDate', 'asc');

      if (startDate) {
        query = query.where('sessionDate', '>=', startDate);
      }
      if (endDate) {
        query = query.where('sessionDate', '<=', endDate);
      }
      if (status && status !== 'TODAS') {
        query = query.where('status', status);
      }

      const sessions = await query;

      if (format === 'excel') {
        const rows = sessions.map((s: any, index: number) => ({
          'Nº': index + 1,
          'Paciente': patient.fullName,
          'Data': s.sessionDate.split('-').reverse().join('/'),
          'Horário': s.sessionTime || 'Não informado',
          'Situação': s.status,
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Histórico');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="historico_${patient.fullName.replace(/\s+/g, '_')}.xlsx"`
        );
        res.send(buffer);
        return;
      }

      res.json({ patientName: patient.fullName, sessions });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao exportar histórico.' });
    }
  }
}
