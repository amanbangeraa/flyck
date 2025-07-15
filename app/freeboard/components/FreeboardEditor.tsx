"use client";
import React, { useRef, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Toolbar from "./Toolbar";

// Excalidraw must be dynamically imported for SSR
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false }
);
import "@excalidraw/excalidraw/index.css";

interface FreeboardEditorProps {
  displayId?: string;
}

const LOCAL_STORAGE_KEY = "freeboard:lastScene";

const FreeboardEditor: React.FC<FreeboardEditorProps> = ({ displayId }) => {
  const excalidrawRef = useRef<any>(null);
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [isPushing, setIsPushing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved && excalidrawAPI) {
      try {
        const data = JSON.parse(saved);
        // Remove collaborators before loading
        if (data.appState && data.appState.collaborators) {
          delete data.appState.collaborators;
        }
        excalidrawAPI.updateScene(data);
      } catch {}
    }
  }, [excalidrawAPI]);

  // Save to localStorage on change
  const handleChange = useCallback((elements: any, appState: any, files: any) => {
    const data = { elements, appState, files };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }, []);

  // Export and push
  const handlePush = async () => {
    if (!excalidrawAPI) return;
    setIsPushing(true);
    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();
    const files = excalidrawAPI.getFiles ? excalidrawAPI.getFiles() : undefined;
    const payload = { elements, appState, files, displayId };
    try {
      await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } finally {
      setIsPushing(false);
    }
  };

  // Save as .json
  const handleSave = () => {
    if (!excalidrawAPI) return;
    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();
    // Remove collaborators before saving
    if (appState && appState.collaborators) {
      delete appState.collaborators;
    }
    const files = excalidrawAPI.getFiles ? excalidrawAPI.getFiles() : undefined;
    const data = { elements, appState, files };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `freeboard${displayId ? `-${displayId}` : ""}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load from .json
  const handleLoad = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        // Remove collaborators before loading
        if (data.appState && data.appState.collaborators) {
          delete data.appState.collaborators;
        }
        excalidrawAPI?.updateScene(data);
      } catch {
        alert("Invalid Excalidraw JSON file.");
      }
    };
    reader.readAsText(file);
  };

  // Clear board
  const handleClear = () => {
    excalidrawAPI?.resetScene();
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  // Send to Upload Window
  const handleSendToUpload = () => {
    if (!excalidrawAPI) return;
    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();
    const files = excalidrawAPI.getFiles ? excalidrawAPI.getFiles() : undefined;
    const data = { elements, appState, files };
    // Simulate a file upload by creating a Blob and File
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const file = new File([blob], `freeboard-upload.json`, { type: "application/json" });
    handleLoad(file);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-3 bg-white shadow z-10">
        <div className="text-xl font-bold">Freeboard</div>
        <button
          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
          onClick={handlePush}
          disabled={isPushing}
        >
          Push to Display
        </button>
      </nav>
      {/* Toolbar */}
      <div className="px-6 py-2 bg-white shadow-sm z-10">
        <Toolbar
          onSave={handleSave}
          onLoad={handleLoad}
          onClear={handleClear}
          onSendToUpload={handleSendToUpload}
        />
      </div>
      {/* Excalidraw Canvas */}
      <div className="flex-1 min-h-0 min-w-0 relative">
        <Excalidraw
          onChange={handleChange}
          theme="light"
          UIOptions={{ canvasActions: { export: false } }}
          excalidrawAPI={(api: any) => {
            excalidrawRef.current = api;
            setExcalidrawAPI(api);
          }}
        />
        {/* Toast/Modal */}
        {showToast && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg animate-fade-in-out">
            Pushed successfully
          </div>
        )}
        <style jsx global>{`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-10px); }
            10% { opacity: 1; transform: translateY(0); }
            90% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-10px); }
          }
          .animate-fade-in-out {
            animation: fadeInOut 2s;
          }
        `}</style>
      </div>
    </div>
  );
};

export default FreeboardEditor; 