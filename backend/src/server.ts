import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import routes from './routes';
import db from './lib/knex';
import { AUTHORIZED_SCALES } from './lib/scales';

const app = express();
const PORT = process.env.PORT || 3333;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Security: CORS configured strictly for client origin
app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:3000', 'http://localhost:5173', /vercel\.app$/],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

// Sincronização automática com Supabase / PostgreSQL ou SQLite
let dbInitialized = false;
async function initDb() {
  if (dbInitialized) return;
  try {
    await db.migrate.latest();
    // Seed essential assessment scales if missing
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
          targetAge: scale.targetAge || 'Adultos',
          instructions: scale.instructions,
          canApplyOnline: true,
          hasAutoScoring: true,
          usageConditions: scale.usageConditions,
          verificationSource: scale.verificationSource,
          cutoffs: JSON.stringify(scale.cutoffs),
          interpretationRules: JSON.stringify(scale.cutoffs),
          items: JSON.stringify(scale.items),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
    dbInitialized = true;
    console.log('✅ Banco de dados sincronizado e tabelas prontas.');
  } catch (err) {
    console.error('⚠️ Inicialização do banco:', err);
  }
}

// Middleware to ensure DB is initialized
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    await initDb();
  }
  next();
});

// Mount API routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Prontuario Backend', timestamp: new Date() });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🛡️  Backend Clínico Seguro rodando em http://localhost:${PORT}`);
    console.log(`📡 CORS configurado para: ${CLIENT_URL}\n`);
    initDb();
  });
}

export default app;


