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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        <KpiCard
          label="Total Applicants"
          value={portfolio.total_applicants.toLocaleString()}
          icon="👥"
          color="bg-blue-500/10"
          borderColor="border-blue-500/20"
        />
        <KpiCard
          label="Avg. Credit Amount"
          value={`DM ${Math.round(portfolio.avg_credit_amount).toLocaleString()}`}
          icon="💰"
          color="bg-amber-500/10"
          borderColor="border-amber-500/20"
        />
        <KpiCard
          label="Good Credit Rate"
          value={`${portfolio.good_risk_pct}%`}
          icon="✓"
          color="bg-emerald-500/10"
          borderColor="border-emerald-500/20"
          valueColor="text-emerald-400"
        />
        <KpiCard
          label="Default Rate"
          value={`${portfolio.bad_risk_pct}%`}
          icon="⚠"
          color="bg-red-500/10"
          borderColor="border-red-500/20"
          valueColor="text-red-400"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
        {/* Risk Distribution Donut */}
        <div className="glass-panel rounded-2xl p-6 shadow-xl glass-panel-hover">
          <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Risk Distribution</h3>
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
                  backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', color: '#e2e8f0', fontSize: '13px', backdropFilter: 'blur(8px)'
                }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            {riskPieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}80` }} />
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>

        {/* Age Distribution */}
        <div className="glass-panel rounded-2xl p-6 shadow-xl glass-panel-hover">
          <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Age Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ageData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', color: '#e2e8f0', fontSize: '13px', backdropFilter: 'blur(8px)'
                }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Purpose Distribution */}
        <div className="glass-panel rounded-2xl p-6 shadow-xl glass-panel-hover">
          <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Loan Purpose</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={purposeData} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="purpose" type="category" width={100} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', color: '#e2e8f0', fontSize: '13px', backdropFilter: 'blur(8px)'
                }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="count" fill="#06b6d4" radius={[0, 6, 6, 0]} />
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
    <div className={`glass-panel border ${borderColor} rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-lg
      transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden group`}>
      <div className={`absolute inset-0 ${color} opacity-20 group-hover:opacity-40 transition-opacity duration-300`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <span className="text-xl sm:text-2xl">{icon}</span>
        </div>
        <p className={`text-2xl sm:text-3xl font-black ${valueColor} tracking-tight truncate`}>{value}</p>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 sm:mt-2 font-medium truncate">{label}</p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 glass-panel rounded-lg animate-pulse border-none" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 glass-panel rounded-2xl animate-pulse border-none" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-72 glass-panel rounded-2xl animate-pulse border-none" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-6 text-center shadow-lg">
      <p className="text-red-400 font-medium">Failed to load portfolio data</p>
      <p className="text-red-400/60 text-sm mt-1">Make sure the backend API is reachable</p>
    </div>
  );
}
