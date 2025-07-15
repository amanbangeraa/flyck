import { FaUpload, FaChartBar } from 'react-icons/fa';

export default function Sidebar({ page, setPage }: { page: string; setPage: (p: string) => void }) {
  return (
    <aside className="h-screen w-48 bg-[#181A20] flex flex-col items-center py-8 space-y-8 fixed left-0 top-0 z-30 shadow-lg">
      <div className="mb-4 flex flex-col items-center">
        {/* Logo */}
        <div className="bg-white rounded-full p-4">
          <svg viewBox="0 0 32 32" fill="none" className="w-12 h-12">
            <circle cx="16" cy="16" r="16" fill="#6366F1" />
            <path d="M10 18l6-8 6 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="16" cy="22" r="2" fill="#fff" />
          </svg>
        </div>
        <span className="text-xs text-gray-300 font-light mt-2 text-center">From dept. of ECE</span>
      </div>
      <nav className="flex flex-col space-y-8 w-full items-center">
        <button
          className={`text-4xl flex flex-col items-center w-full py-3 rounded-xl transition-colors ${page === 'upload' ? 'bg-blue-600 text-white' : 'text-blue-200 hover:bg-blue-700/40'}`}
          onClick={() => setPage('upload')}
          title="Upload Slides"
        >
          <FaUpload />
          <span className="text-base mt-1 font-semibold">Upload</span>
        </button>
        <button
          className={`text-4xl flex flex-col items-center w-full py-3 rounded-xl transition-colors ${page === 'monitor' ? 'bg-blue-600 text-white' : 'text-blue-200 hover:bg-blue-700/40'}`}
          onClick={() => setPage('monitor')}
          title="Monitor & Manage"
        >
          <FaChartBar />
          <span className="text-base mt-1 font-semibold">Monitor</span>
        </button>
      </nav>
    </aside>
  );
} 