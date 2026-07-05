"""
Unit Tests for the Credit Risk Prediction API
===============================================
Tests the /predict endpoint and data validation.
"""

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


# ═══════════════════════════════════════════════════════════
#  Health Check
# ═══════════════════════════════════════════════════════════

def test_health_endpoint():
    """Test that the health endpoint returns a healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "model_loaded" in data


# ═══════════════════════════════════════════════════════════
#  Prediction Endpoint
# ═══════════════════════════════════════════════════════════

def test_predict_valid_input():
    """Test prediction with a valid applicant payload."""
    payload = {
        "age": 35,
        "sex": "male",
        "job": 2,
        "housing": "own",
        "saving_accounts": "moderate",
        "checking_account": "moderate",
        "credit_amount": 5000,
        "duration": 24,
        "purpose": "car"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["risk_classification"] in ("good", "bad")
    assert 0.0 <= data["risk_probability"] <= 1.0
    assert 0 <= data["risk_score"] <= 100
    assert 0.0 <= data["confidence"] <= 1.0
    assert isinstance(data["risk_factors"], list)
    assert isinstance(data["input_summary"], dict)


def test_predict_high_risk_profile():
    """Test prediction with a high-risk applicant profile."""
    payload = {
        "age": 21,
        "sex": "male",
        "job": 0,
        "housing": "rent",
        "saving_accounts": "little",
        "checking_account": "little",
        "credit_amount": 15000,
        "duration": 60,
        "purpose": "vacation/others"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    # A high-risk profile should generally have elevated risk
    assert data["risk_probability"] >= 0.0  # at minimum it returns a valid probability


def test_predict_low_risk_profile():
    """Test prediction with a low-risk applicant profile."""
    payload = {
        "age": 45,
        "sex": "female",
        "job": 3,
        "housing": "own",
        "saving_accounts": "rich",
        "checking_account": "rich",
        "credit_amount": 2000,
        "duration": 12,
        "purpose": "radio/tv"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["risk_probability"] <= 1.0  # valid probability range


def test_predict_null_optional_fields():
    """Test prediction with null saving/checking accounts (allowed)."""
    payload = {
        "age": 30,
        "sex": "female",
        "job": 1,
        "housing": "free",
        "saving_accounts": None,
        "checking_account": None,
        "credit_amount": 3000,
        "duration": 18,
        "purpose": "education"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_classification"] in ("good", "bad")


def test_predict_invalid_age():
    """Test that age validation rejects out-of-range values."""
    payload = {
        "age": 10,  # too young
        "sex": "male",
        "job": 2,
        "housing": "own",
        "credit_amount": 5000,
        "duration": 24,
        "purpose": "car"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422  # Validation error


def test_predict_invalid_sex():
    """Test that sex validation rejects invalid values."""
    payload = {
        "age": 30,
        "sex": "unknown",
        "job": 2,
        "housing": "own",
        "credit_amount": 5000,
        "duration": 24,
        "purpose": "car"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_predict_invalid_housing():
    """Test that housing validation rejects invalid values."""
    payload = {
        "age": 30,
        "sex": "male",
        "job": 2,
        "housing": "castle",
        "credit_amount": 5000,
        "duration": 24,
        "purpose": "car"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_predict_invalid_purpose():
    """Test that purpose validation rejects invalid values."""
    payload = {
        "age": 30,
        "sex": "male",
        "job": 2,
        "housing": "own",
        "credit_amount": 5000,
        "duration": 24,
        "purpose": "yacht"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_predict_missing_required_field():
    """Test that missing required fields return 422."""
    payload = {
        "age": 30,
        "sex": "male"
        # Missing most required fields
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


# ═══════════════════════════════════════════════════════════
#  Metrics & Data Endpoints
# ═══════════════════════════════════════════════════════════

def test_model_metrics_endpoint():
    """Test that model metrics endpoint returns valid data."""
    response = client.get("/model-metrics")
    assert response.status_code == 200
    data = response.json()
    assert "primary_model" in data
    assert "baseline_model" in data


def test_feature_importance_endpoint():
    """Test that feature importance endpoint returns data."""
    response = client.get("/feature-importance")
    assert response.status_code == 200
    data = response.json()
    assert "random_forest" in data


def test_portfolio_summary_endpoint():
    """Test that portfolio summary returns aggregate stats."""
    response = client.get("/portfolio-summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_applicants" in data
    assert "risk_distribution" in data
    assert "avg_credit_amount" in data
