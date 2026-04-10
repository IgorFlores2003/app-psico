import { Request, Response } from 'express';
import connection from '../database/connection';

class PatientDashboardController {
  async show(req: Request, res: Response) {
    const { id } = req.params;

    try {
      // 1. Get Patient Name
      const patient = await connection('patients').where('id', id).first();
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      // 2. Get Next Appointment
      const nextAppointment = await connection('appointments')
        .where('patient_id', id)
        .where('date', '>', new Date())
        .where('status', 'confirmed')
        .orderBy('date', 'asc')
        .first();

      // 3. Get Active Questionnaires
      const questionnaires = await connection('patient_forms')
        .join('forms', 'patient_forms.form_id', '=', 'forms.id')
        .where('patient_forms.patient_id', id)
        .where('patient_forms.status', 'pending')
        .select(
          'patient_forms.id',
          'forms.title',
          'forms.description',
          'patient_forms.status',
          'patient_forms.created_at as dueDate' // Using created_at as simple due date for now
        );

      return res.json({
        name: patient.name,
        nextAppointment: nextAppointment || null,
        questionnaires
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch patient dashboard' });
    }
  }
}

export default new PatientDashboardController();
