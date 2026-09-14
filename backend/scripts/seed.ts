import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AUTHORIZED_SCALES } from '../src/lib/scales';
import { encrypt, encryptJSON } from '../src/lib/crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do backend seguro...');

  const defaultEmail = process.env.ADMIN_EMAIL || 'terapeuta@psicologia.com';
  const defaultPassword = process.env.ADMIN_PASSWORD || 'Terapeuta@Segura2026!';

  let user = await prisma.user.findUnique({ where: { email: defaultEmail } });
  if (!user) {
    const passwordHash = await bcrypt.hash(defaultPassword, 12);
    user = await prisma.user.create({
      data: {
        email: defaultEmail,
        name: 'Dra. Maria Clara Silva',
        passwordHash,
        twoFactorEnabled: false,
      },
    });
    console.log(`✅ Usuário terapeuta criado: ${defaultEmail}`);
  }

  const existingSettings = await prisma.professionalSettings.findUnique({
    where: { id: 'default' },
  });
  if (!existingSettings) {
    await prisma.professionalSettings.create({
      data: {
        id: 'default',
        therapistName: 'Dra. Maria Clara Silva',
        crp: '06/123456',
        clinicName: 'Consultório de Psicologia Clínica',
        headerText: 'Dra. Maria Clara Silva • Psicóloga Clínica • CRP 06/123456',
        footerText: 'Documento confidencial emitido para fins clínicos/legais • LGPD',
        watermarkText: 'CONFIDENCIAL - SIGILO PROFISSIONAL',
        showWatermark: false,
      },
    });
  }

  for (const scale of AUTHORIZED_SCALES) {
    const existing = await prisma.assessmentInstrument.findUnique({
      where: { acronym: scale.acronym },
    });

    if (!existing) {
      await prisma.assessmentInstrument.create({
        data: {
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
        },
      });
      console.log(`✅ Escala cadastrada: ${scale.acronym}`);
    }
  }

  const fictitiousEmail = 'paciente.ficticio@exemplo.com';
  let fictitiousPatient = await prisma.patient.findFirst({
    where: { email: fictitiousEmail },
  });

  if (!fictitiousPatient) {
    fictitiousPatient = await prisma.patient.create({
      data: {
        fullName: 'Lucas Fernandes de Oliveira (Fictício)',
        birthDate: '1994-05-18',
        email: fictitiousEmail,
        phone: '(11) 98765-4321',
        notes: encrypt('Paciente fictício para testes seguros.'),
        status: 'ATIVO',
      },
    });

    await prisma.anamnesis.create({
      data: {
        patientId: fictitiousPatient.id,
        dataEncrypted: encryptJSON({
          demandaPrincipal: 'Manejo de ansiedade e sobrecarga no trabalho com sintomas de insônia inicial.',
          historicoDemanda: 'Sintomas intensificados nos últimos 6 meses após mudança de cargo.',
          fatoresProtecao: 'Boa capacidade reflexiva, apoio familiar.',
          objetivosTerapeuticos: 'Desenvolver repertório de autorregulação e higiene do sono.',
        }),
      },
    });

    const s1 = await prisma.session.create({
      data: {
        patientId: fictitiousPatient.id,
        sessionDate: '2026-08-05',
        sessionTime: '14:00',
        status: 'REALIZADA',
        rawNotesEncrypted: encrypt('Primeira sessão de acolhimento.'),
      },
    });

    await prisma.sessionNote.create({
      data: {
        sessionId: s1.id,
        contentEncrypted: encrypt(`O paciente compareceu pontualmente ao primeiro atendimento de alinhamento terapêutico, apresentando-se motivado para o processo. Relatou incômodo persistente relacionado à urgência constante e dificuldade para desacelerar ao término do expediente de trabalho.

Exploramos a rotina atual e os pensamentos automáticos associados ao desempenho profissional. Foram introduzidas intervenções de psicoeducação sobre o ciclo da ansiedade e regulação respiratória.

Como combinados, o paciente concordou em registrar situações gatilho e iniciar protocolo de higiene do sono.`),
        status: 'APROVADO',
      },
    });

    await prisma.medicalRecordEntry.create({
      data: {
        sessionId: s1.id,
        contentEncrypted: encrypt(`Realizado atendimento psicológico inicial com foco em acolhimento e enquadre terapêutico. Aplicados procedimentos de psicoeducação sobre ansiedade e treino guiado de regulação respiratória. Observada boa receptividade. Combinada continuidade do acompanhamento.`),
        status: 'APROVADO',
      },
    });

    console.log(`✅ Paciente fictício criado: ${fictitiousPatient.fullName}`);
  }

  console.log('🎉 Seed do backend concluído!');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
