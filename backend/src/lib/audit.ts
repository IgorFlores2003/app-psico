import { prisma } from './prisma';

export type AuditAction =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGED'
  | '2FA_ENABLED'
  | '2FA_DISABLED'
  | 'ALL_SESSIONS_REVOKED'
  | 'PATIENT_CREATED'
  | 'PATIENT_UPDATED'
  | 'PATIENT_ARCHIVED'
  | 'PATIENT_UNARCHIVED'
  | 'SESSION_CREATED'
  | 'SESSION_UPDATED'
  | 'SESSION_NOTE_UPDATED'
  | 'MEDICAL_RECORD_UPDATED'
  | 'ANAMNESIS_SAVED'
  | 'ASSESSMENT_SENT'
  | 'ASSESSMENT_ANSWERED'
  | 'EXPORT_MEDICAL_RECORD_PDF'
  | 'EXPORT_SESSION_NOTES_PDF'
  | 'EXPORT_SESSIONS_EXCEL'
  | 'SETTINGS_UPDATED';

interface AuditParams {
  action: AuditAction;
  userId?: string | null;
  patientId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function createAuditLog(params: AuditParams): Promise<void> {
  try {
    const safeDetails = params.details ? params.details.substring(0, 300) : null;
    await prisma.auditLog.create({
      data: {
        action: params.action,
        userId: params.userId || null,
        patientId: params.patientId || null,
        details: safeDetails,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent ? params.userAgent.substring(0, 200) : null,
      },
    });
  } catch (error) {
    console.error('AuditLog write error:', error);
  }
}
