import { Router } from 'express';
import PatientsController from './controllers/PatientsController';
import StatsController from './controllers/StatsController';
import PatientDashboardController from './controllers/PatientDashboardController';

const routes = Router();

// Patients
routes.get('/patients', PatientsController.index);
routes.post('/patients', PatientsController.create);

// Statistics
routes.get('/stats', StatsController.index);

// Patient View
routes.get('/patient/:id/dashboard', PatientDashboardController.show);

export default routes;
