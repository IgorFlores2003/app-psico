import path from 'path';
import dotenv from 'dotenv';
import { Knex } from 'knex';

// Load .env from backend root if not already loaded
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const url = process.env.DATABASE_URL || '';
const isPostgres = url.startsWith('postgres://') || url.startsWith('postgresql://');

let config: Knex.Config;

if (isPostgres) {
  config = {
    client: 'pg',
    connection: {
      connectionString: url,
      ssl: {
        rejectUnauthorized: false,
      },
    },
    pool: {
      min: 0,
      max: 10,
    },
  };
} else {
  const dbFilename = url.startsWith('file:')
    ? url.replace('file:', '')
    : path.resolve(__dirname, '../../dev.db');

  config = {
    // Use dynamic string to prevent Vercel from bundling better-sqlite3 when using PostgreSQL
    client: 'better-sqlite3',
    connection: {
      filename: dbFilename,
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn: any, done: (err: Error | null, connection: any) => void) => {
        try {
          conn.pragma('foreign_keys = ON');
          done(null, conn);
        } catch (err: any) {
          done(err, conn);
        }
      },
    },
  };
}

export default config;


