import { NextApiRequest, NextApiResponse } from 'next';
import { uploadImage } from '../../lib/blob';
import { getSlides, setSlides } from '../../lib/kv';
import { broadcast } from '../../lib/sse';

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
    let duration: number | undefined;
    file.on('data', (d: Buffer) => chunks.push(d));
    file.on('end', () => {
      const buffer = Buffer.concat(chunks);
      // Attach duration if available
      const fileObj = new File([buffer], info.filename, { type: info.mimeType });
      (fileObj as any).duration = duration;
      files.push(fileObj);
    });
  });
  bb.on('field', (name, val) => {
    if (name === 'displays') displays.push(val);
    if (name.startsWith('duration:')) {
      // duration:<filename> = value
      const filename = name.split(':')[1];
      const file = files.find(f => (f as any).name === filename);
      if (file) (file as any).duration = parseInt(val, 10);
    }
  });
  bb.on('finish', async () => {
    for (const displayId of displays) {
      let slides = (await getSlides(displayId)).map(s => ({ url: s.url, uploaded_at: s.uploadedAt, duration: s.duration ?? 10000 }));
      for (const file of files) {
        try {
          console.log('Uploading', file.name, file.size);
          const url = await uploadImage(file);
          console.log('Uploaded', url);
          slides.push({ url, uploaded_at: new Date().toISOString(), duration: (file as any).duration ?? 10000 });
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
