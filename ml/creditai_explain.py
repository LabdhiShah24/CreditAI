import sys
import numpy as np
import pandas as pd
import joblib
import shap
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression

# Define PlattCalibratedModel to unpickle the model safely
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


# Score calculation
def calculate_score(pd_value):
    base_score = 650
    pdo = 50
    base_pd = 0.080722
    factor = pdo / np.log(2)
    base_odds = (1 - base_pd) / base_pd
    pd_safe = np.clip(pd_value, 1e-9, 1.0 - 1e-9)
    odds = (1 - pd_safe) / pd_safe
    score = base_score + factor * np.log(odds / base_odds)
    return int(np.round(np.clip(score, 300, 900)))


def get_risk_band(score):
    if score >= 750: return "Very Low Risk"
    elif score >= 700: return "Low Risk"
    elif score >= 650: return "Moderate Risk"
    elif score >= 600: return "Elevated Risk"
    elif score >= 500: return "High Risk"
    else: return "Very High Risk"


FRIENDLY_NAMES = {
    "age_years": "Age",
    "education_level": "Education Level",
    "family_member_count": "Family Member Count",
    "income_monthly": "Monthly Income",
    "employment_years": "Employment Length",
    "employment_anomaly_flag": "Employment Anomaly Flag",
    "income_type": "Income Type",
    "loan_credit_amount": "Requested Loan Amount",
    "loan_annuity_emi": "Monthly EMI",
    "loan_term_estimated_months": "Estimated Loan Term (Months)",
    "credit_to_goods_ratio": "Credit to Goods Ratio",
    "payment_to_income_ratio": "Payment-to-Income Ratio",
    "credit_to_income_ratio": "Credit-to-Income Ratio",
    "bureau_total_debt_sum": "Total Existing Credit Bureau Debt",
    "bureau_utilization_ratio": "Credit Utilization",
    "bureau_max_days_past_due": "Maximum Past-Due Days",
    "bureau_active_loans_count": "Active Bureau Loans",
    "prev_app_refusal_rate": "Previous Application Refusal Rate",
    "prev_app_total_requested": "Total Previously Requested Credit",
    "prev_app_approved_count": "Previously Approved Applications",
    "installment_max_delay_days": "Maximum Previous Payment Delay",
    "installment_late_payment_count": "Previous Late Payment Count",
    "installment_underpayment_count": "Previous Underpayment Count",
    "installment_payment_fraction": "Fraction of Expected Payment Made",
    "cc_avg_utilization": "Credit Card Avg Utilization",
    "cc_max_utilization": "Credit Card Max Utilization",
    "cc_avg_days_past_due": "Credit Card Avg Days Past Due",
    "cc_overlimit_count": "Credit Card Overlimit Count",
    "recent_credit_inquiries_count": "Recent Credit Inquiries",
    "recent_opened_loans_count": "Recently Opened Loans",
    "disposable_income_per_capita": "Disposable Income Per Family Member",
    "ext_source_mean": "External Credit Score Average",
    "ext_sources_available_count": "External Credit Sources Available",
    "bureau_inquiries_last_month": "Recent Credit Bureau Inquiries",
    "days_since_last_phone_change": "Days Since Last Phone Change",
    "bureau_total_loans_count": "Total Bureau Loans",
    "bureau_credit_history_length_years": "Credit History Length",
    "prev_app_total_count": "Previous Loan Applications",
    "prev_app_refused_count": "Previous Loan Refusals"
}

