import { useState, useEffect } from 'react';
import { getModelMetrics } from '../services/api';

export default function ModelMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getModelMetrics();
        setMetrics(data);
      } catch (err) {
        setError('Failed to load model metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (!metrics) return null;

  const primary = metrics.primary_model;
  const baseline = metrics.baseline_model;

  return (
    <div id="model-performance" className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Model Performance</h2>
          <p className="text-sm text-slate-400">
            Comparing {primary.model_name} (primary) vs {baseline.model_name} (baseline)
          </p>
        </div>
      </div>

      {/* ── Metrics Cards Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
        <MetricCard label="Accuracy" primary={primary.accuracy} baseline={baseline.accuracy} icon="🎯" />
        <MetricCard label="Precision" primary={primary.precision} baseline={baseline.precision} icon="✦" />
        <MetricCard label="Recall" primary={primary.recall} baseline={baseline.recall} icon="◎" />
        <MetricCard label="F1 Score" primary={primary.f1_score} baseline={baseline.f1_score} icon="⚡" />
        <MetricCard label="ROC-AUC" primary={primary.roc_auc} baseline={baseline.roc_auc} icon="📈" />
      </div>

      {/* ── Confusion Matrices ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <ConfusionMatrixCard
          title={primary.model_name}
          matrix={primary.confusion_matrix}
          isPrimary
        />
        <ConfusionMatrixCard
          title={baseline.model_name}
          matrix={baseline.confusion_matrix}
        />
      </div>

      {/* ── Training Info ── */}
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Training Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-slate-500">Training Samples</p>
            <p className="text-white font-bold text-lg">{metrics.training_samples}</p>
          </div>
          <div>
            <p className="text-slate-500">Test Samples</p>
            <p className="text-white font-bold text-lg">{metrics.test_samples}</p>
          </div>
          <div>
            <p className="text-slate-500">Features</p>
            <p className="text-white font-bold text-lg">{metrics.n_features}</p>
          </div>
          <div>
            <p className="text-slate-500">CV ROC-AUC</p>
            <p className="text-white font-bold text-lg">
              {primary.cv_roc_auc_mean} <span className="text-slate-500 text-xs">± {primary.cv_roc_auc_std}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ── Metric Comparison Card ── */
function MetricCard({ label, primary, baseline, icon }) {
  const diff = primary - baseline;
  const better = diff >= 0;

  return (
    <div className="glass-panel rounded-2xl p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden">
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xl">{icon}</span>
          <span className={`text-[11px] font-black tracking-wide px-2.5 py-1 rounded-full shadow-sm ${
            better ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {better ? '+' : ''}{(diff * 100).toFixed(1)}%
          </span>
        </div>
        <p className="text-2xl lg:text-3xl font-black text-white tracking-tight truncate">{(primary * 100).toFixed(1)}%</p>
        <p className="text-[10px] lg:text-xs text-slate-400 font-semibold mt-1 lg:mt-1.5 uppercase tracking-wider truncate">{label}</p>
        <div className="mt-2 lg:mt-3 flex flex-col sm:flex-row sm:items-center justify-between bg-black/20 px-2 lg:px-3 py-1.5 rounded-lg border border-white/5 gap-1">
          <span className="text-[10px] text-slate-500 font-medium">BASELINE</span>
          <span className="text-[11px] text-slate-300 font-bold">{(baseline * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}


/* ── Confusion Matrix Heatmap ── */
function ConfusionMatrixCard({ title, matrix, isPrimary = false }) {
  if (!matrix || matrix.length < 2) return null;

  const [[tn, fp], [fn, tp]] = matrix;
  const total = tn + fp + fn + tp;

  const cells = [
    { label: 'True Neg', value: tn, intensity: tn / total, row: 'Actual: Good', col: 'Pred: Good', color: 'emerald' },
    { label: 'False Pos', value: fp, intensity: fp / total, row: 'Actual: Good', col: 'Pred: Bad', color: 'amber' },
    { label: 'False Neg', value: fn, intensity: fn / total, row: 'Actual: Bad', col: 'Pred: Good', color: 'amber' },
    { label: 'True Pos', value: tp, intensity: tp / total, row: 'Actual: Bad', col: 'Pred: Bad', color: 'emerald' },
  ];

  return (
    <div className={`bg-slate-800/60 backdrop-blur-sm border rounded-2xl p-5 shadow-xl ${
      isPrimary ? 'border-teal-500/30' : 'border-slate-700/50'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
        {isPrimary && (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30">
            PRIMARY
          </span>
        )}
      </div>

      {/* Matrix Grid */}
      <div className="grid grid-cols-3 gap-1 text-center">
        {/* Header row */}
        <div />
        <div className="text-xs text-slate-500 py-2">Pred: Good</div>
        <div className="text-xs text-slate-500 py-2">Pred: Bad</div>

        {/* Row 1: Actual Good */}
        <div className="text-xs text-slate-500 py-4 text-right pr-2 flex items-center justify-end">Actual: Good</div>
        <CmCell value={tn} label="TN" intensity={tn / total} correct />
        <CmCell value={fp} label="FP" intensity={fp / total} />

        {/* Row 2: Actual Bad */}
        <div className="text-xs text-slate-500 py-4 text-right pr-2 flex items-center justify-end">Actual: Bad</div>
        <CmCell value={fn} label="FN" intensity={fn / total} />
        <CmCell value={tp} label="TP" intensity={tp / total} correct />
      </div>
    </div>
  );
}

function CmCell({ value, label, intensity, correct = false }) {
  const alpha = Math.max(0.15, Math.min(0.6, intensity * 3));
  const bg = correct
    ? `rgba(16, 185, 129, ${alpha})`
    : `rgba(245, 158, 11, ${alpha})`;

  return (
    <div
      className="rounded-xl py-4 px-2 transition-transform hover:scale-105"
      style={{ backgroundColor: bg }}
    >
      <p className="text-xl font-black text-white">{value}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}


function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-slate-800/60 rounded-lg animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-800/40 rounded-2xl animate-pulse" />
        ))}
      </div>
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
