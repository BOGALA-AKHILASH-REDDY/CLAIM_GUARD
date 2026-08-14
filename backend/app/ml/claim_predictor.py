import os
import joblib
import numpy as np
from typing import Dict, Any

MODEL_FILE = os.path.join(os.path.dirname(__file__), "claim_risk_model.joblib")

class ClaimPredictor:
    def __init__(self):
        self.model = None
        if os.path.exists(MODEL_FILE):
            try:
                self.model = joblib.load(MODEL_FILE)
            except Exception as e:
                print(f"Failed to load ML model: {e}")

    def predict_risk(self, features_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extracts features and predicts denial risk & probability.
        """
        pol_status = 1 if features_dict.get("policy_status", "").lower() == "active" else 0
        elig = 1 if "eligible" in features_dict.get("eligibility", "").lower() and "ineligible" not in features_dict.get("eligibility", "").lower() else 0
        treat_cov = 1 if features_dict.get("treatment_coverage", "").lower() == "covered" else 0
        pre_auth = 1 if "approved" in features_dict.get("pre_auth", "").lower() or "not required" in features_dict.get("pre_auth", "").lower() else 0
        
        claim_amt = float(features_dict.get("claim_amount", 0.0))
        tot_cov = float(features_dict.get("total_coverage", 1000000.0))
        cov_ratio = min(5.0, claim_amt / max(1.0, tot_cov))
        
        bill_complete = 1.0 if features_dict.get("has_bill", False) else 0.0
        doc_verified = 1.0 if features_dict.get("doc_verified", False) else (0.5 if features_dict.get("doc_pending", True) else 0.0)
        accurate = 1.0 if features_dict.get("is_accurate", True) else 0.0
        no_dup = 1 if not features_dict.get("is_duplicate", False) else 0

        feature_vector = np.array([[pol_status, elig, treat_cov, pre_auth, cov_ratio, bill_complete, doc_verified, accurate, no_dup]])

        if self.model:
            try:
                pred = self.model.predict(feature_vector)[0]
                proba = self.model.predict_proba(feature_vector)[0]
                classes = list(self.model.classes_)
                
                prob_dict = {classes[i]: round(float(proba[i]), 3) for i in range(len(classes))}
                denial_risk_prob = round(float(prob_dict.get("HIGH", 0.0) + (prob_dict.get("MEDIUM", 0.0) * 0.4)), 3)
                
                return {
                    "ml_model_used": "RandomForestClassifier",
                    "predicted_risk": pred,
                    "denial_probability": denial_risk_prob,
                    "probabilities": prob_dict,
                    "feature_summary": {
                        "policy_active": bool(pol_status),
                        "member_eligible": bool(elig),
                        "treatment_covered": bool(treat_cov),
                        "pre_auth_valid": bool(pre_auth),
                        "coverage_ratio": round(cov_ratio, 2),
                        "documents_complete": bool(bill_complete and doc_verified >= 0.5),
                        "duplicate_free": bool(no_dup)
                    }
                }
            except Exception as e:
                print(f"ML prediction error: {e}")

        # Rule-based fallback
        score = (pol_status * 20) + (elig * 15) + (treat_cov * 20) + (pre_auth * 15) + (bill_complete * 15) + (doc_verified * 15)
        if score >= 80 and no_dup and cov_ratio <= 1.0:
            pred = "LOW"
            denial_prob = 0.08
        elif score >= 50 and no_dup:
            pred = "MEDIUM"
            denial_prob = 0.42
        else:
            pred = "HIGH"
            denial_prob = 0.85

        return {
            "ml_model_used": "RuleBasedFallback",
            "predicted_risk": pred,
            "denial_probability": denial_prob,
            "probabilities": {"LOW": round(1.0 - denial_prob, 2), "HIGH": denial_prob},
            "feature_summary": {
                "policy_active": bool(pol_status),
                "member_eligible": bool(elig),
                "treatment_covered": bool(treat_cov),
                "pre_auth_valid": bool(pre_auth)
            }
        }

predictor = ClaimPredictor()
