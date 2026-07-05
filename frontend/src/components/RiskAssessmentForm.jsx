import { useState } from 'react';
import { predictRisk } from '../services/api';

/* ─────────────────────────────────────────────
   Form field configuration — drives the UI
   ───────────────────────────────────────────── */
const FORM_FIELDS = {
  age: { label: 'Age', type: 'number', placeholder: 'e.g. 35', min: 18, max: 100 },
  sex: {
    label: 'Gender', type: 'select',
    options: [
      { value: '', label: 'Select gender' },
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
    ],
  },
  job: {
    label: 'Job Skill Level', type: 'select',
    options: [
      { value: '', label: 'Select skill level' },
      { value: '0', label: '0 — Unskilled (non-resident)' },
      { value: '1', label: '1 — Unskilled (resident)' },
      { value: '2', label: '2 — Skilled' },
      { value: '3', label: '3 — Highly Skilled / Management' },
    ],
  },
  housing: {
    label: 'Housing', type: 'select',
    options: [
      { value: '', label: 'Select housing type' },
      { value: 'own', label: 'Own' },
      { value: 'rent', label: 'Rent' },
      { value: 'free', label: 'Free' },
    ],
  },
  saving_accounts: {
    label: 'Savings Account Level', type: 'select',
    options: [
      { value: '', label: 'Unknown / Not Available' },
      { value: 'little', label: 'Little' },
      { value: 'moderate', label: 'Moderate' },
      { value: 'quite rich', label: 'Quite Rich' },
      { value: 'rich', label: 'Rich' },
    ],
  },
  checking_account: {
    label: 'Checking Account Level', type: 'select',
    options: [
      { value: '', label: 'Unknown / Not Available' },
      { value: 'little', label: 'Little' },
      { value: 'moderate', label: 'Moderate' },
      { value: 'rich', label: 'Rich' },
    ],
  },
  credit_amount: { label: 'Credit Amount (DM)', type: 'number', placeholder: 'e.g. 5000', min: 100, max: 100000 },
  duration: { label: 'Loan Duration (months)', type: 'number', placeholder: 'e.g. 24', min: 1, max: 120 },
  purpose: {
    label: 'Loan Purpose', type: 'select',
    options: [
      { value: '', label: 'Select purpose' },
      { value: 'car', label: 'Car' },
      { value: 'furniture/equipment', label: 'Furniture / Equipment' },
      { value: 'radio/tv', label: 'Radio / TV' },
      { value: 'domestic appliances', label: 'Domestic Appliances' },
      { value: 'repairs', label: 'Repairs' },
      { value: 'education', label: 'Education' },
      { value: 'business', label: 'Business' },
      { value: 'vacation/others', label: 'Vacation / Others' },
    ],
  },
};

const INITIAL_FORM = {
  age: '', sex: '', job: '', housing: '',
  saving_accounts: '', checking_account: '',
  credit_amount: '', duration: '', purpose: '',
};

export default function RiskAssessmentForm() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = {
        ...formData,
        age: parseInt(formData.age, 10),
        job: parseInt(formData.job, 10),
        credit_amount: parseInt(formData.credit_amount, 10),
        duration: parseInt(formData.duration, 10),
        saving_accounts: formData.saving_accounts || null,
        checking_account: formData.checking_account || null,
      };
      const data = await predictRisk(payload);
      setResult(data);
    } catch (err) {
      setError(
        err.response?.data?.detail?.[0]?.msg ||
        err.response?.data?.detail ||
        'Prediction failed. Please check your inputs and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setResult(null);
    setError(null);
  };

  /* ── Risk score color logic ── */
  const getRiskColor = (score) => {
    if (score <= 30) return { bg: 'bg-emerald-500', text: 'text-emerald-400', ring: 'ring-emerald-500/30', label: 'Low Risk' };
    if (score <= 60) return { bg: 'bg-amber-500', text: 'text-amber-400', ring: 'ring-amber-500/30', label: 'Medium Risk' };
    return { bg: 'bg-red-500', text: 'text-red-400', ring: 'ring-red-500/30', label: 'High Risk' };
  };

  return (
    <div id="risk-assessment" className="space-y-6">
      {/* ── Section Header ── */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">New Risk Assessment</h2>
          <p className="text-sm text-slate-400">Enter applicant details to predict credit risk</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Form (left panel) ── */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(FORM_FIELDS).map(([key, field]) => (
              <div key={key} className="space-y-1.5">
                <label htmlFor={key} className="block text-sm font-medium text-slate-300">
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    id={key} name={key} value={formData[key]} onChange={handleChange}
                    required={!['saving_accounts', 'checking_account'].includes(key)}
                    className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-600/50 rounded-xl text-white
                      focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all duration-200
                      hover:border-slate-500"
                  >
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={key} name={key} type={field.type} value={formData[key]} onChange={handleChange}
                    placeholder={field.placeholder} min={field.min} max={field.max} required
                    className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-600/50 rounded-xl text-white
                      placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500
                      transition-all duration-200 hover:border-slate-500"
                  />
                )}
              </div>
            ))}
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500
                text-white font-semibold rounded-xl shadow-lg shadow-teal-500/25
                disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300
                transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  Analyzing...
                </span>
              ) : 'Assess Credit Risk'}
            </button>
            <button
              type="button" onClick={handleReset}
              className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 font-medium rounded-xl
                border border-slate-600/50 transition-all duration-200"
            >
              Reset
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
        </form>

        {/* ── Result Card (right panel) ── */}
        <div className="lg:col-span-2">
          {result ? (
            <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl animate-fade-in">
              {/* Risk Score Gauge */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ring-4 ${getRiskColor(result.risk_score).ring} bg-slate-900/80 mb-3`}>
                  <div>
                    <span className={`text-4xl font-black ${getRiskColor(result.risk_score).text}`}>
                      {result.risk_score}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">/100</p>
                  </div>
                </div>
                <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${
                  result.risk_classification === 'good'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/15 text-red-400 border border-red-500/30'
                }`}>
                  {result.risk_classification === 'good' ? '✓ Good Credit' : '✗ Bad Credit'}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {getRiskColor(result.risk_score).label} · {(result.risk_probability * 100).toFixed(1)}% default probability
                </p>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-slate-900/60 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400 mb-1">Default Prob.</p>
                  <p className="text-lg font-bold text-white">{(result.risk_probability * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-slate-900/60 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400 mb-1">Confidence</p>
                  <p className="text-lg font-bold text-white">{(result.confidence * 100).toFixed(1)}%</p>
                </div>
              </div>

              {/* Risk Factors */}
              {result.risk_factors?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">Risk Factors</h4>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {result.risk_factors.map((factor, i) => (
                      <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg text-xs ${
                        factor.impact === 'positive'
                          ? 'bg-emerald-500/8 border border-emerald-500/20'
                          : 'bg-red-500/8 border border-red-500/20'
                      }`}>
                        <span className={`mt-0.5 flex-shrink-0 text-sm ${
                          factor.impact === 'positive' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {factor.impact === 'positive' ? '▲' : '▼'}
                        </span>
                        <div>
                          <p className={`font-semibold ${
                            factor.impact === 'positive' ? 'text-emerald-300' : 'text-red-300'
                          }`}>{factor.factor}</p>
                          <p className="text-slate-400 mt-0.5">{factor.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-800/30 border border-dashed border-slate-700/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm font-medium">Risk Score Preview</p>
              <p className="text-slate-500 text-xs mt-1">Fill in the form and submit to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
