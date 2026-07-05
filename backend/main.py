"""
Credit Risk Prediction API
============================
FastAPI application serving the trained credit risk model.

Endpoints:
  POST /predict           — Predict risk for a new applicant
  GET  /model-metrics     — Retrieve model performance metrics
  GET  /feature-importance — Get feature importance rankings
  GET  /portfolio-summary  — Aggregate portfolio statistics
  GET  /health             — Health check endpoint
"""

import os
import json
import joblib
import numpy as np
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from preprocessing import preprocess_single_input

# ═══════════════════════════════════════════════════════════
#  Configuration
# ═══════════════════════════════════════════════════════════

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, 'saved_model')

# ═══════════════════════════════════════════════════════════
#  FastAPI Application
# ═══════════════════════════════════════════════════════════

app = FastAPI(
    title="Credit Risk Prediction API",
    description=(
        "REST API for predicting loan default risk using machine learning. "
        "Trained on German Credit Data with Random Forest and Logistic Regression models."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS — allow the React frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════
#  Load Model Artifacts at Startup
# ═══════════════════════════════════════════════════════════

def load_artifact(filename: str):
    """Load a JSON artifact from the saved_model directory."""
    filepath = os.path.join(MODEL_DIR, filename)
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Artifact not found: {filepath}")
    with open(filepath, 'r') as f:
        return json.load(f)

# Load all artifacts
try:
    model = joblib.load(os.path.join(MODEL_DIR, 'random_forest_model.joblib'))
    preprocessor = joblib.load(os.path.join(MODEL_DIR, 'preprocessor.joblib'))
    metrics_data = load_artifact('metrics.json')
    importance_data = load_artifact('feature_importance.json')
    portfolio_data = load_artifact('portfolio_summary.json')
    feature_names = load_artifact('feature_names.json')
    print("✓ All model artifacts loaded successfully")
except FileNotFoundError as e:
    print(f"⚠ Warning: {e}")
    print("  Run model_training.py first to generate model artifacts.")
    model = None
    preprocessor = None
    metrics_data = {}
    importance_data = {}
    portfolio_data = {}
    feature_names = []

# ═══════════════════════════════════════════════════════════
#  Pydantic Models (Input Validation)
# ═══════════════════════════════════════════════════════════

class ApplicantInput(BaseModel):
    """Schema for a loan applicant's details."""
    age: int = Field(..., ge=18, le=100, description="Applicant age (18-100)")
    sex: str = Field(..., description="Gender: 'male' or 'female'")
    job: int = Field(..., ge=0, le=3, description="Job skill level (0-3)")
    housing: str = Field(..., description="Housing: 'own', 'rent', or 'free'")
    saving_accounts: Optional[str] = Field(
        None, description="Savings: 'little', 'moderate', 'quite rich', 'rich', or null"
    )
    checking_account: Optional[str] = Field(
        None, description="Checking: 'little', 'moderate', 'rich', or null"
    )
    credit_amount: int = Field(..., ge=100, le=100000, description="Credit amount in DM (100-100,000)")
    duration: int = Field(..., ge=1, le=120, description="Loan duration in months (1-120)")
    purpose: str = Field(
        ..., description="Loan purpose: 'car', 'furniture/equipment', 'radio/TV', etc."
    )

    @field_validator('sex')
    @classmethod
    def validate_sex(cls, v):
        if v.lower() not in ('male', 'female'):
            raise ValueError("Sex must be 'male' or 'female'")
        return v.lower()

    @field_validator('housing')
    @classmethod
    def validate_housing(cls, v):
        if v.lower() not in ('own', 'rent', 'free'):
            raise ValueError("Housing must be 'own', 'rent', or 'free'")
        return v.lower()

    @field_validator('saving_accounts')
    @classmethod
    def validate_saving_accounts(cls, v):
        if v is not None and v.lower() not in ('little', 'moderate', 'quite rich', 'rich'):
            raise ValueError("Saving accounts must be 'little', 'moderate', 'quite rich', 'rich', or null")
        return v.lower() if v else None

    @field_validator('checking_account')
    @classmethod
    def validate_checking_account(cls, v):
        if v is not None and v.lower() not in ('little', 'moderate', 'rich'):
            raise ValueError("Checking account must be 'little', 'moderate', 'rich', or null")
        return v.lower() if v else None

    @field_validator('purpose')
    @classmethod
    def validate_purpose(cls, v):
        valid_purposes = [
            'car', 'furniture/equipment', 'radio/tv', 'domestic appliances',
            'repairs', 'education', 'business', 'vacation/others'
        ]
        if v.lower() not in valid_purposes:
            raise ValueError(f"Purpose must be one of: {valid_purposes}")
        return v.lower()


class PredictionResponse(BaseModel):
    """Schema for the prediction response."""
    risk_classification: str
    risk_probability: float
    risk_score: int
    confidence: float
    risk_factors: list
    input_summary: dict


# ═══════════════════════════════════════════════════════════
#  API Endpoints
# ═══════════════════════════════════════════════════════════

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "version": "1.0.0"
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict_risk(applicant: ApplicantInput):
    """
    Predict credit risk for a loan applicant.
    
    Returns the risk classification (good/bad), probability,
    a 0-100 risk score, and top risk factors.
    """
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Run model_training.py first."
        )
    
    # Convert to dict for preprocessing
    input_data = applicant.model_dump()
    
    # Preprocess the input
    X_processed = preprocess_single_input(input_data, preprocessor)
    
    # Predict
    prediction = model.predict(X_processed)[0]
    probabilities = model.predict_proba(X_processed)[0]
    
    # Risk probability (probability of being "bad" = class 1)
    risk_prob = float(probabilities[1])
    risk_score = int(round(risk_prob * 100))
    classification = 'bad' if prediction == 1 else 'good'
    confidence = float(max(probabilities))
    
    # Identify top risk factors based on feature importance and input values
    risk_factors = _identify_risk_factors(input_data, risk_prob)
    
    return PredictionResponse(
        risk_classification=classification,
        risk_probability=round(risk_prob, 4),
        risk_score=risk_score,
        confidence=round(confidence, 4),
        risk_factors=risk_factors,
        input_summary={
            'age': input_data['age'],
            'credit_amount': input_data['credit_amount'],
            'duration': input_data['duration'],
            'purpose': input_data['purpose']
        }
    )


def _identify_risk_factors(input_data: dict, risk_prob: float) -> list:
    """
    Generate human-readable risk factor explanations based on input values.
    Uses heuristic rules aligned with known credit risk drivers.
    """
    factors = []
    
    if input_data['credit_amount'] > 8000:
        factors.append({
            'factor': 'High credit amount',
            'detail': f"DM {input_data['credit_amount']:,} is above average",
            'impact': 'negative'
        })
    
    if input_data['duration'] > 30:
        factors.append({
            'factor': 'Long loan duration',
            'detail': f"{input_data['duration']} months increases default risk",
            'impact': 'negative'
        })
    
    if input_data['age'] < 25:
        factors.append({
            'factor': 'Young applicant',
            'detail': f"Age {input_data['age']} — limited credit history likely",
            'impact': 'negative'
        })
    
    if input_data.get('saving_accounts') == 'little' or input_data.get('saving_accounts') is None:
        factors.append({
            'factor': 'Low/unknown savings',
            'detail': 'Limited savings buffer reduces repayment capacity',
            'impact': 'negative'
        })
    
    if input_data.get('checking_account') == 'little' or input_data.get('checking_account') is None:
        factors.append({
            'factor': 'Low/unknown checking balance',
            'detail': 'Low liquidity increases short-term default risk',
            'impact': 'negative'
        })
    
    if input_data['housing'] == 'own':
        factors.append({
            'factor': 'Homeowner',
            'detail': 'Property ownership indicates financial stability',
            'impact': 'positive'
        })
    
    if input_data.get('saving_accounts') in ('rich', 'quite rich'):
        factors.append({
            'factor': 'Strong savings',
            'detail': 'Substantial savings provide repayment buffer',
            'impact': 'positive'
        })
    
    if input_data['job'] >= 2:
        factors.append({
            'factor': 'Skilled employment',
            'detail': 'Higher skill level correlates with income stability',
            'impact': 'positive'
        })
    
    if input_data['credit_amount'] <= 3000:
        factors.append({
            'factor': 'Moderate credit amount',
            'detail': f"DM {input_data['credit_amount']:,} is within manageable range",
            'impact': 'positive'
        })
    
    return factors


@app.get("/model-metrics")
async def get_model_metrics():
    """Return model performance metrics for both primary and baseline models."""
    if not metrics_data:
        raise HTTPException(status_code=503, detail="Metrics not available.")
    return metrics_data


@app.get("/feature-importance")
async def get_feature_importance():
    """Return feature importance rankings for both models."""
    if not importance_data:
        raise HTTPException(status_code=503, detail="Feature importance data not available.")
    return importance_data


@app.get("/portfolio-summary")
async def get_portfolio_summary():
    """Return aggregate portfolio statistics from the training dataset."""
    if not portfolio_data:
        raise HTTPException(status_code=503, detail="Portfolio data not available.")
    return portfolio_data


# ═══════════════════════════════════════════════════════════
#  Entry Point
# ═══════════════════════════════════════════════════════════

if __name__ == '__main__':
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
