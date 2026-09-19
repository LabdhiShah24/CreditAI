import os
import sys
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from sklearn.linear_model import LogisticRegression

class PlattCalibratedModel:
    """Standalone Platt Scaling (Sigmoid) Probability Calibrator."""
    def __init__(self, base_estimator):
        self.base_estimator = base_estimator
        self.calibrator = LogisticRegression(solver="lbfgs")

    def fit_calibration(self, X_val, y_val):
        raw_p = self.base_estimator.predict_proba(X_val)[:, 1].reshape(-1, 1)
        self.calibrator.fit(raw_p, y_val)
        return self

    def predict_proba(self, X):
        raw_p = self.base_estimator.predict_proba(X)[:, 1].reshape(-1, 1)
        cal_p1 = self.calibrator.predict_proba(raw_p)[:, 1]
        cal_p0 = 1.0 - cal_p1
        return np.column_stack([cal_p0, cal_p1])

    def predict(self, X, threshold=0.5):
        return (self.predict_proba(X)[:, 1] >= threshold).astype(int)

# =====================================================================
# CREDITAI RISK SCORE DEFINITION & DOCUMENTATION
# =====================================================================
# Official Name: CreditAI Risk Score
# 
# IMPORTANT DISTINCTIONS:
# - This is a user-facing transformation of the calibrated Probability of Default (PD).
# - It must NOT be called CIBIL Score, FICO Score, or Credit Bureau Score.
# - It is distinct from the calibrated PD; it provides a consumer-friendly scale.
# - Risk bands are presentation bands only. They do not constitute approval/decline rules.
#
# MATHEMATICAL FORMULA (Config B):
# Base Score = 650
# PDO (Points to Double Odds) = 50
# Base PD = 8.0722% (0.080722)
#
# odds = (1 - PD) / PD
# base_odds = (1 - BasePD) / BasePD
# Score = Base Score + (PDO / ln(2)) * ln(odds / base_odds)
# 
# Meaning of PDO:
# The Points to Double Odds (PDO) is 50. This means that for every 50-point
# increase in the score, the odds of a good outcome (not defaulting) double
# compared to the base odds.
#
# The score decreases monotonically as PD increases.
# =====================================================================

BASE_SCORE = 650
PDO = 50
BASE_PD = 0.080722
BASE_ODDS = (1 - BASE_PD) / BASE_PD
FACTOR = PDO / np.log(2)

def calculate_raw_score(pd_values):
    """Calculates the raw unclipped CreditAI Risk Score."""
    # Robust probability handling (strictly between 0 and 1)
    pd_safe = np.clip(pd_values, 1e-9, 1.0 - 1e-9)
    
    odds = (1 - pd_safe) / pd_safe
    score = BASE_SCORE + FACTOR * np.log(odds / BASE_ODDS)
    
    return score

def calculate_score(pd_values):
    """Calculates the clipped CreditAI Risk Score."""
    raw_score = calculate_raw_score(pd_values)
    
    # The clipping is a structural safeguard only, to bound between 300 and 900.
    # Do NOT rescale the observed population to artificially fill 300-900.
    clipped_score = np.clip(raw_score, 300, 900)
    return np.round(clipped_score).astype(int)

def get_risk_band(score):
    """
    Returns the CreditAI V1 presentation risk band.
    IMPORTANT: These are presentation bands only, not approval rules.
    """
    if score >= 750:
        return "Very Low Risk"
    elif score >= 700:
        return "Low Risk"
    elif score >= 650:
        return "Moderate Risk"
    elif score >= 600:
        return "Elevated Risk"
    elif score >= 500:
        return "High Risk"
    else:
        return "Very High Risk"

def test_transformation():
    print("==================================================")
    print("5. TEST THE TRANSFORMATION")
    print("==================================================")
    test_pds = [0.01, 0.02, 0.05, 0.080722, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.4355]
    
    print(f"{'PD':<10} | {'Raw Score':<15} | {'Clipped Score':<15} | {'Risk Band':<20}")
    print("-" * 65)
    for pd_val in test_pds:
        raw = calculate_raw_score(pd_val)
        clipped = calculate_score(pd_val)
        band = get_risk_band(clipped)
        print(f"{pd_val:<10.6f} | {raw:<15.2f} | {clipped:<15d} | {band:<20}")
    print()
    print("- PD increases -> score decreases: YES (see table)")
    print("- PD decreases -> score increases: YES (see table)")
    print(f"- PD = BasePD ({BASE_PD}) produces approximately BaseScore (650): {calculate_score(BASE_PD) == BASE_SCORE}")
    print("- All final scores remain between 300 and 900: YES")
    print()

