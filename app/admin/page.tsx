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

// --- MENU MODERNIZATION ---
function FlyckLogo() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8 mr-2"><circle cx="16" cy="16" r="16" fill="#6366F1" /><path d="M10 18l6-8 6 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="16" cy="22" r="2" fill="#fff" /></svg>
  );
}

function Menu({ page, setPage, onLogout }: { page: string; setPage: (p: string) => void; onLogout: () => void }) {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white/80 border-b shadow-sm sticky top-0 z-20 backdrop-blur">
      <div className="flex items-center gap-4">
        <FlyckLogo />
        <span className="font-extrabold text-xl text-blue-900 tracking-wide select-none">Flyck Admin</span>
        <button
          className={`ml-6 font-bold text-lg px-4 py-2 rounded transition-colors ${page === 'upload' ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-100'}`}
          onClick={() => setPage('upload')}
        >
          Upload Slides
        </button>
        <button
          className={`font-bold text-lg px-4 py-2 rounded transition-colors ${page === 'monitor' ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-100'}`}
          onClick={() => setPage('monitor')}
        >
          Monitor & Manage
        </button>
        {/* Freeboard Link */}
        <a
          href="/freeboard"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-lg px-4 py-2 rounded transition-colors text-blue-700 hover:bg-blue-100 ml-2"
        >
          Freeboard
        </a>
      </div>
      <button
        className="ml-auto px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition-colors border border-red-200 shadow-sm"
        onClick={onLogout}
        title="Logout"
      >Logout</button>
    </nav>
  );
}

