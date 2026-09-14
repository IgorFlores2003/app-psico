import 'dotenv/config';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../src/lib/knex';
import { AUTHORIZED_SCALES } from '../src/lib/scales';

async function main() {
  console.log('🌱 Iniciando seed essencial do backend com Knex...');

  // Ensure migrations are run
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
      console.log(`✅ Escala autorizada cadastrada: ${scale.acronym}`);
    }
  }

  console.log('🎉 Seed essencial concluído com sucesso (sem dados mockados)!');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.destroy();
  });
