"""
CreditAI Feature Engineering Pipeline (V1)
===========================================
Extracts, engineers, and aggregates features from Home Credit Default Risk tables:
- application_train.csv
- bureau.csv
- previous_application.csv
- installments_payments.csv

Ensures strict 1:1 mapping with SK_ID_CURR and outputs to data/processed/credit_features_train.csv.
"""

import os
import sys
import numpy as np
import pandas as pd
from pathlib import Path


def log(msg: str):
    print(f"[CreditAI Feature Pipeline] {msg}")


def build_feature_dataset():
    # Define paths
    base_dir = Path(__file__).resolve().parent.parent
    raw_data_dir = base_dir / "data" / "home_credit"
    processed_dir = base_dir / "data" / "processed"
    processed_dir.mkdir(parents=True, exist_ok=True)

    app_train_path = raw_data_dir / "application_train.csv"
    bureau_path = raw_data_dir / "bureau.csv"
    prev_app_path = raw_data_dir / "previous_application.csv"
    installments_path = raw_data_dir / "installments_payments.csv"

    output_path = processed_dir / "credit_features_train.csv"

    log("Step 1/5: Loading and processing application_train.csv...")
    app_df = pd.read_csv(app_train_path)
    initial_rows = len(app_df)
    log(f"Loaded {initial_rows:,} rows from application_train.csv.")

    # -------------------------------------------------------------
    # 1. APPLICATION / PERSONAL FEATURES
    # -------------------------------------------------------------
    # 1. age_years
    app_df["age_years"] = np.abs(app_df["DAYS_BIRTH"]) / 365.25

    # 2. education_level (kept as categorical string)
    app_df["education_level"] = app_df["NAME_EDUCATION_TYPE"].astype(str)

    # 3. family_member_count (impute missing with CNT_CHILDREN + 1)
    app_df["family_member_count"] = app_df["CNT_FAM_MEMBERS"].fillna(app_df["CNT_CHILDREN"] + 1)

    # -------------------------------------------------------------
    # 2. INCOME / EMPLOYMENT FEATURES
    # -------------------------------------------------------------
    # 4. income_monthly
    app_df["income_monthly"] = app_df["AMT_INCOME_TOTAL"] / 12.0

    # 5. employment_years (handling anomaly 365243 as 0.0 with flag)
    is_employed_anom = (app_df["DAYS_EMPLOYED"] == 365243)
    app_df["employment_years"] = np.where(
        is_employed_anom,
        0.0,
        np.abs(app_df["DAYS_EMPLOYED"]) / 365.25
    )

    # 6. employment_anomaly_flag
    app_df["employment_anomaly_flag"] = is_employed_anom.astype(int)

    # 7. income_type
    app_df["income_type"] = app_df["NAME_INCOME_TYPE"].astype(str)

    # -------------------------------------------------------------
    # 3. CURRENT LOAN FEATURES
    # -------------------------------------------------------------
    # 8. loan_credit_amount
    app_df["loan_credit_amount"] = app_df["AMT_CREDIT"]

    # 9. loan_annuity_emi
    app_df["loan_annuity_emi"] = app_df["AMT_ANNUITY"]

    # 10. loan_term_estimated_months
    app_df["loan_term_estimated_months"] = np.where(
        app_df["AMT_ANNUITY"] > 0,
        app_df["AMT_CREDIT"] / app_df["AMT_ANNUITY"],
        np.nan
    )

    # 11. credit_to_goods_ratio
    app_df["credit_to_goods_ratio"] = np.where(
        app_df["AMT_GOODS_PRICE"] > 0,
        app_df["AMT_CREDIT"] / app_df["AMT_GOODS_PRICE"],
        np.nan
    )

    # -------------------------------------------------------------
    # 4. FINANCIAL BURDEN FEATURES
    # -------------------------------------------------------------
    # 12. payment_to_income_ratio (AMT_ANNUITY / AMT_INCOME_TOTAL)
    app_df["payment_to_income_ratio"] = np.where(
        app_df["AMT_INCOME_TOTAL"] > 0,
        app_df["AMT_ANNUITY"] / app_df["AMT_INCOME_TOTAL"],
        np.nan
    )

    # 13. credit_to_income_ratio (AMT_CREDIT / AMT_INCOME_TOTAL)
    app_df["credit_to_income_ratio"] = np.where(
        app_df["AMT_INCOME_TOTAL"] > 0,
        app_df["AMT_CREDIT"] / app_df["AMT_INCOME_TOTAL"],
        np.nan
    )

    # 14. disposable_income_per_capita
    annual_annuity = app_df["AMT_ANNUITY"] * 12.0
    app_df["disposable_income_per_capita"] = np.where(
        app_df["family_member_count"] > 0,
        (app_df["AMT_INCOME_TOTAL"] - annual_annuity) / (12.0 * app_df["family_member_count"]),
        np.nan
    )

    # -------------------------------------------------------------
    # 5. EXTERNAL INDICATORS
    # -------------------------------------------------------------
    ext_cols = ["EXT_SOURCE_1", "EXT_SOURCE_2", "EXT_SOURCE_3"]
    # 15. ext_source_mean (row-wise mean of available anonymous external scores)
    app_df["ext_source_mean"] = app_df[ext_cols].mean(axis=1)

    # 16. ext_sources_available_count
    app_df["ext_sources_available_count"] = app_df[ext_cols].notnull().sum(axis=1)

    # -------------------------------------------------------------
    # 6. RECENT CREDIT ACTIVITY
    # -------------------------------------------------------------
    # 17. bureau_inquiries_last_month
    app_df["bureau_inquiries_last_month"] = app_df["AMT_REQ_CREDIT_BUREAU_MON"].fillna(0)

    # 18. days_since_last_phone_change
    app_df["days_since_last_phone_change"] = np.abs(app_df["DAYS_LAST_PHONE_CHANGE"])

    # -------------------------------------------------------------
    # Step 2/5: Aggregate Bureau Data
    # -------------------------------------------------------------
    log("Step 2/5: Aggregating bureau.csv...")
    bureau_df = pd.read_csv(bureau_path)
    
    bureau_agg = bureau_df.groupby("SK_ID_CURR").agg(
        bureau_total_loans_count=("SK_ID_BUREAU", "count"),
        bureau_active_loans_count=("CREDIT_ACTIVE", lambda s: (s == "Active").sum()),
        bureau_total_debt_sum=("AMT_CREDIT_SUM_DEBT", lambda s: np.maximum(0, s.fillna(0).sum())),
        total_credit_sum=("AMT_CREDIT_SUM", lambda s: np.maximum(0, s.fillna(0).sum())),
        bureau_max_days_past_due=("CREDIT_DAY_OVERDUE", "max"),
        bureau_credit_history_length_years=("DAYS_CREDIT", lambda s: np.abs(s.min()) / 365.25 if len(s) > 0 else 0.0)
    ).reset_index()

    # 22. bureau_utilization_ratio
    bureau_agg["bureau_utilization_ratio"] = np.where(
        bureau_agg["total_credit_sum"] > 0,
        bureau_agg["bureau_total_debt_sum"] / bureau_agg["total_credit_sum"],
        0.0
    )
    bureau_agg.drop(columns=["total_credit_sum"], inplace=True)
    log(f"Aggregated bureau data for {len(bureau_agg):,} unique applicants.")

    # -------------------------------------------------------------
    # Step 3/5: Aggregate Previous Applications
    # -------------------------------------------------------------
    log("Step 3/5: Aggregating previous_application.csv...")
    prev_df = pd.read_csv(prev_app_path)

    prev_agg = prev_df.groupby("SK_ID_CURR").agg(
        prev_app_total_count=("SK_ID_PREV", "count"),
        prev_app_refused_count=("NAME_CONTRACT_STATUS", lambda s: (s == "Refused").sum())
    ).reset_index()

    # 27. prev_app_refusal_rate
    prev_agg["prev_app_refusal_rate"] = np.where(
        prev_agg["prev_app_total_count"] > 0,
        prev_agg["prev_app_refused_count"] / prev_agg["prev_app_total_count"],
        0.0
    )
    log(f"Aggregated previous applications for {len(prev_agg):,} unique applicants.")

    # -------------------------------------------------------------
    # Step 4/5: Aggregate Installment Payments
    # -------------------------------------------------------------
    log("Step 4/5: Aggregating installments_payments.csv...")
    inst_df = pd.read_csv(installments_path)

    # Calculate payment delay only where entry payment date is recorded
    valid_payment_mask = inst_df["DAYS_ENTRY_PAYMENT"].notnull()
    inst_df["delay_days"] = np.where(
        valid_payment_mask,
        inst_df["DAYS_ENTRY_PAYMENT"] - inst_df["DAYS_INSTALMENT"],
        np.nan
    )
    inst_df["is_late"] = np.where(
        valid_payment_mask,
        (inst_df["delay_days"] > 0).astype(int),
        0
    )
    inst_df["is_underpayment"] = np.where(
        inst_df["AMT_PAYMENT"].notnull(),
        ((inst_df["AMT_INSTALMENT"] - inst_df["AMT_PAYMENT"]) > 1.0).astype(int),
        0
    )

    inst_agg = inst_df.groupby("SK_ID_CURR").agg(
        installment_max_delay_days=("delay_days", "max"),
        installment_late_payment_count=("is_late", "sum"),
        installment_underpayment_count=("is_underpayment", "sum")
    ).reset_index()

    # Applicants with installment history but no positive delays default to 0 max delay if not NaN
    log(f"Aggregated installment payments for {len(inst_agg):,} unique applicants.")

    # -------------------------------------------------------------
    # Step 5/5: Merge all tables onto application_train
    # -------------------------------------------------------------
    log("Step 5/5: Performing 1:1 Left Joins onto application_train...")
    
    # Base columns to select
    base_features = [
        "SK_ID_CURR",
        "TARGET",
        "age_years",
        "education_level",
        "family_member_count",
        "income_monthly",
        "employment_years",
        "employment_anomaly_flag",
        "income_type",
        "loan_credit_amount",
        "loan_annuity_emi",
        "loan_term_estimated_months",
        "credit_to_goods_ratio",
        "payment_to_income_ratio",
        "credit_to_income_ratio",
        "disposable_income_per_capita",
        "ext_source_mean",
        "ext_sources_available_count",
        "bureau_inquiries_last_month",
        "days_since_last_phone_change"
    ]

    final_df = app_df[base_features].copy()

    # Merge Bureau
    final_df = final_df.merge(bureau_agg, on="SK_ID_CURR", how="left")
    bureau_fill_cols = [
        "bureau_total_loans_count",
        "bureau_active_loans_count",
        "bureau_total_debt_sum",
        "bureau_utilization_ratio",
        "bureau_max_days_past_due",
        "bureau_credit_history_length_years"
    ]
    final_df[bureau_fill_cols] = final_df[bureau_fill_cols].fillna(0)

    # Merge Previous Applications
    final_df = final_df.merge(prev_agg, on="SK_ID_CURR", how="left")
    prev_fill_cols = [
        "prev_app_total_count",
        "prev_app_refused_count",
        "prev_app_refusal_rate"
    ]
    final_df[prev_fill_cols] = final_df[prev_fill_cols].fillna(0)

    # Merge Installments
    final_df = final_df.merge(inst_agg, on="SK_ID_CURR", how="left")
    inst_fill_cols = [
        "installment_max_delay_days",
        "installment_late_payment_count",
        "installment_underpayment_count"
    ]
    final_df[inst_fill_cols] = final_df[inst_fill_cols].fillna(0)

    # Order columns consistently
    ordered_cols = [
        "SK_ID_CURR",
        # 1. Application / Personal
        "age_years",
        "education_level",
        "family_member_count",
        # 2. Income / Employment
        "income_monthly",
        "employment_years",
        "employment_anomaly_flag",
        "income_type",
        # 3. Current Loan
        "loan_credit_amount",
        "loan_annuity_emi",
        "loan_term_estimated_months",
        "credit_to_goods_ratio",
        # 4. Financial Burden
        "payment_to_income_ratio",
        "credit_to_income_ratio",
        "disposable_income_per_capita",
        # 5. External Indicators
        "ext_source_mean",
        "ext_sources_available_count",
        # 6. Recent Credit Activity
        "bureau_inquiries_last_month",
        "days_since_last_phone_change",
        # 7. Bureau History
        "bureau_total_loans_count",
        "bureau_active_loans_count",
        "bureau_total_debt_sum",
        "bureau_utilization_ratio",
        "bureau_max_days_past_due",
        "bureau_credit_history_length_years",
        # 8. Previous Applications
        "prev_app_total_count",
        "prev_app_refused_count",
        "prev_app_refusal_rate",
        # 9. Payment History
        "installment_max_delay_days",
        "installment_late_payment_count",
        "installment_underpayment_count",
        # Target
        "TARGET"
    ]

    final_df = final_df[ordered_cols]

    # Validation assertions
    assert len(final_df) == 307511, f"Row count mismatch! Expected 307,511, got {len(final_df)}"
    assert final_df["SK_ID_CURR"].nunique() == 307511, "Duplicate SK_ID_CURR detected!"
    assert "TARGET" in final_df.columns, "TARGET column missing!"
    assert len(final_df.columns) == 32, f"Expected 32 columns (SK_ID_CURR + 30 features + TARGET), got {len(final_df.columns)}"

    log(f"Saving feature matrix to {output_path}...")
    final_df.to_csv(output_path, index=False)
    log("Feature engineering pipeline completed successfully!")

    return final_df


if __name__ == "__main__":
    build_feature_dataset()
