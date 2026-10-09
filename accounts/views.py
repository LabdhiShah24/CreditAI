import sys
import numpy as np
import pandas as pd
import joblib
import shap
from pathlib import Path

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
import os
import json

from .models import CreditApplication
from .forms import CreditApplicationForm, CustomUserCreationForm

BASE_DIR = Path(__file__).resolve().parent.parent

# Add BASE_DIR to sys.path to import ml modules safely
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

from ml.train_creditai_model import PlattCalibratedModel
from ml.creditai_score import calculate_score, get_risk_band
from ml.creditai_explain import FRIENDLY_NAMES

# Patch __main__ so pickle can find PlattCalibratedModel since it was pickled from __main__
import sys
sys.modules['__main__'].PlattCalibratedModel = PlattCalibratedModel

# Load ML artifacts
ARTIFACTS_DIR = BASE_DIR / "ml" / "artifacts"
calibrated_model = joblib.load(ARTIFACTS_DIR / "final_creditai_model.pkl")
preprocessor = joblib.load(ARTIFACTS_DIR / "creditai_preprocessor.pkl")
features = joblib.load(ARTIFACTS_DIR / "creditai_features.pkl")
explainer = shap.TreeExplainer(calibrated_model.base_estimator)


def home(request):
    return render(request, "home.html")


def register(request):
    if request.method == "POST":
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            return render(request, "register.html", {
                "form": CustomUserCreationForm(),
                "success": True
            })
    else:
        form = CustomUserCreationForm()
    return render(request, "register.html", {"form": form})


def user_login(request):
    if request.method == "POST":
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect("dashboard")
    else:
        form = AuthenticationForm()
    return render(request, "login.html", {"form": form})


def user_logout(request):
    logout(request)
    return redirect("home")


@login_required
def dashboard(request):
    apps = request.user.credit_applications.all().order_by('-created_at')
    latest_app = apps.first() if apps.exists() else None
    
    return render(request, "dashboard.html", {
        "applications": apps,
        "latest": latest_app
    })


@login_required
def history(request):
    assessments = request.user.credit_applications.all().order_by('-created_at')
    return render(request, "history.html", {"assessments": assessments})


@login_required
def assessment_detail(request, pk):
    assessment = get_object_or_404(CreditApplication, pk=pk, user=request.user)
    return render(request, "assessment_detail.html", {"application": assessment})


@login_required
def profile_view(request):
    latest_app = request.user.credit_applications.order_by('-created_at').first()
    return render(request, "profile.html", {"latest": latest_app})


@login_required
def ai_assistant_chat(request):
    if request.method == "POST":
        # Check for API Key
        # We simulate this checking process for the architectural stub
        if not os.environ.get('OPENAI_API_KEY') and not os.environ.get('GEMINI_API_KEY'):
            return JsonResponse({
                "response": "⚠️ **Configuration Required**: The AI Assistant provider API key is not currently configured on the server. Please contact the administrator to set `OPENAI_API_KEY` or `GEMINI_API_KEY` in the environment variables to activate live AI responses."
            })
            
        try:
            data = json.loads(request.body)
            message = data.get('message', '')
            
            # Context Gathering Architecture (Internal logic stub for when API is active)
            latest_app = request.user.credit_applications.order_by('-created_at').first()
            context = None
            if latest_app:
                context = {
                    "score": latest_app.creditai_score,
                    "risk_band": latest_app.risk_band,
                    "pd": latest_app.calibrated_pd
                }
            
            # The actual LLM call would go here using `message` and `context`
            
            return JsonResponse({"response": f"I received your message: '{message}'. To generate real answers based on your profile, please configure an LLM provider."})
            
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
            
    return render(request, "ai_assistant.html")


