import crypto from 'crypto';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import { db } from '../lib/knex';
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

    const user = await db('users')
      .where({ email: email.toLowerCase().trim() })
      .first();

    if (!user) {
      // Prevent timing attacks
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

    const lockedUntilDate = user.lockedUntil ? new Date(user.lockedUntil) : null;
    if (lockedUntilDate && lockedUntilDate > new Date()) {
      const remainingMinutes = Math.ceil((lockedUntilDate.getTime() - Date.now()) / 60000);
      res.status(403).json({
        error: `Conta bloqueada temporariamente. Tente novamente em ${remainingMinutes} min.`,
        isLocked: true,
      });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString() : null;
      await db('users')
        .where({ id: user.id })
        .update({
          failedLoginAttempts: attempts,
          lockedUntil,
          updatedAt: new Date().toISOString(),
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

    await db('users')
      .where({ id: user.id })
      .update({
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date().toISOString(),
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
        twoFactorEnabled: !!user.twoFactorEnabled,
      },
    });
  }

  static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const settings = await db('professional_settings')
      .where({ id: 'default' })
      .first();

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
    await db('users')
      .where({ id: user.id })
      .update({
        twoFactorSecret: secret,
        updatedAt: new Date().toISOString(),
      });

    res.json({ secret, qrCodeUrl });
  }

  static async confirm2FA(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const { code } = req.body;

    const dbUser = await db('users').where({ id: user.id }).first();
    if (!dbUser?.twoFactorSecret) {
      res.status(400).json({ error: 'Configuração não iniciada.' });
      return;
    }

    const check = verifySync({ token: code.trim(), secret: dbUser.twoFactorSecret });
    if (!check.valid) {
      res.status(400).json({ error: 'Código 2FA inválido.' });
      return;
    }

    await db('users')
      .where({ id: user.id })
      .update({
        twoFactorEnabled: true,
        updatedAt: new Date().toISOString(),
      });

    res.json({ success: true, message: '2FA ativado com sucesso!' });
  }

  static async disable2FA(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    await db('users')
      .where({ id: user.id })
      .update({
        twoFactorEnabled: false,
        twoFactorSecret: null,
        updatedAt: new Date().toISOString(),
      });
    res.json({ success: true, message: '2FA desativado.' });
  }

  static async revokeAllSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    await db('users')
      .where({ id: user.id })
      .update({
        sessionVersion: db.raw('sessionVersion + 1'),
        updatedAt: new Date().toISOString(),
      });
    res.json({ success: true, message: 'Todas as sessões foram invalidadas.' });
  }

  static async register(req: Request, res: Response): Promise<void> {
    const { name, email, password } = req.body;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || '';

    if (!name?.trim()) {
      res.status(400).json({ error: 'Nome completo é obrigatório.' });
      return;
    }
    if (!email?.trim() || !email.includes('@')) {
      res.status(400).json({ error: 'E-mail válido é obrigatório.' });
      return;
    }
    if (!password || password.trim().length < 8) {
      res.status(400).json({ error: 'A senha deve conter no mínimo 8 caracteres.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await db('users').where({ email: cleanEmail }).first();
    if (existing) {
      res.status(409).json({ error: 'Já existe uma conta cadastrada com este e-mail.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password.trim(), 12);
    const userId = crypto.randomUUID();

    await db('users').insert({
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      twoFactorEnabled: false,
      sessionVersion: 1,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const existingSettings = await db('professional_settings').where({ id: 'default' }).first();
    if (!existingSettings) {
      await db('professional_settings').insert({
        id: 'default',
        therapistName: name.trim(),
        crp: '00/00000',
        updatedAt: new Date().toISOString(),
      });
    }

    const secret = process.env.JWT_SECRET!;
    const token = jwt.sign(
      { userId, email: cleanEmail, sessionVersion: 1 },
      secret,
      { expiresIn: '8h' }
    );

    await createAuditLog({
      action: 'USER_REGISTERED',
      userId,
      details: `Novo terapeuta cadastrado: ${cleanEmail}`,
      ipAddress: ip,
      userAgent,
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        email: cleanEmail,
        name: name.trim(),
        twoFactorEnabled: false,
      },
    });
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const { name, email } = req.body;

    if (!name?.trim()) {
      res.status(400).json({ error: 'Nome não pode ser vazio.' });
      return;
    }
    if (!email?.trim() || !email.includes('@')) {
      res.status(400).json({ error: 'E-mail inválido.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if new email is taken by another user
    if (cleanEmail !== user.email) {
      const existing = await db('users').where({ email: cleanEmail }).whereNot({ id: user.id }).first();
      if (existing) {
        res.status(409).json({ error: 'Este e-mail já está em uso por outro usuário.' });
        return;
      }
    }

    await db('users').where({ id: user.id }).update({
      name: name.trim(),
      email: cleanEmail,
      updatedAt: new Date().toISOString(),
    });

    const settings = await db('professional_settings').where({ id: 'default' }).first();
    if (settings && (settings.therapistName === user.name || !settings.therapistName)) {
      await db('professional_settings').where({ id: 'default' }).update({
        therapistName: name.trim(),
        updatedAt: new Date().toISOString(),
      });
    }

    await createAuditLog({
      action: 'PROFILE_UPDATED',
      userId: user.id,
      details: `Perfil atualizado: ${name.trim()} (${cleanEmail})`,
    });

    const secret = process.env.JWT_SECRET!;
    const dbUser = await db('users').where({ id: user.id }).first();
    const token = jwt.sign(
      { userId: user.id, email: cleanEmail, sessionVersion: dbUser.sessionVersion },
      secret,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: cleanEmail,
        name: name.trim(),
        twoFactorEnabled: !!dbUser.twoFactorEnabled,
      },
      message: 'Perfil atualizado com sucesso!',
    });
  }

  static async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      res.status(400).json({ error: 'Senha atual é obrigatória.' });
      return;
    }
    if (!newPassword || newPassword.trim().length < 8) {
      res.status(400).json({ error: 'A nova senha deve conter no mínimo 8 caracteres.' });
      return;
    }

    const dbUser = await db('users').where({ id: user.id }).first();
    if (!dbUser) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    const isValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!isValid) {
      res.status(400).json({ error: 'Senha atual incorreta.' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword.trim(), 12);

    const newVersion = (dbUser.sessionVersion || 1) + 1;
    await db('users').where({ id: user.id }).update({
      passwordHash: newHash,
      sessionVersion: newVersion,
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date().toISOString(),
    });

    await createAuditLog({
      action: 'PASSWORD_CHANGED',
      userId: user.id,
      details: 'Senha alterada pelo próprio usuário',
    });

    const secret = process.env.JWT_SECRET!;
    const token = jwt.sign(
      { userId: user.id, email: dbUser.email, sessionVersion: newVersion },
      secret,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      message: 'Senha alterada com sucesso! As demais sessões foram desconectadas.',
    });
  }
}
