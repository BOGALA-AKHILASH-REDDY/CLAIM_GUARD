import React, { useState, useEffect } from "react";
import { 
  UserPlus, RefreshCw, AlertOctagon, Gift, ShieldCheck, 
  CheckCircle2, AlertCircle, FileText, ArrowRight, DollarSign, Clock,
  AlertTriangle, ShieldAlert, Sparkles, Shield, Check, X, CreditCard,
  ChevronRight, Activity, Calendar, Info, ArrowUpRight, Lock, Zap, Search,
  Filter, CheckCircle, ExternalLink, HelpCircle, Calculator, Users, HeartPulse,
  Stethoscope, BadgePercent, TrendingUp, Layers, PieChart, Percent, Bed,
  Building2, CheckSquare, ChevronDown
} from "lucide-react";
import api from "../services/api";
import { formatCurrency } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";

const PolicyServicesPage = ({ initialTab = "transfer", onNavigateTab }) => {
  const { user } = useAuth();
  const loggedInPid = user?.policyholder_id || user?.user_id;

  const [activeSubTab, setActiveSubTab] = useState(initialTab);
  
  // Sync tab when prop changes
  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

  // Registry data
  const [policyholders, setPolicyholders] = useState([]);
  const [policiesList, setPoliciesList] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [surrenders, setSurrenders] = useState([]);
  const [arrears, setArrears] = useState([]);
  const [benefitTransfers, setBenefitTransfers] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Pre-Claim Continuation & Live Coverage State
  const [continuationPid, setContinuationPid] = useState(
    localStorage.getItem("claimguard_selected_pid") || loggedInPid || "POL-1001"
  );
  const [continuationPolNum, setContinuationPolNum] = useState(
    localStorage.getItem("claimguard_selected_pol") || ""
  );
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [eligibilityData, setEligibilityData] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [allSummaries, setAllSummaries] = useState([]);
  const [summariesLoading, setSummariesLoading] = useState(false);
  const [summarySearch, setSummarySearch] = useState("");
  const [summaryFilter, setSummaryFilter] = useState("ALL");
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payModalData, setPayModalData] = useState(null);
  const [payMethod, setPayMethod] = useState("UPI (Instant QR / VPA)");
  const [continuationSuccessBanner, setContinuationSuccessBanner] = useState(null);

  // Pre-Claim Coverage & Deductions Estimator State
  const [estimatorOpen, setEstimatorOpen] = useState(false);
  const [estimatorLoading, setEstimatorLoading] = useState(false);
  const [estimateTreatment, setEstimateTreatment] = useState("Cardiac Angioplasty Surgery");
  const [estimateAmount, setEstimateAmount] = useState(150000);
  const [estimateRoomType, setEstimateRoomType] = useState("Normal Room");
  const [estimateStayDays, setEstimateStayDays] = useState(2);
  const [estimateMemberId, setEstimateMemberId] = useState("");
  const [estimateResult, setEstimateResult] = useState(null);

  // Success banners for immediate CTA navigation
  const [transferSuccessBanner, setTransferSuccessBanner] = useState(null);
  const [benefitSuccessBanner, setBenefitSuccessBanner] = useState(null);


  // Form states for new requests
  const [transferForm, setTransferForm] = useState({
    policyholder_id: loggedInPid || "POL-1001",
    policy_number: `HLT-2026-${loggedInPid || "POL-1001"}`,
    nominee_id: `NOM-${loggedInPid || "POL-1001"}-01`,
    nominee_name: "Nominee Name",
    relationship: "Spouse",
    death_date: "2024-11-15",
    reviewer_notes: "Death certificate verified by municipal records."
  });

  const [surrenderForm, setSurrenderForm] = useState({
    policyholder_id: loggedInPid || "POL-1001",
    policy_number: `HLT-2026-${loggedInPid || "POL-1001"}`,
    policy_amount: 1000000,
    reason: "Relocating abroad / alternative corporate coverage",
    disclaimer_accepted: true
  });

  const [benefitForm, setBenefitForm] = useState({
    policyholder_id: loggedInPid || "POL-1001",
    policy_number: `HLT-2026-${loggedInPid || "POL-1001"}`,
    beneficiary_id: `BEN-${loggedInPid || "POL-1001"}-02`,
    beneficiary_name: "Beneficiary Name",
    relationship: "Spouse",
    notes: "100% completed term with zero claims made. Transferred 100% accumulated wellness and bonus."
  });

  const [renewalForm, setRenewalForm] = useState({
    policyholder_id: loggedInPid || "POL-1001",
    policy_number: `HLT-2026-${loggedInPid || "POL-1001"}`,
    renewal_years: 1,
    premium_amount: 25000,
    payment_method: "UPI (Instant)",
    notes: "Annual policy renewal and immediate status reactivation."
  });

  // Helper to find member by relationship type
  const findMemberByRelation = (ph, rel) => {
    if (!ph || !ph.members || ph.members.length === 0) return null;
    const cleanRel = (rel || "").toLowerCase().trim();
    return ph.members.find((m) => {
      const mRel = (m.relationship || "").toLowerCase().trim();
      if (mRel === cleanRel) return true;
      if (cleanRel === "child" && (mRel === "son" || mRel === "daughter")) return true;
      if ((cleanRel === "son" || cleanRel === "daughter") && mRel === "child") return true;
      if (cleanRel === "spouse" && (mRel === "wife" || mRel === "husband")) return true;
      return false;
    });
  };

  const handleNomineeRelationChange = (newRel, currentPh = null) => {
    const ph = currentPh || policyholders.find((p) => p.policyholder_id === transferForm.policyholder_id) || policyholders[0];
    const matched = findMemberByRelation(ph, newRel);
    
    let nomName = "";
    let nomId = "";
    if (matched) {
      nomName = matched.name;
      nomId = matched.member_id;
    } else if (ph) {
      const firstName = ph.full_name ? ph.full_name.split(" ")[0] : (user?.full_name?.split(" ")[0] || "Family");
      nomName = newRel === "Legal Heir" ? `${firstName} Legal Heir` : `${firstName}'s ${newRel}`;
      nomId = `NOM-${ph.policyholder_id}-01`;
    } else {
      const firstName = user?.full_name ? user.full_name.split(" ")[0] : "Family";
      nomName = newRel === "Legal Heir" ? `${firstName} Legal Heir` : `${firstName}'s ${newRel}`;
      nomId = `NOM-${loggedInPid || "POL-1001"}-01`;
    }

    setTransferForm((prev) => ({
      ...prev,
      relationship: newRel,
      nominee_name: nomName || prev.nominee_name,
      nominee_id: nomId || prev.nominee_id
    }));
  };

  const handleBeneficiaryRelationChange = (newRel, currentPh = null) => {
    const ph = currentPh || policyholders.find((p) => p.policyholder_id === benefitForm.policyholder_id) || policyholders[0];
    const matched = findMemberByRelation(ph, newRel);

    let benName = "";
    let benId = "";
    if (matched) {
      benName = matched.name;
      benId = matched.member_id;
    } else if (ph) {
      const firstName = ph.full_name ? ph.full_name.split(" ")[0] : (user?.full_name?.split(" ")[0] || "Family");
      benName = `${firstName}'s ${newRel}`;
      benId = `BEN-${ph.policyholder_id}-02`;
    } else {
      const firstName = user?.full_name ? user.full_name.split(" ")[0] : "Family";
      benName = `${firstName}'s ${newRel}`;
      benId = `BEN-${loggedInPid || "POL-1001"}-02`;
    }

    setBenefitForm((prev) => ({
      ...prev,
      relationship: newRel,
      beneficiary_name: benName || prev.beneficiary_name,
      beneficiary_id: benId || prev.beneficiary_id
    }));
  };

  const syncPolicyholderSelection = (ph) => {
    if (!ph) return;
    const polNum = ph.policies && ph.policies.length > 0 ? ph.policies[0].policy_number : `HLT-2026-${ph.policyholder_id}`;
    const sumIns = ph.policies && ph.policies.length > 0 ? ph.policies[0].sum_insured : 1000000;

    // Nominee matching
    const curNomRel = transferForm.relationship || "Spouse";
    const matchedNom = findMemberByRelation(ph, curNomRel) || (ph.members && ph.members.length > 1 ? ph.members[1] : ph.members?.[0]);
    const nomName = matchedNom ? matchedNom.name : `${(ph.full_name || "Family").split(" ")[0]}'s ${curNomRel}`;
    const nomId = matchedNom ? matchedNom.member_id : `NOM-${ph.policyholder_id}-01`;
    const nomRel = matchedNom ? matchedNom.relationship : curNomRel;

    setTransferForm({
      policyholder_id: ph.policyholder_id,
      policy_number: polNum,
      nominee_id: nomId,
      nominee_name: nomName,
      relationship: nomRel,
      death_date: "2024-11-15",
      reviewer_notes: "Death certificate verified by municipal records."
    });

    setSurrenderForm({
      policyholder_id: ph.policyholder_id,
      policy_number: polNum,
      policy_amount: sumIns,
      reason: "Relocating abroad / alternative corporate coverage",
      disclaimer_accepted: true
    });

    // Beneficiary matching
    const curBenRel = benefitForm.relationship || "Spouse";
    const matchedBen = findMemberByRelation(ph, curBenRel) || (ph.members && ph.members.length > 1 ? ph.members[1] : ph.members?.[0]);
    const benName = matchedBen ? matchedBen.name : `${(ph.full_name || "Family").split(" ")[0]}'s ${curBenRel}`;
    const benId = matchedBen ? matchedBen.member_id : `BEN-${ph.policyholder_id}-02`;
    const benRel = matchedBen ? matchedBen.relationship : curBenRel;

    setBenefitForm({
      policyholder_id: ph.policyholder_id,
      policy_number: polNum,
      beneficiary_id: benId,
      beneficiary_name: benName,
      relationship: benRel,
      notes: "100% completed term with zero claims made. Transferred 100% accumulated wellness and bonus."
    });

    setRenewalForm({
      policyholder_id: ph.policyholder_id,
      policy_number: polNum,
      renewal_years: 1,
      premium_amount: 25000,
      payment_method: "UPI (Instant)",
      notes: "Annual policy renewal and immediate status reactivation."
    });
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [phRes, polRes, tRes, sRes, aRes, bRes, rRes] = await Promise.all([
        api.get("/policyholders?limit=100"),
        api.get("/policies?limit=200").catch(() => ({ data: [] })),
        api.get("/policy-services/transfers"),
        api.get("/policy-services/surrenders"),
        api.get("/policy-services/arrears"),
        api.get("/policy-services/benefit-transfers"),
        api.get("/policies/renewals/history")
      ]);
      setPolicyholders(phRes.data || []);
      setPoliciesList(polRes.data || []);
      setTransfers(tRes.data || []);
      setSurrenders(sRes.data || []);
      setArrears(aRes.data || []);
      setBenefitTransfers(bRes.data || []);
      setRenewals(rRes.data || []);

      // Auto-bind to logged in user or saved selection
      const savedPolNum = localStorage.getItem("claimguard_selected_pol");
      const savedPid = localStorage.getItem("claimguard_selected_pid");
      const currentPid = savedPid || loggedInPid || "POL-1001";
      const ph = (phRes.data || []).find((p) => p.policyholder_id === currentPid) || (phRes.data || [])[0];
      if (ph) {
        syncPolicyholderSelection(ph);
      }
      if (savedPolNum) {
        setContinuationPolNum(savedPolNum);
      }
      if (savedPid) {
        setContinuationPid(savedPid);
      }
    } catch (err) {
      console.error("Error loading services data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [loggedInPid]);

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post("/policy-services/transfer", transferForm);
      const savedTransfer = {
        type: "nominee",
        policyholder_id: transferForm.policyholder_id,
        policy_number: transferForm.policy_number,
        nominee_id: transferForm.nominee_id,
        nominee_name: transferForm.nominee_name,
        relationship: transferForm.relationship,
        member_id: res.data?.member_id || transferForm.nominee_id,
        timestamp: Date.now()
      };
      localStorage.setItem("claimguard_active_transfer", JSON.stringify(savedTransfer));

      setTransferSuccessBanner({
        title: "Nominee Transfer Submitted & Authorized!",
        message: `Policy ${transferForm.policy_number} ownership transfer to nominee ${transferForm.nominee_name} (${transferForm.relationship}) is registered with status Approved. The nominee is now authorized and will automatically autofill as the insured member on New Claims.`,
        nominee_name: transferForm.nominee_name,
        relationship: transferForm.relationship,
        policyholder_id: transferForm.policyholder_id
      });

      fetchAllData();
    } catch (err) {
      console.error("Transfer submission error:", err);
      const msg = err.response?.data?.detail || err.message || "Failed to submit transfer request.";
      alert(`Failed to submit transfer request: ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSurrenderSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post("/policy-services/surrender", surrenderForm);
      alert(`Policy Surrender Request registered successfully! 70% Refund of ${formatCurrency(res.data.final_refund)} initiated.`);
      fetchAllData();
    } catch (err) {
      console.error(err);
      alert("Failed to submit surrender request.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTransferStatus = async (reqId, newStatus) => {
    try {
      await api.put(`/policy-services/transfers/${reqId}/status?new_status=${newStatus}`);
      alert(`Transfer ${reqId} status set to ${newStatus}!`);
      fetchAllData();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const fetchContinuationEligibility = async (pid, polNum) => {
    setEligibilityLoading(true);
    try {
      let url = "";
      const effectivePolNum = polNum || continuationPolNum || localStorage.getItem("claimguard_selected_pol");
      const effectivePid = pid || continuationPid || localStorage.getItem("claimguard_selected_pid") || loggedInPid || "POL-1001";
      if (effectivePolNum && effectivePolNum.trim()) {
        url = `/policy-services/continuation/eligibility-check?policy_number=${encodeURIComponent(effectivePolNum.trim())}`;
      } else {
        url = `/policy-services/continuation/eligibility-check?policyholder_id=${encodeURIComponent(effectivePid.trim())}`;
      }
      const res = await api.get(url);
      setEligibilityData(res.data);
      if (res.data?.policy_number) {
        setContinuationPolNum(res.data.policy_number);
        localStorage.setItem("claimguard_selected_pol", res.data.policy_number);
      }
      if (res.data?.policyholder_id) {
        setContinuationPid(res.data.policyholder_id);
        localStorage.setItem("claimguard_selected_pid", res.data.policyholder_id);
      }
      if (res.data?.insured_members?.length > 0) {
        if (!selectedMemberId || !res.data.insured_members.some(m => m.member_id === selectedMemberId)) {
          setSelectedMemberId(res.data.insured_members[0].member_id);
          setEstimateMemberId(res.data.insured_members[0].member_id);
        }
      }
    } catch (err) {
      console.error("Error fetching pre-claim eligibility:", err);
    } finally {
      setEligibilityLoading(false);
    }
  };

  const handlePolicySelectionChange = (newPolNum) => {
    if (!newPolNum) return;
    setContinuationPolNum(newPolNum);
    const matched = policiesList.find(p => p.policy_number === newPolNum);
    const newPid = matched?.policyholder_id || continuationPid;
    if (matched?.policyholder_id) {
      setContinuationPid(matched.policyholder_id);
    }
    localStorage.setItem("claimguard_selected_pol", newPolNum);
    if (newPid) {
      localStorage.setItem("claimguard_selected_pid", newPid);
    }
    window.dispatchEvent(new CustomEvent("claimguard_policy_changed", {
      detail: { policy_number: newPolNum, policyholder_id: newPid }
    }));
    fetchContinuationEligibility(newPid, newPolNum);
  };

  const handleRunEstimate = async (e) => {
    if (e) e.preventDefault();
    if (!eligibilityData?.policy_number) return;
    setEstimatorLoading(true);
    try {
      const res = await api.post("/policy-services/continuation/estimate-claim", {
        policy_number: eligibilityData.policy_number,
        member_id: estimateMemberId || selectedMemberId || eligibilityData.insured_members?.[0]?.member_id,
        treatment_name: estimateTreatment,
        estimated_bill_amount: parseFloat(estimateAmount) || 0,
        room_type: estimateRoomType,
        stay_days: parseInt(estimateStayDays) || 1
      });
      setEstimateResult(res.data);
    } catch (err) {
      console.error("Error calculating estimate:", err);
      alert("Failed to calculate pre-claim estimate.");
    } finally {
      setEstimatorLoading(false);
    }
  };

  const fetchAllSummaries = async () => {
    setSummariesLoading(true);
    try {
      const res = await api.get("/policy-services/continuation/all-policies-summary");
      setAllSummaries(res.data || []);
    } catch (err) {
      console.error("Error fetching summaries:", err);
    } finally {
      setSummariesLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === "continuation") {
      const savedPolNum = localStorage.getItem("claimguard_selected_pol");
      const savedPid = localStorage.getItem("claimguard_selected_pid");
      const targetPol = savedPolNum || continuationPolNum;
      const targetPid = savedPid || continuationPid || loggedInPid || "POL-1001";
      if (savedPolNum) setContinuationPolNum(savedPolNum);
      if (savedPid) setContinuationPid(savedPid);
      fetchContinuationEligibility(targetPid, targetPol);
      fetchAllSummaries();
    }
  }, [activeSubTab]);

  useEffect(() => {
    const handlePolSync = (e) => {
      const targetPolNum = e?.detail?.policy_number || localStorage.getItem("claimguard_selected_pol");
      const targetPid = e?.detail?.policyholder_id || localStorage.getItem("claimguard_selected_pid");
      if (targetPolNum) {
        setContinuationPolNum(targetPolNum);
        if (targetPid) setContinuationPid(targetPid);
        if (activeSubTab === "continuation") {
          fetchContinuationEligibility(targetPid, targetPolNum);
        }
      }
    };
    window.addEventListener("claimguard_policy_changed", handlePolSync);
    return () => window.removeEventListener("claimguard_policy_changed", handlePolSync);
  }, [activeSubTab]);

  const handleExecutePayInstalment = async (e) => {
    if (e) e.preventDefault();
    if (!payModalData) return;
    setActionLoading(true);
    try {
      const res = await api.post("/policy-services/continuation/pay-instalment", {
        policy_number: payModalData.policy_number,
        arrear_id: payModalData.arrear_id,
        payment_id: payModalData.payment_id,
        payment_amount: payModalData.amount || payModalData.payment_amount || 25000,
        payment_method: payMethod
      });
      setEligibilityData(res.data);
      setPayModalOpen(false);
      setContinuationSuccessBanner({
        title: "Instalment Payment Received & Eligibility Restored!",
        message: `Payment of ${formatCurrency(payModalData.amount || payModalData.payment_amount || 25000)} settled via ${payMethod}. Policy ${payModalData.policy_number} is now 100% Active and verified eligible for instant claim submission!`,
        policy_number: payModalData.policy_number,
        policyholder_id: res.data.policyholder_id,
        can_submit_claim: res.data.can_submit_claim
      });
      fetchAllData();
      fetchAllSummaries();
    } catch (err) {
      console.error("Payment error:", err);
      alert("Failed to process payment.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreGracePolicy = async (polNum) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/policy-services/continuation/restore-policy?policy_number=${polNum}`);
      setEligibilityData(res.data);
      setContinuationSuccessBanner({
        title: "Policy Continuation Restored!",
        message: `Policy ${polNum} coverage and claim eligibility have been reinstated to Active standing.`,
        policy_number: polNum,
        policyholder_id: res.data.policyholder_id,
        can_submit_claim: true
      });
      fetchAllData();
      fetchAllSummaries();
    } catch (err) {
      console.error("Restore error:", err);
      alert("Failed to restore policy.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSettleArrear = async (arrearId, amt) => {
    try {
      await api.post("/policy-services/arrears/settle", {
        arrear_id: arrearId,
        payment_amount: amt,
        payment_method: "UPI"
      });
      alert(`Arrears for ${arrearId} settled! Policy restored to Active status and claim eligibility reactivated.`);
      fetchAllData();
      fetchContinuationEligibility(continuationPid);
      fetchAllSummaries();
    } catch (err) {
      alert("Settlement failed.");
    }
  };

  const handleBenefitSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post("/policy-services/benefit-transfer", benefitForm);
      const savedBenefit = {
        type: "benefit",
        policyholder_id: benefitForm.policyholder_id,
        policy_number: benefitForm.policy_number,
        beneficiary_id: benefitForm.beneficiary_id,
        beneficiary_name: benefitForm.beneficiary_name,
        relationship: benefitForm.relationship,
        member_id: res.data?.member_id || benefitForm.beneficiary_id,
        timestamp: Date.now()
      };
      localStorage.setItem("claimguard_active_transfer", JSON.stringify(savedBenefit));

      setBenefitSuccessBanner({
        title: "Benefit Rollover Transfer Authorized!",
        message: `100% policy term wellness benefits & bonus rollover to beneficiary ${benefitForm.beneficiary_name} (${benefitForm.relationship}) registered with status Approved. The beneficiary will automatically autofill as the insured member on New Claims.`,
        beneficiary_name: benefitForm.beneficiary_name,
        relationship: benefitForm.relationship,
        policyholder_id: benefitForm.policyholder_id
      });

      fetchAllData();
    } catch (err) {
      console.error("Benefit transfer error:", err);
      const msg = err.response?.data?.detail || err.message || "Failed to submit benefit transfer.";
      alert(`Failed to submit benefit transfer: ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenewalSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post(`/policies/${renewalForm.policy_number}/renew`, renewalForm);
      alert(`Policy ${renewalForm.policy_number} for ${renewalForm.policyholder_id} has been renewed and activated!`);
      fetchAllData();
    } catch (err) {
      console.error(err);
      alert("Failed to submit policy renewal.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* FEATURE 1: NOMINEE TRANSFER */}
      {activeSubTab === "transfer" && (
        <div className="space-y-6">
          {/* Dedicated Feature Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
                <span className="w-2 h-2 rounded-full bg-teal-600" />
                Policy Services
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                Policy Transfer to Nominee (After Death)
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Upon primary policyholder decease, legal nominees can assume policy title after document verification.
              </p>
            </div>
            <button
              onClick={fetchAllData}
              title="Refresh"
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors self-start sm:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Nominee Transfer Success Banner with Action to New Claim */}
          {transferSuccessBanner && (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950 shadow-sm animate-fadeIn">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                    {transferSuccessBanner.title}
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-200 text-emerald-900 rounded-full font-bold">AUTHORIZED</span>
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5 font-medium leading-relaxed">
                    {transferSuccessBanner.message}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigateTab ? onNavigateTab("new-claim") : null}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 active:scale-95 text-white font-bold text-xs shadow-md transition-all"
                >
                  <span>Create Claim for {transferSuccessBanner.nominee_name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setTransferSuccessBanner(null)}
                  className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1.5">
                <UserPlus className="w-4 h-4 text-teal-600" />
                Request Nominee Policy Ownership Transfer
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Submit deceased policyholder transfer request for the active login account.
              </p>

              <form onSubmit={handleTransferSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deceased Policyholder</label>
                  {loggedInPid ? (
                    <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-200 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-teal-900">{loggedInPid}</span>
                        <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                          Logged-in Account
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 mt-1">{user?.full_name || "Primary Policyholder"}</p>
                    </div>
                  ) : (
                    <select
                      value={transferForm.policyholder_id}
                      onChange={(e) => {
                        const ph = policyholders.find((p) => p.policyholder_id === e.target.value);
                        syncPolicyholderSelection(ph);
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    >
                      {policyholders.map((ph) => (
                        <option key={ph.policyholder_id} value={ph.policyholder_id}>
                          {ph.policyholder_id} - {ph.full_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Policy Number</label>
                  <input
                    type="text"
                    required
                    value={transferForm.policy_number}
                    onChange={(e) => setTransferForm({ ...transferForm, policy_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-teal-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nominee ID</label>
                    <input
                      type="text"
                      required
                      value={transferForm.nominee_id}
                      onChange={(e) => setTransferForm({ ...transferForm, nominee_id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Relationship</label>
                    <select
                      value={transferForm.relationship}
                      onChange={(e) => handleNomineeRelationChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Legal Heir">Legal Heir</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nominee Full Name</label>
                  <input
                    type="text"
                    required
                    value={transferForm.nominee_name}
                    onChange={(e) => setTransferForm({ ...transferForm, nominee_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date of Death</label>
                  <input
                    type="date"
                    required
                    value={transferForm.death_date}
                    onChange={(e) => setTransferForm({ ...transferForm, death_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all mt-2 disabled:opacity-50"
                >
                  {actionLoading ? "Submitting..." : "Submit & Authorize Transfer"}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Nominee Transfer Applications ({transfers.length})</h3>
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {transfers.map((t) => (
                  <div key={t.request_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-teal-700">{t.request_id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${t.transfer_status === "Approved" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-amber-100 text-amber-800 border border-amber-200"}`}>
                        {t.transfer_status}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">
                        Deceased: <span className="text-slate-900">{t.policyholder_id}</span> • Policy: <span className="font-mono">{t.policy_number}</span>
                      </p>
                      <p className="text-slate-600 mt-0.5">
                        Nominee: <span className="font-semibold text-slate-800">{t.nominee_name}</span> ({t.relationship}) • Deceased Date: {t.death_date}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Document: <code className="text-teal-700 font-bold">{t.death_certificate_doc || "death_cert.pdf"}</code> (Verified ✓)</span>
                      {t.transfer_status !== "Approved" && (
                        <button
                          onClick={() => handleUpdateTransferStatus(t.request_id, "Approved")}
                          className="px-2.5 py-1 rounded-lg bg-teal-600 text-white font-bold text-[10px] hover:bg-teal-700"
                        >
                          Approve Transfer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FEATURE 2: POLICY SURRENDER / 70-30 RULE */}
      {activeSubTab === "surrender" && (
        <div className="space-y-6">
          {/* Dedicated Feature Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
                <span className="w-2 h-2 rounded-full bg-teal-600" />
                Policy Services
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-teal-600" />
                Surrender / Closure (70/30 Settlement)
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Policy early surrender settlement: 70% refund of eligible policy sum with 30% penalty deduction.
              </p>
            </div>
            <button
              onClick={fetchAllData}
              title="Refresh"
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors self-start sm:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 mb-4 text-xs">
                <span className="font-extrabold uppercase text-teal-900 block flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-teal-700" /> Configured Policy Rule
                </span>
                <p className="text-teal-800 mt-1">
                  Policy early surrender offers a <strong>70% refund</strong> of eligible policy amount with a <strong>30% penalty deduction</strong> as per configured policy rules.
                </p>
              </div>

              <form onSubmit={handleSurrenderSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Policyholder</label>
                  {loggedInPid ? (
                    <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-200 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-teal-900">{loggedInPid}</span>
                        <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                          Logged-in Account
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 mt-1">{user?.full_name || "Primary Policyholder"}</p>
                    </div>
                  ) : (
                    <select
                      value={surrenderForm.policyholder_id}
                      onChange={(e) => setSurrenderForm({ ...surrenderForm, policyholder_id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    >
                      {policyholders.map((ph) => (
                        <option key={ph.policyholder_id} value={ph.policyholder_id}>
                          {ph.policyholder_id} - {ph.full_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Policy Number</label>
                  <input
                    type="text"
                    required
                    value={surrenderForm.policy_number}
                    onChange={(e) => setSurrenderForm({ ...surrenderForm, policy_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-teal-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Policy Coverage Base Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={surrenderForm.policy_amount}
                    onChange={(e) => setSurrenderForm({ ...surrenderForm, policy_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900"
                  />
                </div>

                {/* Live Calculation Preview */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Gross Policy Amount:</span>
                    <span>{formatCurrency(surrenderForm.policy_amount)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Penalty Deduction (30%):</span>
                    <span>-{formatCurrency(surrenderForm.policy_amount * 0.3)}</span>
                  </div>
                  <div className="flex justify-between font-black text-teal-800 pt-1.5 border-t border-slate-200 text-sm">
                    <span>Refund to Policyholder (70%):</span>
                    <span>{formatCurrency(surrenderForm.policy_amount * 0.7)}</span>
                  </div>
                </div>

                <label className="flex items-start gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={surrenderForm.disclaimer_accepted}
                    onChange={(e) => setSurrenderForm({ ...surrenderForm, disclaimer_accepted: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded mt-0.5"
                  />
                  <span className="text-[11px] text-slate-600 font-medium leading-tight">
                    I accept that early policy termination will cancel all active health coverage and waiting period credits.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all mt-2 disabled:opacity-50"
                >
                  {actionLoading ? "Processing..." : "Execute Policy Surrender & Process 70% Refund"}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Surrender Request Records ({surrenders.length})</h3>
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {surrenders.map((s) => (
                  <div key={s.request_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-800">{s.request_id}</span>
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {s.closure_status}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">
                        Policy: <span className="font-mono">{s.policy_number}</span> ({s.policyholder_id})
                      </p>
                      <p className="text-slate-500 mt-0.5">Reason: {s.reason}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 grid grid-cols-3 gap-2 text-center text-[11px]">
                      <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Policy Amount</span>
                        <span className="font-bold text-slate-800">{formatCurrency(s.policy_amount)}</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-200">
                        <span className="text-rose-500 block text-[9px] uppercase font-bold">Penalty (30%)</span>
                        <span className="font-bold text-rose-700">-{formatCurrency(s.penalty_amount)}</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-teal-50 border border-teal-200">
                        <span className="text-teal-600 block text-[9px] uppercase font-bold">Final Refund (70%)</span>
                        <span className="font-extrabold text-teal-800">{formatCurrency(s.final_refund)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FEATURE 3: PRE-CLAIM POLICY CONTINUATION & ELIGIBILITY VERIFICATION */}
      {activeSubTab === "continuation" && (
        <div className="space-y-6">
          {/* Dedicated Feature Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                POLICY SERVICES • PRE-CLAIM ELIGIBILITY & LIVE COVERAGE AUDIT
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <RefreshCw className="w-5 h-5 text-teal-600" />
                Policy Continuation & Pre-Claim Eligibility Check
              </h1>
              <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                Before claim submission, <strong>CLAIMGUARD</strong> validates live policy status, remaining coverage buffer, outstanding instalments, statutory grace periods, member PED clearances, and deductible/co-payment rules to ensure 100% dispute-free claim processing.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setEstimatorOpen(true)}
                title="Launch Interactive Claim Simulator"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 font-bold text-xs shadow-2xs transition-all"
              >
                <Calculator className="w-3.5 h-3.5 text-teal-700" />
                <span>Simulate Claim Bill</span>
              </button>

              <button
                onClick={() => {
                  fetchContinuationEligibility(continuationPid, continuationPolNum);
                  fetchAllSummaries();
                }}
                title="Run Live Pre-Claim Eligibility Audit"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${eligibilityLoading ? "animate-spin" : ""}`} />
                <span>{eligibilityLoading ? "Scanning..." : "Re-Check Eligibility"}</span>
              </button>
            </div>
          </div>

          {/* Continuation Success Banner with Immediate Action to New Claim */}
          {continuationSuccessBanner && (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950 shadow-sm animate-fadeIn">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                    {continuationSuccessBanner.title}
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-200 text-emerald-900 rounded-full font-bold">100% ELIGIBLE</span>
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5 font-medium leading-relaxed">
                    {continuationSuccessBanner.message}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigateTab ? onNavigateTab("new-claim") : null}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 active:scale-95 text-white font-bold text-xs shadow-md transition-all"
                >
                  <span>Proceed to Claim Submission</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setContinuationSuccessBanner(null)}
                  className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Active Policy & Member Command Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-black shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Evaluated Policy & Coverage</span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900">
                    {eligibilityData?.policyholder_name || user?.full_name || "Policyholder"}
                  </span>
                  <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    {eligibilityData?.policy_number || `HLT-2026-${continuationPid}`}
                  </span>
                  {eligibilityData?.coverage_details?.policy_type && (
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                      {eligibilityData.coverage_details.policy_type}
                    </span>
                  )}
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    eligibilityData?.policy_conditions?.key_metrics?.policy_status === "Active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}>
                    {eligibilityData?.policy_conditions?.key_metrics?.policy_status || "Active"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  Select Policy:
                </label>
                <select
                  value={continuationPolNum || eligibilityData?.policy_number || ""}
                  onChange={(e) => handlePolicySelectionChange(e.target.value)}
                  className="px-3 py-1.5 bg-teal-50/70 border border-teal-200 rounded-xl text-xs font-bold text-teal-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  {policiesList.length > 0 ? (
                    policiesList.map((pol) => (
                      <option key={pol.policy_number} value={pol.policy_number}>
                        {pol.policy_number} - {pol.policyholder_id} ({pol.policy_type} • ₹{formatCurrency(pol.available_coverage || (pol.sum_insured - (pol.used_coverage || 0)))} Avail)
                      </option>
                    ))
                  ) : (
                    policyholders.map((ph) => (
                      <option key={ph.policyholder_id} value={ph.policies?.[0]?.policy_number || `HLT-2026-${ph.policyholder_id}`}>
                        {ph.policies?.[0]?.policy_number || `HLT-2026-${ph.policyholder_id}`} - {ph.policyholder_id} ({ph.full_name})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Policyholder:</label>
                <select
                  value={continuationPid || eligibilityData?.policyholder_id || ""}
                  onChange={(e) => {
                    setContinuationPid(e.target.value);
                    const selectedPh = policyholders.find(p => p.policyholder_id === e.target.value);
                    const firstPol = selectedPh?.policies?.[0]?.policy_number;
                    if (firstPol) {
                      handlePolicySelectionChange(firstPol);
                    } else {
                      fetchContinuationEligibility(e.target.value, "");
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  {policyholders.map((ph) => (
                    <option key={ph.policyholder_id} value={ph.policyholder_id}>
                      {ph.policyholder_id} - {ph.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* HERO PRE-CLAIM ELIGIBILITY VERDICT BANNER */}
          {eligibilityData && (
            <div className={`p-6 rounded-2xl border-2 transition-all shadow-sm ${
              eligibilityData.overall_eligibility === "ELIGIBLE"
                ? "bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-300 text-emerald-950"
                : eligibilityData.overall_eligibility === "CONDITIONAL_WARNING"
                ? "bg-gradient-to-r from-amber-50 via-yellow-50 to-white border-amber-300 text-amber-950"
                : "bg-gradient-to-r from-rose-50 via-red-50 to-white border-rose-300 text-rose-950"
            }`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    eligibilityData.overall_eligibility === "ELIGIBLE"
                      ? "bg-emerald-600 text-white"
                      : eligibilityData.overall_eligibility === "CONDITIONAL_WARNING"
                      ? "bg-amber-500 text-white"
                      : "bg-rose-600 text-white"
                  }`}>
                    {eligibilityData.overall_eligibility === "ELIGIBLE" ? (
                      <CheckCircle2 className="w-7 h-7" />
                    ) : eligibilityData.overall_eligibility === "CONDITIONAL_WARNING" ? (
                      <AlertTriangle className="w-7 h-7" />
                    ) : (
                      <ShieldAlert className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        eligibilityData.overall_eligibility === "ELIGIBLE"
                          ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                          : eligibilityData.overall_eligibility === "CONDITIONAL_WARNING"
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : "bg-rose-100 text-rose-900 border-rose-300"
                      }`}>
                        {eligibilityData.overall_eligibility === "ELIGIBLE" ? "Pre-Claim Check Passed" : eligibilityData.overall_eligibility === "CONDITIONAL_WARNING" ? "Conditional Clearance" : "Submission Blocked"}
                      </span>
                      <span className="text-xs font-bold text-slate-500">•</span>
                      <span className="text-xs font-extrabold text-slate-800">
                        Claim Readiness Score: <span className="font-mono text-sm">{eligibilityData.readiness_score}%</span>
                      </span>
                      <span className="text-xs font-bold text-slate-500">•</span>
                      <span className="text-xs font-bold text-teal-800">
                        Available Buffer: {formatCurrency(eligibilityData.coverage_details?.available_coverage || 0)}
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      {eligibilityData.overall_eligibility === "ELIGIBLE"
                        ? "100% Eligible for Immediate Claim Submission"
                        : eligibilityData.overall_eligibility === "CONDITIONAL_WARNING"
                        ? "Conditionally Eligible — Pending Grace Period / Low Buffer Clearance"
                        : "Claim Submission Ineligible — Corrective Action Required"}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      {eligibilityData.summary_message}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    onClick={() => setEstimatorOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs shadow-xs transition-all"
                  >
                    <Calculator className="w-4 h-4 text-teal-600" />
                    <span>Simulate Claim</span>
                  </button>

                  {eligibilityData.can_submit_claim && (
                    <button
                      onClick={() => onNavigateTab ? onNavigateTab("new-claim") : null}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-teal-600/25 transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Proceed to Claim Submission</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {eligibilityData.outstanding_instalments?.key_metrics?.total_outstanding_amount > 0 && (
                    <button
                      onClick={() => {
                        setPayModalData({
                          policy_number: eligibilityData.policy_number,
                          arrear_id: eligibilityData.outstanding_instalments?.key_metrics?.arrear_id,
                          payment_id: eligibilityData.outstanding_instalments?.key_metrics?.payment_id,
                          amount: eligibilityData.outstanding_instalments?.key_metrics?.total_outstanding_amount
                        });
                        setPayModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-rose-600/25 transition-all"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Settle Arrears ({formatCurrency(eligibilityData.outstanding_instalments?.key_metrics?.total_outstanding_amount)})</span>
                    </button>
                  )}
                  {eligibilityData.overall_eligibility !== "ELIGIBLE" && eligibilityData.outstanding_instalments?.key_metrics?.total_outstanding_amount === 0 && (
                    <button
                      onClick={() => handleRestoreGracePolicy(eligibilityData.policy_number)}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-extrabold text-xs shadow-md transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Reinstate Policy Continuation</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* DEDICATED LIVE POLICY & COVERAGE HEALTH INTELLIGENCE CARD */}
          {eligibilityData?.coverage_details && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                      Live Policy & Coverage Financial Health
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Real-time sum insured allocation, claim payouts ledger, and remaining cashless coverage buffer.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                    eligibilityData.coverage_details.safety_status === "OPTIMAL"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : eligibilityData.coverage_details.safety_status === "MODERATE"
                      ? "bg-teal-50 text-teal-800 border-teal-200"
                      : eligibilityData.coverage_details.safety_status === "CRITICAL_LOW"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}>
                    Buffer Safety: {eligibilityData.coverage_details.safety_status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* 3 Major Coverage Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Total Sum Insured */}
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Total Sum Insured</span>
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="text-xl font-black text-slate-900">
                    {formatCurrency(eligibilityData.coverage_details.sum_insured)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    Base policy protection limit ({eligibilityData.coverage_details.policy_type})
                  </div>
                </div>

                {/* 2. Deducted Claim Money */}
                <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-rose-700">Utilized / Claim Deductions</span>
                    <DollarSign className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <div className="text-xl font-black text-rose-700">
                    {formatCurrency(eligibilityData.coverage_details.used_coverage)}
                  </div>
                  <div className="text-[10px] text-rose-600 font-medium">
                    {eligibilityData.coverage_details.coverage_utilized_pct}% utilized by submitted/approved claims
                  </div>
                </div>

                {/* 3. Available Live Coverage */}
                <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-teal-800">Remaining Available Balance</span>
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                  <div className="text-xl font-black text-teal-800">
                    {formatCurrency(eligibilityData.coverage_details.available_coverage)}
                  </div>
                  <div className="text-[10px] text-teal-700 font-medium">
                    {Math.max(0, Math.round(100 - eligibilityData.coverage_details.coverage_utilized_pct))}% available for new cashless & reimbursement claims
                  </div>
                </div>
              </div>

              {/* Policy Balance Completely Utilized Recommendation Banner */}
              {eligibilityData.coverage_details.available_coverage <= 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-rose-950 shadow-sm animate-fadeIn">
                  <div className="flex items-start gap-3.5">
                    <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-black text-rose-950 flex items-center gap-2">
                        ⚠️ RECOMMENDATION: Policy Balance Completely Utilized (₹0 Available)
                        <span className="px-2.5 py-0.5 text-[10px] bg-rose-200 text-rose-900 rounded-full font-black uppercase">
                          100% EXHAUSTED
                        </span>
                      </h4>
                      <p className="text-xs text-rose-800 mt-1 font-medium leading-relaxed">
                        Policy sum insured of <strong>{formatCurrency(eligibilityData.coverage_details.sum_insured)}</strong> is fully exhausted. New claim submissions will be rejected until policy renewal or coverage buffer enhancement is processed.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExecuteCorrectiveAction({
                      id: "ACT-TOPUP-COVERAGE",
                      action_type: "RENEW_POLICY",
                      title: "Renew Policy & Restore Sum Insured",
                      amount: 25000,
                      payload: { policy_number: selectedPolicyNumber, policyholder_id: selectedPolicyholderId }
                    })}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs shadow-md transition-all shrink-0 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Renew Policy / Top-up Sum Insured ➔</span>
                  </button>
                </div>
              )}

              {/* Visual Coverage Progress Bar */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-teal-600" />
                    Coverage Utilization Meter:
                  </span>
                  <span className="font-mono text-slate-800">
                    {eligibilityData.coverage_details.coverage_utilized_pct}% Utilized (₹{formatCurrency(eligibilityData.coverage_details.available_coverage)} Left)
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      eligibilityData.coverage_details.coverage_utilized_pct > 80
                        ? "bg-rose-500"
                        : eligibilityData.coverage_details.coverage_utilized_pct > 40
                        ? "bg-amber-500"
                        : "bg-teal-600"
                    }`}
                    style={{ width: `${Math.max(3, eligibilityData.coverage_details.coverage_utilized_pct)}%` }}
                  />
                </div>
              </div>

              {/* 4 Mini Key Policy & Coverage Terms */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Co-Payment Obligation</span>
                  <span className="font-extrabold text-slate-800 mt-0.5 block">
                    {eligibilityData.coverage_details.co_payment}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Senior citizen: +10%</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Mandatory Deductible</span>
                  <span className="font-extrabold text-slate-800 mt-0.5 block">
                    {formatCurrency(eligibilityData.coverage_details.deductible)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Per claim deductible</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Policy Active Tenure</span>
                  <span className="font-extrabold text-slate-800 mt-0.5 block">
                    {eligibilityData.coverage_details.days_remaining} Days Remaining
                  </span>
                  <span className="text-[10px] text-slate-500 block">Valid to {eligibilityData.coverage_details.end_date}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Initial 30-Day Waiting</span>
                  <span className={`font-extrabold mt-0.5 block ${eligibilityData.coverage_details.is_initial_waiting_cleared ? "text-emerald-700" : "text-amber-600"}`}>
                    {eligibilityData.coverage_details.is_initial_waiting_cleared ? "Fully Cleared ✓" : `${eligibilityData.coverage_details.initial_waiting_days_remaining} Days Left`}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Accidental covered Day 1</span>
                </div>
              </div>
            </div>
          )}

          {/* THE 4 PILLARS DEEP DIAGNOSTIC GRID */}
          {eligibilityData && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-teal-600" />
                    4-Pillar Pre-Claim Verification Engine
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mandatory multi-factor pre-submission verification of policy, billing, and coverage compliance.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  Last Checked: {eligibilityData.timestamp || "Live"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* PILLAR 1: PREMIUM PAYMENT STATUS */}
                <div className={`p-4 rounded-2xl border bg-white shadow-xs transition-all flex flex-col justify-between ${
                  eligibilityData.premium_status.status === "PASS"
                    ? "border-emerald-200 hover:border-emerald-300"
                    : eligibilityData.premium_status.status === "WARNING"
                    ? "border-amber-200 hover:border-amber-300"
                    : "border-rose-200 hover:border-rose-300"
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Pillar 1</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                        eligibilityData.premium_status.status === "PASS"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : eligibilityData.premium_status.status === "WARNING"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}>
                        {eligibilityData.premium_status.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-black text-slate-900">Premium Payment Status</h4>
                    </div>

                    <p className="text-xs font-bold text-slate-800 mb-1">
                      {eligibilityData.premium_status.status_label}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                      {eligibilityData.premium_status.message}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 text-[11px] space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Frequency:</span>
                      <span className="font-bold text-slate-800">{eligibilityData.premium_status.key_metrics?.payment_frequency || "Annual"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Premium:</span>
                      <span className="font-bold text-slate-800">{formatCurrency(eligibilityData.premium_status.key_metrics?.premium_amount || 25000)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Next Due:</span>
                      <span className="font-mono text-slate-700">{eligibilityData.premium_status.key_metrics?.next_due_date || "Annual Cycle"}</span>
                    </div>
                  </div>
                </div>

                {/* PILLAR 2: OUTSTANDING INSTALMENTS */}
                <div className={`p-4 rounded-2xl border bg-white shadow-xs transition-all flex flex-col justify-between ${
                  eligibilityData.outstanding_instalments.status === "PASS"
                    ? "border-emerald-200 hover:border-emerald-300"
                    : eligibilityData.outstanding_instalments.status === "WARNING"
                    ? "border-amber-200 hover:border-amber-300"
                    : "border-rose-200 hover:border-rose-300"
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Pillar 2</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                        eligibilityData.outstanding_instalments.status === "PASS"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : eligibilityData.outstanding_instalments.status === "WARNING"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}>
                        {eligibilityData.outstanding_instalments.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold shrink-0">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-black text-slate-900">Outstanding Instalments</h4>
                    </div>

                    <p className="text-xs font-bold text-slate-800 mb-1">
                      {eligibilityData.outstanding_instalments.status_label}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                      {eligibilityData.outstanding_instalments.message}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 text-[11px] space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Pending Dues:</span>
                      <span className={`font-black ${eligibilityData.outstanding_instalments.key_metrics?.total_outstanding_amount > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                        {formatCurrency(eligibilityData.outstanding_instalments.key_metrics?.total_outstanding_amount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Instalments:</span>
                      <span className="font-bold text-slate-800">{eligibilityData.outstanding_instalments.key_metrics?.pending_instalments_count || 0} Pending</span>
                    </div>
                    {eligibilityData.outstanding_instalments.key_metrics?.total_outstanding_amount > 0 ? (
                      <button
                        onClick={() => {
                          setPayModalData({
                            policy_number: eligibilityData.policy_number,
                            arrear_id: eligibilityData.outstanding_instalments?.key_metrics?.arrear_id,
                            payment_id: eligibilityData.outstanding_instalments?.key_metrics?.payment_id,
                            amount: eligibilityData.outstanding_instalments?.key_metrics?.total_outstanding_amount
                          });
                          setPayModalOpen(true);
                        }}
                        className="w-full mt-1.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] text-center transition-colors"
                      >
                        Settle Dues Now
                      </button>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Status:</span>
                        <span className="font-bold text-emerald-700">Reconciled ✓</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* PILLAR 3: GRACE-PERIOD STATUS */}
                <div className={`p-4 rounded-2xl border bg-white shadow-xs transition-all flex flex-col justify-between ${
                  eligibilityData.grace_period.status === "PASS"
                    ? "border-emerald-200 hover:border-emerald-300"
                    : eligibilityData.grace_period.status === "WARNING"
                    ? "border-amber-200 hover:border-amber-300"
                    : "border-rose-200 hover:border-rose-300"
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Pillar 3</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                        eligibilityData.grace_period.status === "PASS"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : eligibilityData.grace_period.status === "WARNING"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}>
                        {eligibilityData.grace_period.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-black text-slate-900">Grace-Period Status</h4>
                    </div>

                    <p className="text-xs font-bold text-slate-800 mb-1">
                      {eligibilityData.grace_period.status_label}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                      {eligibilityData.grace_period.message}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 text-[11px] space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Grace Window:</span>
                      <span className="font-bold text-slate-800">{eligibilityData.grace_period.key_metrics?.grace_period_days || 30} Days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Days Left:</span>
                      <span className="font-bold text-amber-700">{eligibilityData.grace_period.key_metrics?.days_remaining || 0} Days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Expiry Date:</span>
                      <span className="font-mono text-slate-700">{eligibilityData.grace_period.key_metrics?.grace_expiry_date || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* PILLAR 4: POLICY-SPECIFIC CONDITIONS & COVERAGE */}
                <div className={`p-4 rounded-2xl border bg-white shadow-xs transition-all flex flex-col justify-between ${
                  eligibilityData.policy_conditions.status === "PASS"
                    ? "border-emerald-200 hover:border-emerald-300"
                    : eligibilityData.policy_conditions.status === "WARNING"
                    ? "border-amber-200 hover:border-amber-300"
                    : "border-rose-200 hover:border-rose-300"
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Pillar 4</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                        eligibilityData.policy_conditions.status === "PASS"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : eligibilityData.policy_conditions.status === "WARNING"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}>
                        {eligibilityData.policy_conditions.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-black text-slate-900">Policy & Coverage Conditions</h4>
                    </div>

                    <p className="text-xs font-bold text-slate-800 mb-1">
                      {eligibilityData.policy_conditions.status_label}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                      {eligibilityData.policy_conditions.message}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 text-[11px] space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Available Buffer:</span>
                      <span className="font-bold text-teal-800">{formatCurrency(eligibilityData.policy_conditions.key_metrics?.available_coverage || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Co-Pay / Deductible:</span>
                      <span className="font-bold text-slate-800">{eligibilityData.coverage_details?.co_payment || "0%"} / ₹{eligibilityData.coverage_details?.deductible || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Waiting Period:</span>
                      <span className={`font-bold ${eligibilityData.coverage_details?.is_initial_waiting_cleared ? "text-emerald-700" : "text-amber-600"}`}>
                        {eligibilityData.coverage_details?.is_initial_waiting_cleared ? "Cleared ✓" : "Active"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* INTERACTIVE PRE-CLAIM CLAIM BILL ESTIMATOR MODAL */}
          {estimatorOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-scaleUp max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">Pre-Claim Coverage & Deductions Estimator</h3>
                      <p className="text-xs text-slate-500">
                        Simulate hospital bill payouts, sub-limits, deductible, and patient out-of-pocket obligations before submitting.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEstimatorOpen(false);
                      setEstimateResult(null);
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Estimator Input Form */}
                <form onSubmit={handleRunEstimate} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Select Insured Member</label>
                      <select
                        value={estimateMemberId || selectedMemberId}
                        onChange={(e) => {
                          setEstimateMemberId(e.target.value);
                          setSelectedMemberId(e.target.value);
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
                      >
                        {eligibilityData?.insured_members?.map((m) => (
                          <option key={m.member_id} value={m.member_id}>
                            {m.name} ({m.relationship} • {m.age} yrs • {m.applicable_copay_pct}% Co-pay)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Treatment / Procedure</label>
                      <input
                        type="text"
                        value={estimateTreatment}
                        onChange={(e) => setEstimateTreatment(e.target.value)}
                        placeholder="e.g. Cardiac Angioplasty, Cataract Surgery"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {["Cardiac Angioplasty", "Cataract Eye Surgery", "Total Knee Replacement", "Kidney Dialysis", "Appendix Removal"].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setEstimateTreatment(preset)}
                            className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 rounded text-slate-600 font-semibold transition-colors"
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Total Hospital Bill (₹)</label>
                      <input
                        type="number"
                        min="1000"
                        step="1000"
                        value={estimateAmount}
                        onChange={(e) => setEstimateAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500/20 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Hospital Room Category</label>
                      <select
                        value={estimateRoomType}
                        onChange={(e) => setEstimateRoomType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
                      >
                        <option value="Normal Room">Normal Room (₹5,000/day limit)</option>
                        <option value="Twin Sharing Room">Twin Sharing Room (₹6,000/day limit)</option>
                        <option value="Deluxe Single Room">Deluxe Single Room (₹12,000/day - pro-rata applies)</option>
                        <option value="ICU / CCU">ICU / Intensive Care Unit (₹10,000/day limit)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={estimatorLoading}
                      className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-teal-600/25 transition-all disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      <Calculator className={`w-3.5 h-3.5 ${estimatorLoading ? "animate-spin" : ""}`} />
                      <span>{estimatorLoading ? "Simulating..." : "Calculate Pre-Claim Payout Estimate"}</span>
                    </button>
                  </div>
                </form>

                {/* ESTIMATOR LIVE RESULTS CARD */}
                {estimateResult && (
                  <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Simulation Payout Verdict</span>
                        <h4 className="text-sm font-black text-slate-900">
                          {estimateResult.treatment_name} for {estimateResult.member_name} ({estimateResult.member_relationship})
                        </h4>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        estimateResult.treatment_coverage_category === "FULLY_COVERED"
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : estimateResult.treatment_coverage_category === "COVERED_WITH_SUBLIMIT"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-rose-100 text-rose-900 border border-rose-300"
                      }`}>
                        {estimateResult.treatment_coverage_category.replace("_", " ")}
                      </span>
                    </div>

                    {/* Breakdown Ledger */}
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>1. Gross Estimated Hospital Bill:</span>
                        <span className="font-mono font-bold text-slate-900">{formatCurrency(estimateResult.gross_bill_amount)}</span>
                      </div>

                      {estimateResult.sub_limit_deduction > 0 && (
                        <div className="flex justify-between text-rose-600">
                          <span>2. Less Room Rent Sub-Limit Deduction:</span>
                          <span className="font-mono font-bold">-{formatCurrency(estimateResult.sub_limit_deduction)}</span>
                        </div>
                      )}

                      {estimateResult.deductible_applied > 0 && (
                        <div className="flex justify-between text-amber-700">
                          <span>3. Less Mandatory Policy Deductible:</span>
                          <span className="font-mono font-bold">-{formatCurrency(estimateResult.deductible_applied)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-slate-600">
                        <span>4. Less Co-Payment Deduction ({estimateResult.copay_pct_applied}%):</span>
                        <span className="font-mono font-bold text-amber-700">-{formatCurrency(estimateResult.copay_deduction)}</span>
                      </div>

                      <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase block">Estimated Approved Claim Payout</span>
                          <span className="text-lg font-black text-emerald-900">{formatCurrency(estimateResult.estimated_approved_payout)}</span>
                          <span className="text-[10px] text-emerald-700 block">Insurer Cashless Settlement Share</span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-600 uppercase block">Patient Out-of-Pocket Share</span>
                          <span className="text-lg font-black text-slate-900">{formatCurrency(estimateResult.estimated_patient_out_of_pocket)}</span>
                          <span className="text-[10px] text-slate-500 block">Includes co-pay & non-payables</span>
                        </div>
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-500 pt-2">
                        <span>Projected Coverage Balance Remaining after Claim:</span>
                        <span className="font-mono font-bold text-teal-800">{formatCurrency(estimateResult.projected_available_coverage_after_claim)}</span>
                      </div>
                    </div>

                    {/* Warning notes */}
                    {estimateResult.coverage_warning_notes?.length > 0 && (
                      <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200 text-[11px] text-teal-900 space-y-1">
                        <span className="font-bold block text-teal-950">Pre-Claim Advisory Notes:</span>
                        {estimateResult.coverage_warning_notes.map((note, idx) => (
                          <p key={idx} className="flex items-start gap-1">
                            <span>•</span>
                            <span>{note}</span>
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setEstimatorOpen(false);
                          if (onNavigateTab) onNavigateTab("new-claim");
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        <span>Proceed to Submit Claim with this Estimate</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* INSTANT PAYMENT & ARREARS SETTLEMENT MODAL */}
          {payModalOpen && payModalData && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-black text-slate-900">Settle Outstanding Instalment</h3>
                  </div>
                  <button
                    onClick={() => setPayModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Executing instant instalment settlement restores active policy coverage, carries over cumulative NCB bonuses, and unlocks 100% pre-claim eligibility.
                </p>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Policy Number:</span>
                    <span className="font-mono font-bold text-slate-900">{payModalData.policy_number}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Instalment / Arrears Due:</span>
                    <span className="font-bold text-rose-600">{formatCurrency(payModalData.amount || payModalData.payment_amount || 25000)}</span>
                  </div>
                  <div className="flex justify-between font-black text-teal-900 pt-2 border-t border-slate-200 text-sm">
                    <span>Total Settlement Payable:</span>
                    <span>{formatCurrency(payModalData.amount || payModalData.payment_amount || 25000)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="UPI (Instant QR / VPA)">UPI (Instant QR / VPA)</option>
                    <option value="Net Banking (All Indian Banks)">Net Banking (All Indian Banks)</option>
                    <option value="Credit / Debit Card (Instant)">Credit / Debit Card (Instant)</option>
                    <option value="Auto-Debit / NACH Direct Clearance">Auto-Debit / NACH Direct Clearance</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPayModalOpen(false)}
                    className="w-1/3 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleExecutePayInstalment}
                    className="w-2/3 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-teal-600/25 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? "Processing Payment..." : `Pay ${formatCurrency(payModalData.amount || payModalData.payment_amount || 25000)} & Restore`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FEATURE 4: BENEFIT TRANSFER */}
      {activeSubTab === "benefit" && (
        <div className="space-y-6">
          {/* Dedicated Feature Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
                <span className="w-2 h-2 rounded-full bg-teal-600" />
                Policy Services
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Gift className="w-5 h-5 text-teal-600" />
                Benefit Transfer & Wellness Rollover
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Upon 100% completion of term with 0% claim usage, accumulated wellness bonus and rollover coverage can be transferred to a spouse, child, or grandchild.
              </p>
            </div>
            <button
              onClick={fetchAllData}
              title="Refresh"
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors self-start sm:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Benefit Rollover Success Banner with Action to New Claim */}
          {benefitSuccessBanner && (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950 shadow-sm animate-fadeIn">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                    {benefitSuccessBanner.title}
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-200 text-emerald-900 rounded-full font-bold">AUTHORIZED</span>
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5 font-medium leading-relaxed">
                    {benefitSuccessBanner.message}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigateTab ? onNavigateTab("new-claim") : null}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 active:scale-95 text-white font-bold text-xs shadow-md transition-all"
                >
                  <span>Create Claim for {benefitSuccessBanner.beneficiary_name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setBenefitSuccessBanner(null)}
                  className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1.5">
                <Gift className="w-4 h-4 text-teal-600" />
                Transfer Policy Benefits to Beneficiary
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Roll over accrued wellness benefits and no-claim bonuses to covered family members.
              </p>

              <form onSubmit={handleBenefitSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Primary Policyholder</label>
                  {loggedInPid ? (
                    <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-200 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-teal-900">{loggedInPid}</span>
                        <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                          Logged-in Account
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 mt-1">{user?.full_name || "Primary Policyholder"}</p>
                    </div>
                  ) : (
                    <select
                      value={benefitForm.policyholder_id}
                      onChange={(e) => {
                        const ph = policyholders.find((p) => p.policyholder_id === e.target.value);
                        syncPolicyholderSelection(ph);
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    >
                      {policyholders.map((ph) => (
                        <option key={ph.policyholder_id} value={ph.policyholder_id}>
                          {ph.policyholder_id} - {ph.full_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Policy Number</label>
                  <input
                    type="text"
                    required
                    value={benefitForm.policy_number}
                    onChange={(e) => setBenefitForm({ ...benefitForm, policy_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-teal-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Beneficiary ID</label>
                    <input
                      type="text"
                      required
                      value={benefitForm.beneficiary_id}
                      onChange={(e) => setBenefitForm({ ...benefitForm, beneficiary_id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Relationship</label>
                    <select
                      value={benefitForm.relationship}
                      onChange={(e) => handleBeneficiaryRelationChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    >
                      <option value="Spouse">Spouse / Soulmate</option>
                      <option value="Child">Child</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Grandchild">Grandchild</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Beneficiary Full Name</label>
                  <input
                    type="text"
                    required
                    value={benefitForm.beneficiary_name}
                    onChange={(e) => setBenefitForm({ ...benefitForm, beneficiary_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all mt-2 disabled:opacity-50"
                >
                  {actionLoading ? "Submitting..." : "Authorize Benefit Rollover Transfer"}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Benefit Rollover Registry ({benefitTransfers.length})</h3>
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {benefitTransfers.map((b) => (
                  <div key={b.request_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-teal-700">{b.request_id}</span>
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {b.transfer_status}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">
                        From: <span className="text-slate-900">{b.policyholder_id}</span> → To: <span className="font-bold text-teal-800">{b.beneficiary_name}</span> ({b.relationship})
                      </p>
                      <p className="text-slate-500 mt-0.5">{b.notes}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Usage: <strong className="text-emerald-700">{b.benefit_usage}</strong></span>
                      <span className="font-bold text-teal-700">{b.transfer_eligibility}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FEATURE 5: POLICY RENEWAL & REACTIVATION */}
      {activeSubTab === "renewals" && (
        <div className="space-y-6">
          {/* Dedicated Feature Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
                <span className="w-2 h-2 rounded-full bg-teal-600" />
                Policy Services
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                Policy Renewal & Reactivation
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Extend lapsed or inactive policy tenures, settle outstanding premiums, and restore active claim eligibility.
              </p>
            </div>
            <button
              onClick={fetchAllData}
              title="Refresh"
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors self-start sm:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Register Policy Renewal & Reactivation
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Extend lapsed or inactive policy tenures, settle outstanding premiums, and restore active claim eligibility.
              </p>

              <form onSubmit={handleRenewalSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Policyholder</label>
                  {loggedInPid ? (
                    <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-200 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-teal-900">{loggedInPid}</span>
                        <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                          Logged-in Account
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 mt-1">{user?.full_name || "Primary Policyholder"}</p>
                    </div>
                  ) : (
                    <select
                      value={renewalForm.policyholder_id}
                      onChange={(e) => setRenewalForm({ ...renewalForm, policyholder_id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      {policyholders.map((p) => (
                        <option key={p.policyholder_id} value={p.policyholder_id}>
                          {p.policyholder_id} - {p.full_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Policy Number</label>
                  <input
                    type="text"
                    required
                    value={renewalForm.policy_number}
                    onChange={(e) => setRenewalForm({ ...renewalForm, policy_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-teal-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Term (Years)</label>
                    <select
                      value={renewalForm.renewal_years}
                      onChange={(e) => {
                        const y = parseInt(e.target.value);
                        setRenewalForm({
                          ...renewalForm,
                          renewal_years: y,
                          premium_amount: y === 1 ? 25000 : y === 2 ? 47500 : 67500
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value={1}>1 Year (Standard)</option>
                      <option value={2}>2 Years (5% Off)</option>
                      <option value={3}>3 Years (10% Off)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={renewalForm.payment_method}
                      onChange={(e) => setRenewalForm({ ...renewalForm, payment_method: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="UPI (Instant)">UPI (Instant)</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Net Banking">Net Banking</option>
                      <option value="Auto-Debit">Auto-Debit</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Renewal Premium (₹)</label>
                  <input
                    type="number"
                    required
                    value={renewalForm.premium_amount}
                    onChange={(e) => setRenewalForm({ ...renewalForm, premium_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Officer / Audit Notes</label>
                  <textarea
                    rows="2"
                    value={renewalForm.notes}
                    onChange={(e) => setRenewalForm({ ...renewalForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all mt-2 disabled:opacity-50"
                >
                  {actionLoading ? "Renewing..." : "Process Renewal & Activate Policy"}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Policy Renewals & Audit Ledger ({renewals.length})</h3>
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {renewals.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">No renewal records found.</div>
                ) : (
                  renewals.map((r) => (
                    <div key={r.renewal_id || r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-teal-800">{r.renewal_id}</span>
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {r.renewal_status || "Active & Renewed"}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          Policy: <span className="font-mono text-teal-800">{r.policy_number}</span> ({r.policyholder_id})
                        </p>
                        <p className="text-slate-500 mt-0.5">
                          Previous Expiry: <span className="text-rose-600 font-mono font-bold">{r.previous_end_date}</span> ➜ Extended Active Tenure: <span className="text-emerald-700 font-mono font-bold">{r.new_start_date} to {r.new_end_date}</span>
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                        <span>Premium: <strong className="text-slate-900 font-black">{formatCurrency(r.premium_amount)}</strong> via {r.payment_method}</span>
                        <span className="text-slate-400 font-mono text-[10px]">{r.created_at ? String(r.created_at).substring(0, 10) : "Recent"}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicyServicesPage;