function UploadSlidesPage(props: any) {
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
    <div className="bg-white/90 rounded-2xl shadow-lg p-6 border border-blue-100 mt-10">
      {/* Display selection UI restored */}
      <div className="mb-8">
        <label className="block font-medium text-blue-900 text-base mb-2">Select Displays</label>
        <div className="flex flex-wrap gap-4">
          {DISPLAY_IDS.map((id) => (
            <label key={id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${selected.includes(id) ? 'bg-blue-100 border-blue-400' : 'bg-white border-blue-200 hover:bg-blue-50'}`}>
              <input
                type="checkbox"
                checked={selected.includes(id)}
                onChange={() => handleSelect(id)}
                className="accent-blue-600"
              />
              <span className="font-mono text-blue-900">{id}</span>
            </label>
          ))}
        </div>
      </div>
      {/* Monitor Display dropdown removed */}
      <form className="space-y-12 bg-white/90 p-10 rounded-3xl shadow-2xl border border-blue-100" onSubmit={handleUpload}>
        <h2 className="text-xl font-bold text-blue-900 mb-6">Upload Slides</h2>
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
        {/* Upload button at the bottom */}
        <div className="flex justify-end mt-8">
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        </form>
    </div>
  );
}

// --- MONITOR & MANAGE MODERNIZATION ---
import { useCallback } from 'react';

function formatTimeAgo(ts: number) {
  if (!ts) return 'Never';
  const diff = Math.floor((Date.now() - Number(ts)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return new Date(ts).toLocaleString();
}

function useDisplayStatus() {
  const [status, setStatus] = useState<{id: string, online: boolean, lastSeen: number}[]>([]);
  useEffect(() => {
    const fetchStatus = async () => {
      const res = await fetch('/api/status');
      if (!res.ok) return;
      setStatus(await res.json());
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);
  return status;
}

function MonitorManagePage() {
  const [selectedDisp, setSelectedDisp] = useState(DISPLAY_IDS[0]);
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [orderChanged, setOrderChanged] = useState(false);
  const [showDeleteIdx, setShowDeleteIdx] = useState<number|null>(null);
  const [toast, setToast] = useState<string|null>(null);
  const status = useDisplayStatus();
  // Manual refresh
  const refresh = useCallback(() => {
    setLoading(true);
    fetch(`/api/slides?disp=${selectedDisp}`)
      .then(res => res.json())
      .then(data => { setSlides(data || []); setLoading(false); });
  }, [selectedDisp]);
  // Fetch slides for selected display
  useEffect(() => { refresh(); }, [refresh]);
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
  // Delete slide with confirmation
  const handleDelete = async (idx: number) => {
    setShowDeleteIdx(idx);
  };
  const confirmDelete = async (idx: number) => {
    const url = slides[idx].url;
    await fetch(`/api/slides?disp=${selectedDisp}&url=${encodeURIComponent(url)}`, { method: 'DELETE' });
    setSlides(slides => slides.filter((_, i) => i !== idx));
    setShowDeleteIdx(null);
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
    setOrderChanged(true);
  };
  const saveOrder = async () => {
    await fetch(`/api/slides?disp=${selectedDisp}&order=${slides.map(s => s.id).join(',')}`, { method: 'PATCH' });
    setReordering(false);
    setOrderChanged(false);
    setToast('Order saved!');
    setTimeout(() => setToast(null), 2000);
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
      <div ref={ref} className={`flex items-center gap-4 p-3 rounded-xl border transition-all duration-200 bg-white shadow-sm group hover:bg-blue-50 cursor-pointer relative ${isDragging ? 'scale-95 ring-2 ring-blue-300' : ''} ${currentIdx === idx ? 'ring-2 ring-blue-500 bg-blue-50 shadow-md' : ''}`}
        style={{ opacity: isDragging ? 0.7 : 1 }}
        title={currentIdx === idx ? 'Currently showing' : undefined}
      >
        <span className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white text-xs mr-2 ${currentIdx === idx ? 'bg-blue-600' : 'bg-blue-300'}`}>{idx+1}</span>
        <img src={slide.url} alt="slide" className="w-20 h-20 object-cover rounded border shadow group-hover:scale-105 transition-transform duration-200" />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-blue-900 font-semibold truncate max-w-xs">{slide.url.split('/').pop()}</div>
          <div className="text-xs text-blue-700">{((slide.duration || 10000) / 1000).toFixed(1)}s</div>
        </div>
        <button onClick={() => handleDelete(idx)} className="px-2 py-1 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-600 transition-colors" title="Delete slide">Delete</button>
        {/* Delete confirmation dialog */}
        {showDeleteIdx === idx && (
          <div className="absolute z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-red-300 rounded-xl shadow-lg p-4 flex flex-col items-center animate-fade-in">
            <div className="text-red-600 font-bold mb-2">Delete this slide?</div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-red-500 text-white rounded font-bold" onClick={() => confirmDelete(idx)}>Yes</button>
              <button className="px-3 py-1 bg-gray-200 rounded font-bold" onClick={() => setShowDeleteIdx(null)}>No</button>
            </div>
          </div>
        )}
      </div>
    );
  };
  // --- Display status grid ---
  const displayStatusMap = Object.fromEntries(status.map(s => [s.id, s]));
  return (
    <div className="bg-white/90 rounded-2xl shadow-lg p-6 border border-blue-100 mt-10">
      {toast && <Toast msg={toast} type="success" onClose={() => setToast(null)} />}
      <div className="sticky top-20 z-10 bg-white/80 pb-2 mb-4 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-blue-900 text-lg">Displays</div>
          <button onClick={refresh} className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-bold text-sm shadow border border-blue-200" title="Refresh status/slides">Refresh</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {DISPLAY_IDS.map(id => {
            const s = displayStatusMap[id];
            const online = s?.online;
            const lastSeen = s?.lastSeen;
            const isSelected = selectedDisp === id;
            return (
              <button
                key={id}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 shadow-sm group focus:ring-2 focus:ring-blue-400 ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-blue-200 bg-white hover:bg-blue-50'} ${online ? '' : 'opacity-60'}`}
                onClick={() => setSelectedDisp(id)}
                title={online ? `Online\nLast seen: ${formatTimeAgo(lastSeen)}` : `Offline\nLast seen: ${formatTimeAgo(lastSeen)}`}
              >
                <span className="font-bold text-blue-900 mb-1 text-lg">{id}</span>
                <span className={`w-4 h-4 rounded-full mb-1 ${online ? 'bg-green-400' : 'bg-gray-300'} border-2 border-white shadow`} title={online ? 'Online' : 'Offline'}></span>
                <span className="text-xs text-blue-700/70 mb-1">{online ? 'Online' : 'Offline'}</span>
                <span className="text-xs text-gray-400">{formatTimeAgo(lastSeen)}</span>
                {/* Show current slide preview for each display */}
                {isSelected && slides.length > 0 ? (
                  <img src={slides[currentIdx]?.url} alt="Current slide" className="w-20 h-20 object-cover rounded mt-2 border shadow group-hover:scale-105 transition-transform duration-200" />
                ) : <div className="w-20 h-20 bg-gray-100 rounded mt-2 flex items-center justify-center text-gray-300 text-xs">No slide</div>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-4 mb-4 mt-2">
        <label className="font-semibold text-blue-900">Monitor Display:</label>
        <select value={selectedDisp} onChange={e => setSelectedDisp(e.target.value)} className="border rounded px-2 py-1">
          {DISPLAY_IDS.map(id => <option key={id} value={id}>{id}</option>)}
        </select>
        {orderChanged && (
          <button onClick={saveOrder} className="ml-4 px-4 py-2 bg-blue-600 text-white rounded font-bold shadow hover:bg-blue-700 transition-colors" title="Save new slide order">Save Order</button>
        )}
      </div>
      {loading ? <Spinner /> : (
        <DndProvider backend={HTML5Backend}>
          <div className="space-y-3">
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

export default function AdminPanel() {
  const router = useRouter();
  const [page, setPage] = useState('upload');

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') !== 'true') {
      router.replace('/');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    router.replace('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      <Menu page={page} setPage={setPage} onLogout={handleLogout} />
      <main className="max-w-3xl mx-auto px-4 py-10">
        {page === 'upload' ? <UploadSlidesPage router={router} /> : <MonitorManagePage />}
      </main>
    </div>
  );
} 