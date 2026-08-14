import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.models.policy import Policy

client = TestClient(app)

def test_claims_analytics_summary():
    response = client.get("/api/claims/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_claims" in data
    assert "status_distribution" in data
    assert "type_distribution" in data
    assert "failure_reasons_distribution" in data
    assert "monthly_claim_amounts" in data
    assert "confidence_score_ranges" in data

def test_grouped_recommendations_endpoint():
    response = client.get("/api/claims/recommendations/grouped")
    assert response.status_code == 200
    data = response.json()
    assert "total_open_recommendations" in data
    assert "categories" in data
    category_names = [c["category_name"] for c in data["categories"]]
    assert "Policy Issues" in category_names
    assert "Eligibility Issues" in category_names
    assert "Treatment Issues" in category_names
    assert "Authorization Issues" in category_names
    assert "Documentation Issues" in category_names
    assert "Amount / Coverage Issues" in category_names
    assert "Duplicate Claim Issues" in category_names

def test_full_claim_wizard_lifecycle():
    # 1. Create claim
    create_res = client.post("/api/claims", json={
        "policyholder_id": "POL-1001",
        "member_id": "POL-1001-M01",
        "policy_number": "HLT-2026-127824",
        "patient_name": "Karan Gupta",
        "disease_diagnosis": "Cataract",
        "treatment_procedure": "Phacoemulsification with Foldable IOL",
        "claim_amount": 55000.0,
        "claim_type": "Reimbursement",
        "hospital_name": "Apollo Multispeciality Hospital",
        "hospital_type": "Network Hospital",
        "bank_account_holder": "Karan Gupta",
        "bank_account_number": "918273645019",
        "bank_ifsc": "HDFC0001234",
        "pre_auth_status": "Approved"
    })
    assert create_res.status_code == 200
    claim_id = create_res.json()["claim_id"]

    # 2. Update claim fields (PUT)
    update_res = client.put(f"/api/claims/{claim_id}", json={
        "doctor_name": "Dr. Arvind Sharma",
        "pre_auth_number": "PA-TEST-2026-99"
    })
    assert update_res.status_code == 200
    assert update_res.json()["doctor_name"] == "Dr. Arvind Sharma"

    # 3. Attempt final submission before documents are attached -> should fail
    submit_fail_res = client.post(f"/api/claims/{claim_id}/submit")
    assert submit_fail_res.status_code == 400

    # 4. Attach verified documents
    client.post(
        f"/api/claims/{claim_id}/documents",
        data={"document_type": "Final Itemized Bill", "document_name": "hospital_bill.pdf", "verification_status": "Verified"},
        files={"file": ("hospital_bill.pdf", b"Certified Bill", "application/pdf")}
    )
    client.post(
        f"/api/claims/{claim_id}/documents",
        data={"document_type": "Hospital Discharge Summary", "document_name": "discharge_summary.pdf", "verification_status": "Verified"},
        files={"file": ("discharge_summary.pdf", b"Certified Discharge Summary", "application/pdf")}
    )

    # 5. Live Recheck
    recheck_res = client.post(f"/api/claims/{claim_id}/recheck")
    assert recheck_res.status_code == 200
    assert recheck_res.json()["after_confidence"] >= 90.0

    # 6. Submit Claim now that requirements are satisfied
    submit_success_res = client.post(f"/api/claims/{claim_id}/submit")
    assert submit_success_res.status_code == 200
    assert submit_success_res.json()["status"] == "SUBMITTED"
    assert submit_success_res.json()["success"] is True

    # 7. Download PDF
    pdf_res = client.get(f"/api/claims/{claim_id}/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
