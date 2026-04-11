import { Knex } from "knex";
import { hash } from "bcryptjs";

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries in users
    await knex("users").del();

    const hashedPassword = await hash("admin123", 8);

    // Inserts seed entries
    await knex("users").insert([
        { 
          name: "Administrador", 
          email: "admin@psico.com", 
          password: hashedPassword 
        }
    ]);
};
