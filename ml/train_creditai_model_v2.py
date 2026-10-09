import os
import sys
import django
import numpy as np
import pandas as pd
import joblib
from pathlib import Path

# Setup Paths
base_dir = Path(os.getcwd())
sys.path.append(str(base_dir))

# Add platt calibrator to global scope for unpickling
from ml.train_creditai_model_v2 import PlattCalibratedModelV2
import __main__
__main__.PlattCalibratedModelV2 = PlattCalibratedModelV2

# Define scoring
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

def get_risk_band(score):
    if score >= 750: return "Very Low Risk"
    elif score >= 700: return "Low Risk"
    elif score >= 650: return "Moderate Risk"
    elif score >= 600: return "Elevated Risk"
    elif score >= 500: return "High Risk"
    else: return "Very High Risk"

artifacts_dir = base_dir / 'ml' / 'artifacts'

# Load V2 artifacts
preprocessor = joblib.load(artifacts_dir / 'creditai_preprocessor_v2.pkl')
calibrated_model = joblib.load(artifacts_dir / 'final_creditai_model_v2.pkl')
features = joblib.load(artifacts_dir / 'creditai_features_v2.pkl')

def predict(data):
    goods_price = data.get('goods_price') or data['loan_credit_amount']
    credit_to_goods_ratio = data['loan_credit_amount'] / goods_price if goods_price > 0 else np.nan
    loan_term = data['loan_credit_amount'] / data['loan_annuity_emi'] if data['loan_annuity_emi'] > 0 else np.nan
    
    annual_income = data['income_monthly'] * 12.0
    payment_to_income_ratio = data['loan_annuity_emi'] / annual_income if annual_income > 0 else np.nan
    credit_to_income_ratio = data['loan_credit_amount'] / annual_income if annual_income > 0 else np.nan
    disposable = (data['income_monthly'] - data['loan_annuity_emi']) / data['family_member_count']
    
    raw_input = {
        'age_years': data['age_years'],
        'education_level': data['education_level'],
        'family_member_count': data['family_member_count'],
        'income_monthly': data['income_monthly'],
        'employment_years': data['employment_years'],
        'employment_anomaly_flag': 1 if data['income_type'] == 'Pensioner' else 0,
        'income_type': data['income_type'],
        'loan_credit_amount': data['loan_credit_amount'],
        'loan_annuity_emi': data['loan_annuity_emi'],
        'loan_term_estimated_months': loan_term,
        'credit_to_goods_ratio': credit_to_goods_ratio,
        'payment_to_income_ratio': payment_to_income_ratio,
        'credit_to_income_ratio': credit_to_income_ratio,
        'disposable_income_per_capita': disposable,
    }
    
    input_df = pd.DataFrame([raw_input])[features]
    input_proc = preprocessor.transform(input_df)
    prob = calibrated_model.predict_proba(input_proc)[0][1]
    score = calculate_score(prob)
    band = get_risk_band(score)
    return prob, score, band

strong = {
    'age_years': 45, 
    'education_level': 'Higher education', 
    'family_member_count': 2, 
    'income_monthly': 200000, 
    'employment_years': 10, 
    'income_type': 'Working', 
    'loan_credit_amount': 500000, 
    'loan_annuity_emi': 15000
}

moderate = {
    'age_years': 30, 
    'education_level': 'Secondary / secondary special', 
    'family_member_count': 3, 
    'income_monthly': 60000, 
    'employment_years': 3, 
    'income_type': 'Working', 
    'loan_credit_amount': 800000, 
    'loan_annuity_emi': 20000
}

adverse = {
    'age_years': 29, 
    'education_level': 'Secondary / secondary special', 
    'family_member_count': 1, 
    'income_monthly': 10125, 
    'employment_years': 1.16, 
    'income_type': 'Working', 
    'loan_credit_amount': 474048, 
    'loan_annuity_emi': 32067
}

p1, s1, b1 = predict(strong)
p2, s2, b2 = predict(moderate)
p3, s3, b3 = predict(adverse)

print(f"Strong Profile: PD={p1*100:5.2f}%, Score={s1:3d}, Band={b1}")
print(f"Moderate Profl: PD={p2*100:5.2f}%, Score={s2:3d}, Band={b2}")
print(f"Adverse Profil: PD={p3*100:5.2f}%, Score={s3:3d}, Band={b3}")
