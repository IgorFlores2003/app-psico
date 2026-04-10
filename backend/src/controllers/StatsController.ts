import { Request, Response } from 'express';
import connection from '../database/connection';

class StatsController {
  async index(req: Request, res: Response) {
    try {
      // 1. Total Patients
      const [patientsCount] = await connection('patients').count('id as total');

      // 2. Forms Answered
      const [responsesCount] = await connection('form_responses').count('id as total');

      // 3. Pending Questionnaires
      const [pendingCount] = await connection('patient_forms')
        .where('status', 'pending')
        .count('id as total');

      // 4. Return Rate (Example calculation)
      // Percentage of patients who have at least one response
      const [patientsWithResponses] = await connection('patients')
        .whereExists(function() {
          this.select('*')
            .from('patient_forms')
            .whereRaw('patient_forms.patient_id = patients.id')
            .where('status', 'completed');
        })
        .count('id as count');

      const totalPatients = Number(patientsCount.total) || 0;
      const totalWithResponses = Number(patientsWithResponses.count) || 0;
      const returnRate = totalPatients > 0 ? Math.round((totalWithResponses / totalPatients) * 100) : 0;

      return res.json({
        totalPatients,
        formsAnswered: Number(responsesCount.total) || 0,
        pendingForms: Number(pendingCount.total) || 0,
        returnRate: `${returnRate}%`
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
}

export default new StatsController();
