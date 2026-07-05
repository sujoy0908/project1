import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
console.log('Using API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased to 60s for Render free tier cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Prediction ──────────────────────────────────────────
export const predictRisk = async (applicantData) => {
  const response = await api.post('/predict', applicantData);
  return response.data;
};

// ── Model Metrics ───────────────────────────────────────
export const getModelMetrics = async () => {
  const response = await api.get('/model-metrics');
  return response.data;
};

// ── Feature Importance ──────────────────────────────────
export const getFeatureImportance = async () => {
  const response = await api.get('/feature-importance');
  return response.data;
};

// ── Portfolio Summary ───────────────────────────────────
export const getPortfolioSummary = async () => {
  const response = await api.get('/portfolio-summary');
  return response.data;
};

// ── Health Check ────────────────────────────────────────
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
