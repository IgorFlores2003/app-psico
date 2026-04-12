import { Request, Response } from 'express';
import { hash } from 'bcryptjs';
import connection from '../database/connection';

class UsersController {
  async index(req: Request, res: Response) {
    try {
      const users = await connection('users')
        .select('id', 'name', 'email', 'role', 'created_at');

      return res.json(users);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao listar usuários' });
    }
  }

  async create(req: Request, res: Response) {
    const { name, email, password, role } = req.body;

    try {
      // Check if user already exists
      const userExists = await connection('users').where('email', email).first();

      if (userExists) {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado' });
      }

      // Hash password
      const hashedPassword = await hash(password, 8);

      const [id] = await connection('users').insert({
        name,
        email,
        password: hashedPassword,
        role: role || 'psicologo',
      });

      return res.status(201).json({ id, name, email, role: role || 'psicologo' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao criar usuário' });
    }
  }
}

export default new UsersController();
