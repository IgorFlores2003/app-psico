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
        rejectUnauthorized: false, // Required for Supabase pooler/direct connection
      },
    },
    pool: {
      min: 0,
      max: 10,
    },
    migrations: {
      directory: path.resolve(__dirname, './migrations'),
      extension: 'ts',
    },
  };
} else {
  const dbFilename = (() => {
    if (url.startsWith('file:')) {
      const rawPath = url.replace('file:', '');
      return path.isAbsolute(rawPath) ? rawPath : path.resolve(__dirname, '../../', rawPath);
    }
    return path.resolve(__dirname, '../../dev.db');
  })();

  config = {
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
    migrations: {
      directory: path.resolve(__dirname, './migrations'),
      extension: 'ts',
    },
  };
}

export default config;

