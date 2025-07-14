import { put } from '@vercel/blob';

export async function uploadImage(file: File) {
  const { url } = await put(file.name, file, { access: 'public' });
  return url;
}
