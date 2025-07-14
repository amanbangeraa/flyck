import { kv } from '@vercel/kv';

export async function getSlides(displayId: string) {
  const slides = await kv.get<{ url: string; uploadedAt: string }[]>(
    displayId
  );
  return Array.isArray(slides) ? slides : [];
}

export async function setSlides(displayId: string, slides: any[]) {
  await kv.set(displayId, slides);
}

export async function setHeartbeat(id: string, at: number) {
  await kv.set(`hb:${id}`, at);
}

export async function getHeartbeats() {
  const keys = await kv.keys('hb:*');
  const now = Date.now();
  return Promise.all(
    keys.map(async (key: string) => {
      const lastSeen = await kv.get<number>(key);
      return {
        id: key.slice(3),
        online: lastSeen && now - lastSeen < 10 * 60 * 1000,
        lastSeen,
      };
    })
  );
}
