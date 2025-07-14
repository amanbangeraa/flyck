'use client';

import { useEffect, useRef, useState } from 'react';

function Spinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
      <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function useSlides(id: string) {
  const [slides, setSlides] = useState<{ url: string; uploadedAt: string; duration?: number }[]>([]);
  // Expose a refetch function
  const fetchSlides = async () => {
    const res = await fetch(`/api/disp?id=${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setSlides(data);
  };
  useEffect(() => {
    let ignore = false;
    async function initialFetch() {
      const res = await fetch(`/api/disp?id=${id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!ignore) setSlides(data);
    }
    initialFetch();
    return () => {
      ignore = true;
    };
  }, [id]);
  return { slides, fetchSlides };
}

// Use a fixed start time (e.g., Unix epoch)
const SLIDESHOW_START = 0;

function getCurrentSlideIdx(slides: { duration?: number }[]) {
  if (!slides.length) return 0;
  const now = Date.now();
  const durations = slides.map(s => s.duration || 10000);
  const total = durations.reduce((a, b) => a + b, 0);
  const elapsed = (now - SLIDESHOW_START) % total;
  let acc = 0;
  for (let i = 0; i < durations.length; i++) {
    acc += durations[i];
    if (elapsed < acc) return i;
  }
  return 0;
}

export default function Slideshow({ params }: { params: { id: string } }) {
  const { id } = params;
  const { slides, fetchSlides } = useSlides(id);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const timer = useRef<NodeJS.Timeout | null>(null);

  // Synchronized slideshow logic
  useEffect(() => {
    if (!slides.length) return;
    const updateIdx = () => setIdx(getCurrentSlideIdx(slides));
    updateIdx();
    const interval = setInterval(updateIdx, 250); // update 4x/sec for smoothness
    return () => clearInterval(interval);
  }, [slides]);

  // Reset to first slide when slides change
  useEffect(() => {
    setIdx(0);
  }, [slides]);

  useEffect(() => {
    const es = new EventSource(`/api/stream?disp=${id}`);
    es.addEventListener('update', () => {
      fetchSlides();
      setIdx(0); // Reset to first slide on update
    });
    return () => es.close();
  }, [id, fetchSlides]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, at: Date.now() }),
      });
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [id]);

  if (!slides.length)
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100">
        <img
          src="/fallback.jpg"
          className="w-1/2 max-w-xs mb-6 drop-shadow-lg rounded-xl border border-blue-100"
          alt="No slides"
        />
        <div className="text-2xl font-bold text-blue-700 mb-2">No slides available</div>
        <div className="text-blue-500">Waiting for slides to be uploaded...</div>
      </div>
    );

  return (
    <div className="relative w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
      {loading && <Spinner />}
      <img
        key={slides[idx].url}
        src={slides[idx].url}
        className={`w-screen h-screen object-contain transition-opacity duration-700 ${loading ? 'opacity-0' : 'opacity-100'}`}
        alt={`Slide ${idx + 1}`}
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
      />
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 text-white px-5 py-2 rounded-full text-lg font-semibold shadow-lg flex items-center gap-4">
        <span className="text-xs text-blue-200">{((slides[idx]?.duration || 10000) / 1000).toFixed(1)}s</span>
      </div>
    </div>
  );
}
