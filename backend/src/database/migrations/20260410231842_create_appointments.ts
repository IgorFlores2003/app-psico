import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('appointments', (table) => {
    table.increments('id').primary();
    table.integer('patient_id').unsigned().references('id').inTable('patients').onDelete('CASCADE');
    table.datetime('date').notNullable();
    table.string('status').defaultTo('confirmed'); // confirmed, pending, cancelled, completed
    table.string('type').defaultTo('presencial'); // presencial, remoto
    table.text('notes');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('appointments');
}
