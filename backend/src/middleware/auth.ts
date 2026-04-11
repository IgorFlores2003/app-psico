import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

interface TokenPayload {
  iat: number;
  exp: number;
  sub: string;
}

export function auth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'JWT token is missing' });
  }

  const [, token] = authHeader.split(' ');

  try {
    const secret = process.env.APP_SECRET || 'default-secret';
    const decoded = verify(token, secret);

    const { sub } = decoded as TokenPayload;

    // Optional: Add user ID to request for later use
    // req.user = { id: sub };

    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid JWT token' });
  }
}
