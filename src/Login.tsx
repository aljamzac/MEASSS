import React, { useState } from 'react';
import { User, ArrowRight } from 'lucide-react';

// Edit this value to change the colours of the animated gradient over the background.
// The gradient slowly slides across the screen (see .login-gradient in index.css).
const OVERLAY_GRADIENT =
  'linear-gradient(135deg, rgba(11, 31, 77, 0.85) 0%, rgba(30, 58, 138, 0.55) 25%, rgba(3, 105, 161, 0.65) 50%, rgba(30, 58, 138, 0.55) 75%, rgba(11, 31, 77, 0.85) 100%)';

interface LoginProps {
  onLogin: (id: string) => void;
  error?: string;
}

export function Login({ onLogin, error }: LoginProps) {
  const [id, setId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (id.trim()) onLogin(id.trim());
  };

  return (
    <div className="relative flex min-h-screen w-screen flex-col overflow-auto bg-blue-950">
      {/* Background: the banner, blurred and tinted, so it fills any screen
          without being stretched or cropped awkwardly */}
      <img
        src="/images/esti-banner.png"
        alt=""
        className="login-bg-drift pointer-events-none fixed inset-0 h-full w-full object-cover blur-2xl"
        draggable={false}
      />
      <div
        className="login-gradient pointer-events-none fixed inset-0"
        style={{ background: OVERLAY_GRADIENT, backgroundSize: '300% 300%' }}
      />

      {/* Soft glowing light blobs drifting in the background */}
      <div className="login-float pointer-events-none fixed -left-24 -top-24 h-96 w-96 rounded-full bg-sky-300/25 blur-3xl" />
      <div className="login-float-slow pointer-events-none fixed -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-blue-300/25 blur-3xl" />

      {/* ── Centered card: banner (true proportions) + login form ── */}
      <main className="relative z-10 flex flex-1 items-center justify-center p-4 sm:p-8">
      <div className="flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_-10px_rgba(2,12,40,0.7),0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/40 lg:flex-row">
        {/* Banner side: shown at its natural 3:2 ratio, never stretched */}
        <div className="w-full shrink-0 lg:w-[62%]">
          {/* No background colour here, so no solid shape can show behind the image.
              On desktop the image fills the full height of the card. */}
          <img
            src="/images/esti-banner.png"
            alt="ESTI Maritime Assessment System"
            className="block h-auto w-full lg:h-full lg:object-cover lg:object-center"
            draggable={false}
          />
        </div>

        {/* Form side */}
        <div className="flex flex-1 flex-col justify-center bg-gradient-to-b from-white to-slate-50 px-8 py-8 sm:px-10">
          <div className="mb-6 flex flex-col items-center text-center">
            {/* School logo (public/images/marine.jpg). mix-blend-multiply hides its white
                background; scale trims the extra white margin around the emblem. */}
            <div className="mb-3 h-28 w-28 overflow-hidden">
              <img
                src="/images/marine.jpg"
                alt="ESTI Logo"
                className="h-full w-full scale-[1.4] object-contain mix-blend-multiply"
                draggable={false}
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Welcome Aboard</h1>
            <p className="mt-1.5 text-sm font-medium text-blue-900">ESTI Maritime Assessment System</p>
            <p className="mt-0.5 text-xs text-slate-500">BS Marine Transportation - 3rd Year</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-id" className="mb-1.5 block text-sm font-medium text-slate-700">
                Student ID / Administrator Username
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="login-id"
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-800 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  placeholder="e.g., 20-23001 or admin"
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            {error && (
              <div role="alert" className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-900 to-blue-700 px-4 py-3 font-semibold text-white shadow-md transition-all hover:from-blue-800 hover:to-blue-600 hover:shadow-lg active:scale-[0.99]"
            >
              Login to System
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>
        </div>
      </div>
      </main>

      {/* Footer: plain text (no background), one line, bottom center */}
      <footer className="relative z-10 w-full px-4 pb-4 text-center text-xs text-white/90 sm:whitespace-nowrap">
        Educational Systems Technological Institute &middot; Murallon, Boac, Marinduque &nbsp;|&nbsp; &copy; 2026 ESTI Maritime Assessment System. All rights reserved.
      </footer>
    </div>
  );
}