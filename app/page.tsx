'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function FlyckIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 32 32" fill="none" className="mx-auto mb-6" width={48} height={48}>
      <circle cx="16" cy="16" r="16" fill="#6366F1" />
      <path d="M10 18l6-8 6 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="16" cy="22" r="2" fill="#fff" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Use env vars at the top level so Next.js can replace them at build time
  const USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
  const PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (username === USERNAME && password === PASSWORD) {
      localStorage.setItem('isLoggedIn', 'true');
      router.push('/admin');
    } else {
      setError('Invalid username or password');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white/80 p-6 rounded-xl shadow-md w-full max-w-xs space-y-6 animate-fade-in"
      >
        <FlyckIcon />
        <div className="text-xs text-gray-400 font-light text-center mb-2">From dept. of ECE</div>
        <h1 className="text-xl font-semibold text-blue-900 text-center mb-2 tracking-tight">Sign in to Flyck</h1>
        <div>
          <label className="block text-blue-900 text-xs font-medium mb-1" htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            className="w-full px-0 py-2 bg-transparent border-0 border-b border-blue-200 focus:border-blue-500 focus:ring-0 text-base placeholder:text-blue-300 transition-colors"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="Username"
          />
        </div>
        <div>
          <label className="block text-blue-900 text-xs font-medium mb-1" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="w-full px-0 py-2 bg-transparent border-0 border-b border-blue-200 focus:border-blue-500 focus:ring-0 text-base placeholder:text-blue-300 transition-colors"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Password"
          />
        </div>
        {error && <div className="text-red-500 text-xs text-center font-medium mt-2">{error}</div>}
        <button
          type="submit"
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-base transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}