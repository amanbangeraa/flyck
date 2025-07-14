import { NextApiRequest, NextApiResponse } from 'next';
import { getSlides } from '../../lib/kv';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).end();
  const slides = await getSlides(id);
  res.status(200).json(slides);
}