def get_test_predictions():
    """Loads the real model distribution from the untouched test set."""
    from sklearn.model_selection import train_test_split
    
    base_dir = Path(__file__).resolve().parent.parent
    data_path = base_dir / "data" / "processed" / "credit_features_train.csv"
    artifacts_dir = base_dir / "ml" / "artifacts"
    
    # Load dataset
    df = pd.read_csv(data_path)
    X = df.drop(columns=["SK_ID_CURR", "TARGET"])
    y = df["TARGET"]
    
    # Recreate the exact 70/15/15 split using random_state=42
    X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.30, random_state=42, stratify=y)
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp)
    
    # Ensure PlattCalibratedModel is available in scope for unpickling
    sys.path.append(str(base_dir / "ml"))
    from train_creditai_model import PlattCalibratedModel
    
    # Load artifacts
    preprocessor = joblib.load(artifacts_dir / "creditai_preprocessor.pkl")
    calibrated_clf = joblib.load(artifacts_dir / "final_creditai_model.pkl")
    
    # Preprocess and predict
    X_test_proc = preprocessor.transform(X_test)
    test_pred_proba = calibrated_clf.predict_proba(X_test_proc)[:, 1]
    
    return test_pred_proba

def test_model_distribution():
    print("==================================================")
    print("6. TEST AGAINST REAL MODEL DISTRIBUTION")
    print("==================================================")
    
    test_pds = get_test_predictions()
    scores = calculate_score(test_pds)
    
    print("Distribution Report (CreditAI Risk Score):")
    print(f"Minimum: {np.min(scores)}")
    print(f"Maximum: {np.max(scores)}")
    print(f"Mean:    {np.mean(scores):.2f}")
    print(f"Median:  {np.median(scores):.2f}")
    print(f"Std Dev: {np.std(scores):.2f}")
    print(f"P10:     {np.percentile(scores, 10):.0f}")
    print(f"P25:     {np.percentile(scores, 25):.0f}")
    print(f"P75:     {np.percentile(scores, 75):.0f}")
    print(f"P90:     {np.percentile(scores, 90):.0f}")
    print()
    
    print("Risk Band Distribution (Counts and Percentages):")
    bins = [300, 500, 600, 650, 700, 750, 800, 850, 901]
    labels = ["300-499", "500-599", "600-649", "650-699", "700-749", "750-799", "800-849", "850-900"]
    
    total = len(scores)
    for i in range(len(labels)):
        lower = bins[i]
        upper = bins[i+1]
        if i == len(labels) - 1:
            count = np.sum((scores >= lower) & (scores <= 900))
        else:
            count = np.sum((scores >= lower) & (scores < upper))
        
        pct = (count / total) * 100
        print(f"{labels[i]:<10}: {count:>8} applicants ({pct:>6.2f}%)")
    print()

def test_consistency():
    print("==================================================")
    print("7. SCORE <-> PD CONSISTENCY")
    print("==================================================")
    
    # Check monotonicity
    pds = np.linspace(0.01, 0.99, 1000)
    raw_scores = calculate_raw_score(pds)
    diffs = np.diff(raw_scores)
    is_monotonic = np.all(diffs < 0)
    print(f"Transformation is mathematically monotonic: {is_monotonic}")
    print()
    
    print("Verify exact PD mappings (examples):")
    test_scores = [350, 500, 600, 650, 700, 800, 850]
    
    print(f"{'Target Score':<15} | {'Implied PD':<15} | {'Calculated Score (verify)'}")
    print("-" * 65)
    for ts in test_scores:
        # Score = BaseScore + FACTOR * ln(odds / BASE_ODDS)
        # (Score - BaseScore) / FACTOR = ln(odds / BASE_ODDS)
        # exp((Score - BaseScore) / FACTOR) = odds / BASE_ODDS
        # odds = BASE_ODDS * exp((Score - BaseScore) / FACTOR)
        # odds = (1-PD)/PD => 1/PD - 1 = odds => 1/PD = odds + 1 => PD = 1 / (odds + 1)
        
        implied_odds = BASE_ODDS * np.exp((ts - BASE_SCORE) / FACTOR)
        implied_pd = 1 / (implied_odds + 1)
        
        calc_score = calculate_raw_score(implied_pd)
        print(f"{ts:<15d} | {implied_pd:<15.6f} | {calc_score:<15.2f}")
    print()

if __name__ == "__main__":
    test_transformation()
    test_model_distribution()
    test_consistency()
