import { useState, useEffect } from 'react';
import RiskAssessmentForm from './components/RiskAssessmentForm';
import PortfolioOverview from './components/PortfolioOverview';
import FeatureImportance from './components/FeatureImportance';
import ModelMetrics from './components/ModelMetrics';
import { healthCheck } from './services/api';

const NAV_ITEMS = [
  { id: 'risk-assessment', label: 'Risk Assessment', icon: '📋' },
  { id: 'portfolio', label: 'Portfolio', icon: '📊' },
  { id: 'feature-importance', label: 'Features', icon: '📈' },
  { id: 'model-performance', label: 'Performance', icon: '⚡' },
];

export default function App() {
  const [apiStatus, setApiStatus] = useState('checking');
  const [activeSection, setActiveSection] = useState(null);

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

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* ── Background decoration ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-teal-500/5 blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 rounded-full bg-indigo-500/5 blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/*  HEADER / NAVIGATION                       */}
      {/* ═══════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/70 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent leading-tight">
                  CreditGuard
                </h1>
                <p className="text-[10px] text-slate-500 -mt-0.5 tracking-wider uppercase">Risk Analytics</p>
              </div>
            </div>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200
                    ${activeSection === item.id
                      ? 'bg-teal-500/15 text-teal-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>

            {/* API Status */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold ${
                apiStatus === 'connected'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : apiStatus === 'checking'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  apiStatus === 'connected' ? 'bg-emerald-400 animate-pulse' :
                  apiStatus === 'checking' ? 'bg-amber-400 animate-pulse' : 'bg-red-400'
                }`} />
                {apiStatus === 'connected' ? 'API Connected' :
                 apiStatus === 'checking' ? 'Connecting...' : 'API Offline'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════ */}
      {/*  MAIN CONTENT                               */}
      {/* ═══════════════════════════════════════════ */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-14">
        {apiStatus === 'disconnected' && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-amber-300 font-semibold text-sm">Backend API is unreachable</p>
              <p className="text-amber-400/70 text-xs mt-1">
                Make sure the FastAPI server is running on <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs">http://localhost:8000</code>.
                Run <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs">python main.py</code> from the backend directory.
              </p>
            </div>
          </div>
        )}

        <RiskAssessmentForm />
        <PortfolioOverview />
        <FeatureImportance />
        <ModelMetrics />

        {/* Footer */}
        <footer className="border-t border-slate-800/50 pt-8 pb-4 text-center">
          <p className="text-xs text-slate-600">
            CreditGuard — Credit Risk Prediction Dashboard · Built with FastAPI, scikit-learn, React &amp; Recharts
          </p>
          <p className="text-[10px] text-slate-700 mt-1">
            Portfolio project demonstrating ML deployment + full-stack engineering for financial risk analytics
          </p>
        </footer>
      </main>
    </div>
  );
}
