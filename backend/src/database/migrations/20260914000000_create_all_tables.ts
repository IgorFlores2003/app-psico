import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Users
  await knex.schema.createTable('users', (table) => {
    table.string('id').primary();
    table.string('email').notNullable().unique();
    table.string('name').notNullable();
    table.text('passwordHash').notNullable();
    table.text('twoFactorSecret').nullable();
    table.boolean('twoFactorEnabled').notNullable().defaultTo(false);
    table.integer('sessionVersion').notNullable().defaultTo(1);
    table.integer('failedLoginAttempts').notNullable().defaultTo(0);
    table.datetime('lockedUntil').nullable();
    table.datetime('createdAt').notNullable().defaultTo(knex.fn.now());
    table.datetime('updatedAt').notNullable().defaultTo(knex.fn.now());
  });

  // 2. Patients
  await knex.schema.createTable('patients', (table) => {
    table.string('id').primary();
    table.string('fullName').notNullable();
    table.string('birthDate').notNullable();
    table.string('email').nullable();
    table.string('phone').nullable();
    table.text('notes').nullable();
    table.string('status').notNullable().defaultTo('ATIVO');
    table.datetime('createdAt').notNullable().defaultTo(knex.fn.now());
    table.datetime('updatedAt').notNullable().defaultTo(knex.fn.now());
  });

  // 3. Sessions
  await knex.schema.createTable('sessions', (table) => {
    table.string('id').primary();
    table.string('patientId').notNullable().references('id').inTable('patients').onDelete('CASCADE');
    table.string('sessionDate').notNullable();
    table.string('sessionTime').nullable();
    table.string('status').notNullable().defaultTo('REALIZADA');
    table.text('rawNotesEncrypted').nullable();
    table.datetime('createdAt').notNullable().defaultTo(knex.fn.now());
    table.datetime('updatedAt').notNullable().defaultTo(knex.fn.now());
  });

  // 4. Session Notes
  await knex.schema.createTable('session_notes', (table) => {
    table.string('id').primary();
    table.string('sessionId').notNullable().unique().references('id').inTable('sessions').onDelete('CASCADE');
    table.text('contentEncrypted').notNullable();
    table.string('status').notNullable().defaultTo('APROVADO');
    table.datetime('createdAt').notNullable().defaultTo(knex.fn.now());
    table.datetime('updatedAt').notNullable().defaultTo(knex.fn.now());
  });

  // 5. Note Versions
  await knex.schema.createTable('note_versions', (table) => {
    table.string('id').primary();
    table.string('sessionNoteId').notNullable().references('id').inTable('session_notes').onDelete('CASCADE');
    table.text('contentEncrypted').notNullable();
    table.text('reason').nullable();
    table.datetime('createdAt').notNullable().defaultTo(knex.fn.now());
  });

  // 6. Medical Record Entries
  await knex.schema.createTable('medical_record_entries', (table) => {
    table.string('id').primary();
    table.string('sessionId').notNullable().unique().references('id').inTable('sessions').onDelete('CASCADE');
    table.text('contentEncrypted').notNullable();
    table.string('status').notNullable().defaultTo('APROVADO');
    table.datetime('createdAt').notNullable().defaultTo(knex.fn.now());
    table.datetime('updatedAt').notNullable().defaultTo(knex.fn.now());
  });

  // 7. Record Versions
  await knex.schema.createTable('record_versions', (table) => {
    table.string('id').primary();
    table.string('recordEntryId').notNullable().references('id').inTable('medical_record_entries').onDelete('CASCADE');
    table.text('contentEncrypted').notNullable();
    table.text('reason').nullable();
    table.datetime('createdAt').notNullable().defaultTo(knex.fn.now());
  });

  // 8. Anamnesis
  await knex.schema.createTable('anamnesis', (table) => {
    table.string('id').primary();
    table.string('patientId').notNullable().unique().references('id').inTable('patients').onDelete('CASCADE');
    table.text('dataEncrypted').notNullable();
    table.datetime('createdAt').notNullable().defaultTo(knex.fn.now());
    table.datetime('updatedAt').notNullable().defaultTo(knex.fn.now());
  });

  // 9. Assessment Instruments
  await knex.schema.createTable('assessment_instruments', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('acronym').notNullable().unique();
    table.string('category').notNullable();
    table.text('description').notNullable();
    table.text('whatItMeasures').notNullable();
    table.string('authors').notNullable();
    table.text('reference').notNullable();
    table.integer('itemCount').notNullable();
    table.string('scoringMethod').notNullable();
    table.text('cutoffs').notNullable();
    table.text('interpretationRules').notNullable();
    table.string('targetAge').nullable();
    table.text('instructions').notNullable();
    table.boolean('canApplyOnline').notNullable().defaultTo(true);
    table.boolean('hasAutoScoring').notNullable().defaultTo(true);
    table.text('usageConditions').notNullable();
    table.string('verificationSource').notNullable();
    table.text('items').notNullable();
    table.datetime('createdAt').notNullable().defaultTo(knex.fn.now());
    table.datetime('updatedAt').notNullable().defaultTo(knex.fn.now());
  });

  // 10. Assessment Assignments
  await knex.schema.createTable('assessment_assignments', (table) => {
    table.string('id').primary();
    table.string('patientId').notNullable().references('id').inTable('patients').onDelete('CASCADE');
    table.string('instrumentId').notNullable().references('id').inTable('assessment_instruments').onDelete('CASCADE');
    table.string('secureToken').notNullable().unique();
    table.string('status').notNullable().defaultTo('ENVIADO');
    table.datetime('sentAt').notNullable().defaultTo(knex.fn.now());
    table.datetime('expiresAt').notNullable();
    table.datetime('respondedAt').nullable();
  });

  // 11. Assessment Responses
  await knex.schema.createTable('assessment_responses', (table) => {
    table.string('id').primary();
    table.string('assignmentId').notNullable().unique().references('id').inTable('assessment_assignments').onDelete('CASCADE');
    table.text('answersEncrypted').notNullable();
    table.float('totalScore').nullable();
    table.string('classification').nullable();
    table.datetime('completedAt').notNullable().defaultTo(knex.fn.now());
  });

  // 12. Audit Logs
  await knex.schema.createTable('audit_logs', (table) => {
    table.string('id').primary();
    table.string('action').notNullable();
    table.string('userId').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('patientId').nullable();
    table.text('details').nullable();
    table.string('ipAddress').nullable();
    table.string('userAgent').nullable();
    table.datetime('createdAt').notNullable().defaultTo(knex.fn.now());
  });

  // 13. Professional Settings
  await knex.schema.createTable('professional_settings', (table) => {
    table.string('id').primary().defaultTo('default');
    table.string('therapistName').notNullable().defaultTo('Psicóloga(o)');
    table.string('crp').notNullable().defaultTo('00/00000');
    table.string('clinicName').nullable();
    table.text('headerText').nullable();
    table.text('footerText').nullable();
    table.text('watermarkText').nullable();
    table.boolean('showWatermark').notNullable().defaultTo(false);
    table.datetime('updatedAt').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('professional_settings');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('assessment_responses');
  await knex.schema.dropTableIfExists('assessment_assignments');
  await knex.schema.dropTableIfExists('assessment_instruments');
  await knex.schema.dropTableIfExists('anamnesis');
  await knex.schema.dropTableIfExists('record_versions');
  await knex.schema.dropTableIfExists('medical_record_entries');
  await knex.schema.dropTableIfExists('note_versions');
  await knex.schema.dropTableIfExists('session_notes');
  await knex.schema.dropTableIfExists('sessions');
  await knex.schema.dropTableIfExists('patients');
  await knex.schema.dropTableIfExists('users');
}
