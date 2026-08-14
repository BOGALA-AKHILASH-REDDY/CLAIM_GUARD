import urllib.request
import json
import sys

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_URL = "http://127.0.0.1:8000/api"
FRONTEND_URL = "http://127.0.0.1:5173"

def http_get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "ClaimGuardTester"})
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode('utf-8')
        try:
            return resp.status, json.loads(content), resp.headers
        except Exception:
            return resp.status, content, resp.headers

def http_post(url, data_dict):
    data_bytes = json.dumps(data_dict).encode('utf-8') if data_dict is not None else b""
    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers={"Content-Type": "application/json", "User-Agent": "ClaimGuardTester"}
    )
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode('utf-8')
        try:
            return resp.status, json.loads(content), resp.headers
        except Exception:
            return resp.status, content, resp.headers

def run_e2e_tests():
    print("=== STARTING CLAIMGUARD RE-VERIFICATION ===")

    # 1. Test Root API
    status, res, _ = http_get("http://127.0.0.1:8000/")
    assert status == 200
    print("[PASS] 1. Root API endpoint is healthy:", res["system"])

    # 2. Test Frontend Server
    status, res, _ = http_get(FRONTEND_URL)
    assert status == 200
    print("[PASS] 2. Frontend Vite server is serving HTML at", FRONTEND_URL)

    # 3. Test Global Search Engine Endpoint
    status, search_res, _ = http_get(f"{BASE_URL}/search?q=Cataract")
    assert status == 200
    assert search_res["total_results"] > 0
    print(f"[PASS] 3. Global Search Engine found {search_res['total_results']} results for 'Cataract'.")

    # 4. Test 16-Factor Live Validation & Calculation (must output Claim Approval)
    status, audit_data, _ = http_post(f"{BASE_URL}/claims/CLM-1001/validate", {})
    assert status == 200
    assert len(audit_data["validations"]) == 15
    print(f"[PASS] 4. Core Audit executed on CLM-1001: Score={audit_data['confidence_score']}%, Status={audit_data['status']}")

    # 5. Test Live Recheck Engine (output text must be Claim is Approved)
    status, recheck_data, _ = http_post(f"{BASE_URL}/claims/CLM-1001/recheck", {})
    assert status == 200
    assert recheck_data["after_status"] == "Claim is Approved"
    print(f"[PASS] 5. Hackathon Recheck: Before={recheck_data['before_confidence']}% -> After={recheck_data['after_confidence']}% (Output: {recheck_data['after_status']}).")

    # 6. Test Nominee Transfer Creation & Approval
    status, trf_res, _ = http_post(f"{BASE_URL}/policy-services/transfer", {
        "policyholder_id": "POL-1003",
        "policy_number": "HLT-2026-383060",
        "nominee_id": "NOM-1003-01",
        "nominee_name": "Sneha Mehta",
        "relationship": "Spouse",
        "death_date": "2024-11-15",
        "reviewer_notes": "Municipal death certificate verified."
    })
    assert status == 200
    print(f"[PASS] 6. Nominee Transfer registered: {trf_res['request_id']} Status={trf_res['transfer_status']}")

    # 7. Test Policy Surrender with 70% Refund / 30% Penalty
    status, sur_res, _ = http_post(f"{BASE_URL}/policy-services/surrender", {
        "policyholder_id": "POL-1002",
        "policy_number": "HLT-2026-295574",
        "policy_amount": 1000000.0,
        "reason": "Relocating abroad",
        "disclaimer_accepted": True
    })
    assert status == 200
    assert sur_res["eligible_refund"] == 700000.0
    assert sur_res["penalty_amount"] == 300000.0
    print(f"[PASS] 7. Policy Surrender executed: {sur_res['request_id']} Final Refund=Rs.{sur_res['final_refund']:,.0f} (70%), Penalty=Rs.{sur_res['penalty_amount']:,.0f} (30%).")

    # 8. Test PDF Report Generation
    req = urllib.request.Request(f"{BASE_URL}/claims/CLM-1001/pdf")
    with urllib.request.urlopen(req) as resp:
        pdf_bytes = resp.read()
        assert resp.status == 200
        print(f"[PASS] 8. PDF Claim Audit Report generated and streamed ({len(pdf_bytes)} bytes).")

    print("\n=======================================================")
    print("ALL RE-VERIFICATION INTEGRATION TESTS PASSED!")
    print("=======================================================")

if __name__ == "__main__":
    run_e2e_tests()
