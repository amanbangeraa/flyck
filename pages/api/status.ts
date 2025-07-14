import { NextApiRequest, NextApiResponse } from 'next';
import { getHeartbeats } from '../../lib/kv';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const data = await getHeartbeats();
  res.status(200).json(data);
}
