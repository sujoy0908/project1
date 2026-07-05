"""
Model Training Script
======================
Trains Random Forest (primary) and Logistic Regression (baseline) classifiers
on the German Credit Data. Evaluates both models, computes feature importance,
and saves artifacts for the API to serve.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)

from preprocessing import (
    load_data, preprocess_data, save_preprocessor,
    NUMERICAL_FEATURES, CATEGORICAL_FEATURES
)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'german_credit_data.csv')
MODEL_DIR = os.path.join(BASE_DIR, 'saved_model')
os.makedirs(MODEL_DIR, exist_ok=True)


def evaluate_model(model, X_test, y_test, model_name: str) -> dict:
    """
    Compute comprehensive evaluation metrics for a trained model.
    
    Returns a dictionary with accuracy, precision, recall, F1, ROC-AUC,
    and confusion matrix.
    """
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    metrics = {
        'model_name': model_name,
        'accuracy': round(accuracy_score(y_test, y_pred), 4),
        'precision': round(precision_score(y_test, y_pred, zero_division=0), 4),
        'recall': round(recall_score(y_test, y_pred, zero_division=0), 4),
        'f1_score': round(f1_score(y_test, y_pred, zero_division=0), 4),
        'roc_auc': round(roc_auc_score(y_test, y_prob), 4),
        'confusion_matrix': confusion_matrix(y_test, y_pred).tolist()
    }
    
    print(f"\n{'='*50}")
    print(f"  {model_name} — Evaluation Results")
    print(f"{'='*50}")
    print(f"  Accuracy:  {metrics['accuracy']}")
    print(f"  Precision: {metrics['precision']}")
    print(f"  Recall:    {metrics['recall']}")
    print(f"  F1 Score:  {metrics['f1_score']}")
    print(f"  ROC-AUC:   {metrics['roc_auc']}")
    print(f"\n  Confusion Matrix:")
    print(f"    {metrics['confusion_matrix']}")
    print(f"\n{classification_report(y_test, y_pred, target_names=['good (0)', 'bad (1)'])}")
    
    return metrics


def compute_feature_importance(model, feature_names: list, model_name: str) -> list:
    """
    Extract feature importance from a trained model.
    
    For tree-based models: uses built-in feature_importances_
    For linear models: uses absolute coefficient values (normalized)
    """
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
    elif hasattr(model, 'coef_'):
        importances = np.abs(model.coef_[0])
        importances = importances / importances.sum()  # normalize
    else:
        return []
    
    # Sort by importance (descending)
    indices = np.argsort(importances)[::-1]
    
    feature_importance = []
    for idx in indices:
        # Clean up feature names for readability
        name = feature_names[idx]
        name = name.replace('_', ' ').title()
        feature_importance.append({
            'feature': name,
            'importance': round(float(importances[idx]), 4),
            'raw_feature': feature_names[idx]
        })
    
    print(f"\n  Top 10 Feature Importances ({model_name}):")
    for i, fi in enumerate(feature_importance[:10]):
        bar = '#' * int(fi['importance'] * 50)
        print(f"    {i+1:2d}. {fi['feature']:<35s} {fi['importance']:.4f}  {bar}")
    
    return feature_importance


def compute_portfolio_summary(df: pd.DataFrame) -> dict:
    """Compute aggregate portfolio statistics from the full dataset."""
    total = len(df)
    risk_dist = df['risk'].value_counts().to_dict()
    
    summary = {
        'total_applicants': total,
        'risk_distribution': {
            'good': int(risk_dist.get('good', 0)),
            'bad': int(risk_dist.get('bad', 0))
        },
        'good_risk_pct': round(risk_dist.get('good', 0) / total * 100, 1),
        'bad_risk_pct': round(risk_dist.get('bad', 0) / total * 100, 1),
        'avg_credit_amount': round(float(df['credit_amount'].mean()), 2),
        'median_credit_amount': round(float(df['credit_amount'].median()), 2),
        'avg_duration': round(float(df['duration'].mean()), 1),
        'avg_age': round(float(df['age'].mean()), 1),
        'credit_amount_by_risk': {
            'good': round(float(df[df['risk'] == 'good']['credit_amount'].mean()), 2),
            'bad': round(float(df[df['risk'] == 'bad']['credit_amount'].mean()), 2)
        },
        'age_distribution': {
            '18-25': int(((df['age'] >= 18) & (df['age'] <= 25)).sum()),
            '26-35': int(((df['age'] >= 26) & (df['age'] <= 35)).sum()),
            '36-45': int(((df['age'] >= 36) & (df['age'] <= 45)).sum()),
            '46-55': int(((df['age'] >= 46) & (df['age'] <= 55)).sum()),
            '56+': int((df['age'] >= 56).sum())
        },
        'purpose_distribution': df['purpose'].value_counts().to_dict()
    }
    
    return summary


def train_models():
    """
    Main training pipeline:
    1. Load and preprocess data
    2. Train Random Forest (primary) and Logistic Regression (baseline)
    3. Evaluate both models
    4. Save models, preprocessor, metrics, and feature importance
    """
    print("=" * 60)
    print("  CREDIT RISK MODEL TRAINING PIPELINE")
    print("=" * 60)
    
    # ── Step 1: Load data ──
    print("\n[1/6] Loading dataset...")
    df = load_data(DATA_PATH)
    
    # ── Step 2: Preprocess ──
    print("[2/6] Preprocessing data...")
    X, y, preprocessor, feature_names = preprocess_data(df)
    print(f"  Features shape: {X.shape}")
    print(f"  Target distribution: {np.bincount(y)} (0=good, 1=bad)")
    
    # Train/test split (80/20, stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"  Train: {X_train.shape[0]} samples | Test: {X_test.shape[0]} samples")
    
    # ── Step 3: Train Random Forest ──
    print("\n[3/6] Training Random Forest classifier...")
    rf_model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_split=5,
        min_samples_leaf=3,
        class_weight='balanced',     # handle class imbalance
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train, y_train)
    
    # Cross-validation score
    cv_scores = cross_val_score(rf_model, X, y, cv=5, scoring='roc_auc')
    print(f"  5-Fold CV ROC-AUC: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    
    rf_metrics = evaluate_model(rf_model, X_test, y_test, "Random Forest")
    rf_metrics['cv_roc_auc_mean'] = round(float(cv_scores.mean()), 4)
    rf_metrics['cv_roc_auc_std'] = round(float(cv_scores.std()), 4)
    
    # ── Step 4: Train Logistic Regression (baseline) ──
    print("\n[4/6] Training Logistic Regression baseline...")
    lr_model = LogisticRegression(
        max_iter=1000,
        class_weight='balanced',
        random_state=42,
        solver='lbfgs'
    )
    lr_model.fit(X_train, y_train)
    lr_metrics = evaluate_model(lr_model, X_test, y_test, "Logistic Regression")
    
    # ── Step 5: Feature importance ──
    print("\n[5/6] Computing feature importance...")
    rf_importance = compute_feature_importance(rf_model, feature_names, "Random Forest")
    lr_importance = compute_feature_importance(lr_model, feature_names, "Logistic Regression")
    
    # ── Step 6: Save all artifacts ──
    print("\n[6/6] Saving model artifacts...")
    
    # Save models
    joblib.dump(rf_model, os.path.join(MODEL_DIR, 'random_forest_model.joblib'))
    joblib.dump(lr_model, os.path.join(MODEL_DIR, 'logistic_regression_model.joblib'))
    print(f"  ✓ Models saved to {MODEL_DIR}")
    
    # Save preprocessor
    save_preprocessor(preprocessor, os.path.join(MODEL_DIR, 'preprocessor.joblib'))
    
    # Save metrics
    all_metrics = {
        'primary_model': rf_metrics,
        'baseline_model': lr_metrics,
        'feature_names': feature_names,
        'training_samples': int(X_train.shape[0]),
        'test_samples': int(X_test.shape[0]),
        'n_features': int(X.shape[1])
    }
    with open(os.path.join(MODEL_DIR, 'metrics.json'), 'w') as f:
        json.dump(all_metrics, f, indent=2)
    print("  ✓ Metrics saved")
    
    # Save feature importance
    importance_data = {
        'random_forest': rf_importance,
        'logistic_regression': lr_importance
    }
    with open(os.path.join(MODEL_DIR, 'feature_importance.json'), 'w') as f:
        json.dump(importance_data, f, indent=2)
    print("  ✓ Feature importance saved")
    
    # Save portfolio summary
    portfolio = compute_portfolio_summary(df)
    with open(os.path.join(MODEL_DIR, 'portfolio_summary.json'), 'w') as f:
        json.dump(portfolio, f, indent=2)
    print("  ✓ Portfolio summary saved")
    
    # Save feature names for the API
    with open(os.path.join(MODEL_DIR, 'feature_names.json'), 'w') as f:
        json.dump(feature_names, f, indent=2)
    print("  ✓ Feature names saved")
    
    print(f"\n{'='*60}")
    print(f"  TRAINING COMPLETE")
    print(f"  Primary model (Random Forest) ROC-AUC: {rf_metrics['roc_auc']}")
    print(f"  Baseline model (Logistic Regression) ROC-AUC: {lr_metrics['roc_auc']}")
    print(f"{'='*60}")
    
    return rf_model, lr_model, preprocessor


if __name__ == '__main__':
    train_models()
