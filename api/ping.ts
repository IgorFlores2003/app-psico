import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({
    status: 'ok',
    env: {
      has_db: !!process.env.DATABASE_URL,
      has_jwt: !!process.env.JWT_SECRET,
      has_enc: !!process.env.ENCRYPTION_KEY,
      node: process.version,
    },
  });
}
