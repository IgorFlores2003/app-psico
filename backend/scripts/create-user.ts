import 'dotenv/config';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import readline from 'readline';
import { db } from '../src/lib/knex';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function main() {
  console.log('\n🔒 --- Criação / Atualização de Conta do Terapeuta (Knex) ---');

  // Ensure migrations are ran
  await db.migrate.latest();

  const email = (await question('\nDigite seu e-mail: ')).trim();
  if (!email || !email.includes('@')) {
    console.error('❌ E-mail inválido.');
    process.exit(1);
  }

  const name = (await question('Digite seu nome completo profissional: ')).trim();
  const password = (await question('Digite uma senha forte (mínimo 8 caracteres): ')).trim();
  if (password.length < 8) {
    console.error('❌ A senha deve ter pelo menos 8 caracteres.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await db('users').where({ email }).first();
  if (existing) {
    await db('users').where({ email }).update({
      name,
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date().toISOString(),
    });
    console.log(`\n✅ Conta atualizada com sucesso para ${email}!`);
  } else {
    await db('users').insert({
      id: crypto.randomUUID(),
      email,
      name,
      passwordHash,
      twoFactorEnabled: false,
      sessionVersion: 1,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(`\n✅ Conta criada com sucesso para ${email}!`);
  }

  const existingSettings = await db('professional_settings').where({ id: 'default' }).first();
  if (existingSettings) {
    await db('professional_settings').where({ id: 'default' }).update({
      therapistName: name,
      updatedAt: new Date().toISOString(),
    });
  } else {
    await db('professional_settings').insert({
      id: 'default',
      therapistName: name,
      crp: '00/00000',
      updatedAt: new Date().toISOString(),
    });
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    rl.close();
    await db.destroy();
  });
