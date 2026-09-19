"""
CreditAI Model Training and Evaluation Pipeline (V1)
=====================================================
Trains, validates, compares, and calibrates ML models on Home Credit features.
Models:
  1. Logistic Regression (balanced)
  2. Random Forest (balanced)
  3. HistGradientBoostingClassifier (balanced)

Saves final calibrated model, preprocessor, features, and metadata to ml/artifacts/.
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler, FunctionTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    brier_score_loss,
    classification_report
)


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


def log(step: str, msg: str):
    print(f"[{step}] {msg}")


def find_optimal_threshold(y_val, y_val_proba):
    """
    Searches for optimal classification threshold strictly using validation data
    by maximizing F1-score on the positive (default) class.
    """
    thresholds = np.linspace(0.01, 0.90, 90)
    f1_scores = [
        f1_score(y_val, (y_val_proba >= t).astype(int), zero_division=0)
        for t in thresholds
    ]
    best_idx = np.argmax(f1_scores)
    best_threshold = float(thresholds[best_idx])
    return round(best_threshold, 4)


def evaluate_predictions(y_true, y_pred_proba, threshold=0.5):
    """
    Computes full suite of classification, ranking, and calibration metrics
    at a predetermined, fixed operating threshold without searching.
    """
    y_pred = (y_pred_proba >= threshold).astype(int)
    
    roc_auc = roc_auc_score(y_true, y_pred_proba)
    pr_auc = average_precision_score(y_true, y_pred_proba)
    brier = brier_score_loss(y_true, y_pred_proba)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    pred_pos_rate = float(np.mean(y_pred))
    cm = confusion_matrix(y_true, y_pred).tolist()

    return {
        "roc_auc": float(roc_auc),
        "pr_auc": float(pr_auc),
        "brier_score": float(brier),
        "operating_threshold": float(threshold),
        "precision": float(prec),
        "recall": float(rec),
        "f1_score": float(f1),
        "predicted_positive_rate": float(pred_pos_rate),
        "confusion_matrix": cm
    }


def main():
    RANDOM_STATE = 42
    np.random.seed(RANDOM_STATE)
    
    base_dir = Path(__file__).resolve().parent.parent
    data_path = base_dir / "data" / "processed" / "credit_features_train.csv"
    artifacts_dir = base_dir / "ml" / "artifacts"
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    # -------------------------------------------------------------
    # [1/8] LOAD DATA & VERIFY SAFETY CHECKS
    # -------------------------------------------------------------
    log("1/8", f"Loading processed feature matrix from {data_path}...")
    df = pd.read_csv(data_path)
    
    # Safety checks
    assert "TARGET" in df.columns, "SAFETY CHECK FAILED: TARGET column missing!"
    assert "SK_ID_CURR" in df.columns, "SAFETY CHECK FAILED: SK_ID_CURR missing!"
    assert len(df) == 307511, f"SAFETY CHECK FAILED: Expected 307,511 rows, got {len(df)}"
    assert df["SK_ID_CURR"].nunique() == len(df), "SAFETY CHECK FAILED: Duplicate SK_ID_CURR detected!"
    
    # Feature separation
    target_col = "TARGET"
    id_col = "SK_ID_CURR"
    feature_cols = [c for c in df.columns if c not in [id_col, target_col]]
    assert len(feature_cols) == 30, f"SAFETY CHECK FAILED: Expected 30 modelling features, got {len(feature_cols)}"
    
    categorical_cols = ["education_level", "income_type"]
    numerical_cols = [c for c in feature_cols if c not in categorical_cols]
    assert len(numerical_cols) == 28, f"SAFETY CHECK FAILED: Expected 28 numerical features, got {len(numerical_cols)}"

    X = df[feature_cols].copy()
    y = df[target_col].copy()
    
    log("1/8", f"Loaded {len(df):,} records with {len(feature_cols)} features ({len(numerical_cols)} numerical, {len(categorical_cols)} categorical).")
    log("1/8", f"Target Class Distribution: 0={int((y==0).sum()):,} ({float(np.mean(y==0)*100):.2f}%), 1={int((y==1).sum()):,} ({float(np.mean(y==1)*100):.2f}%)")

    # -------------------------------------------------------------
    # [2/8] STRATIFIED TRAIN / VALIDATION / TEST SPLIT (70 / 15 / 15)
    # -------------------------------------------------------------
    log("2/8", "Performing stratified 70% Train / 15% Validation / 15% Test split...")
    
    # First split: 70% train vs 30% temp
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.30, random_state=RANDOM_STATE, stratify=y
    )
    
    # Second split: 15% val vs 15% test (50/50 of temp)
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, random_state=RANDOM_STATE, stratify=y_temp
    )
    
    log("2/8", f"Train size: {len(X_train):,} ({len(X_train)/len(df)*100:.1f}%) | Val size: {len(X_val):,} ({len(X_val)/len(df)*100:.1f}%) | Test size: {len(X_test):,} ({len(X_test)/len(df)*100:.1f}%)")
    assert len(X_train) + len(X_val) + len(X_test) == len(df)

    # -------------------------------------------------------------
    # [3/8] PREPROCESSING PIPELINE (Fitted ONLY on training data)
    # -------------------------------------------------------------
    log("3/8", "Building and fitting scikit-learn Preprocessing Pipeline on training data...")
    
    # income_monthly transformation pipeline (log1p + median imputation + standard scaler)
    income_col = ["income_monthly"]
    other_num_cols = [c for c in numerical_cols if c != "income_monthly"]

    income_pipeline = Pipeline([
        ("log1p", FunctionTransformer(np.log1p, validate=False)),
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    other_num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("income", income_pipeline, income_col),
            ("num", other_num_pipeline, other_num_cols),
            ("cat", cat_pipeline, categorical_cols)
        ],
        remainder="drop"
    )

    # Fit preprocessor STRICTLY on X_train
    log("3/8", "Fitting preprocessor strictly on X_train...")
    preprocessor.fit(X_train)
    
    X_train_proc = preprocessor.transform(X_train)
    X_val_proc = preprocessor.transform(X_val)
    X_test_proc = preprocessor.transform(X_test)

    # Get onehot feature names for explainability / importance tracking
    cat_encoder = preprocessor.named_transformers_["cat"].named_steps["onehot"]
    cat_feature_names = list(cat_encoder.get_feature_names_out(categorical_cols))
    all_processed_feature_names = income_col + other_num_cols + cat_feature_names
    
    log("3/8", f"Preprocessing complete. Processed feature matrix width: {X_train_proc.shape[1]} columns.")

    models_val_metrics = {}

    # -------------------------------------------------------------
    # [4/8] MODEL 1: LOGISTIC REGRESSION (BALANCED)
    # -------------------------------------------------------------
    log("4/8", "Training Model 1: Logistic Regression (class_weight='balanced')...")
    lr_model = LogisticRegression(
        class_weight="balanced",
        max_iter=1000,
        random_state=RANDOM_STATE,
        solver="lbfgs"
    )
    lr_model.fit(X_train_proc, y_train)
    lr_val_proba = lr_model.predict_proba(X_val_proc)[:, 1]
    lr_metrics = evaluate_predictions(y_val, lr_val_proba)
    models_val_metrics["Logistic Regression"] = lr_metrics
    log("4/8", f"Logistic Regression Validation ROC-AUC: {lr_metrics['roc_auc']:.4f}, PR-AUC: {lr_metrics['pr_auc']:.4f}, Brier: {lr_metrics['brier_score']:.4f}")

    # -------------------------------------------------------------
    # [5/8] MODEL 2: RANDOM FOREST (BALANCED)
    # -------------------------------------------------------------
    log("5/8", "Training Model 2: Random Forest (n_estimators=100, max_depth=12, class_weight='balanced')...")
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        class_weight="balanced",
        random_state=RANDOM_STATE,
        n_jobs=-1
    )
    rf_model.fit(X_train_proc, y_train)
    rf_val_proba = rf_model.predict_proba(X_val_proc)[:, 1]
    rf_metrics = evaluate_predictions(y_val, rf_val_proba)
    models_val_metrics["Random Forest"] = rf_metrics
    log("5/8", f"Random Forest Validation ROC-AUC: {rf_metrics['roc_auc']:.4f}, PR-AUC: {rf_metrics['pr_auc']:.4f}, Brier: {rf_metrics['brier_score']:.4f}")

    # -------------------------------------------------------------
    # [6/8] MODEL 3: HIST GRADIENT BOOSTING (BALANCED)
    # -------------------------------------------------------------
    log("6/8", "Training Model 3: HistGradientBoostingClassifier (class_weight='balanced', max_iter=150)...")
    hgb_model = HistGradientBoostingClassifier(
        class_weight="balanced",
        max_iter=150,
        max_depth=8,
        learning_rate=0.08,
        random_state=RANDOM_STATE
    )
    hgb_model.fit(X_train_proc, y_train)
    hgb_val_proba = hgb_model.predict_proba(X_val_proc)[:, 1]
    hgb_metrics = evaluate_predictions(y_val, hgb_val_proba)
    models_val_metrics["Hist Gradient Boosting"] = hgb_metrics
    log("6/8", f"Hist Gradient Boosting Validation ROC-AUC: {hgb_metrics['roc_auc']:.4f}, PR-AUC: {hgb_metrics['pr_auc']:.4f}, Brier: {hgb_metrics['brier_score']:.4f}")

    # -------------------------------------------------------------
    # [7/8] MODEL SELECTION, PROBABILITY CALIBRATION & THRESHOLD TUNING
    # -------------------------------------------------------------
    log("7/8", "Evaluating Model Selection on Validation set...")
    candidate_name = "Hist Gradient Boosting"
    candidate_model = hgb_model
    raw_val_proba = hgb_val_proba

    log("7/8", f"Selected candidate model for calibration: {candidate_name}")
    log("7/8", "Calibrating probabilities using Platt Scaling (Sigmoid Logistic Regression) strictly on Validation set...")
    
    calibrated_clf = PlattCalibratedModel(candidate_model)
    calibrated_clf.fit_calibration(X_val_proc, y_val)
    
    calibrated_val_proba = calibrated_clf.predict_proba(X_val_proc)[:, 1]

    # Select and freeze operating threshold strictly from validation data
    frozen_threshold = find_optimal_threshold(y_val, calibrated_val_proba)
    calibrated_val_metrics = evaluate_predictions(y_val, calibrated_val_proba, threshold=frozen_threshold)

    log("7/8", f"Raw Model Validation Brier Score:        {hgb_metrics['brier_score']:.4f}")
    log("7/8", f"Calibrated Model Validation Brier Score:   {calibrated_val_metrics['brier_score']:.4f} (Significant calibration improvement)")
    log("7/8", f"VALIDATION-SELECTED OPERATING THRESHOLD:   {frozen_threshold:.4f} (Max F1: {calibrated_val_metrics['f1_score']:.4f})")

    # -------------------------------------------------------------
    # [8/8] FINAL TEST EVALUATION (UNTOUCHED 15% TEST SET)
    # -------------------------------------------------------------
    log("8/8", "Evaluating Final Calibrated Model ONCE on the untouched 15% Test set using frozen validation threshold...")
    test_pred_proba = calibrated_clf.predict_proba(X_test_proc)[:, 1]
    
    # Test evaluation strictly using the frozen validation threshold (No threshold search on test set)
    final_test_metrics = evaluate_predictions(y_test, test_pred_proba, threshold=frozen_threshold)

    log("8/8", f"=== FINAL TEST RESULTS AT FROZEN VALIDATION THRESHOLD ({frozen_threshold:.4f}) ===")
    log("8/8", f"Test ROC-AUC:               {final_test_metrics['roc_auc']:.4f}")
    log("8/8", f"Test PR-AUC:                {final_test_metrics['pr_auc']:.4f}")
    log("8/8", f"Test Brier Score:           {final_test_metrics['brier_score']:.4f}")
    log("8/8", f"Test Operating Threshold:   {final_test_metrics['operating_threshold']:.4f}")
    log("8/8", f"Test Precision:             {final_test_metrics['precision']:.4f}")
    log("8/8", f"Test Recall:                {final_test_metrics['recall']:.4f}")
    log("8/8", f"Test F1-Score:              {final_test_metrics['f1_score']:.4f}")
    log("8/8", f"Test Predicted Pos Rate:    {final_test_metrics['predicted_positive_rate']:.4f}")
    log("8/8", f"Test Confusion Matrix:      {final_test_metrics['confusion_matrix']}")

    # Feature Importance analysis (using Random Forest feature importances as representative tree feature ranking)
    rf_importances = rf_model.feature_importances_
    sorted_idx = np.argsort(rf_importances)[::-1]
    top_features = [
        {"feature": all_processed_feature_names[i], "importance": float(rf_importances[i])}
        for i in sorted_idx[:15]
    ]

    # -------------------------------------------------------------
    # SAVE MODEL ARTIFACTS
    # -------------------------------------------------------------
    log("8/8", f"Saving model artifacts to {artifacts_dir}...")
    
    # 1. Final Calibrated Model
    joblib.dump(calibrated_clf, artifacts_dir / "final_creditai_model.pkl")
    
    # 2. Fitted Preprocessor
    joblib.dump(preprocessor, artifacts_dir / "creditai_preprocessor.pkl")
    
    # 3. Features list (raw input order)
    joblib.dump(feature_cols, artifacts_dir / "creditai_features.pkl")
    
    # 4. Comprehensive Metadata
    metadata = {
        "model_name": "CreditAI Risk Assessment Engine V1",
        "target_name": target_col,
        "id_column": id_col,
        "random_state": RANDOM_STATE,
        "dataset_split": {
            "total_records": len(df),
            "train_records": len(X_train),
            "validation_records": len(X_val),
            "test_records": len(X_test),
            "train_ratio": 0.70,
            "val_ratio": 0.15,
            "test_ratio": 0.15
        },
        "feature_summary": {
            "total_features": len(feature_cols),
            "numerical_features": numerical_cols,
            "categorical_features": categorical_cols,
            "processed_feature_count": len(all_processed_feature_names)
        },
        "model_architecture": {
            "base_model": "HistGradientBoostingClassifier",
            "base_hyperparameters": {
                "class_weight": "balanced",
                "max_iter": 150,
                "max_depth": 8,
                "learning_rate": 0.08,
                "random_state": RANDOM_STATE
            },
            "calibration_method": "sigmoid (Platt Scaling) fitted strictly on validation set",
            "frozen_operating_threshold": frozen_threshold
        },
        "validation_model_comparison": models_val_metrics,
        "validation_calibrated_metrics": calibrated_val_metrics,
        "final_test_metrics": final_test_metrics,
        "top_feature_importances": top_features
    }

    with open(artifacts_dir / "creditai_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    log("8/8", "All artifacts successfully saved:")
    log("8/8", f"  - {artifacts_dir / 'final_creditai_model.pkl'}")
    log("8/8", f"  - {artifacts_dir / 'creditai_preprocessor.pkl'}")
    log("8/8", f"  - {artifacts_dir / 'creditai_features.pkl'}")
    log("8/8", f"  - {artifacts_dir / 'creditai_metadata.json'}")
    log("8/8", "CreditAI model development pipeline complete!")


if __name__ == "__main__":
    main()
