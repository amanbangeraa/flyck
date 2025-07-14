import { supabase } from './supabase';

export async function uploadImage(file: File) {
  // Upload to Supabase Storage bucket 'slides'
  const filePath = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage.from('slides').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  // Get public URL
  const { data: publicUrlData } = supabase.storage.from('slides').getPublicUrl(filePath);
  return publicUrlData.publicUrl;
}
