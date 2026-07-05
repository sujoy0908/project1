import { useState, useEffect } from 'react';
import RiskAssessmentForm from './components/RiskAssessmentForm';
import { healthCheck } from './services/api';

export default function App() {
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    const checkApi = async () => {
      try {
        await healthCheck();
        setApiStatus('connected');
      } catch {
        setApiStatus('disconnected');
      }
    };
    checkApi();
  }, []);

  return (
    <div className="min-h-screen text-white relative">
      {/* ── Background decoration ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-cyan-600/10 blur-[100px] animate-pulse-glow" />
        <div className="absolute top-1/3 -left-20 w-[500px] h-[500px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/*  HEADER / NAVIGATION                       */}
      {/* ═══════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 glass-panel border-b-0 border-b-white/10">
        <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-12 lg:px-16">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent leading-tight tracking-tight">
                  CreditGuard
                </h1>
                <p className="text-[10px] text-cyan-400 -mt-0.5 tracking-widest uppercase font-semibold">Risk Analytics</p>
              </div>
            </div>

            {/* API Status */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide shadow-lg ${
                apiStatus === 'connected'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/10'
                  : apiStatus === 'checking'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30 shadow-red-500/10'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  apiStatus === 'connected' ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]' :
                  apiStatus === 'checking' ? 'bg-amber-400 animate-pulse' : 'bg-red-400 shadow-[0_0_8px_#f87171]'
                }`} />
                {apiStatus === 'connected' ? 'API CONNECTED' :
                 apiStatus === 'checking' ? 'CONNECTING...' : 'API OFFLINE'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════ */}
      {/*  MAIN CONTENT                               */}
      {/* ═══════════════════════════════════════════ */}
      <main className="relative z-10 w-full max-w-[1600px] mx-auto px-6 sm:px-12 lg:px-16 py-12 animate-fade-in">
        {apiStatus === 'disconnected' && (
          <div className="glass-panel border-red-500/30 rounded-2xl p-6 flex items-start gap-4 mb-8">
            <span className="text-3xl animate-bounce">⚠️</span>
            <div>
              <p className="text-red-400 font-heading font-semibold text-xl">Backend API is unreachable</p>
              <p className="text-red-400/70 text-base mt-2">
                The backend API could not be reached. Ensure your server is running and configured correctly.
              </p>
            </div>
          </div>
        )}

        <RiskAssessmentForm />
      </main>
    </div>
  );
}
