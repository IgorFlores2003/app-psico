import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { encrypt, decrypt } from '../lib/crypto';
import { createAuditLog } from '../lib/audit';
import { AuthenticatedRequest } from '../middleware/auth';

export class PatientsController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const q = (req.query.q as string)?.trim() || '';
    const status = (req.query.status as string) || 'ATIVO';

    try {
      const patients = await prisma.patient.findMany({
        where: {
          status: status === 'TODOS' ? undefined : status,
          fullName: q ? { contains: q } : undefined,
        },
        include: {
          _count: { select: { sessions: true, assignments: true } },
          sessions: { orderBy: { sessionDate: 'desc' }, take: 1, select: { sessionDate: true } },
        },
        orderBy: { fullName: 'asc' },
      });

      const sanitized = patients.map((p) => ({
        id: p.id,
        fullName: p.fullName,
        birthDate: p.birthDate,
        email: p.email,
        phone: p.phone,
        status: p.status,
        notes: p.notes ? decrypt(p.notes) : null,
        totalSessions: p._count.sessions,
        totalAssignments: p._count.assignments,
        lastSessionDate: p.sessions[0]?.sessionDate || null,
        createdAt: p.createdAt,
      }));

      res.json({ patients: sanitized });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao listar pacientes.' });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { fullName, birthDate, email, phone, notes } = req.body;
    if (!fullName?.trim()) {
      res.status(400).json({ error: 'Nome completo é obrigatório.' });
      return;
    }
    if (!birthDate) {
      res.status(400).json({ error: 'Data de nascimento é obrigatória.' });
      return;
    }

    try {
      const patient = await prisma.patient.create({
        data: {
          fullName: fullName.trim(),
          birthDate: birthDate.trim(),
          email: email?.trim() || null,
          phone: phone?.trim() || null,
          notes: notes?.trim() ? encrypt(notes.trim()) : null,
          status: 'ATIVO',
        },
      });

      await createAuditLog({
        action: 'PATIENT_CREATED',
        userId: req.user!.id,
        patientId: patient.id,
        details: 'Novo paciente cadastrado',
      });

      res.json({ success: true, patient });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao cadastrar paciente.' });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          _count: { select: { sessions: true, assignments: true } },
          sessions: {
            orderBy: { sessionDate: 'desc' },
            take: 5,
            select: { id: true, sessionDate: true, sessionTime: true, status: true },
          },
          anamnesis: { select: { updatedAt: true } },
        },
      });

      if (!patient) {
        res.status(404).json({ error: 'Paciente não encontrado.' });
        return;
      }

      res.json({
        patient: {
          id: patient.id,
          fullName: patient.fullName,
          birthDate: patient.birthDate,
          email: patient.email,
          phone: patient.phone,
          status: patient.status,
          notes: patient.notes ? decrypt(patient.notes) : null,
          totalSessions: patient._count.sessions,
          totalAssignments: patient._count.assignments,
          hasAnamnesis: !!patient.anamnesis,
          anamnesisUpdatedAt: patient.anamnesis?.updatedAt || null,
          recentSessions: patient.sessions,
          createdAt: patient.createdAt,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao buscar dados do paciente.' });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { fullName, birthDate, email, phone, notes } = req.body;

    try {
      const updated = await prisma.patient.update({
        where: { id },
        data: {
          fullName: fullName?.trim(),
          birthDate: birthDate?.trim(),
          email: email?.trim() || null,
          phone: phone?.trim() || null,
          notes: notes ? encrypt(notes.trim()) : null,
        },
      });
      res.json({ success: true, patient: updated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao atualizar paciente.' });
    }
  }

  static async toggleArchive(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;

    try {
      await prisma.patient.update({
        where: { id },
        data: { status },
      });
      res.json({ success: true, status });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao alterar status.' });
    }
  }
}
