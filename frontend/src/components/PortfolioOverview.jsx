import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { getPortfolioSummary } from '../services/api';

const COLORS = {
  good: '#10b981',   // emerald-500
  bad: '#ef4444',    // red-500
  neutral: '#64748b' // slate-500
};

export default function PortfolioOverview() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPortfolioSummary();
        setPortfolio(data);
      } catch (err) {
        setError('Failed to load portfolio data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (!portfolio) return null;

  const riskPieData = [
    { name: 'Good Credit', value: portfolio.risk_distribution.good, color: COLORS.good },
    { name: 'Bad Credit', value: portfolio.risk_distribution.bad, color: COLORS.bad },
  ];

  const ageData = Object.entries(portfolio.age_distribution).map(([range, count]) => ({
    range, count,
  }));

  const purposeData = Object.entries(portfolio.purpose_distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([purpose, count]) => ({
      purpose: purpose.charAt(0).toUpperCase() + purpose.slice(1),
      count,
    }));

  return (
    <div id="portfolio" className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Portfolio Overview</h2>
          <p className="text-sm text-slate-400">Aggregate credit portfolio statistics</p>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Total Applicants"
          value={portfolio.total_applicants.toLocaleString()}
          icon="👥"
          color="from-blue-500/10 to-indigo-500/10"
          borderColor="border-blue-500/20"
        />
        <KpiCard
          label="Avg. Credit Amount"
          value={`DM ${Math.round(portfolio.avg_credit_amount).toLocaleString()}`}
          icon="💰"
          color="from-amber-500/10 to-yellow-500/10"
          borderColor="border-amber-500/20"
        />
        <KpiCard
          label="Good Credit Rate"
          value={`${portfolio.good_risk_pct}%`}
          icon="✓"
          color="from-emerald-500/10 to-green-500/10"
          borderColor="border-emerald-500/20"
          valueColor="text-emerald-400"
        />
        <KpiCard
          label="Default Rate"
          value={`${portfolio.bad_risk_pct}%`}
          icon="⚠"
          color="from-red-500/10 to-rose-500/10"
          borderColor="border-red-500/20"
          valueColor="text-red-400"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Risk Distribution Donut */}
        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 shadow-xl">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={riskPieData} cx="50%" cy="50%"
                innerRadius={55} outerRadius={80}
                paddingAngle={4} dataKey="value"
                stroke="none"
              >
                {riskPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b', border: '1px solid #334155',
                  borderRadius: '12px', color: '#e2e8f0', fontSize: '13px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            {riskPieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>

        {/* Age Distribution */}
        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 shadow-xl">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Age Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ageData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b', border: '1px solid #334155',
                  borderRadius: '12px', color: '#e2e8f0', fontSize: '13px'
                }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Purpose Distribution */}
        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 shadow-xl">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Loan Purpose Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={purposeData} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis dataKey="purpose" type="category" width={100} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b', border: '1px solid #334155',
                  borderRadius: '12px', color: '#e2e8f0', fontSize: '13px'
                }}
              />
              <Bar dataKey="count" fill="#14b8a6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}


/* ── Sub-components ── */

function KpiCard({ label, value, icon, color, borderColor, valueColor = 'text-white' }) {
  return (
    <div className={`bg-gradient-to-br ${color} border ${borderColor} rounded-2xl p-4 shadow-lg
      transition-transform duration-200 hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg">{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-slate-800/60 rounded-lg animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-800/40 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-72 bg-slate-800/40 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
      <p className="text-red-400 font-medium">{message}</p>
      <p className="text-red-400/60 text-sm mt-1">Make sure the backend is running on port 8000</p>
    </div>
  );
}
