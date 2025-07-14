import { supabase } from './supabase';

export async function getSlides(displayId: string) {
  const { data, error } = await supabase
    .from('slides')
    .select('url, uploaded_at, duration')
    .eq('display_id', displayId)
    .order('uploaded_at', { ascending: true });
  if (error) throw error;
  // Map to camelCase for frontend compatibility
  return (data || []).map(s => ({ url: s.url, uploadedAt: s.uploaded_at, duration: s.duration ?? 10000 }));
}

export async function setSlides(displayId: string, slides: { url: string; uploaded_at: string; duration?: number }[]) {
  // Remove old slides for this display
  await supabase.from('slides').delete().eq('display_id', displayId);
  // Insert new slides
  if (slides.length > 0) {
    const insertData = slides.map(s => ({
      display_id: displayId,
      url: s.url,
      uploaded_at: s.uploaded_at,
      duration: s.duration ?? 10000,
    }));
    await supabase.from('slides').insert(insertData);
  }
}

export async function setHeartbeat(id: string, at: number) {
  await supabase.from('heartbeats').upsert({ id, last_seen: at });
}

export async function getHeartbeats() {
  const { data, error } = await supabase.from('heartbeats').select('id, last_seen');
  if (error) throw error;
  const now = Date.now();
  return (data || []).map(hb => ({
    id: hb.id,
    online: hb.last_seen && now - Number(hb.last_seen) < 10 * 60 * 1000,
    lastSeen: hb.last_seen,
  }));
}
