import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex("form_responses").del();
    await knex("patient_forms").del();
    await knex("patients").del();
    await knex("forms").del();

    // Inserts seed entries
    const [patient1Id] = await knex("patients").insert([
        { name: "Marcos Oliveira", email: "marcos@email.com", phone: "(11) 98765-4321", age: 34, gender: "Masculino" },
    ]);

    const [patient2Id] = await knex("patients").insert([
        { name: "Ana Costa", email: "ana.c@email.com", phone: "(11) 91234-5678", age: 28, gender: "Feminino" },
    ]);

    const [formId] = await knex("forms").insert([
        { 
          title: "Avaliação Inicial", 
          description: "Primeira conversa e histórico do paciente.",
          questions: JSON.stringify([
            { id: 1, type: 'text', label: 'Como você se sente hoje?' },
            { id: 2, type: 'scale', label: 'Nível de ansiedade (0-10)' }
          ])
        }
    ]);

    const [patientForm1Id] = await knex("patient_forms").insert([
        { patient_id: patient1Id, form_id: formId, status: "completed" }
    ]);

    await knex("patient_forms").insert([
        { patient_id: patient2Id, form_id: formId, status: "pending" }
    ]);

    await knex("form_responses").insert([
        { patient_form_id: patientForm1Id, responses: JSON.stringify({ q1: "Muito bem", q2: "Nenhuma queixa" }) }
    ]);

    // Add Appointments
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(14, 0, 0, 0);

    await knex("appointments").insert([
        { 
          patient_id: patient1Id, 
          date: nextWeek, 
          status: 'confirmed', 
          type: 'presencial',
          notes: 'Conversar sobre progresso semanal.'
        }
    ]);
};