@login_required
def credit_form(request):
    if request.method == "POST":
        form = CreditApplicationForm(request.POST)
        
        if form.is_valid():
            data = form.cleaned_data
            
            # Derived features
            employment_anomaly_flag = 1 if data['employment_years'] == 0 else 0
            
            goods_price = data.get('goods_price') or data['loan_credit_amount']
            credit_to_goods_ratio = data['loan_credit_amount'] / goods_price if goods_price > 0 else np.nan
            
            loan_term = data['loan_credit_amount'] / data['loan_annuity_emi'] if data['loan_annuity_emi'] > 0 else np.nan
            payment_to_income_ratio = data['loan_annuity_emi'] / data['income_monthly'] if data['income_monthly'] > 0 else np.nan
            credit_to_income_ratio = data['loan_credit_amount'] / data['income_monthly'] if data['income_monthly'] > 0 else np.nan
            
            disposable = (data['income_monthly'] - data['loan_annuity_emi']) / data['family_member_count']
            
            # Construct feature dict mapping EXACTLY to features.pkl
            raw_input_dict = {
                "age_years": data['age_years'],
                "education_level": data['education_level'],
                "family_member_count": data['family_member_count'],
                "income_monthly": data['income_monthly'],
                "employment_years": data['employment_years'],
                "employment_anomaly_flag": employment_anomaly_flag,
                "income_type": data['income_type'],
                "loan_credit_amount": data['loan_credit_amount'],
                "loan_annuity_emi": data['loan_annuity_emi'],
                "loan_term_estimated_months": loan_term,
                "credit_to_goods_ratio": credit_to_goods_ratio,
                "payment_to_income_ratio": payment_to_income_ratio,
                "credit_to_income_ratio": credit_to_income_ratio,
                "disposable_income_per_capita": disposable,
                # All bureau/historical features as NaN to leverage preprocessor imputation
                "ext_source_mean": np.nan,
                "ext_sources_available_count": np.nan,
                "bureau_inquiries_last_month": np.nan,
                "days_since_last_phone_change": np.nan,
                "bureau_total_loans_count": np.nan,
                "bureau_active_loans_count": np.nan,
                "bureau_total_debt_sum": np.nan,
                "bureau_utilization_ratio": np.nan,
                "bureau_max_days_past_due": np.nan,
                "bureau_credit_history_length_years": np.nan,
                "prev_app_total_count": np.nan,
                "prev_app_refused_count": np.nan,
                "prev_app_refusal_rate": np.nan,
                "installment_max_delay_days": np.nan,
                "installment_late_payment_count": np.nan,
                "installment_underpayment_count": np.nan,
            }
            
            input_df = pd.DataFrame([raw_input_dict])[features]
            input_proc = preprocessor.transform(input_df)
            
            # Prediction and Score
            prob = calibrated_model.predict_proba(input_proc)[0][1]
            score = calculate_score(prob)
            risk_band = get_risk_band(score)
            
            # SHAP
            shap_values_obj = explainer(input_proc)
            if hasattr(shap_values_obj, 'values'):
                shap_values = shap_values_obj.values[0]
            else:
                shap_values = shap_values_obj[0]
                
            if len(shap_values.shape) > 1:
                if shap_values.shape[1] == 2:
                    shap_values = shap_values[:, 1]
                elif shap_values.shape[0] == 2:
                    shap_values = shap_values[1, :]
            
            # Aggregation logic
            income_col = ["income_monthly"]
            categorical_cols = ["education_level", "income_type"]
            numerical_cols = [c for c in features if c not in categorical_cols and c != "income_monthly"]
            cat_encoder = preprocessor.named_transformers_["cat"].named_steps["onehot"]
            cat_feature_names_out = list(cat_encoder.get_feature_names_out(categorical_cols))
            
            aggregated_shap = {}
            aggregated_shap["income_monthly"] = shap_values[0]
            
            for i, col in enumerate(numerical_cols):
                aggregated_shap[col] = shap_values[i + 1]
                
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
                
            sorted_features = sorted(aggregated_shap.items(), key=lambda x: abs(x[1]), reverse=True)
            
            risk_increasing = []
            risk_reducing = []
            
            for f, sv in sorted_features:
                val = raw_input_dict[f]
                if pd.isna(val):
                    display_val = 'Not Provided (Imputed)'
                elif isinstance(val, str):
                    display_val = val
                else:
                    display_val = round(float(val), 2)
                    
                if sv > 0 and len(risk_increasing) < 3:
                    risk_increasing.append({
                        "name": FRIENDLY_NAMES.get(f, f), 
                        "value": display_val,
                        "impact": "Score Decreaser"
                    })
                elif sv < 0 and len(risk_reducing) < 3:
                    risk_reducing.append({
                        "name": FRIENDLY_NAMES.get(f, f), 
                        "value": display_val, 
                        "impact": "Score Increaser"
                    })
            
            explanations = {
                "risk_increasing": risk_increasing,
                "risk_reducing": risk_reducing
            }
            
            # Save to database
            application = CreditApplication.objects.create(
                user=request.user,
                age_years=data['age_years'],
                education_level=data['education_level'],
                family_member_count=data['family_member_count'],
                employment_years=data['employment_years'],
                income_type=data['income_type'],
                income_monthly=data['income_monthly'],
                loan_credit_amount=data['loan_credit_amount'],
                loan_annuity_emi=data['loan_annuity_emi'],
                goods_price=data.get('goods_price'),
                calibrated_pd=round(prob * 100, 2),
                creditai_score=score,
                risk_band=risk_band,
                shap_explanations=explanations
            )
            
            return render(request, "credit_form.html", {
                "form": form,
                "submitted": True,
                "application": application
            })
            
    else:
        form = CreditApplicationForm()

    return render(request, "credit_form.html", {"form": form})