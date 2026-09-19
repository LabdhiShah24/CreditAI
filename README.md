# CreditAI

CreditAI is a Django-based AI credit-risk assessment application that uses a machine-learning model to estimate the probability of the modeled payment-difficulty outcome. Designed as an end-to-end full-stack portfolio project, it processes applicant data through a robust ML pipeline and produces a transparent "CreditAI Risk Score" (300-900 scale) alongside mathematically derived SHAP explanation factors. 

> [!IMPORTANT]
> **Disclaimer:** CreditAI is an educational/portfolio project implementation. Its outputs should not be treated as an official credit-bureau score, lending decision, or financial advice.

---

## Features

- **User Authentication:** Secure user registration, login, and logout flow.
- **Credit Assessment Engine:** Comprehensive applicant financial information form processing.
- **V1 Machine Learning Prediction:** End-to-end integration of a pre-trained `HistGradientBoostingClassifier`.
- **Calibrated Probability Estimation:** Generates a rigorously calibrated payment-difficulty probability using Platt scaling.
- **CreditAI Risk Score:** Transforms raw probability into a user-friendly presentation scale (300–900).
- **Risk Bands:** Categorizes users into distinct risk bands based on their scores.
- **SHAP-based Explainability:** Identifies and displays the top model-associated risk-increasing and risk-reducing factors for each applicant.
- **Interactive Dashboard:** Aggregates and displays the latest predictions and metrics for the logged-in user.
- **Assessment History:** Allows users to track their historical assessments with a dedicated "View Details" drill-down.
- **Database Persistence:** Stores all inputs, ML outputs, and explainability payloads in an isolated, secure SQLite database.

---

## How It Works

The application operates on a seamless data pipeline conceptually flowing from user input to ML inference and database persistence:

1. **Login**
2. ↓ **Dashboard**
3. ↓ **Credit Analysis Form**
4. ↓ **Validated Applicant Inputs**
5. ↓ **V1 Feature Construction**
6. ↓ **30 Raw V1 Features**
7. ↓ **Preprocessing** (Handling missing values, scaling, one-hot encoding)
8. ↓ **HistGradientBoosting Model**
9. ↓ **Calibrated Probability** (Platt Scaling)
10. ↓ **CreditAI Risk Score** (Linear scaling to 300-900)
11. ↓ **Risk Band + SHAP Explanation**
12. ↓ **Database Persistence**
13. ↓ **Dashboard / Assessment History Detail View**

---

## Machine Learning

The V1 CreditAI predictive engine is trained offline using the publicly available **Home Credit Default Risk** dataset.

- The model predicts the dataset's explicitly modeled payment-difficulty target.
- **This model is NOT a CIBIL, FICO, or official bureau score model.**
- The pipeline utilizes **30 raw modeling features**, which expand into **41 processed features** after preprocessing (e.g., via One-Hot Encoding).
- Historical and bureau features are aggregated at the applicant level where applicable during offline training.
- Because the web application workflow accepts applicant-only inputs, missing historical/bureau information is handled natively by the trained preprocessing and median-imputation pipeline.

### Model Performance

Evaluation results on the Home Credit dataset:
- **Validation ROC-AUC:** 0.7617
- **Validation PR-AUC:** 0.2465
- **Validation Brier Score:** 0.0679
- **Test ROC-AUC:** 0.7649
- **Test PR-AUC:** 0.2516
- **Test Brier Score:** 0.0676

*Note: These evaluation metrics represent performance on the historical Home Credit dataset and do not represent real-world performance on live Indian credit applicants or active production environments.*

---

## CreditAI Risk Score

The CreditAI Risk Score is a model-derived presentation layer built on top of the calibrated payment-difficulty probability.

- **Score Range:** 300–900
- **Base Score:** 650
- **PDO (Points to Double Odds):** 50
- **Base PD (Probability of Default):** 8.0722%

**CreditAI Risk Score is an internal model-derived score and is strictly not a CIBIL, FICO, or other bureau credit score.**

---

## Explainable AI (XAI)

