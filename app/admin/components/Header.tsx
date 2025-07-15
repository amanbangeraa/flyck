export default function Header({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="h-16 bg-white shadow rounded-tr-3xl flex items-center justify-end pr-8 pl-8 ml-20 sticky top-0 z-20">
      {/* Future: User avatar/info can go here */}
      <button
        className="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-semibold ml-4 hover:bg-red-200 transition-colors border border-red-200 shadow-sm"
        onClick={onLogout}
        title="Logout"
      >
        Logout
      </button>
    </header>
  );
} 