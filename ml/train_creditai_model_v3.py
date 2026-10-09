import os
import sys
import numpy as np
import pandas as pd
from pathlib import Path
import joblib
import json

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    precision_score,
    recall_score,
    confusion_matrix,
    brier_score_loss
)

def log(msg: str):
    print(f"[V3 Training] {msg}")

class PlattCalibratedModelV3:
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

def evaluate_predictions(y_true, y_pred_proba, threshold=0.5):
    y_pred = (y_pred_proba >= threshold).astype(int)
    roc_auc = roc_auc_score(y_true, y_pred_proba)
    pr_auc = average_precision_score(y_true, y_pred_proba)
    brier = brier_score_loss(y_true, y_pred_proba)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    cm = confusion_matrix(y_true, y_pred).tolist()
    return {
        "roc_auc": float(roc_auc),
        "pr_auc": float(pr_auc),
        "brier_score": float(brier),
        "precision": float(prec),
        "recall": float(rec),
        "predicted_positive_rate": float(np.mean(y_pred)),
        "confusion_matrix": cm
    }

def main():
    RANDOM_STATE = 42
    np.random.seed(RANDOM_STATE)
    
    base_dir = Path(__file__).resolve().parent.parent
    data_path = base_dir / "data" / "processed" / "credit_features_train.csv"
    artifacts_dir = base_dir / "ml" / "artifacts"
    
    log(f"Loading pre-processed data from {data_path}")
    df = pd.read_csv(data_path)
    
    # Define V3 Features
    v3_features = [
        "age_years", "education_level", "family_member_count", "income_monthly",
        "employment_years", "employment_anomaly_flag", "income_type", 
        "loan_credit_amount", "loan_annuity_emi", "loan_term_estimated_months", 
        "credit_to_goods_ratio", "payment_to_income_ratio", "credit_to_income_ratio", 
        "disposable_income_per_capita",
        # V3 Additions
        "bureau_total_loans_count", 
        "bureau_active_loans_count", 
        "bureau_total_debt_sum", 
        "bureau_utilization_ratio", 
        "bureau_credit_history_length_years", 
        "prev_app_refused_count"
    ]
    
    X = df[v3_features].copy()
    y = df["TARGET"].copy()

    # The missing values in bureau features were already filled with 0.0 in build_features.py
    # But just in case any are NaN from the CSV read:
    bureau_fill_cols = [
        "bureau_total_loans_count", "bureau_active_loans_count", "bureau_total_debt_sum", 
        "bureau_utilization_ratio", "bureau_credit_history_length_years", "prev_app_refused_count"
    ]
    X[bureau_fill_cols] = X[bureau_fill_cols].fillna(0.0)

    log("Splitting data (70/15/15)...")
    X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.30, random_state=RANDOM_STATE, stratify=y)
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.50, random_state=RANDOM_STATE, stratify=y_temp)
    
    categorical_cols = ["education_level", "income_type"]
    numerical_cols = [c for c in v3_features if c not in categorical_cols]
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())]), numerical_cols),
            ("cat", Pipeline([("imputer", SimpleImputer(strategy="most_frequent")), ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))]), categorical_cols)
        ], remainder="drop"
    )
    
    log("Fitting preprocessor...")
    X_train_proc = preprocessor.fit_transform(X_train)
    X_val_proc = preprocessor.transform(X_val)
    X_test_proc = preprocessor.transform(X_test)
    
    log("Training HistGradientBoostingClassifier for V3...")
    base_model = HistGradientBoostingClassifier(class_weight="balanced", random_state=RANDOM_STATE)
    base_model.fit(X_train_proc, y_train)
    
    log("Calibrating model using validation set...")
    calibrated_model = PlattCalibratedModelV3(base_model)
    calibrated_model.fit_calibration(X_val_proc, y_val)
    
    y_val_proba = calibrated_model.predict_proba(X_val_proc)[:, 1]
    
    log("Selecting optimal threshold on validation set...")
    from sklearn.metrics import f1_score
    thresholds = np.linspace(0.01, 0.90, 90)
    f1_scores = [f1_score(y_val, (y_val_proba >= t).astype(int), zero_division=0) for t in thresholds]
    best_threshold = float(thresholds[np.argmax(f1_scores)])
    log(f"Selected threshold: {best_threshold:.2f}")
    
    log("Evaluating on test set...")
    y_test_proba = calibrated_model.predict_proba(X_test_proc)[:, 1]
    metrics = evaluate_predictions(y_test, y_test_proba, best_threshold)
    
    log(f"V3 ROC-AUC: {metrics['roc_auc']:.4f}")
    log(f"V3 PR-AUC: {metrics['pr_auc']:.4f}")
    
    # Save V3 Artifacts
    log("Saving V3 artifacts...")
    joblib.dump(calibrated_model, artifacts_dir / "final_creditai_model_v3.pkl")
    joblib.dump(preprocessor, artifacts_dir / "creditai_preprocessor_v3.pkl")
    joblib.dump(v3_features, artifacts_dir / "creditai_features_v3.pkl")
    
    metadata = {
        "metrics": metrics,
        "best_threshold": best_threshold,
        "features": v3_features
    }
    with open(artifacts_dir / "creditai_metadata_v3.json", "w") as f:
        json.dump(metadata, f, indent=2)

    # Perform behavioral profiling
    # We will use the calculate_score from previous scripts
    BASE_SCORE = 650
    PDO = 50
    BASE_PD = 0.080722
    BASE_ODDS = (1 - BASE_PD) / BASE_PD
    FACTOR = PDO / np.log(2)

    def calculate_score(pd_values):
        pd_safe = np.clip(pd_values, 1e-9, 1.0 - 1e-9)
        odds = (1 - pd_safe) / pd_safe
        raw_score = BASE_SCORE + FACTOR * np.log(odds / BASE_ODDS)
        return int(np.round(np.clip(raw_score, 300, 900)))

    def eval_profile(d):
        annual = d['income_monthly'] * 12.0
        d['loan_term_estimated_months'] = d['loan_credit_amount'] / d['loan_annuity_emi']
        d['credit_to_goods_ratio'] = d['loan_credit_amount'] / d.get('goods_price', d['loan_credit_amount'])
        d['payment_to_income_ratio'] = d['loan_annuity_emi'] / annual
        d['credit_to_income_ratio'] = d['loan_credit_amount'] / annual
        d['disposable_income_per_capita'] = (d['income_monthly'] - d['loan_annuity_emi']) / d['family_member_count']
        
        df_p = pd.DataFrame([d])[v3_features]
        df_p[bureau_fill_cols] = df_p[bureau_fill_cols].fillna(0.0)
        
        proc = preprocessor.transform(df_p)
        prob = calibrated_model.predict_proba(proc)[0][1]
        score = calculate_score(prob)
        return prob, score

    strong = {
        'age_years': 45, 'education_level': 'Higher education', 'family_member_count': 2, 'income_monthly': 200000, 
        'employment_years': 10, 'employment_anomaly_flag': 0, 'income_type': 'Working', 'loan_credit_amount': 500000, 
        'loan_annuity_emi': 15000, 'goods_price': 500000,
        # V3
        'bureau_total_loans_count': 2, 'bureau_active_loans_count': 0, 'bureau_total_debt_sum': 0, 
        'bureau_utilization_ratio': 0.0, 'bureau_credit_history_length_years': 10, 'prev_app_refused_count': 0
    }
    moderate = {
        'age_years': 30, 'education_level': 'Secondary / secondary special', 'family_member_count': 3, 'income_monthly': 60000, 
        'employment_years': 3, 'employment_anomaly_flag': 0, 'income_type': 'Working', 'loan_credit_amount': 800000, 
        'loan_annuity_emi': 20000, 'goods_price': 800000,
        # V3
        'bureau_total_loans_count': 3, 'bureau_active_loans_count': 1, 'bureau_total_debt_sum': 50000, 
        'bureau_utilization_ratio': 0.5, 'bureau_credit_history_length_years': 4, 'prev_app_refused_count': 1
    }
    adverse = {
        'age_years': 29, 'education_level': 'Secondary / secondary special', 'family_member_count': 1, 'income_monthly': 10125, 
        'employment_years': 1.16, 'employment_anomaly_flag': 0, 'income_type': 'Working', 'loan_credit_amount': 474000, 
        'loan_annuity_emi': 32000, 'goods_price': 474000,
        # V3
        'bureau_total_loans_count': 5, 'bureau_active_loans_count': 4, 'bureau_total_debt_sum': 300000, 
        'bureau_utilization_ratio': 0.95, 'bureau_credit_history_length_years': 2, 'prev_app_refused_count': 3
    }

    log("Behavioral Predictions:")
    p_s, s_s = eval_profile(strong)
    p_m, s_m = eval_profile(moderate)
    p_a, s_a = eval_profile(adverse)
    log(f"Strong     -> PD: {p_s*100:5.2f}%, Score: {s_s}")
    log(f"Moderate   -> PD: {p_m*100:5.2f}%, Score: {s_m}")
    log(f"Adverse    -> PD: {p_a*100:5.2f}%, Score: {s_a}")

if __name__ == "__main__":
    main()