CreditAI leverages **SHAP (SHapley Additive exPlanations)** to identify the strongest risk-increasing and risk-reducing factors for an individual assessment. 

These factors are aggregated from the processed feature space back to human-readable applicant inputs. **These are model-derived mathematical explanations and feature associations, not strictly causal conclusions.**

---

## Application Architecture

- **Django Backend:** Handles routing, authentication, forms, and database ORM operations (`accounts` application).
- **Frontend UI:** Standard Django HTML templates styling with pure CSS.
- **Database:** SQLite development database.
- **ML Engine:** Custom Python modules (`creditai_score.py`, `creditai_explain.py`) executing pre-trained `scikit-learn` artifacts loaded securely via `joblib`.

### Project Structure

```text
CreditAI/
├── accounts/
├── CreditAI/
├── ml/
│   ├── artifacts/
│   │   ├── creditai_features.pkl
│   │   ├── creditai_metadata.json
│   │   ├── creditai_preprocessor.pkl
│   │   └── final_creditai_model.pkl
│   ├── build_features.py
│   ├── train_creditai_model.py
│   ├── creditai_score.py
│   └── creditai_explain.py
├── static/
├── templates/
├── manage.py
├── requirements.txt
└── .gitignore
```

---

## Installation

These instructions are tailored for Windows environments.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/LabdhiShah24/CreditAI.git
   cd CreditAI
   ```

2. **Set up the virtual environment:**
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

6. **Access the application:**
   Open a web browser and navigate to `http://127.0.0.1:8000`.

*(Note: Raw historical datasets are ignored via `.gitignore` and are not required to run the web application).*

---

## Usage

1. **Register/Login:** Create a secure account or log in.
2. **Dashboard:** View your high-level credit summary.
3. **Credit Analysis:** Navigate to the analysis form and enter your financial/demographic information.
4. **Prediction:** Submit the form to run the V1 ML model.
5. **Review Results:** Instantly view your CreditAI Score, Calibrated Probability, Risk Band, and localized SHAP factors.
6. **History:** Navigate to the Assessment History page to track and review all previous predictions securely.

---

## Repository & Data Handling

To ensure security and optimize repository size:
- **Raw datasets and local development files** are explicitly excluded from GitHub via `.gitignore`.
- Massive legacy `.pkl` models have been purged from the repository.
- There are no hardcoded secrets, credentials, or sensitive database states exposed.

---

## Limitations

When evaluating this project, please note the following technical and architectural limitations:
- **Training Data:** Current training data comes from the offline Home Credit dataset rather than live Indian bureau data.
- **No Live API:** No live CIBIL/bureau API integration exists.
- **Imputation:** Some historical/bureau information is intentionally unavailable in the simple applicant-only web workflow; this is handled automatically by the model's trained median imputation process.
- **Target Definition:** The modeled probability represents the specific payment-difficulty target defined by the training dataset.
- **Not a Bureau Score:** CreditAI Risk Score is not a bureau score.
- **Evaluation:** Model evaluation results on an offline competition dataset do not establish or guarantee real-world production performance.
- **Production Readiness:** Further external validation, temporal monitoring, fairness evaluation, calibration monitoring, security hardening, and appropriate financial/regulatory review would be strictly required for any real-world deployment.

---

## Future Improvements

Realistic future extensions for a V2 roadmap:
- Authorized live credit-bureau or external data provider integration.
- Training specifically on localized Indian financial datasets.
- Temporal and out-of-time external validation.
- Enhanced calibration monitoring and model drift detection.
- Fairness and subgroup bias evaluation.
- Cloud deployment infrastructure (Docker, AWS/GCP, PostgreSQL).
- Advanced production security, caching, and privacy controls.

---

## Technology Stack

- **Python** (Core language)
- **Django** (Web framework)
- **pandas** / **NumPy** (Data processing)
- **scikit-learn** (Machine learning pipelines)
- **SHAP** (Explainable AI)
- **joblib** (Artifact serialization)
- **SQLite** (Database)
- **HTML / CSS** (Frontend presentation)
