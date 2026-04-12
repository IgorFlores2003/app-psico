import { Router } from 'express';
import PatientsController from './controllers/PatientsController';
import StatsController from './controllers/StatsController';
import PatientDashboardController from './controllers/PatientDashboardController';
import SessionsController from './controllers/SessionsController';
import UsersController from './controllers/UsersController';
import { auth } from './middleware/auth';

const routes = Router();

// Sessions (Login)
routes.post('/login', SessionsController.create);

// Protected Admin Routes
routes.get('/patients', auth, PatientsController.index);
routes.post('/patients', auth, PatientsController.create);
routes.get('/stats', auth, StatsController.index);

// User Management
routes.post('/register', UsersController.create); // Public registration
routes.get('/users', auth, UsersController.index);
routes.post('/users', auth, UsersController.create);

// Patient View (Will be localized later)
routes.get('/patient/:id/dashboard', PatientDashboardController.show);

export default routes;
