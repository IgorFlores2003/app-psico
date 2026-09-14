import { Router } from 'express';
import { AuthController } from './controllers/AuthController';
import { PatientsController } from './controllers/PatientsController';
import { SessionsController } from './controllers/SessionsController';
import { AIController } from './controllers/AIController';
import { AnamnesisController } from './controllers/AnamnesisController';
import { ScalesController } from './controllers/ScalesController';
import { ResponderController } from './controllers/ResponderController';
import { ExportController } from './controllers/ExportController';
import { SettingsController } from './controllers/SettingsController';
import { authMiddleware } from './middleware/auth';

const router = Router();

// Public routes
router.post('/auth/login', AuthController.login);
router.post('/auth/register', AuthController.register);
router.get('/responder/:token', ResponderController.getByToken);
router.post('/responder/:token', ResponderController.submitAnswers);

// Protected routes (require valid JWT and active session)
router.use(authMiddleware);

// Auth & Security
router.get('/auth/me', AuthController.me);
router.put('/auth/profile', AuthController.updateProfile);
router.put('/auth/change-password', AuthController.changePassword);
router.post('/auth/2fa', AuthController.setup2FA);
router.put('/auth/2fa', AuthController.confirm2FA);
router.delete('/auth/2fa', AuthController.disable2FA);
router.post('/auth/sessions/revoke-all', AuthController.revokeAllSessions);

// Patients
router.get('/pacientes', PatientsController.list);
router.post('/pacientes', PatientsController.create);
router.get('/pacientes/:id', PatientsController.getById);
router.put('/pacientes/:id', PatientsController.update);
router.patch('/pacientes/:id', PatientsController.toggleArchive);

// Sessions
router.get('/pacientes/:patientId/sessoes', SessionsController.listByPatient);
router.post('/pacientes/:patientId/sessoes', SessionsController.create);
router.put('/sessoes/:sessionId', SessionsController.update);

// AI
router.post('/ai/generate', AIController.generate);
router.post('/ai/regenerate', AIController.regenerate);

// Anamnesis
router.get('/pacientes/:patientId/anamnese', AnamnesisController.getByPatient);
router.post('/pacientes/:patientId/anamnese', AnamnesisController.saveByPatient);

// Scales & Questionnaires
router.get('/escalas', ScalesController.listCatalog);
router.post('/escalas/aplicar', ScalesController.applyScale);
router.get('/escalas/paciente/:patientId', ScalesController.getPatientHistory);

// Export & Settings
router.get('/exportar/historico', ExportController.exportHistory);
router.get('/configuracoes', SettingsController.getSettings);
router.put('/configuracoes', SettingsController.updateSettings);

export default router;
