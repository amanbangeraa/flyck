import { NextApiRequest, NextApiResponse } from 'next';
import { uploadImage } from '../../lib/blob';
import { getSlides, setSlides } from '../../lib/kv';
import { broadcast } from '../../lib/sse';
import { File } from 'fetch-blob';

export const config = {
  api: { bodyParser: false },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') return res.status(405).end();
  const busboy = require('busboy');
  const bb = busboy({ headers: req.headers });
  const files: File[] = [];
  const displays: string[] = [];
  bb.on('file', (_, file, info) => {
    const chunks: Buffer[] = [];
    file.on('data', (d: Buffer) => chunks.push(d));
    file.on('end', () => {
      const buffer = Buffer.concat(chunks);
      // Add name and type properties for Vercel Blob SDK compatibility
      (buffer as any).name = info.filename;
      (buffer as any).type = info.mimeType;
      files.push(buffer);
    });
  });
  bb.on('field', (name, val) => {
    if (name === 'displays') displays.push(val);
  });
  bb.on('finish', async () => {
    for (const displayId of displays) {
      let slides = await getSlides(displayId);
      for (const file of files) {
        try {
          console.log('Uploading', (file as any).name, (file as any).length || (file as any).size);
          const url = await uploadImage(file);
          console.log('Uploaded', url);
          slides.push({ url, uploadedAt: new Date().toISOString() });
          if (slides.length > 50) slides = slides.slice(-50);
        } catch (e) {
          console.error('Upload error:', e);
        }
      }
      await setSlides(displayId, slides);
      await broadcast(displayId);
    }
    res.status(200).json({ ok: true });
  });
  req.pipe(bb);
}
