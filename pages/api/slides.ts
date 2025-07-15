import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import { broadcast } from '../../lib/sse';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { disp, url, order } = req.query;
  if (!disp || typeof disp !== 'string') return res.status(400).json({ error: 'Missing disp' });

  if (req.method === 'GET') {
    // List all slides for a display
    const { data, error } = await supabase
      .from('slides')
      .select('id, url, uploaded_at, duration')
      .eq('display_id', disp)
      .order('uploaded_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'Missing url' });
    // Delete from DB
    const { error } = await supabase.from('slides').delete().eq('display_id', disp).eq('url', url);
    // Optionally, delete from storage
    const path = url.split('/').slice(-1)[0];
    await supabase.storage.from('slides').remove([path]);
    if (error) return res.status(500).json({ error: error.message });
    await broadcast(disp); // Notify clients to update
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'PATCH') {
    // Reorder slides: expects ?order=[id1,id2,...]
    if (!order || typeof order !== 'string') return res.status(400).json({ error: 'Missing order' });
    const ids = order.split(',');
    // Update uploaded_at to reorder
    for (let i = 0; i < ids.length; i++) {
      await supabase.from('slides').update({ uploaded_at: new Date(Date.now() + i) }).eq('id', ids[i]);
    }
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
} 