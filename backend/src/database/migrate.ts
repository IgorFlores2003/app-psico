import db from '../lib/knex';

async function runMigrations() {
  console.log('🔄 Executando migrações do Knex...');
  try {
    const [batchNo, log] = await db.migrate.latest();
    if (log.length === 0) {
      console.log('✨ Banco de dados já está atualizado na versão mais recente.');
    } else {
      console.log(`✅ Lote ${batchNo} executado com sucesso:`);
      log.forEach((file: string) => console.log(`   - ${file}`));
    }
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

runMigrations();
