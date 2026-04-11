import { Request, Response } from 'express';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import connection from '../database/connection';

class SessionsController {
  async create(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
      // 1. Find User
      const user = await connection('users').where('email', email).first();

      if (!user) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos' });
      }

      // 2. Verify Password
      const passwordMatched = await compare(password, user.password);

      if (!passwordMatched) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos' });
      }

      // 3. Generate JWT Token
      const secret = process.env.APP_SECRET || 'default-secret';
      const token = sign({}, secret, {
        subject: String(user.id),
        expiresIn: '7d'
      });

      // Remove password from response
      delete user.password;

      return res.json({ user, token });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno no servidor' });
    }
  }
}

export default new SessionsController();
