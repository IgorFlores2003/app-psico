import { Request, Response } from 'express';
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
      return res.status(500).json({ error: 'Failed to fetch patients' });
    }
  }

  async create(req: Request, res: Response) {
    const { name, email, phone, age, gender } = req.body;

    try {
      const [id] = await connection('patients').insert({
        name,
        email,
        phone,
        age,
        gender
      });

      const newPatient = await connection('patients').where('id', id).first();

      return res.status(201).json(newPatient);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to create patient' });
    }
  }
}

export default new PatientsController();
