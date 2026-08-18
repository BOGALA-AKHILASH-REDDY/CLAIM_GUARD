import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.models.policy import Policy, Policyholder

client = TestClient(app)

def test_pre_claim_eligibility_check_success():
    db = SessionLocal()
    policy = db.query(Policy).first()
    assert policy is not None, "At least one policy must exist in test DB"
    pid = policy.policyholder_id
    pol_num = policy.policy_number
    db.close()

    # Test query by policyholder_id
    response = client.get(f"/api/policy-services/continuation/eligibility-check?policyholder_id={pid}")
    assert response.status_code == 200
    data = response.json()
    assert "policyholder_id" in data
    assert "coverage_details" in data
    assert "sum_insured" in data["coverage_details"]
    assert "available_coverage" in data["coverage_details"]
    assert "coverage_utilized_pct" in data["coverage_details"]
    assert "safety_status" in data["coverage_details"]
    assert "insured_members" in data
    assert len(data["insured_members"]) > 0
    assert "covered_treatments_list" in data
    assert "exclusions_list" in data
    assert "premium_status" in data
    assert "outstanding_instalments" in data
    assert "grace_period" in data
    assert "policy_conditions" in data
    assert "overall_eligibility" in data

    # Test query by policy_number
    response_pol = client.get(f"/api/policy-services/continuation/eligibility-check?policy_number={pol_num}")
    assert response_pol.status_code == 200
    assert response_pol.json()["policy_number"] == pol_num

def test_all_policies_pre_claim_summary():
    response = client.get("/api/policy-services/continuation/all-policies-summary")
    assert response.status_code == 200
    summaries = response.json()
    assert isinstance(summaries, list)
    assert len(summaries) > 0
    first = summaries[0]
    assert "policyholder_id" in first
    assert "policy_number" in first
    assert "policy_type" in first
    assert "sum_insured" in first
    assert "available_coverage" in first
    assert "coverage_utilized_pct" in first
    assert "co_payment" in first
    assert "deductible" in first
    assert "overall_eligibility" in first

def test_estimate_pre_claim_payout():
    db = SessionLocal()
    policy = db.query(Policy).first()
    pol_num = policy.policy_number
    db.close()

    estimate_payload = {
        "policy_number": pol_num,
        "treatment_name": "Cardiac Angioplasty Surgery",
        "estimated_bill_amount": 150000.0,
        "room_type": "Normal Room",
        "stay_days": 2
    }
    response = client.post("/api/policy-services/continuation/estimate-claim", json=estimate_payload)
    assert response.status_code == 200
    result = response.json()
    assert result["policy_number"] == pol_num
    assert result["gross_bill_amount"] == 150000.0
    assert result["is_treatment_covered"] is True
    assert "estimated_approved_payout" in result
    assert "estimated_patient_out_of_pocket" in result
    assert "projected_available_coverage_after_claim" in result
    assert result["estimated_approved_payout"] + result["estimated_patient_out_of_pocket"] == pytest.approx(150000.0, 1.0)
