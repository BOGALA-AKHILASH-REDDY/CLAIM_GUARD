import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from backend.app.config import settings

MODEL_FILE = os.path.join(os.path.dirname(__file__), "claim_risk_model.joblib")
ENCODERS_FILE = os.path.join(os.path.dirname(__file__), "label_encoders.joblib")

def train_and_save_model():
    csv_path = os.path.join(settings.DATA_DIR, "claim_validation_dataset.csv")
    if not os.path.exists(csv_path):
        print(f"Dataset not found at {csv_path}")
        return

    df = pd.read_csv(csv_path)

    # Prepare features
    features = []
    labels = []

    for _, row in df.iterrows():
        # Encode features
        pol_status = 1 if str(row.get("1. Policy Status", "")).strip().lower() == "active" else 0
        elig = 1 if "eligible" in str(row.get("4. Patient / Member Eligibility", "")).lower() and "ineligible" not in str(row.get("4. Patient / Member Eligibility", "")).lower() else 0
        treat_cov = 1 if str(row.get("7. Treatment Coverage", "")).strip().lower() == "covered" else 0
        pre_auth = 1 if "approved" in str(row.get("8. Pre-Authorization Status", "")).lower() or "not required" in str(row.get("8. Pre-Authorization Status", "")).lower() else 0
        
        claim_amt = float(str(row.get("9. Claim Amount", 0)).replace("₹", "").replace(",", "").strip() or 0)
        tot_cov = float(str(row.get("3. Total Policy Coverage Amount", 0)).replace("₹", "").replace(",", "").strip() or 1000000)
        cov_ratio = min(5.0, claim_amt / max(1.0, tot_cov))
        
        bill_complete = 1 if "complete" in str(row.get("11. Bill Upload", "")).lower() else (0.5 if "partial" in str(row.get("11. Bill Upload", "")).lower() else 0)
        doc_verified = 1 if str(row.get("13. Documentation Verification Status", "")).strip().lower() == "verified" else (0.5 if "pending" in str(row.get("13. Documentation Verification Status", "")).lower() else 0)
        accurate = 1 if "accurate" in str(row.get("14. Medical/Claim Information Accuracy", "")).lower() else (0.5 if "minor" in str(row.get("14. Medical/Claim Information Accuracy", "")).lower() else 0)
        no_dup = 1 if "passed" in str(row.get("15. Duplicate Claim Check", "")).lower() else 0

        # Feature vector
        feat = [pol_status, elig, treat_cov, pre_auth, cov_ratio, bill_complete, doc_verified, accurate, no_dup]
        features.append(feat)

        # Label: LOW (0), MEDIUM (1), HIGH (2)
        score = (pol_status * 20) + (elig * 15) + (treat_cov * 20) + (pre_auth * 15) + (bill_complete * 10) + (doc_verified * 10) + (accurate * 10)
        if score >= 80 and no_dup and cov_ratio <= 1.0:
            labels.append("LOW")
        elif score >= 50 and no_dup:
            labels.append("MEDIUM")
        else:
            labels.append("HIGH")

    X = np.array(features)
    y = np.array(labels)

    # Train Random Forest Classifier
    rf = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=6)
    rf.fit(X, y)

    joblib.dump(rf, MODEL_FILE)
    print(f"ML Model trained and saved successfully at {MODEL_FILE}")
    print(f"Classes: {rf.classes_}")

if __name__ == "__main__":
    train_and_save_model()