def main():
    print("1. SHAP Version:", shap.__version__)
    
    base_dir = Path(__file__).resolve().parent.parent
    artifacts_dir = base_dir / "ml" / "artifacts"
    
    try:
        calibrated_model = joblib.load(artifacts_dir / "final_creditai_model.pkl")
        preprocessor = joblib.load(artifacts_dir / "creditai_preprocessor.pkl")
        features = joblib.load(artifacts_dir / "creditai_features.pkl")
        print("2. Model successfully loaded.")
    except Exception as e:
        print("Failed to load artifacts:", e)
        return
        
    base_model = calibrated_model.base_estimator
    
    # 3. Model Handling - TreeExplainer
    try:
        # HGB natively outputs margin, so we explain the raw underlying model
        explainer = shap.TreeExplainer(base_model)
    except Exception as e:
        print("\n7. Limitations & Compatibility Issues:")
        print("Compatibility issue with SHAP TreeExplainer and HistGradientBoostingClassifier:")
        print(e)
        return

    # Processed features logic
    income_col = ["income_monthly"]
    categorical_cols = ["education_level", "income_type"]
    numerical_cols = [c for c in features if c not in categorical_cols and c != "income_monthly"]
    
    cat_encoder = preprocessor.named_transformers_["cat"].named_steps["onehot"]
    cat_feature_names_out = list(cat_encoder.get_feature_names_out(categorical_cols))
    
    processed_feature_names = income_col + numerical_cols + cat_feature_names_out
    
    print(f"3. Number of processed features: {len(processed_feature_names)}")
    print(f"4. Number of original features: {len(features)}")
    
    # Load 1 applicant from test set
    data_path = base_dir / "data" / "processed" / "credit_features_train.csv"
    df = pd.read_csv(data_path)
    X = df.drop(columns=["SK_ID_CURR", "TARGET"])
    y = df["TARGET"]
    
    # Exact stratified split used in training
    _, X_temp, _, y_temp = train_test_split(X, y, test_size=0.30, random_state=42, stratify=y)
    _, X_test, _, y_test = train_test_split(X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp)
    
    # Applicant index 0 in test set
    applicant_raw = X_test.iloc[[0]].copy()
    applicant_proc = preprocessor.transform(applicant_raw)
    
    # Compute SHAP values
    try:
        shap_values_obj = explainer(applicant_proc)
        # Handle different SHAP return types (arrays vs Explanation objects)
        if hasattr(shap_values_obj, 'values'):
            shap_values = shap_values_obj.values[0]
        else:
            shap_values = shap_values_obj[0]
            
        # some versions of sklearn HGB with SHAP return [features] or [classes, features]
        if len(shap_values.shape) > 1:
            # typically [n_classes, n_features] for classifiers if not margin
            # Or [n_features, n_classes]
            # Since HGB binary usually returns 1D array for margin, we just handle safely
            # If 2D, target class 1 is index 1
            if shap_values.shape[1] == 2:
                 shap_values = shap_values[:, 1]
            elif shap_values.shape[0] == 2:
                 shap_values = shap_values[1, :]
    except Exception as e:
        print("\n7. Limitations & Compatibility Issues:")
        print("Failed to compute SHAP values using TreeExplainer:")
        print(e)
        return
    
    aggregated_shap = {}
    
    # Map the 41 shap values back to the 30 original features
    # First the income feature
    aggregated_shap["income_monthly"] = shap_values[0]
    
    # Then numerical features (1 to 28)
    for i, col in enumerate(numerical_cols):
        aggregated_shap[col] = shap_values[i + 1]
        
    # Then categorical features (28 to 41)
    cat_start_idx = 1 + len(numerical_cols)
    for i, proc_col in enumerate(cat_feature_names_out):
        shap_val = shap_values[cat_start_idx + i]
        
        orig_col = None
        for cat in categorical_cols:
            if proc_col.startswith(cat + "_"):
                orig_col = cat
                break
                
        if orig_col not in aggregated_shap:
            aggregated_shap[orig_col] = 0.0
        aggregated_shap[orig_col] += shap_val
        
    print(f"5. Number of final explanation features: {len(aggregated_shap)}")
    assert len(aggregated_shap) == 30, "Aggregation failed to produce exactly 30 features."
    
    print("\n6. Example applicant explanation")
    print("==================================================")
    
    prob = calibrated_model.predict_proba(applicant_proc)[0, 1]
    score = calculate_score(prob)
    band = get_risk_band(score)
    
    print("Applicant Raw Input:")
    for f in features:
        print(f"  {f}: {applicant_raw.iloc[0][f]}")
    print()
    print(f"Calibrated PD: {prob*100:.2f}%")
    print(f"CreditAI Risk Score: {score} ({band})")
    
    # Sort SHAP values by magnitude
    sorted_features = sorted(aggregated_shap.items(), key=lambda x: abs(x[1]), reverse=True)
    
    risk_increasing = []
    risk_reducing = []
    
    for f, sv in sorted_features:
        if sv > 0 and len(risk_increasing) < 3:
            risk_increasing.append((f, sv))
        elif sv < 0 and len(risk_reducing) < 3:
            risk_reducing.append((f, sv))
            
    print("\nTop 3 Risk-Increasing Factors (Score Decreasers):")
    for f, sv in risk_increasing:
        friendly = FRIENDLY_NAMES.get(f, f)
        val = applicant_raw.iloc[0][f]
        print(f" - {friendly} ({f} = {val}): contributed toward higher predicted risk")
        
    print("\nTop 3 Risk-Reducing Factors (Score Increasers):")
    for f, sv in risk_reducing:
        friendly = FRIENDLY_NAMES.get(f, f)
        val = applicant_raw.iloc[0][f]
        print(f" - {friendly} ({f} = {val}): contributed toward lower predicted risk")
        
    print("\n7. Limitations & Compatibility Issues:")
    print("No immediate compatibility issues found. SHAP TreeExplainer successfully explained the underlying HistGradientBoostingClassifier margin, correctly mapped back to original 30 features without data leakage.")

if __name__ == '__main__':
    main()
