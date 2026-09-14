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

// Mount API routes
app.use('/api', routes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Prontuario Backend', timestamp: new Date() });
});
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


