"""
Data Preprocessing Pipeline
============================
Handles missing values, encodes categorical variables, and scales numerical features.
Designed for the German Credit Data schema.
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import joblib
import os

# Feature column definitions
NUMERICAL_FEATURES = ['age', 'credit_amount', 'duration']
CATEGORICAL_FEATURES = ['sex', 'job', 'housing', 'saving_accounts', 'checking_account', 'purpose']
TARGET_COLUMN = 'risk'


def load_data(filepath: str) -> pd.DataFrame:
    """Load the German Credit Data CSV file."""
    df = pd.read_csv(filepath)
    print(f"Loaded dataset with shape: {df.shape}")
    return df


def create_preprocessing_pipeline() -> ColumnTransformer:
    """
    Build a scikit-learn preprocessing pipeline.
    
    Numerical features: impute missing → standard scale
    Categorical features: impute missing with 'unknown' → one-hot encode
    """
    numerical_pipeline = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    categorical_pipeline = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='unknown')),
        ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numerical_pipeline, NUMERICAL_FEATURES),
            ('cat', categorical_pipeline, CATEGORICAL_FEATURES)
        ],
        remainder='drop'
    )
    
    return preprocessor


def encode_target(y: pd.Series) -> np.ndarray:
    """Encode target variable: 'bad' = 1 (high risk), 'good' = 0 (low risk)."""
    return (y == 'bad').astype(int).values


def decode_target(y: np.ndarray) -> list:
    """Decode numeric predictions back to labels."""
    return ['bad' if v == 1 else 'good' for v in y]


def preprocess_data(df: pd.DataFrame, fit: bool = True, preprocessor=None):
    """
    Full preprocessing pipeline: separate features/target, apply transformations.
    
    Args:
        df: Raw DataFrame
        fit: If True, fit the preprocessor; otherwise use existing fitted preprocessor
        preprocessor: Pre-fitted preprocessor (required if fit=False)
    
    Returns:
        X_processed: Transformed feature matrix
        y: Encoded target array
        preprocessor: Fitted preprocessor (for saving/reuse)
        feature_names: List of feature names after transformation
    """
    X = df[NUMERICAL_FEATURES + CATEGORICAL_FEATURES]
    y = encode_target(df[TARGET_COLUMN])
    
    if fit:
        preprocessor = create_preprocessing_pipeline()
        X_processed = preprocessor.fit_transform(X)
    else:
        X_processed = preprocessor.transform(X)
    
    # Extract feature names from the column transformer
    feature_names = get_feature_names(preprocessor)
    
    return X_processed, y, preprocessor, feature_names


def get_feature_names(preprocessor: ColumnTransformer) -> list:
    """Extract human-readable feature names from a fitted ColumnTransformer."""
    feature_names = []
    
    # Numerical feature names (unchanged)
    feature_names.extend(NUMERICAL_FEATURES)
    
    # Categorical feature names (from OneHotEncoder)
    ohe = preprocessor.named_transformers_['cat'].named_steps['encoder']
    cat_feature_names = ohe.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
    feature_names.extend(cat_feature_names)
    
    return feature_names


def preprocess_single_input(input_data: dict, preprocessor) -> np.ndarray:
    """
    Preprocess a single applicant's data for prediction.
    
    Args:
        input_data: Dictionary with applicant details
        preprocessor: Fitted preprocessor
    
    Returns:
        Transformed feature array ready for model prediction
    """
    df = pd.DataFrame([input_data])
    
    # Ensure all required columns exist
    for col in NUMERICAL_FEATURES + CATEGORICAL_FEATURES:
        if col not in df.columns:
            df[col] = np.nan
    
    X = df[NUMERICAL_FEATURES + CATEGORICAL_FEATURES]
    X_processed = preprocessor.transform(X)
    
    return X_processed


def save_preprocessor(preprocessor, filepath: str):
    """Save the fitted preprocessor to disk."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    joblib.dump(preprocessor, filepath)
    print(f"Preprocessor saved to: {filepath}")


def load_preprocessor(filepath: str):
    """Load a fitted preprocessor from disk."""
    return joblib.load(filepath)
