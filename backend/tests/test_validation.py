import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.validators.claim_validator import ClaimValidator
from backend.app.models.policy import Policy

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/api")
    assert response.status_code == 200
    assert response.json()["system"] == "CLAIMGUARD"

def test_auth_login_provider():
    response = client.post("/api/auth/login", json={
        "username": "provider@claimguard.health",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "provider"

def test_auth_login_policyholder():
    response = client.post("/api/auth/login", json={
        "username": "POL-1001",
        "password": "202699"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "policyholder"

def test_dashboard_api():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert "charts" in data
    assert data["kpis"]["total_claims"] >= 200

def test_16_factor_validator_direct():
    db = SessionLocal()
    try:
        validator = ClaimValidator(db)
        claim_dict = {
            "claim_id": "CLM-TEST-01",
            "policy_number": "HLT-2026-127824",
            "policyholder_id": "POL-1001",
            "member_id": "POL-1001-M01",
            "patient_name": "Karan Gupta",
            "disease_diagnosis": "Cataract",
            "treatment_procedure": "Phacoemulsification with IOL Implant",
            "claim_amount": 75000.0,
            "claim_submission_date": "2024-12-20",
            "pre_auth_status": "Approved"
        }
        factors, calc_summary = validator.validate_16_factors(claim_dict, [])
        assert len(factors) == 16
        assert calc_summary["confidence_score"] > 0
    finally:
        db.close()

def test_claim_document_submission_updates_scorecard():
    # 1. Create a new claim without documents
    res = client.post("/api/claims", json={
        "policyholder_id": "POL-1001",
        "member_id": "POL-1001-M01",
        "policy_number": "HLT-2026-127824",
        "patient_name": "Karan Gupta",
        "disease_diagnosis": "Cataract",
        "treatment_procedure": "Phacoemulsification with IOL Implant",
        "claim_amount": 55000,
        "pre_auth_status": "Approved"
    })
    assert res.status_code == 200
    claim_id = res.json()["claim_id"]
    initial_score = res.json()["confidence_score"]

    # 2. Upload itemized bill document
    file_content = b"Sample itemized hospital bill"
    res_doc = client.post(
        f"/api/claims/{claim_id}/documents",
        data={"document_type": "Final Itemized Bill", "document_name": "hospital_bill.pdf", "verification_status": "Verified"},
        files={"file": ("hospital_bill.pdf", file_content, "application/pdf")}
    )
    assert res_doc.status_code == 200

    # 3. Upload discharge summary document
    res_doc2 = client.post(
        f"/api/claims/{claim_id}/documents",
        data={"document_type": "Hospital Discharge Summary", "document_name": "discharge_summary.pdf", "verification_status": "Verified"},
        files={"file": ("discharge_summary.pdf", file_content, "application/pdf")}
    )
    assert res_doc2.status_code == 200

    # 4. Fetch claim and verify scorecard matrix is updated with PASS on factors 11, 12, 13
    res_updated = client.get(f"/api/claims/{claim_id}")
    assert res_updated.status_code == 200
    updated_data = res_updated.json()
    val_map = {v["factor_number"]: (v["status"], v["factor_name"], v["message"]) for v in updated_data["validations"]}
    assert updated_data["confidence_score"] > initial_score
    assert val_map[11][0] == "PASS" # Bill Upload
    assert val_map[12][0] == "PASS" # Required Documents
    assert val_map[13][0] == "PASS" # Documentation Verification Status
    assert updated_data["confidence_score"] >= 95.0

