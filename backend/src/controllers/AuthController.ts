import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import { prisma } from '../lib/prisma';
import { createAuditLog } from '../lib/audit';
import { AuthenticatedRequest } from '../middleware/auth';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    const { email, password, totpToken } = req.body;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || '';

    if (!email || !password) {
      res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      await bcrypt.compare('dummy123', '$2a$12$e8Y5tGzO9N5aYJ9N/bL4e.uG2hXm6Q2gU7.4lX2bU5.1nQ5nK.qye');
      await createAuditLog({
        action: 'LOGIN_FAILED',
        details: 'Tentativa com e-mail inexistente',
        ipAddress: ip,
        userAgent,
      });
      res.status(401).json({ error: 'Credenciais inválidas.' });
      return;
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      res.status(403).json({
        error: `Conta bloqueada temporariamente. Tente novamente em ${remainingMinutes} min.`,
        isLocked: true,
      });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      const attempts = user.failedLoginAttempts + 1;
      const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60000) : null;
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: attempts, lockedUntil },
      });
      await createAuditLog({
        action: 'LOGIN_FAILED',
        userId: user.id,
        details: 'Senha incorreta',
        ipAddress: ip,
        userAgent,
      });
      res.status(401).json({ error: 'Credenciais inválidas.' });
      return;
    }

    if (user.twoFactorEnabled) {
      if (!totpToken) {
        res.json({ requires2FA: true, message: 'Código 2FA necessário.' });
        return;
      }
      const check = verifySync({ token: totpToken.trim(), secret: user.twoFactorSecret || '' });
      if (!check.valid) {
        res.status(401).json({ error: 'Código 2FA incorreto ou expirado.' });
        return;
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    const secret = process.env.JWT_SECRET!;
    const token = jwt.sign(
      { userId: user.id, email: user.email, sessionVersion: user.sessionVersion },
      secret,
      { expiresIn: '8h' }
    );

    await createAuditLog({
      action: 'LOGIN',
      userId: user.id,
      details: 'Login efetuado com sucesso',
      ipAddress: ip,
      userAgent,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  }

  static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const settings = await prisma.professionalSettings.findUnique({
      where: { id: 'default' },
    });

    res.json({
      user: req.user,
      settings: settings || { therapistName: req.user.name, crp: '00/00000' },
    });
  }

  static async setup2FA(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const secret = generateSecret();
    const otpauth = generateURI({
      issuer: 'ProntuarioPsicologia',
      label: user.email,
      secret,
    });

    const qrCodeUrl = await QRCode.toDataURL(otpauth);
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret },
    });

    res.json({ secret, qrCodeUrl });
  }

  static async confirm2FA(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const { code } = req.body;

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.twoFactorSecret) {
      res.status(400).json({ error: 'Configuração não iniciada.' });
      return;
    }

    const check = verifySync({ token: code.trim(), secret: dbUser.twoFactorSecret });
    if (!check.valid) {
      res.status(400).json({ error: 'Código 2FA inválido.' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });

    res.json({ success: true, message: '2FA ativado com sucesso!' });
  }

  static async disable2FA(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    res.json({ success: true, message: '2FA desativado.' });
  }

  static async revokeAllSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    await prisma.user.update({
      where: { id: user.id },
      data: { sessionVersion: { increment: 1 } },
    });
    res.json({ success: true, message: 'Todas as sessões foram invalidadas.' });
  }
}
