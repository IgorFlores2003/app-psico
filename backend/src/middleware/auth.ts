import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../lib/knex';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    twoFactorEnabled: boolean;
  };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'Configuração interna de JWT ausente.' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      sessionVersion: number;
    };

    const user = await db('users')
      .where({ id: payload.userId })
      .select('id', 'email', 'name', 'twoFactorEnabled', 'sessionVersion', 'lockedUntil')
      .first();

    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado.' });
      return;
    }

    if (user.sessionVersion !== payload.sessionVersion) {
      res.status(401).json({ error: 'Sessão revogada em outro dispositivo.' });
      return;
    }

    const lockedUntilDate = user.lockedUntil ? new Date(user.lockedUntil) : null;
    if (lockedUntilDate && lockedUntilDate > new Date()) {
      res.status(403).json({ error: 'Conta bloqueada temporariamente.' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      twoFactorEnabled: !!user.twoFactorEnabled,
    };

    next();
  } catch {
    res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }
}
