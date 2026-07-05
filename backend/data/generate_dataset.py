"""
Synthetic German Credit Data Generator
=======================================
Generates a realistic dataset modeled after the UCI German Credit Data.
Distributions are calibrated to match the original dataset's statistical properties.
"""

import numpy as np
import pandas as pd
import os

np.random.seed(42)

def generate_german_credit_data(n_samples: int = 1000) -> pd.DataFrame:
    """
    Generate synthetic German Credit Data with realistic distributions.
    
    The original UCI dataset has 700 good and 300 bad credit risks.
    We replicate that 70/30 split and match feature distributions.
    """
    
    # --- Age: skewed right, range ~19-75, median ~33 ---
    age = np.clip(
        np.random.lognormal(mean=3.5, sigma=0.35, size=n_samples).astype(int),
        19, 75
    )
    
    # --- Sex: ~69% male, ~31% female in original ---
    sex = np.random.choice(['male', 'female'], size=n_samples, p=[0.69, 0.31])
    
    # --- Job: 0=unskilled non-res, 1=unskilled res, 2=skilled, 3=highly skilled ---
    job = np.random.choice(
        [0, 1, 2, 3], size=n_samples,
        p=[0.05, 0.20, 0.63, 0.12]
    )
    
    # --- Housing: own ~71%, rent ~18%, free ~11% ---
    housing = np.random.choice(
        ['own', 'rent', 'free'], size=n_samples,
        p=[0.71, 0.18, 0.11]
    )
    
    # --- Saving accounts: little ~60%, moderate ~10%, quite rich ~6%, rich ~5%, NA ~18% ---
    saving_accounts_raw = np.random.choice(
        ['little', 'moderate', 'quite rich', 'rich', np.nan], size=n_samples,
        p=[0.60, 0.10, 0.07, 0.05, 0.18]
    )
    saving_accounts = pd.Series(saving_accounts_raw)
    
    # --- Checking account: little ~39%, moderate ~27%, rich ~6%, NA ~28% ---
    checking_account_raw = np.random.choice(
        ['little', 'moderate', 'rich', np.nan], size=n_samples,
        p=[0.39, 0.27, 0.06, 0.28]
    )
    checking_account = pd.Series(checking_account_raw)
    
    # --- Credit amount: right-skewed, range ~250-18,424, median ~2,320 ---
    credit_amount = np.clip(
        np.random.lognormal(mean=7.8, sigma=0.8, size=n_samples).astype(int),
        250, 20000
    )
    
    # --- Duration: months, range 4-72, most common 12,24,36 ---
    duration = np.random.choice(
        [6, 9, 10, 12, 15, 18, 21, 24, 27, 30, 33, 36, 42, 48, 54, 60, 72],
        size=n_samples,
        p=[0.08, 0.02, 0.04, 0.22, 0.04, 0.10, 0.02, 0.20, 0.02, 0.04,
           0.02, 0.08, 0.03, 0.05, 0.01, 0.02, 0.01]
    )
    
    # --- Purpose ---
    purpose = np.random.choice(
        ['car', 'furniture/equipment', 'radio/TV', 'domestic appliances',
         'repairs', 'education', 'business', 'vacation/others'],
        size=n_samples,
        p=[0.34, 0.18, 0.28, 0.01, 0.02, 0.07, 0.09, 0.01]
    )
    
    # --- Risk (target): ~30% bad, ~70% good ---
    # Generate a latent risk score correlated with features, then threshold
    # to achieve approximately 70% good / 30% bad (matching original dataset)
    risk_score = (
        0.0                                                     # neutral base
        - 0.01 * (age - 33)                                     # older = lower risk
        + 0.15 * np.array([1 if s == 'female' else 0 for s in sex])
        + 0.3 * (job == 0).astype(float)                        # unskilled = higher risk
        - 0.2 * (job == 3).astype(float)                        # highly skilled = lower risk
        - 0.25 * np.array([1 if h == 'own' else 0 for h in housing])
        + 0.15 * np.array([1 if h == 'rent' else 0 for h in housing])
        + 0.00004 * (credit_amount - 3000)                      # higher amount = riskier
        + 0.012 * (duration - 20)                               # longer duration = riskier
        - 0.3 * np.array([1 if str(s) == 'rich' else 0 for s in saving_accounts_raw])
        - 0.2 * np.array([1 if str(s) == 'quite rich' else 0 for s in saving_accounts_raw])
        + 0.15 * np.array([1 if str(s) == 'little' else 0 for s in saving_accounts_raw])
        - 0.25 * np.array([1 if str(c) == 'rich' else 0 for c in checking_account_raw])
        + 0.15 * np.array([1 if str(c) == 'little' else 0 for c in checking_account_raw])
        + 0.1 * np.array([1 if p in ['vacation/others', 'repairs'] else 0 for p in purpose])
        + np.random.normal(0, 0.6, n_samples)                  # noise
    )
    
    # Use percentile threshold to get ~30% bad (top 30% of risk scores = bad)
    threshold = np.percentile(risk_score, 70)
    risk = np.array(['bad' if s > threshold else 'good' for s in risk_score])
    
    df = pd.DataFrame({
        'age': age,
        'sex': sex,
        'job': job,
        'housing': housing,
        'saving_accounts': saving_accounts,
        'checking_account': checking_account,
        'credit_amount': credit_amount,
        'duration': duration,
        'purpose': purpose,
        'risk': risk
    })
    
    return df


if __name__ == '__main__':
    df = generate_german_credit_data(1000)
    
    # Save to CSV
    output_path = os.path.join(os.path.dirname(__file__), 'german_credit_data.csv')
    df.to_csv(output_path, index=False)
    
    print(f"Dataset generated: {output_path}")
    print(f"Shape: {df.shape}")
    print(f"\nRisk distribution:\n{df['risk'].value_counts()}")
    print(f"\nSample rows:\n{df.head()}")
    print(f"\nMissing values:\n{df.isnull().sum()}")
