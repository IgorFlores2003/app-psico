import path from 'path';
import dotenv from 'dotenv';

// Load .env from backend root if not already loaded
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbFilename = (() => {
  const url = process.env.DATABASE_URL;
  if (url && url.startsWith('file:')) {
    const rawPath = url.replace('file:', '');
    return path.isAbsolute(rawPath) ? rawPath : path.resolve(__dirname, '../../', rawPath);
  }
  return path.resolve(__dirname, '../../dev.db');
})();

const config = {
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

export default config;
