import { NextApiRequest, NextApiResponse } from 'next';
import { openChannel } from '../../lib/sse';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { disp } = req.query;
  if (!disp || typeof disp !== 'string') return res.status(400).end();
  openChannel(disp, res);
}
