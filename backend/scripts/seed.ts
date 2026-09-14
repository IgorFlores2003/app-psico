import 'dotenv/config';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../src/lib/knex';
import { AUTHORIZED_SCALES } from '../src/lib/scales';
import { encrypt, encryptJSON } from '../src/lib/crypto';

async function main() {
  console.log('🌱 Iniciando seed do backend com Knex...');

  // Ensure migrations are ran
  await db.migrate.latest();

  const defaultEmail = process.env.ADMIN_EMAIL || 'terapeuta@psicologia.com';
  const defaultPassword = process.env.ADMIN_PASSWORD || 'Terapeuta@Segura2026!';

  let user = await db('users').where({ email: defaultEmail }).first();
  if (!user) {
    const passwordHash = await bcrypt.hash(defaultPassword, 12);
    const userId = crypto.randomUUID();
    await db('users').insert({
      id: userId,
      email: defaultEmail,
      name: 'Dra. Maria Clara Silva',
      passwordHash,
      twoFactorEnabled: false,
      sessionVersion: 1,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(`✅ Usuário terapeuta criado: ${defaultEmail}`);
  }

  const existingSettings = await db('professional_settings').where({ id: 'default' }).first();
  if (!existingSettings) {
    await db('professional_settings').insert({
      id: 'default',
      therapistName: 'Dra. Maria Clara Silva',
      crp: '06/123456',
      clinicName: 'Consultório de Psicologia Clínica',
      headerText: 'Dra. Maria Clara Silva • Psicóloga Clínica • CRP 06/123456',
      footerText: 'Documento confidencial emitido para fins clínicos/legais • LGPD',
      watermarkText: 'CONFIDENCIAL - SIGILO PROFISSIONAL',
      showWatermark: false,
      updatedAt: new Date().toISOString(),
    });
    console.log('✅ Configurações profissionais padrão criadas.');
  }

  for (const scale of AUTHORIZED_SCALES) {
    const existing = await db('assessment_instruments').where({ acronym: scale.acronym }).first();

    if (!existing) {
      await db('assessment_instruments').insert({
        id: crypto.randomUUID(),
        acronym: scale.acronym,
        name: scale.name,
        category: scale.category,
        description: scale.description,
        whatItMeasures: scale.whatItMeasures,
        authors: scale.authors,
        reference: scale.reference,
        itemCount: scale.itemCount,
        scoringMethod: scale.scoringMethod,
        cutoffs: JSON.stringify(scale.cutoffs),
        interpretationRules: JSON.stringify({
          note: 'Classificação objetiva conforme manual oficial da escala.',
        }),
        targetAge: scale.targetAge,
        instructions: scale.instructions,
        canApplyOnline: true,
        hasAutoScoring: true,
        usageConditions: scale.usageConditions,
        verificationSource: scale.verificationSource,
        items: JSON.stringify(scale.items),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log(`✅ Escala cadastrada: ${scale.acronym}`);
    }
  }

  const fictitiousEmail = 'paciente.ficticio@exemplo.com';
  let fictitiousPatient = await db('patients').where({ email: fictitiousEmail }).first();

  if (!fictitiousPatient) {
    const patientId = crypto.randomUUID();
    await db('patients').insert({
      id: patientId,
      fullName: 'Lucas Fernandes de Oliveira (Fictício)',
      birthDate: '1994-05-18',
      email: fictitiousEmail,
      phone: '(11) 98765-4321',
      notes: encrypt('Paciente fictício para testes seguros.'),
      status: 'ATIVO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db('anamnesis').insert({
      id: crypto.randomUUID(),
      patientId,
      dataEncrypted: encryptJSON({
        demandaPrincipal: 'Manejo de ansiedade e sobrecarga no trabalho com sintomas de insônia inicial.',
        historicoDemanda: 'Sintomas intensificados nos últimos 6 meses após mudança de cargo.',
        fatoresProtecao: 'Boa capacidade reflexiva, apoio familiar.',
        objetivosTerapeuticos: 'Desenvolver repertório de autorregulação e higiene do sono.',
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const sessionId = crypto.randomUUID();
    await db('sessions').insert({
      id: sessionId,
      patientId,
      sessionDate: '2026-08-05',
      sessionTime: '14:00',
      status: 'REALIZADA',
      rawNotesEncrypted: encrypt('Primeira sessão de acolhimento.'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db('session_notes').insert({
      id: crypto.randomUUID(),
      sessionId,
      contentEncrypted: encrypt(`O paciente compareceu pontualmente ao primeiro atendimento de alinhamento terapêutico, apresentando-se motivado para o processo. Relatou incômodo persistente relacionado à urgência constante e dificuldade para desacelerar ao término do expediente de trabalho.

Exploramos a rotina atual e os pensamentos automáticos associados ao desempenho profissional. Foram introduzidas intervenções de psicoeducação sobre o ciclo da ansiedade e regulação respiratória.

Como combinados, o paciente concordou em registrar situações gatilho e iniciar protocolo de higiene do sono.`),
      status: 'APROVADO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db('medical_record_entries').insert({
      id: crypto.randomUUID(),
      sessionId,
      contentEncrypted: encrypt(`Realizado atendimento psicológico inicial com foco em acolhimento e enquadre terapêutico. Aplicados procedimentos de psicoeducação sobre ansiedade e treino guiado de regulação respiratória. Observada boa receptividade. Combinada continuidade do acompanhamento.`),
      status: 'APROVADO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Paciente fictício criado: Lucas Fernandes de Oliveira`);
  }

  console.log('🎉 Seed do backend concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.destroy();
  });
