'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

function CloudArrowUpIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V8m0 0l-3.5 3.5M12 8l3.5 3.5M20.25 16.5A4.75 4.75 0 0016 12.25h-1.25A4.75 4.75 0 0010 16.5m10.25 0A6.75 6.75 0 0012 5.75a6.75 6.75 0 00-8.25 10.75" />
    </svg>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center items-center">
      <div className="w-6 h-6 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-semibold flex items-center gap-2 transition-all duration-300 animate-fade-in ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
      {type === 'success' ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      )}
      <span>{msg}</span>
      <button onClick={onClose} className="ml-2 text-lg leading-none">&times;</button>
    </div>
  );
}

async function uploadSlides(formData: FormData) {
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

const DISPLAY_IDS = Array.from({ length: 8 }, (_, i) => `disp${i + 1}`);

function SlideManager() {
  const [selectedDisp, setSelectedDisp] = useState(DISPLAY_IDS[0]);
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Fetch slides for selected display
  useEffect(() => {
    if (!selectedDisp) return;
    setLoading(true);
    fetch(`/api/slides?disp=${selectedDisp}`)
      .then(res => res.json())
      .then(data => { setSlides(data || []); setLoading(false); });
  }, [selectedDisp]);

  // Synchronized slideshow index
  useEffect(() => {
    if (!slides.length) return;
    const getCurrentSlideIdx = (slides: any[]) => {
      const now = Date.now();
      const durations = slides.map(s => s.duration || 10000);
      const total = durations.reduce((a, b) => a + b, 0);
      const elapsed = (now) % total;
      let acc = 0;
      for (let i = 0; i < durations.length; i++) {
        acc += durations[i];
        if (elapsed < acc) return i;
      }
      return 0;
    };
    const updateIdx = () => setCurrentIdx(getCurrentSlideIdx(slides));
    updateIdx();
    const interval = setInterval(updateIdx, 250);
    return () => clearInterval(interval);
  }, [slides]);

  // Delete slide
  const handleDelete = async (url: string) => {
    await fetch(`/api/slides?disp=${selectedDisp}&url=${encodeURIComponent(url)}`, { method: 'DELETE' });
    setSlides(slides => slides.filter(s => s.url !== url));
  };

  // Drag-and-drop reordering
  const moveSlide = (from: number, to: number) => {
    setSlides(slides => {
      const updated = [...slides];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
    setReordering(true);
  };
  const saveOrder = async () => {
    await fetch(`/api/slides?disp=${selectedDisp}&order=${slides.map(s => s.id).join(',')}`, { method: 'PATCH' });
    setReordering(false);
  };

  // Drag-and-drop hooks
  const SlideItem = ({ slide, idx, move }: any) => {
    const ref = useRef<HTMLDivElement>(null);
    const [, drop] = useDrop({
      accept: 'slide',
      hover(item: any) {
        if (item.idx !== idx) move(item.idx, idx);
        item.idx = idx;
      },
    });
    const [{ isDragging }, drag] = useDrag({
      type: 'slide',
      item: { idx },
      collect: monitor => ({ isDragging: monitor.isDragging() }),
    });
    drag(drop(ref));
    return (
      <div ref={ref} className={`flex items-center gap-3 p-2 rounded-lg border ${isDragging ? 'bg-blue-100' : 'bg-white'} ${currentIdx === idx ? 'ring-2 ring-blue-500' : ''}`}
        style={{ opacity: isDragging ? 0.5 : 1 }}>
        <img src={slide.url} alt="slide" className="w-16 h-16 object-cover rounded border" />
        <div className="flex-1">
          <div className="text-xs text-blue-900 font-semibold">{slide.url.split('/').pop()}</div>
          <div className="text-xs text-blue-700">{((slide.duration || 10000) / 1000).toFixed(1)}s</div>
        </div>
        <button onClick={() => handleDelete(slide.url)} className="px-2 py-1 bg-red-500 text-white rounded text-xs font-bold">Delete</button>
      </div>
    );
  };

  return (
    <div className="bg-white/90 rounded-2xl shadow-lg p-6 border border-blue-100 mt-10">
      <div className="flex items-center gap-4 mb-4">
        <label className="font-semibold text-blue-900">Monitor Display:</label>
        <select value={selectedDisp} onChange={e => setSelectedDisp(e.target.value)} className="border rounded px-2 py-1">
          {DISPLAY_IDS.map(id => <option key={id} value={id}>{id}</option>)}
        </select>
        {reordering && <button onClick={saveOrder} className="ml-auto px-3 py-1 bg-blue-600 text-white rounded">Save Order</button>}
      </div>
      {loading ? <Spinner /> : (
        <DndProvider backend={HTML5Backend}>
          <div className="space-y-2">
            {slides.map((slide, i) => (
              <SlideItem key={slide.id} slide={slide} idx={i} move={moveSlide} />
            ))}
          </div>
        </DndProvider>
      )}
      <div className="text-xs text-blue-500 mt-2">Current slide is highlighted. Drag to reorder, click delete to remove.</div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [durations, setDurations] = useState<number[]>([]);
  const [commonDuration, setCommonDuration] = useState(10000);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') !== 'true') {
      router.replace('/');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    router.replace('/');
  };

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setPreviews(Array.from(files).map((file) => URL.createObjectURL(file)));
    setDurations(Array.from(files).map(() => 10000)); // default 10s
  };

  const handleDurationChange = (idx: number, value: number) => {
    setDurations((prev) => prev.map((d, i) => (i === idx ? value : d)));
  };

  const handleCommonDurationChange = (value: number) => {
    setCommonDuration(value);
    setDurations((prev) => prev.map(() => value));
  };

  const handleRemovePreview = (idx: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
    if (fileRef.current && fileRef.current.files) {
      const dt = new DataTransfer();
      Array.from(fileRef.current.files).forEach((file, i) => {
        if (i !== idx) dt.items.add(file);
      });
      fileRef.current.files = dt.files;
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileRef.current?.files?.length || !selected.length) {
      setToast({ msg: 'Select images and displays', type: 'error' });
      return;
    }
    setUploading(true);
    setToast(null);
    const formData = new FormData();
    Array.from(fileRef.current.files).forEach((f, i) => {
      formData.append('files', f);
      formData.append(`duration:${f.name}`, durations[i].toString());
    });
    selected.forEach((id) => formData.append('displays', id));
    try {
      await uploadSlides(formData);
      setToast({ msg: 'Upload successful!', type: 'success' });
      fileRef.current.value = '';
      setSelected([]);
      setPreviews([]);
    } catch {
      setToast({ msg: 'Upload failed', type: 'error' });
    }
    setUploading(false);
  };

  const handleDrag = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && fileRef.current) {
      fileRef.current.files = e.dataTransfer.files;
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 flex items-center gap-3 py-3">
          <div className="bg-blue-600 rounded-full p-2 shadow text-white">
            <CloudArrowUpIcon className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-wide text-blue-900 drop-shadow-sm">Flyck Admin</h1>
          <span className="ml-auto text-sm text-blue-700/70 font-medium">Push slides to displays</span>
          <button
            onClick={handleLogout}
            className="ml-4 px-4 py-1 rounded-lg bg-red-500 text-white font-semibold shadow hover:bg-red-600 transition-all"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-16">
        <form
          className="space-y-12 bg-white/90 p-10 rounded-3xl shadow-2xl border border-blue-100"
          onSubmit={handleUpload}
        >
          <div>
            {/* Common duration slider, only show if more than one image */}
            {previews.length > 1 && (
              <div className="mb-4 flex items-center gap-4">
                <label className="font-medium text-blue-900 text-sm">All slides duration:</label>
                <input
                  type="range"
                  min={1000}
                  max={60000}
                  step={1000}
                  value={commonDuration}
                  onChange={e => handleCommonDurationChange(Number(e.target.value))}
                  className="w-48"
                />
                <span className="text-blue-700 text-sm font-mono">{(commonDuration / 1000).toFixed(1)}s</span>
              </div>
            )}
            <label
              htmlFor="file-upload"
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl h-52 cursor-pointer transition-all duration-200 ${
                dragActive ? 'border-blue-500 bg-blue-100/60 scale-105' : 'border-blue-200 bg-blue-50/60 hover:bg-blue-100/40'
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileRef}
                id="file-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleInputChange}
              />
              <CloudArrowUpIcon className="w-12 h-12 text-blue-400 mb-2" />
              <span className="text-blue-700 font-medium">
                {previews.length === 0
                  ? 'Drag & drop images here, or click to select'
                  : `${previews.length} image(s) selected`}
              </span>
              {previews.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mt-4 w-full">
                  {previews.map((src, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={src}
                        alt="preview"
                        className="h-20 w-20 object-cover rounded-lg border border-blue-200 shadow-sm transition-transform duration-200 group-hover:scale-105"
                      />
                      <input
                        type="number"
                        min={1000}
                        step={1000}
                        value={durations[i]}
                        onChange={e => handleDurationChange(i, parseInt(e.target.value, 10))}
                        className="mt-2 w-full text-xs border rounded px-1 py-0.5"
                        placeholder="Duration (ms)"
                        title="Duration in milliseconds"
                      />
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); handleRemovePreview(i); }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg opacity-80 hover:opacity-100 text-xs"
                        title="Remove"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </label>
          </div>
          <div>
            <label className="block font-semibold mb-3 text-blue-900 text-lg">
              Select Displays
            </label>
            <div className="flex flex-wrap gap-4">
              {DISPLAY_IDS.map((id) => (
                <button
                  type="button"
                  key={id}
                  className={`px-6 py-2 rounded-full border font-semibold shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base flex items-center gap-2 ${
                    selected.includes(id)
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white border-blue-700 scale-105 shadow-lg'
                      : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                  }`}
                  onClick={() => handleSelect(id)}
                  aria-pressed={selected.includes(id)}
                >
                  <span className={`inline-block w-3 h-3 rounded-full border-2 mr-2 ${selected.includes(id) ? 'bg-white border-blue-300' : 'bg-blue-100 border-blue-200'}`}></span>
                  {id}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white rounded-2xl font-bold text-xl shadow-lg transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            disabled={uploading}
          >
            {uploading && <Spinner />}
            {uploading ? 'Uploading...' : 'Upload Slides'}
          </button>
        </form>
        <SlideManager />
      </main>
    </div>
  );
} 