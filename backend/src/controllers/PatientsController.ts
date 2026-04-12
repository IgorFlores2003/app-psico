import { Request, Response } from 'express';
import { hash } from 'bcryptjs';
import connection from '../database/connection';

class PatientsController {
  async index(req: Request, res: Response) {
    try {
      const patients = await connection('patients')
        .select('*')
        .orderBy('created_at', 'desc');

      return res.json(patients);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao listar pacientes' });
    }
  }

  async create(req: Request, res: Response) {
    const { name, email, password, phone, age, gender } = req.body;

    // Start a transaction
    const trx = await connection.transaction();

    try {
      // 1. Check if user already exists
      const userExists = await trx('users').where('email', email).first();

      if (userExists) {
        await trx.rollback();
        return res.status(400).json({ error: 'Este e-mail já está em uso por outro usuário ou paciente.' });
      }

      // 2. Create User account for the patient
      const hashedPassword = await hash(password, 8);
      const [user_id] = await trx('users').insert({
        name,
        email,
        password: hashedPassword,
        role: 'paciente'
      });

      // 3. Create Patient record linked to the user
      const [id] = await trx('patients').insert({
        name,
        email,
        phone,
        age,
        gender,
        user_id
      });

      const newPatient = await trx('patients').where('id', id).first();

      // Commit the transaction
      await trx.commit();

      return res.status(201).json(newPatient);
    } catch (error) {
      // Rollback on any error
      await trx.rollback();
      console.error(error);
      return res.status(500).json({ error: 'Erro ao criar conta do paciente. Tente novamente.' });
    }
  }
}

export default new PatientsController();
