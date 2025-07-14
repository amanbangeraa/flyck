import { NextApiRequest, NextApiResponse } from 'next';
import { setHeartbeat } from '../../lib/kv';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') return res.status(405).end();
  const { id, at } = req.body;
  if (!id || !at) return res.status(400).end();
  await setHeartbeat(id, at);
  res.status(200).json({ ok: true });
}
