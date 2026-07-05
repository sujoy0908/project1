import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getFeatureImportance } from '../services/api';

export default function FeatureImportance() {
  const [data, setData] = useState(null);
  const [activeModel, setActiveModel] = useState('random_forest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getFeatureImportance();
        setData(result);
      } catch (err) {
        setError('Failed to load feature importance data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  // Take top 12 features for readability
  const chartData = (data[activeModel] || [])
    .slice(0, 12)
    .reverse()
    .map((item) => ({
      feature: item.feature.length > 25 ? item.feature.slice(0, 22) + '...' : item.feature,
      importance: item.importance,
      fullName: item.feature,
    }));

  const maxImportance = Math.max(...chartData.map(d => d.importance));

  return (
    <div id="feature-importance" className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Feature Importance</h2>
            <p className="text-sm text-slate-400">Key factors influencing credit risk predictions</p>
          </div>
        </div>

        {/* Model Toggle */}
        <div className="flex bg-slate-800/80 rounded-xl p-1 border border-slate-700/50">
          <button
            onClick={() => setActiveModel('random_forest')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeModel === 'random_forest'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Random Forest
          </button>
          <button
            onClick={() => setActiveModel('logistic_regression')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeModel === 'logistic_regression'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Logistic Regression
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              domain={[0, maxImportance * 1.1]}
              tickFormatter={(v) => v.toFixed(2)}
            />
            <YAxis
              dataKey="feature"
              type="category"
              width={180}
              tick={{ fill: '#cbd5e1', fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '12px',
                color: '#e2e8f0',
                fontSize: '13px'
              }}
              formatter={(value, name, props) => [
                `${value.toFixed(4)}`,
                props.payload.fullName
              ]}
            />
            <Bar
              dataKey="importance"
              radius={[0, 8, 8, 0]}
              fill="url(#importanceGradient)"
              barSize={20}
            >
            </Bar>
            <defs>
              <linearGradient id="importanceGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0d9488" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>

        {/* Insight callout */}
        <div className="mt-4 p-3 bg-slate-900/40 rounded-xl border border-slate-700/30">
          <p className="text-xs text-slate-400">
            <span className="text-teal-400 font-semibold">Insight: </span>
            {activeModel === 'random_forest'
              ? 'Random Forest feature importance is computed from mean decrease in impurity (Gini importance) across all trees.'
              : 'Logistic Regression importance is derived from normalized absolute coefficient values.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-56 bg-slate-800/60 rounded-lg animate-pulse" />
      <div className="h-96 bg-slate-800/40 rounded-2xl animate-pulse" />
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
      <p className="text-red-400 font-medium">{message}</p>
    </div>
  );
}
