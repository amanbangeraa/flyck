import React, { useRef } from "react";

interface ToolbarProps {
  onSave: () => void;
  onLoad: (file: File) => void;
  onClear: () => void;
  onSendToUpload: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onSave, onLoad, onClear, onSendToUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoad(file);
      e.target.value = "";
    }
  };

  return (
    <div className="flex gap-2">
      <button
        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
        onClick={onSave}
      >
        Save
      </button>
      <button
        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
        onClick={() => fileInputRef.current?.click()}
      >
        Load
      </button>
      <input
        type="file"
        accept="application/json"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
        onClick={onClear}
      >
        Clear
      </button>
      <button
        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
        onClick={onSendToUpload}
      >
        Send to Upload Window
      </button>
    </div>
  );
};

export default Toolbar; 