import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Patients Table
  await knex.schema.createTable('patients', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').unique();
    table.string('phone');
    table.integer('age');
    table.string('gender');
    table.timestamps(true, true);
  });

  // Forms (Questionnaire Templates) Table
  await knex.schema.createTable('forms', (table) => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description');
    table.json('questions').notNullable(); // Array of questions
    table.timestamps(true, true);
  });

  // Patient_Forms (Assignments) Table
  await knex.schema.createTable('patient_forms', (table) => {
    table.increments('id').primary();
    table.integer('patient_id').unsigned().references('id').inTable('patients').onDelete('CASCADE');
    table.integer('form_id').unsigned().references('id').inTable('forms').onDelete('CASCADE');
    table.enum('status', ['pending', 'completed']).defaultTo('pending');
    table.timestamps(true, true);
  });

  // Form_Responses Table
  await knex.schema.createTable('form_responses', (table) => {
    table.increments('id').primary();
    table.integer('patient_form_id').unsigned().references('id').inTable('patient_forms').onDelete('CASCADE');
    table.json('responses').notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('form_responses');
  await knex.schema.dropTableIfExists('patient_forms');
  await knex.schema.dropTableIfExists('forms');
  await knex.schema.dropTableIfExists('patients');
}
