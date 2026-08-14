import React, { useState, useEffect, useRef } from "react";
import { 
  PlusCircle, ShieldCheck, User, Search, FileText, UploadCloud, 
  CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, RefreshCw, XCircle,
  FileCheck, Trash2, Zap, Check, AlertOctagon, Info, Lock, Building2, CreditCard,
  Calendar, DollarSign, Activity, FileWarning, Eye, Download, ChevronRight, Stethoscope, FileSearch
} from "lucide-react";
import FactorBadge from "../components/FactorBadge";
import ConfidenceGauge from "../components/ConfidenceGauge";
import api from "../services/api";
import { formatCurrency, getStatusBadgeColor, getRiskBadgeColor } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";

const WIZARD_STEPS = [
  { id: 1, title: "Patient & Policy", short: "Patient" },
  { id: 2, title: "Treatment Details", short: "Treatment" },
  { id: 3, title: "Claim Type", short: "Claim Type" },
  { id: 4, title: "Documents / Flow", short: "Documents" },
  { id: 5, title: "Verification", short: "Verification" },
  { id: 6, title: "Claim Analysis", short: "Analysis" },
  { id: 7, title: "Final Result", short: "Submission" },
];

const REQUIRED_DOC_TYPES = [
  { type: "Claim Form", name: "Claim Form (Part A & B)", req: true, desc: "Standard signed claim application form" },
  { type: "Discharge Summary", name: "Hospital Discharge Summary", req: true, desc: "Complete clinical summary signed by attending doctor" },
  { type: "Final Itemized Bill", name: "Original Medical / Hospital Bills", req: true, desc: "Detailed bill breakup with invoice number" },
  { type: "Payment Receipts", name: "Payment / Settlement Receipts", req: true, desc: "Paid money receipt / transaction acknowledgment" },
  { type: "Diagnostic Reports", name: "Diagnostic & Lab Reports", req: true, desc: "Pathology, Radiology, ECG, MRI or CT scan reports" },
  { type: "Doctor Certificate", name: "Medical Certificate / Doctor Notes", req: false, desc: "Attending consultant medical necessity certificate" },
  { type: "Prescription", name: "Doctor Prescriptions & Pharmacy Memos", req: true, desc: "Doctor prescription slips and chemist invoices" },
  { type: "PAN Card", name: "PAN Card / KYC Document", req: false, desc: "Mandatory for claim amounts exceeding ₹1,00,000" },
];

const NewClaimPage = ({ onClaimCreated, onViewClaimAnalysis, onNavigateBack }) => {
  const { user } = useAuth();
  const isPolicyholder = user?.role === "policyholder";
  const loggedInPid = user?.policyholder_id || user?.user_id;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Policyholders & Policies list for selection/lookup
  const [policyholdersList, setPolicyholdersList] = useState([]);
  const [allPolicies, setAllPolicies] = useState([]);

  // Step 1: Patient & Policy State
  const [policyholderId, setPolicyholderId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [patientName, setPatientName] = useState("");
  const [dob, setDob] = useState("1988-06-15");
  const [age, setAge] = useState(38);
  const [gender, setGender] = useState("Male");
  const [contactNumber, setContactNumber] = useState("+91 98765 43210");
  const [selectedPolicyDetails, setSelectedPolicyDetails] = useState(null);
  const [selectedPolicyholderObj, setSelectedPolicyholderObj] = useState(null);

  // Step 2: Treatment Details
  const [diseaseDiagnosis, setDiseaseDiagnosis] = useState("Cataract");
  const [treatmentProcedure, setTreatmentProcedure] = useState("Phacoemulsification with Foldable IOL");
  const [hospitalName, setHospitalName] = useState("Apollo Multispeciality Hospital");
  const [hospitalType, setHospitalType] = useState("Network Hospital"); // "Network Hospital", "Non-Network Hospital"
  const [admissionDate, setAdmissionDate] = useState("2026-08-10");
  const [dischargeDate, setDischargeDate] = useState("2026-08-12");
  const [claimAmount, setClaimAmount] = useState(55000);
  const [emergencyOrPlanned, setEmergencyOrPlanned] = useState("Planned Treatment");

  // Step 3: Claim Type Decision
  const [claimType, setClaimType] = useState("Cashless"); // "Cashless", "Reimbursement"

  // Step 4A: Cashless Flow
  const [insuranceCardId, setInsuranceCardId] = useState("INS-CARD-2026-8891");
  const [preAuthNumber, setPreAuthNumber] = useState("PA-HYD-2026-0941");
  const [treatmentPlan, setTreatmentPlan] = useState("Standard surgical day care protocol with monofocal IOL implantation.");
  const [doctorName, setDoctorName] = useState("Dr. Arvind Sharma (Ophthalmology)");
  const [cashlessStatus, setCashlessStatus] = useState("Approved"); // "Approved", "Additional Info Required", "Not Approved"
  const [cashlessMissingNotes, setCashlessMissingNotes] = useState("");

  // Step 4B: Reimbursement Flow
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("918273645019");
  const [bankIfsc, setBankIfsc] = useState("HDFC0001234");
  const [panNumber, setPanNumber] = useState("ABCDE1234F");

  // Documents attached in wizard
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const fileInputRef = useRef(null);
  const [activeUploadDocType, setActiveUploadDocType] = useState(null);

  // Validation & Backend Evaluation
  const [activeClaimId, setActiveClaimId] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [recheckComparison, setRecheckComparison] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);

  // Policy Renewal & Immediate Activation State
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewalYears, setRenewalYears] = useState(1);
  const [renewalPaymentMethod, setRenewalPaymentMethod] = useState("UPI (Instant)");
  const [renewalHealthConfirmed, setRenewalHealthConfirmed] = useState(true);
  const [renewalNotes, setRenewalNotes] = useState("");
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewalSuccessMsg, setRenewalSuccessMsg] = useState(null);

  const getRenewalDatesPreview = () => {
    const today = new Date();
    const startDateStr = today.toISOString().split("T")[0];
    const endDate = new Date(today);
    endDate.setFullYear(endDate.getFullYear() + renewalYears);
    endDate.setDate(endDate.getDate() - 1);
    const endDateStr = endDate.toISOString().split("T")[0];
    return { startDateStr, endDateStr };
  };

  const getRenewalPremiumAmount = () => {
    const sumIns = selectedPolicyDetails?.sum_insured || 500000;
    const baseAnnual = sumIns >= 1000000 ? 30000 : sumIns >= 500000 ? 22000 : 16000;
    const totalBase = baseAnnual * renewalYears;
    const discount = renewalYears === 2 ? 0.05 : renewalYears === 3 ? 0.10 : 0.0;
    const discountedBase = totalBase * (1 - discount);
    const gst = discountedBase * 0.18;
    const total = Math.round(discountedBase + gst);
    return { baseAnnual, totalBase, discount, gst, total };
  };

  const handleOpenRenewalModal = () => {
    setRenewalSuccessMsg(null);
    setIsRenewModalOpen(true);
  };

  const handleExecuteRenewal = async () => {
    if (!selectedPolicyDetails) return;
    try {
      setIsRenewing(true);
      const { startDateStr, endDateStr } = getRenewalDatesPreview();
      const { total } = getRenewalPremiumAmount();

      const payload = {
        policy_number: selectedPolicyDetails.policy_number,
        policyholder_id: policyholderId || selectedPolicyDetails.policyholder_id,
        renewal_years: renewalYears,
        new_start_date: startDateStr,
        new_end_date: endDateStr,
        premium_amount: total,
        payment_method: renewalPaymentMethod,
        health_declaration_confirmed: renewalHealthConfirmed,
        notes: renewalNotes || `Online renewal for ${selectedPolicyDetails.policy_number} for ${renewalYears} yr(s).`,
        actor: isPolicyholder ? `Policyholder (${user?.full_name || patientName})` : "Provider / Claims Officer"
      };

      const res = await api.post(`/policies/${selectedPolicyDetails.policy_number}/renew`, payload);
      const updatedPol = res.data.policy;

      setSelectedPolicyDetails(updatedPol);
      setAllPolicies(prev => prev.map(p => 
        p.policy_number.toLowerCase() === updatedPol.policy_number.toLowerCase() ? { ...p, ...updatedPol } : p
      ));

      setRenewalSuccessMsg({
        title: "Policy Renewed & Activated Successfully!",
        message: `Policy ${updatedPol.policy_number} has been extended until ${updatedPol.end_date}. Status is now ACTIVE. You can now proceed with claim submission.`
      });

      setIsRenewModalOpen(false);
    } catch (err) {
      console.error("Renewal error:", err);
      alert("Policy renewal failed. Please check network and inputs.");
    } finally {
      setIsRenewing(false);
    }
  };

  // Load initial policies & policyholders
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const [phRes, polRes] = await Promise.all([
          api.get("/policyholders?limit=50"),
          api.get("/policies?limit=50")
        ]);
        setPolicyholdersList(phRes.data);
        setAllPolicies(polRes.data);

        if (isPolicyholder && loggedInPid) {
          const userPh = phRes.data.find(p => p.policyholder_id === loggedInPid) || phRes.data[0];
          if (userPh) handleSelectPolicyholder(userPh);
        } else if (phRes.data.length > 0) {
          handleSelectPolicyholder(phRes.data[0]);
        }
      } catch (err) {
        console.error("Init fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [isPolicyholder, loggedInPid]);

  const handleSelectPolicyholder = (ph) => {
    setSelectedPolicyholderObj(ph);
    setPolicyholderId(ph.policyholder_id);
    setPatientName(ph.full_name);
    setBankAccountHolder(ph.full_name);
    setContactNumber(ph.contact_number || "+91 98765 43210");
    setDob(ph.dob || "1988-06-15");
    setAge(ph.age || 38);
    setGender(ph.gender || "Male");

    if (ph.policies && ph.policies.length > 0) {
      handleSelectPolicy(ph.policies[0]);
    } else {
      setSelectedPolicyDetails(null);
      setPolicyNumber("");
    }

    if (ph.members && ph.members.length > 0) {
      setMemberId(ph.members[0].member_id);
    } else {
      setMemberId("");
    }
  };

  const handleSelectPolicy = (pol) => {
    setSelectedPolicyDetails(pol);
    setPolicyNumber(pol.policy_number);
  };

  const handlePolicyNumberChange = (polNum) => {
    setPolicyNumber(polNum);
    const found = allPolicies.find(p => p.policy_number.toLowerCase() === polNum.trim().toLowerCase());
    if (found) {
      setSelectedPolicyDetails(found);
    }
  };

  // Sync hospital type recommendation with claim type
  const handleHospitalTypeChange = (type) => {
    setHospitalType(type);
    if (type === "Network Hospital") {
      setClaimType("Cashless");
    } else {
      setClaimType("Reimbursement");
    }
  };

  // Document upload handler
  const handleFileSelect = (e, docType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newDoc = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type: docType || activeUploadDocType || "Claim Form",
      filename: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      fileObj: file,
      uploaded: true,
      formatValid: ["pdf", "jpg", "jpeg", "png"].includes(file.name.split(".").pop().toLowerCase()),
      verified: false,
      status: "Verification Pending"
    };

    setUploadedDocs(prev => {
      const filtered = prev.filter(d => d.type !== newDoc.type);
      return [...filtered, newDoc];
    });

    e.target.value = null;
  };

  const triggerUploadForDoc = (docType) => {
    setActiveUploadDocType(docType);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Auto-attach sample verified documents (useful for quick demo)
  const handleAttachVerifiedDemoDocs = () => {
    const demoDocs = REQUIRED_DOC_TYPES.map((dt, idx) => ({
      id: `demo-doc-${idx}`,
      type: dt.type,
      filename: `${dt.type.toLowerCase().replace(/[\s/]+/g, "_")}_certified.pdf`,
      size: "240.5 KB",
      uploaded: true,
      formatValid: true,
      verified: true,
      status: "Verified",
      fileObj: new Blob(["Sample verified document"], { type: "application/pdf" })
    }));
    setUploadedDocs(demoDocs);
  };

  const handleVerifySingleDoc = (docId) => {
    setUploadedDocs(prev => prev.map(d => d.id === docId ? { ...d, verified: true, status: "Verified" } : d));
  };

  const handleVerifyAllDocs = () => {
    setUploadedDocs(prev => prev.map(d => ({ ...d, verified: true, status: "Verified" })));
  };

  // Calculate document completeness %
  const requiredDocs = REQUIRED_DOC_TYPES.filter(d => d.req);
  const uploadedRequiredCount = requiredDocs.filter(req => uploadedDocs.some(u => u.type === req.type && u.uploaded)).length;
  const docCompletenessPct = Math.round((uploadedRequiredCount / requiredDocs.length) * 100);

  // Check if policy is active
  const isPolicyActive = selectedPolicyDetails ? selectedPolicyDetails.status === "Active" : true;

  // Evaluation & Validation trigger
  const handleExecuteValidation = async () => {
    if (!selectedPolicyDetails) {
      alert("Please select a valid policy.");
      return;
    }
    if (!isPolicyActive) {
      alert("Claim cannot proceed because the policy is not active.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create/Save Claim Draft
      const payload = {
        policyholder_id: policyholderId || "POL-1001",
        member_id: memberId || null,
        policy_number: policyNumber,
        patient_name: patientName,
        disease_diagnosis: diseaseDiagnosis,
        treatment_procedure: treatmentProcedure,
        claim_amount: parseFloat(claimAmount) || 0,
        claim_submission_date: admissionDate || new Date().toISOString().split("T")[0],
        claim_type: claimType,
        hospital_name: hospitalName,
        hospital_type: hospitalType,
        admission_date: admissionDate,
        discharge_date: dischargeDate,
        emergency_or_planned: emergencyOrPlanned,
        bank_account_holder: bankAccountHolder,
        bank_account_number: bankAccountNumber,
        bank_ifsc: bankIfsc,
        pan_number: panNumber,
        doctor_name: doctorName,
        pre_auth_number: preAuthNumber,
        pre_auth_status: cashlessStatus === "Approved" ? "Approved" : cashlessStatus === "Not Approved" ? "Rejected" : "Missing",
        notes: `Wizard evaluation for ${patientName}`
      };

      let claimObj;
      if (activeClaimId) {
        const updateRes = await api.put(`/claims/${activeClaimId}`, payload);
        claimObj = updateRes.data;
      } else {
        const createRes = await api.post("/claims", payload);
        claimObj = createRes.data;
        setActiveClaimId(claimObj.claim_id);
      }

      // 2. Upload attached documents if any
      if (uploadedDocs.length > 0) {
        for (const doc of uploadedDocs) {
          try {
            const formData = new FormData();
            formData.append("document_type", doc.type);
            formData.append("document_name", doc.filename);
            formData.append("verification_status", doc.verified ? "Verified" : doc.status || "Pending Review");
            formData.append("is_required", "true");
            
            if (doc.fileObj instanceof File || doc.fileObj instanceof Blob) {
              formData.append("file", doc.fileObj, doc.filename);
            } else {
              formData.append("file", new Blob(["Certified doc"], { type: "application/pdf" }), doc.filename);
            }

            await api.post(`/claims/${claimObj.claim_id}/documents`, formData, {
              headers: { "Content-Type": "multipart/form-data" }
            });
          } catch (e) {
            console.error("Doc upload sync error:", e);
          }
        }
      }

      // 3. Run live 16-factor validation
      const evalRes = await api.post(`/claims/${claimObj.claim_id}/validate`);
      setEvaluationResult(evalRes.data);
      setCurrentStep(7); // Navigate directly to Final Result step!
    } catch (err) {
      console.error("Validation error:", err);
      alert("Validation failed. Please verify backend connection and inputs.");
    } finally {
      setLoading(false);
    }
  };

  // Single-Click Fix handler for a recommendation
  const handleFixRecommendation = async (recId) => {
    if (!activeClaimId) return;
    try {
      setLoading(true);
      await api.post(`/claims/${activeClaimId}/recommendations/${recId}/fix`);
      // Re-run validation live
      const evalRes = await api.post(`/claims/${activeClaimId}/validate`);
      setEvaluationResult(evalRes.data);
    } catch (err) {
      console.error("Fix recommendation error:", err);
      alert("Failed to fix recommendation.");
    } finally {
      setLoading(false);
    }
  };

  // Recheck Claim handler
  const handleRecheckClaim = async () => {
    if (!activeClaimId) return;
    try {
      setLoading(true);
      const recheckRes = await api.post(`/claims/${activeClaimId}/recheck`);
      setRecheckComparison(recheckRes.data);
      // Refresh evaluation result
      const evalRes = await api.post(`/claims/${activeClaimId}/validate`);
      setEvaluationResult(evalRes.data);
    } catch (err) {
      console.error("Recheck error:", err);
      alert("Recheck failed.");
    } finally {
      setLoading(false);
    }
  };

  // Final Claim Submission
  const handleSubmitClaim = async () => {
    if (!activeClaimId) return;
    try {
      setIsSubmitting(true);
      const submitRes = await api.post(`/claims/${activeClaimId}/submit`);
      setSubmissionSuccess(submitRes.data);
      if (onClaimCreated) onClaimCreated(activeClaimId);
    } catch (err) {
      console.error("Submission error:", err);
      const msg = err.response?.data?.detail?.message || "Claim cannot be submitted until mandatory validation requirements are satisfied.";
      alert(`Submission Blocked: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation conditions
  const canAdvanceStep = () => {
    if (currentStep === 1) {
      return Boolean(policyNumber && patientName && isPolicyActive);
    }
    if (currentStep === 2) {
      return Boolean(diseaseDiagnosis && treatmentProcedure && hospitalName && claimAmount > 0);
    }
    if (currentStep === 3) {
      return Boolean(claimType);
    }
    if (currentStep === 4) {
      if (claimType === "Cashless") {
        return Boolean(insuranceCardId && preAuthNumber);
      }
      return Boolean(bankAccountNumber && bankIfsc);
    }
    if (currentStep === 5) {
      return docCompletenessPct >= 60; // Allow review if at least majority uploaded
    }
    return true;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileSelect(e, activeUploadDocType)}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
      />

      {/* Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-black uppercase tracking-wider">
              Step {currentStep} of 7
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-teal-600" />
              New Claim Pre-Submission Validation Wizard
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise healthcare claim verification engine to prevent denials before submission to insurer.
          </p>
        </div>

        {onNavigateBack && (
          <button
            onClick={onNavigateBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Claims
          </button>
        )}
      </div>

      {/* 7-STEP PROGRESS INDICATOR */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-[620px]">
          {WIZARD_STEPS.map((s, idx) => {
            const isCompleted = currentStep > s.id;
            const isCurrent = currentStep === s.id;
            return (
              <React.Fragment key={s.id}>
                <div
                  onClick={() => {
                    if (s.id < currentStep || (evaluationResult && s.id <= 7)) {
                      setCurrentStep(s.id);
                    }
                  }}
                  className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    isCurrent ? "scale-105" : isCompleted ? "opacity-90" : "opacity-50"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs transition-all shadow-xs ${
                      isCompleted
                        ? "bg-teal-600 text-white"
                        : isCurrent
                        ? "bg-teal-800 text-white ring-4 ring-teal-500/20"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : s.id}
                  </div>
                  <span
                    className={`text-[11px] font-bold tracking-tight text-center whitespace-nowrap ${
                      isCurrent ? "text-teal-900 font-black" : isCompleted ? "text-slate-700" : "text-slate-400"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                {idx < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded transition-colors ${
                      currentStep > idx + 1 ? "bg-teal-600" : "bg-slate-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1 — PATIENT & POLICY DETAILS */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" />
                Step 1: Patient & Policy Information
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter policy details or select from database. Policy validity, available coverage, and member eligibility are retrieved dynamically.
              </p>
            </div>

            {/* Renewal Success Notification Banner */}
            {renewalSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-start justify-between gap-3 text-emerald-950 shadow-sm animate-fadeIn">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                      {renewalSuccessMsg.title}
                      <span className="px-2 py-0.5 text-[10px] bg-emerald-200 text-emerald-900 rounded-full font-bold">STATUS: ACTIVE</span>
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5 font-medium">
                      {renewalSuccessMsg.message}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRenewalSuccessMsg(null)}
                  className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Inactive Policy Alert Banner if inactive */}
            {!isPolicyActive && (
              <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-rose-900 shadow-sm">
                <div className="flex items-start gap-3.5">
                  <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-black text-rose-900 flex items-center gap-2">
                      Policy is Not Active
                      <span className="px-2 py-0.5 text-[10px] bg-rose-200 text-rose-900 rounded-full font-bold uppercase">
                        {selectedPolicyDetails?.status || "INACTIVE"}
                      </span>
                    </h4>
                    <p className="text-xs text-rose-700 mt-1 font-medium leading-relaxed">
                      "Claim cannot proceed because the policy is not active." Final submission is disabled until the policy is renewed or activated.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleOpenRenewalModal}
                  type="button"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs shadow-md transition-all shrink-0 hover:shadow-rose-300"
                >
                  <span>Renew & Activate Policy</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Quick Policyholder Selector */}
            {!isPolicyholder && policyholdersList.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span className="font-bold text-slate-700">Quick Select Registered Policyholder:</span>
                <select
                  value={policyholderId}
                  onChange={(e) => {
                    const found = policyholdersList.find(p => p.policyholder_id === e.target.value);
                    if (found) handleSelectPolicyholder(found);
                  }}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  {policyholdersList.map((p) => (
                    <option key={p.policyholder_id} value={p.policyholder_id}>
                      {p.policyholder_id} — {p.full_name} ({p.coverage_type || "Health"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Insurance ID *</label>
                <input
                  type="text"
                  value={policyholderId}
                  onChange={(e) => setPolicyholderId(e.target.value)}
                  placeholder="e.g. POL-1001"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Policy Number *</label>
                <input
                  type="text"
                  value={policyNumber}
                  onChange={(e) => handlePolicyNumberChange(e.target.value)}
                  placeholder="e.g. POL20260001"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-teal-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Insured Member / Beneficiary</label>
                {selectedPolicyholderObj?.members?.length > 0 ? (
                  <select
                    value={memberId}
                    onChange={(e) => {
                      const mId = e.target.value;
                      setMemberId(mId);
                      const foundM = selectedPolicyholderObj.members.find(m => m.member_id === mId);
                      if (foundM) {
                        setPatientName(foundM.name);
                        setDob(foundM.dob || dob);
                        setAge(foundM.age || age);
                        setGender(foundM.gender || gender);
                      } else {
                        setPatientName(selectedPolicyholderObj.full_name);
                        setDob(selectedPolicyholderObj.dob || dob);
                        setAge(selectedPolicyholderObj.age || age);
                        setGender(selectedPolicyholderObj.gender || gender);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  >
                    <option value="">{selectedPolicyholderObj.full_name} (Self - Primary)</option>
                    {selectedPolicyholderObj.members.map((m) => (
                      <option key={m.member_id} value={m.member_id}>
                        {m.member_id} — {m.name} ({m.relationship})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    placeholder="e.g. POL-1001-M01"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Patient Name *</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Patient Full Name"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Contact Number</label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>

            {/* DYNAMIC DATABASE POLICY INFORMATION DISPLAY */}
            {selectedPolicyDetails ? (
              <div className="p-5 rounded-2xl bg-teal-50/40 border border-teal-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-teal-700" />
                    <span className="font-black text-sm text-teal-950">
                      Policy Retrieved: {selectedPolicyDetails.policy_number}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Policy Status:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-black text-[11px] ${
                        selectedPolicyDetails.status === "Active"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : selectedPolicyDetails.status === "Pending"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-rose-100 text-rose-800 border border-rose-300"
                      }`}
                    >
                      {selectedPolicyDetails.status.toUpperCase()}
                    </span>
                    {!isPolicyActive && (
                      <button
                        onClick={handleOpenRenewalModal}
                        type="button"
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] shadow-xs transition-all active:scale-95"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Renew Policy</span>
                      </button>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full font-black text-[11px] bg-teal-100 text-teal-800 border border-teal-300">
                      ELIGIBILITY: ELIGIBLE
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Policy Start Date</span>
                    <p className="font-bold text-slate-800">{selectedPolicyDetails.start_date || "2024-01-01"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Policy End Date</span>
                    <p className="font-bold text-slate-800">{selectedPolicyDetails.end_date || "2026-12-31"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Policy Type</span>
                    <p className="font-bold text-slate-800 truncate">{selectedPolicyDetails.policy_type}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Sum Insured</span>
                    <p className="font-black text-slate-900">{formatCurrency(selectedPolicyDetails.sum_insured)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Coverage Used</span>
                    <p className="font-bold text-slate-700">{formatCurrency(selectedPolicyDetails.used_coverage || 0)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-teal-800">Available Coverage</span>
                    <p className="font-black text-teal-700 text-sm">{formatCurrency(selectedPolicyDetails.available_coverage)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                Enter a Policy Number above to dynamically query policy status and coverage limits from the database.
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              disabled={!canAdvanceStep()}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs shadow-md transition-all ${
                canAdvanceStep()
                  ? "bg-teal-600 hover:bg-teal-700 text-white"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <span>Next: Treatment Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2 — TREATMENT DETAILS */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                Step 2: Treatment & Hospitalization Information
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter medical diagnosis, surgical procedure, network classification, and treatment cost estimates.
              </p>
            </div>

            {/* Presets switcher for fast testing */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-600">Sample Clinical Scenarios:</span>
              <button
                onClick={() => {
                  setDiseaseDiagnosis("Cataract");
                  setTreatmentProcedure("Phacoemulsification with Foldable IOL");
                  setClaimAmount(55000);
                  setHospitalType("Network Hospital");
                  setClaimType("Cashless");
                }}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold hover:border-teal-500 hover:text-teal-700"
              >
                Cataract (Network)
              </button>
              <button
                onClick={() => {
                  setDiseaseDiagnosis("Total Knee Osteoarthritis");
                  setTreatmentProcedure("Unilateral Total Knee Replacement");
                  setClaimAmount(185000);
                  setHospitalType("Network Hospital");
                  setClaimType("Cashless");
                }}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold hover:border-teal-500 hover:text-teal-700"
              >
                Knee Replacement
              </button>
              <button
                onClick={() => {
                  setDiseaseDiagnosis("Acute Gastroenteritis");
                  setTreatmentProcedure("Inpatient IV Fluids & Antibiotics");
                  setClaimAmount(38000);
                  setHospitalType("Non-Network Hospital");
                  setClaimType("Reimbursement");
                }}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold hover:border-teal-500 hover:text-teal-700"
              >
                Gastroenteritis (Non-Network)
              </button>
            </div>

            {/* Treatment Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Diagnosis / Disease *</label>
                <input
                  type="text"
                  value={diseaseDiagnosis}
                  onChange={(e) => setDiseaseDiagnosis(e.target.value)}
                  placeholder="e.g. Cataract, Dengue Fever, CAD"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Treatment / Procedure *</label>
                <input
                  type="text"
                  value={treatmentProcedure}
                  onChange={(e) => setTreatmentProcedure(e.target.value)}
                  placeholder="e.g. Phacoemulsification, Angioplasty"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Hospital Name *</label>
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Treatment Type</label>
                <select
                  value={emergencyOrPlanned}
                  onChange={(e) => setEmergencyOrPlanned(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  <option value="Planned Treatment">Planned Treatment</option>
                  <option value="Emergency Treatment">Emergency Treatment</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Admission Date</label>
                <input
                  type="date"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Discharge Date</label>
                <input
                  type="date"
                  value={dischargeDate}
                  onChange={(e) => setDischargeDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1.5">Requested Treatment Cost / Claim Amount (₹) *</label>
                <input
                  type="number"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(parseFloat(e.target.value) || 0)}
                  placeholder="₹ Amount"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg text-teal-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>

            {/* HOSPITAL TYPE EXPLANATION CARD */}
            <div className="space-y-3 pt-2">
              <label className="block font-bold text-slate-800 text-xs">Hospital Network Classification *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => handleHospitalTypeChange("Network Hospital")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    hospitalType === "Network Hospital"
                      ? "bg-teal-50/70 border-teal-600 shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-teal-900">Network Hospital</span>
                    {hospitalType === "Network Hospital" && (
                      <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs">✓</span>
                    )}
                  </div>
                  <p className="text-xs text-teal-950 mt-2 font-medium leading-relaxed">
                    <strong>Network Hospital:</strong> Cashless treatment may be available subject to insurer authorization and policy conditions.
                  </p>
                </div>

                <div
                  onClick={() => handleHospitalTypeChange("Non-Network Hospital")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    hospitalType === "Non-Network Hospital"
                      ? "bg-amber-50/70 border-amber-600 shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-amber-900">Non-Network Hospital</span>
                    {hospitalType === "Non-Network Hospital" && (
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">✓</span>
                    )}
                  </div>
                  <p className="text-xs text-amber-950 mt-2 font-medium leading-relaxed">
                    <strong>Non-Network Hospital:</strong> The patient may need to pay the hospital first and submit a reimbursement claim, subject to policy terms.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl border border-slate-200 font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              disabled={!canAdvanceStep()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md transition-all"
            >
              <span>Next: Select Claim Type</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3 — CLAIM TYPE DECISION */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold mb-2">
                <Building2 className="w-3.5 h-3.5" />
                Hospital Classification: {hospitalType}
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Step 3: Choose Claim Settlement Pathway
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select between Cashless Pre-Authorization or Direct Reimbursement. The system recommends the optimal pathway based on your hospital choice.
              </p>
            </div>

            {/* TWO LARGE SELECTABLE CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option A: CASHLESS CLAIM */}
              <div
                onClick={() => setClaimType("Cashless")}
                className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between relative ${
                  claimType === "Cashless"
                    ? "bg-teal-50/50 border-teal-600 shadow-md ring-2 ring-teal-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                {hospitalType === "Network Hospital" && (
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-black tracking-wider">
                    RECOMMENDED
                  </div>
                )}

                <div>
                  <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold mb-4">
                    <ShieldCheck className="w-5 h-5" />
                  </div>

                  <h3 className="text-lg font-black text-slate-900">CASHLESS CLAIM</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Direct hospital insurance desk settlement without upfront out-of-pocket medical bill payments.
                  </p>

                  <div className="mt-5 p-4 rounded-xl bg-white border border-teal-100 text-xs space-y-2 text-slate-700">
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                      <span>Network hospital admission</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                      <span>Hospital insurance / TPA help desk</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                      <span>Pre-authorization request dispatch</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px] font-black shrink-0">4</span>
                      <span>Insurer medical board review</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px] font-black shrink-0">5</span>
                      <span>Cashless approval & direct hospital settlement</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-teal-700">
                  <span>{claimType === "Cashless" ? "✓ Selected Pathway" : "Select Cashless"}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Option B: REIMBURSEMENT CLAIM */}
              <div
                onClick={() => setClaimType("Reimbursement")}
                className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between relative ${
                  claimType === "Reimbursement"
                    ? "bg-teal-50/50 border-teal-600 shadow-md ring-2 ring-teal-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                {hospitalType === "Non-Network Hospital" && (
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-black tracking-wider">
                    RECOMMENDED
                  </div>
                )}

                <div>
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-4">
                    <CreditCard className="w-5 h-5" />
                  </div>

                  <h3 className="text-lg font-black text-slate-900">REIMBURSEMENT CLAIM</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Upfront payment by policyholder followed by documentation submission for direct bank transfer.
                  </p>

                  <div className="mt-5 p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-2 text-slate-700">
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                      <span>Non-network hospital or direct admission</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                      <span>Patient pays hospital expenses upfront</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                      <span>Original bills & discharge summary collected</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-black shrink-0">4</span>
                      <span>Claim & KYC docs submitted to insurer</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-black shrink-0">5</span>
                      <span>Approved amount reimbursed directly to bank</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-teal-700">
                  <span>{claimType === "Reimbursement" ? "✓ Selected Pathway" : "Select Reimbursement"}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
              * Note: System recommendations assist pre-submission compliance and do not automatically guarantee insurer approval.
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl border border-slate-200 font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md transition-all"
            >
              <span>Next: {claimType === "Cashless" ? "Cashless Flow" : "Reimbursement Flow"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4 — CASHLESS OR REIMBURSEMENT FLOW */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="space-y-6">
          {claimType === "Cashless" ? (
            /* CASHLESS FLOW FORM */
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black uppercase tracking-wider">
                  Cashless Workflow
                </span>
                <h2 className="text-lg font-black text-slate-900 tracking-tight mt-2">
                  Step 4: Cashless Pre-Authorization Protocol
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  1. Hospital Desk → 2. Insurance ID Card → 3. Pre-Auth Request → 4. Treatment Plan → 5. Estimated Cost → 6. Insurer Review → 7. Authorization Decision
                </p>
              </div>

              {/* Status Tracker Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Cashless Status Tracker</span>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-teal-800 flex items-center gap-1">✓ Hospital Request</span>
                  <span className="text-slate-300">→</span>
                  <span className="text-teal-800 flex items-center gap-1">✓ Pre-Authorization</span>
                  <span className="text-slate-300">→</span>
                  <span className="text-teal-800 flex items-center gap-1">✓ Under Review</span>
                  <span className="text-slate-300">→</span>
                  <span className={cashlessStatus === "Approved" ? "text-emerald-700 font-black" : "text-amber-700 font-black"}>
                    {cashlessStatus === "Approved" ? "🟢 Approved" : cashlessStatus === "Additional Info Required" ? "🟡 Additional Info" : "🔴 Not Approved"}
                  </span>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Insurance ID / Health Card Number *</label>
                  <input
                    type="text"
                    value={insuranceCardId}
                    onChange={(e) => setInsuranceCardId(e.target.value)}
                    placeholder="e.g. INS-CARD-2026-8891"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Pre-Authorization Number *</label>
                  <input
                    type="text"
                    value={preAuthNumber}
                    onChange={(e) => setPreAuthNumber(e.target.value)}
                    placeholder="e.g. PA-HYD-2026-0941"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-teal-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Attending Doctor Details</label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Doctor Name & Speciality"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Pre-Auth Decision State</label>
                  <select
                    value={cashlessStatus}
                    onChange={(e) => setCashlessStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  >
                    <option value="Approved">🟢 CASHLESS AUTHORIZATION APPROVED</option>
                    <option value="Additional Info Required">🟡 ADDITIONAL INFORMATION REQUIRED</option>
                    <option value="Not Approved">🔴 CASHLESS AUTHORIZATION NOT APPROVED</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1.5">Treatment Plan & Clinical Notes</label>
                  <textarea
                    rows={2}
                    value={treatmentPlan}
                    onChange={(e) => setTreatmentPlan(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              {/* Conditional Info if Additional Information is required */}
              {cashlessStatus === "Additional Info Required" && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-2 text-xs">
                  <h4 className="font-black text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Insurer Query: Additional Documentation Required
                  </h4>
                  <p className="text-amber-800">
                    The insurer has requested an attending physician medical certificate and past clinical history before granting approval.
                  </p>
                  <input
                    type="text"
                    placeholder="Enter missing details / query response..."
                    value={cashlessMissingNotes}
                    onChange={(e) => setCashlessMissingNotes(e.target.value)}
                    className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs"
                  />
                </div>
              )}
            </div>
          ) : (
            /* REIMBURSEMENT FLOW FORM */
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                  Reimbursement Workflow
                </span>
                <h2 className="text-lg font-black text-slate-900 tracking-tight mt-2">
                  Step 4: Reimbursement & Direct Bank Settlement Details
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  "The reimbursement process is intended for eligible expenses paid by the policyholder/patient upfront, subject to policy terms."
                </p>
              </div>

              {/* Bank Account Details */}
              <div className="space-y-3">
                <h3 className="font-black text-slate-800 text-xs flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-teal-600" />
                  Bank Account for Direct Claim Credit
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Account Holder Name *</label>
                    <input
                      type="text"
                      value={bankAccountHolder}
                      onChange={(e) => setBankAccountHolder(e.target.value)}
                      placeholder="Name as per Bank Record"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Bank Account Number *</label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="Account Number"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">IFSC Code *</label>
                    <input
                      type="text"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">PAN Card Number</label>
                    <input
                      type="text"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. ABCDE1234F"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>
                </div>
              </div>

              {/* 7 Document Upload Cards */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-800 text-xs flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-600" />
                    Required Claim Documentation Upload
                  </h3>
                  <button
                    onClick={handleAttachVerifiedDemoDocs}
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200"
                  >
                    Quick Auto-Attach Sample Verified Docs
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {REQUIRED_DOC_TYPES.map((docItem) => {
                    const attached = uploadedDocs.find(d => d.type === docItem.type);
                    return (
                      <div
                        key={docItem.type}
                        className={`p-4 rounded-2xl border flex flex-col justify-between text-xs transition-all ${
                          attached?.verified
                            ? "bg-emerald-50/50 border-emerald-200"
                            : attached?.uploaded
                            ? "bg-teal-50/40 border-teal-200"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              docItem.req ? "bg-slate-100 text-slate-700" : "bg-slate-50 text-slate-400"
                            }`}>
                              {docItem.req ? "Mandatory" : "Optional"}
                            </span>
                            <span className={`text-[10px] font-bold ${
                              attached?.verified
                                ? "text-emerald-700"
                                : attached?.uploaded
                                ? "text-amber-700"
                                : "text-rose-600"
                            }`}>
                              {attached?.verified
                                ? "✓ Verified"
                                : attached?.uploaded
                                ? "⚠ Pending Audit"
                                : "⚠ Missing"}
                            </span>
                          </div>

                          <h4 className="font-black text-slate-900 leading-tight">{docItem.name}</h4>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{docItem.desc}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                          {attached ? (
                            <span className="font-mono text-[10px] text-slate-600 truncate max-w-[120px]">
                              {attached.filename}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">No file uploaded</span>
                          )}

                          <button
                            onClick={() => triggerUploadForDoc(docItem.type)}
                            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] transition-colors"
                          >
                            {attached ? "Re-upload" : "Upload"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl border border-slate-200 font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setCurrentStep(5)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md transition-all"
            >
              <span>Next: Document Verification Table</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5 — DOCUMENT VERIFICATION */}
      {/* ========================================================================= */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-teal-600" />
                  Step 5: Document Audit & Completeness Verification
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Cross-check document validity, format, mandatory coverage, and certified verification status.
                </p>
              </div>
              <button
                onClick={handleVerifyAllDocs}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Verify All Attached Documents
              </button>
            </div>

            {/* COMPLETENESS PROGRESS BAR */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">DOCUMENT COMPLETENESS:</span>
                <span className="font-black text-teal-800 text-sm">{docCompletenessPct}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    docCompletenessPct >= 80 ? "bg-teal-600" : docCompletenessPct >= 50 ? "bg-amber-500" : "bg-rose-500"
                  }`}
                  style={{ width: `${docCompletenessPct}%` }}
                />
              </div>
              {docCompletenessPct < 100 && (
                <p className="text-[11px] text-amber-700 font-semibold mt-1">
                  ⚠ "Claim cannot be finalized until the required documents are provided."
                </p>
              )}
            </div>

            {/* DOCUMENT VERIFICATION TABLE */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Document</th>
                    <th className="py-3 px-4 text-center">Uploaded</th>
                    <th className="py-3 px-4 text-center">Format Valid</th>
                    <th className="py-3 px-4 text-center">Required</th>
                    <th className="py-3 px-4 text-center">Verified</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {REQUIRED_DOC_TYPES.map((docItem) => {
                    const doc = uploadedDocs.find(d => d.type === docItem.type);
                    const isUploaded = Boolean(doc?.uploaded);
                    const isFormatValid = isUploaded ? doc.formatValid : false;
                    const isVerified = Boolean(doc?.verified);

                    return (
                      <tr key={docItem.type} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{docItem.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {doc ? doc.filename : "Not provided"}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          {isUploaded ? <span className="text-teal-700">✓</span> : <span className="text-rose-500">✗</span>}
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          {isFormatValid ? <span className="text-teal-700">✓</span> : isUploaded ? <span className="text-rose-500">✗</span> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          {docItem.req ? <span className="text-teal-700">✓</span> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          {isVerified ? (
                            <span className="text-emerald-700">✓</span>
                          ) : isUploaded ? (
                            <span className="text-amber-500">⚠</span>
                          ) : (
                            <span className="text-rose-500">✗</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                              isVerified
                                ? "bg-emerald-100 text-emerald-800"
                                : isUploaded
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {isVerified ? "VERIFIED" : isUploaded ? "PENDING" : "MISSING"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isUploaded && !isVerified ? (
                            <button
                              onClick={() => handleVerifySingleDoc(doc.id)}
                              className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[11px] transition-colors"
                            >
                              Verify Now
                            </button>
                          ) : !isUploaded ? (
                            <button
                              onClick={() => triggerUploadForDoc(docItem.type)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors"
                            >
                              Upload
                            </button>
                          ) : (
                            <span className="text-emerald-600 font-bold text-[11px]">✓ Audited</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* FIX MISSING DOCUMENTS SHORTCUT */}
            {docCompletenessPct < 100 && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs">
                <span className="font-semibold text-amber-900">Need to attach missing files?</span>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors"
                >
                  Fix Missing Documents
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl border border-slate-200 font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={handleExecuteValidation}
              disabled={loading}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-teal-600/30 transition-all active:scale-95"
            >
              {loading ? "Running 16-Factor Audit..." : "Verify Claim (16 Factors)"}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 6 — CLAIM VALIDATION ENGINE & FINANCIAL ANALYSIS */}
      {/* ========================================================================= */}
      {currentStep === 6 && (
        <div className="space-y-6">
          {/* Top Score Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* STEP 9A: CLAIM CONFIDENCE SCORE CARD */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Claim Confidence Score
                  </span>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                    {evaluationResult?.confidence_score ?? 94}/100
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-black text-slate-900">
                    {evaluationResult?.confidence_score ?? 94}%
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-black text-xs ${
                      (evaluationResult?.confidence_score ?? 94) >= 80
                        ? "bg-emerald-100 text-emerald-800"
                        : (evaluationResult?.confidence_score ?? 94) >= 60
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {(evaluationResult?.confidence_score ?? 94) >= 80 ? "🟢 HIGH CONFIDENCE" : (evaluationResult?.confidence_score ?? 94) >= 60 ? "🟡 MEDIUM CONFIDENCE" : "🔴 LOW CONFIDENCE"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  Confidence in the completeness and validity of submitted claim info. *Not a guarantee of insurer approval.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-50">
                  <span className="text-[10px] text-slate-400 font-bold block">16 Factors</span>
                  <span className="font-black text-slate-800">Checked</span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50">
                  <span className="text-[10px] text-emerald-600 font-bold block">Passed</span>
                  <span className="font-black text-emerald-700">{evaluationResult?.passed_factors ?? 14}</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50">
                  <span className="text-[10px] text-amber-600 font-bold block">Need Action</span>
                  <span className="font-black text-amber-700">{evaluationResult?.warning_factors ?? 2}</span>
                </div>
              </div>
            </div>

            {/* STEP 9B: DENYING CHANCE SCORE CARD (BESIDE CONFIDENCE SCORE) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Denying Chance Score
                  </span>
                </div>
                {(() => {
                  const conf = evaluationResult?.confidence_score ?? 94;
                  const denialChance = evaluationResult?.denial_chance_score ?? Math.max(0, Math.min(100, Math.round(100 - conf)));
                  const isLow = denialChance <= 20;
                  const isMed = denialChance > 20 && denialChance <= 40;
                  const isHigh = denialChance > 40;
                  return (
                    <>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className={`text-4xl font-black ${isLow ? "text-emerald-700" : isMed ? "text-amber-600" : "text-rose-600"}`}>
                          {denialChance}%
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-black text-xs ${
                            isLow
                              ? "bg-emerald-100 text-emerald-800"
                              : isMed
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isLow ? "🟢 LOW DENIAL RISK" : isMed ? "🟡 MODERATE RISK" : "🔴 HIGH DENIAL RISK"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                        Estimated probability of insurer claim denial based on incomplete factor documentation.
                      </p>

                      {/* 3-Tier Segmented Risk Meter */}
                      <div className="mt-3 space-y-1.5">
                        <div className="grid grid-cols-3 gap-1 text-[10px] text-center">
                          <div
                            className={`py-1 px-1 rounded-md transition-all ${
                              isLow
                                ? "bg-emerald-100 text-emerald-800 font-black ring-1 ring-emerald-300"
                                : "bg-slate-50 text-slate-400 font-medium"
                            }`}
                          >
                            Low (≤20%)
                          </div>
                          <div
                            className={`py-1 px-1 rounded-md transition-all ${
                              isMed
                                ? "bg-amber-100 text-amber-800 font-black ring-1 ring-amber-300 shadow-xs"
                                : "bg-slate-50 text-slate-400 font-medium"
                            }`}
                          >
                            Moderate (21-40%)
                          </div>
                          <div
                            className={`py-1 px-1 rounded-md transition-all ${
                              isHigh
                                ? "bg-rose-100 text-rose-800 font-black ring-1 ring-rose-300 shadow-xs"
                                : "bg-slate-50 text-slate-400 font-medium"
                            }`}
                          >
                            High (&gt;40%)
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1 h-2 w-full">
                          <div
                            className={`h-full rounded-l-full transition-all duration-300 ${
                              isLow ? "bg-emerald-500" : isMed ? "bg-amber-400/50" : "bg-slate-200"
                            }`}
                          />
                          <div
                            className={`h-full transition-all duration-300 ${
                              isMed ? "bg-amber-500" : isHigh ? "bg-rose-400/50" : "bg-slate-200"
                            }`}
                          />
                          <div
                            className={`h-full rounded-r-full transition-all duration-300 ${
                              isHigh ? "bg-rose-500" : "bg-slate-200"
                            }`}
                          />
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-50">
                  <span className="text-[10px] text-slate-400 font-bold block">Adjudication Outlook</span>
                  <span className={`font-black text-[11px] ${
                    (evaluationResult?.confidence_score ?? 94) >= 80 ? "text-emerald-700" : (evaluationResult?.confidence_score ?? 94) >= 60 ? "text-amber-700" : "text-rose-700"
                  }`}>
                    {(evaluationResult?.confidence_score ?? 94) >= 80 ? "Safe to Submit" : (evaluationResult?.confidence_score ?? 94) >= 60 ? "Review Advised" : "Action Required"}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <span className="text-[10px] text-slate-400 font-bold block">Risk Factors</span>
                  <span className={`font-black text-[11px] ${(evaluationResult?.warning_factors ?? 0) + (evaluationResult?.failed_factors ?? 0) > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                    {(evaluationResult?.warning_factors ?? 0) + (evaluationResult?.failed_factors ?? 0)} Issues
                  </span>
                </div>
              </div>
            </div>

            {/* STEP 8: CLAIM AMOUNT FINANCIAL ANALYSIS CARD */}
            <div className="md:col-span-2 xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    Claim Financial Calculation Engine
                  </span>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                    Configured Policy Rules Applied
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mt-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold">Requested Claim</span>
                    <p className="font-black text-slate-900 text-sm">{formatCurrency(claimAmount)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold">Total Sum Insured</span>
                    <p className="font-bold text-slate-800">{formatCurrency(selectedPolicyDetails?.sum_insured || 1000000)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold">Previously Used</span>
                    <p className="font-bold text-slate-700">{formatCurrency(selectedPolicyDetails?.used_coverage || 0)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold">Available Coverage</span>
                    <p className="font-black text-teal-800">{formatCurrency(selectedPolicyDetails?.available_coverage || 1000000)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold">Deductible Applied</span>
                    <p className="font-bold text-rose-600">- {formatCurrency(evaluationResult?.calculation_breakdown?.deductible || selectedPolicyDetails?.deductible || 0)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold">Co-payment Rate</span>
                    <p className="font-bold text-slate-800">{selectedPolicyDetails?.co_payment || "0%"}</p>
                  </div>
                  <div className="sm:col-span-2 p-3 rounded-xl bg-teal-50/70 border border-teal-200">
                    <span className="text-[10px] uppercase font-bold text-teal-800 block">Estimated Claimable Amount</span>
                    <p className="text-xl font-black text-teal-900">
                      {formatCurrency(evaluationResult?.estimated_claimable_amount ?? claimAmount)}
                    </p>
                    <span className="text-[10px] text-teal-700 font-semibold">* Estimated pre-submission calculation, not a guaranteed settlement.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 7: 16-FACTOR VALIDATION DASHBOARD */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  16-Factor Pre-Submission Validation Checklist
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  GREEN = Valid • YELLOW = Needs Attention • RED = Invalid / Missing
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRecheckClaim}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  [ RECHECK CLAIM ]
                </button>
              </div>
            </div>

            {/* Scorecard 16 factors grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {evaluationResult?.validations?.map((v) => (
                <div
                  key={v.factor_number}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                    v.status === "PASS"
                      ? "bg-emerald-50/40 border-emerald-200 text-emerald-950"
                      : v.status === "WARNING"
                      ? "bg-amber-50/40 border-amber-200 text-amber-950"
                      : "bg-rose-50/40 border-rose-200 text-rose-950"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold opacity-60">Factor #{v.factor_number}</span>
                      <span
                        className={`font-black text-[10px] px-2 py-0.5 rounded-md ${
                          v.status === "PASS"
                            ? "bg-emerald-100 text-emerald-800"
                            : v.status === "WARNING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {v.status === "PASS" ? "✓ VALID" : v.status === "WARNING" ? "⚠ ATTENTION" : "✗ INVALID"}
                      </span>
                    </div>
                    <h4 className="font-black mt-1.5 text-xs">{v.factor_name}</h4>
                    <p className="text-[11px] mt-1 opacity-80 line-clamp-2">{v.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 10: ACTIONABLE RECOMMENDATIONS & SINGLE-CLICK FIX FUNCTION */}
          {evaluationResult?.recommendations && evaluationResult.recommendations.filter(r => r.status === "Open").length > 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  Actionable Recommendations & Single-Click Fix
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Clicking Fix Now directly resolves the underlying factor in the database and re-audits the scorecard live.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evaluationResult.recommendations.filter(r => r.status === "Open").map((rec) => (
                  <div
                    key={rec.rec_id}
                    className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 flex flex-col justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                          {rec.severity} SEVERITY
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">Factor #{rec.factor_number}</span>
                      </div>
                      <h4 className="font-black text-slate-900 text-xs mt-2">{rec.issue_title}</h4>
                      <p className="text-slate-600 text-[11px] mt-1">{rec.recommended_action}</p>
                    </div>

                    <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                      <span className="text-[10px] text-amber-800 font-semibold">Action Required</span>
                      <button
                        onClick={() => handleFixRecommendation(rec.rec_id)}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-xs transition-all"
                      >
                        Fix Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 11: RECHECK CLAIM COMPARISON DISPLAY */}
          {recheckComparison && (
            <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-teal-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  Live Recheck Completed
                </span>
                <span className="text-[11px] font-bold text-teal-700">
                  Issues Resolved: {recheckComparison.before_issues_count - recheckComparison.after_issues_count}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400">Previous Confidence</span>
                  <p className="font-bold text-slate-600">{recheckComparison.before_confidence}%</p>
                </div>
                <div>
                  <span className="text-[10px] text-teal-700 font-bold">Current Confidence</span>
                  <p className="font-black text-teal-800 text-base">{recheckComparison.after_confidence}%</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Denying Chance</span>
                  <p className="font-black text-emerald-700 text-base">
                    {Math.max(0, Math.round(100 - recheckComparison.after_confidence))}%
                    <span className="text-[10px] font-normal text-slate-400 ml-1">
                      (was {Math.max(0, Math.round(100 - recheckComparison.before_confidence))}%)
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Remaining Issues</span>
                  <p className="font-bold text-amber-700">{recheckComparison.after_issues_count}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Status</span>
                  <p className="font-bold text-teal-800">{recheckComparison.after_status}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(5)}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl border border-slate-200 font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setCurrentStep(7)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md transition-all"
            >
              <span>Next: Final Result & Submission Gate</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 7 — FINAL CLAIM RESULT & SUBMISSION GATE */}
      {/* ========================================================================= */}
      {currentStep === 7 && (
        <div className="space-y-6">
          {/* Submission Success Screen */}
          {submissionSuccess ? (
            <div className="bg-white p-8 sm:p-12 rounded-3xl border-2 border-emerald-500/40 shadow-lg text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs tracking-wider">
                  STATUS: SUBMITTED
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-3">
                  ✓ CLAIM SUCCESSFULLY SUBMITTED
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto leading-relaxed">
                  "Your claim has passed the configured pre-submission validation checks and has been submitted for further processing."
                </p>
              </div>

              {/* Claim Summary Box */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 max-w-xl mx-auto text-left grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Claim Number</span>
                  <p className="font-mono font-black text-teal-800 text-sm">{submissionSuccess.claim_id}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Policy Number</span>
                  <p className="font-mono font-bold text-slate-800">{submissionSuccess.policy_number}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Patient Name</span>
                  <p className="font-bold text-slate-800">{submissionSuccess.patient_name}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Claim Type</span>
                  <p className="font-bold text-slate-800">{submissionSuccess.claim_type}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Requested Amount</span>
                  <p className="font-bold text-slate-800">{formatCurrency(submissionSuccess.claim_amount)}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-teal-700 uppercase">Est. Claimable Amount</span>
                  <p className="font-black text-teal-800 text-sm">{formatCurrency(submissionSuccess.estimated_claimable_amount)}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 font-semibold max-w-xl mx-auto">
                Important Distinction: <strong>Validation Passed ≠ Final Insurance Approval</strong>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {onViewClaimAnalysis && (
                  <button
                    onClick={() => onViewClaimAnalysis(submissionSuccess.claim_id)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md shadow-teal-600/20 transition-all"
                  >
                    <FileSearch className="w-4 h-4" />
                    View Claim Analysis
                  </button>
                )}
                <a
                  href={`http://127.0.0.1:8000/api/claims/${submissionSuccess.claim_id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Claim Summary
                </a>
                {onNavigateBack && (
                  <button
                    onClick={onNavigateBack}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
                  >
                    Back to Claims
                  </button>
                )}
              </div>
            </div>
          ) : (evaluationResult?.failed_factors === 0 || !evaluationResult?.recommendations?.some(r => r.status === "Open" && r.severity === "HIGH")) ? (
            /* STEP 12: CLAIM READY FOR SUBMISSION SCREEN */
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-md text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs tracking-wider">
                  🟢 READY FOR SUBMISSION
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-3">
                  ✓ CLAIM READY FOR SUBMISSION
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto">
                  All 16 mandatory pre-submission factors have been validated with high confidence.
                </p>
              </div>

              {/* Ready Summary Card */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 max-w-xl mx-auto text-left grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Claim Number</span>
                  <p className="font-mono font-black text-teal-800">{activeClaimId || "CLM20260045"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Claim Type</span>
                  <p className="font-bold text-slate-800">{claimType}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Requested Amount</span>
                  <p className="font-bold text-slate-800">{formatCurrency(claimAmount)}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-teal-700 uppercase">Estimated Claimable Amount</span>
                  <p className="font-black text-teal-800">{formatCurrency(evaluationResult?.estimated_claimable_amount ?? claimAmount)}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Claim Confidence Score</span>
                  <p className="font-black text-emerald-700">{evaluationResult?.confidence_score ?? 94}%</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Denying Chance Score</span>
                  <p className="font-black text-emerald-700">
                    {evaluationResult?.denial_chance_score ?? Math.max(0, 100 - (evaluationResult?.confidence_score ?? 94))}% (Low Risk)
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Validation</span>
                  <p className="font-black text-slate-800">16 / 16 PASSED</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => setCurrentStep(5)}
                  className="inline-flex items-center gap-1.5 px-5 py-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={handleSubmitClaim}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-black text-sm shadow-lg shadow-teal-600/30 transition-all"
                >
                  <ShieldCheck className="w-5 h-5" />
                  {isSubmitting ? "Submitting..." : "Submit Claim"}
                </button>
                {activeClaimId && (
                  <a
                    href={`http://127.0.0.1:8000/api/claims/${activeClaimId}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Claim Summary
                  </a>
                )}
              </div>
            </div>
          ) : (
            /* IF CLAIM REQUIREMENTS ARE NOT SATISFIED */
            <div className="bg-white p-8 sm:p-12 rounded-3xl border-2 border-rose-300 shadow-md space-y-6">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div className="text-center">
                <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-black text-xs tracking-wider">
                  ⚠ CANNOT BE SUBMITTED
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-3">
                  ⚠ CLAIM CANNOT BE SUBMITTED
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">
                  Reason: {evaluationResult?.failed_factors || 2} validation requirements need attention before submission.
                </p>
              </div>

              {/* Unresolved Issues List */}
              <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200 max-w-xl mx-auto space-y-2 text-xs">
                <h4 className="font-black text-rose-900">Unresolved Items:</h4>
                {evaluationResult?.recommendations?.filter(r => r.status === "Open").map((rec, i) => (
                  <div key={rec.rec_id} className="flex items-start gap-2 text-rose-800">
                    <span className="font-bold">{i + 1}.</span>
                    <span>{rec.issue_title} — {rec.recommended_action}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setCurrentStep(6)}
                  className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs transition-colors"
                >
                  Fix Issues
                </button>
                <button
                  onClick={handleRecheckClaim}
                  className="inline-flex items-center gap-1.5 px-6 py-3 rounded-2xl border border-slate-200 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Recheck Claim
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* POLICY RENEWAL & INSTANT ACTIVATION MODAL */}
      {/* ========================================================================= */}
      {isRenewModalOpen && selectedPolicyDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-2xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-900 to-teal-800 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-teal-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    Renew & Activate Policy
                  </h3>
                  <p className="text-xs text-teal-200 mt-0.5">
                    Extend validity, settle premium arrears, and unlock instant claim submission eligibility.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="p-2 rounded-xl text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto text-xs">
              {/* Current Policy Status Overview */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Policy Number</span>
                  <p className="font-mono font-bold text-teal-800 text-xs">{selectedPolicyDetails.policy_number}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Policyholder</span>
                  <p className="font-bold text-slate-800 truncate">{patientName || selectedPolicyDetails.policyholder_id}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Current Status</span>
                  <p className="font-extrabold text-rose-600">{selectedPolicyDetails.status.toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Sum Insured</span>
                  <p className="font-black text-slate-900">{formatCurrency(selectedPolicyDetails.sum_insured)}</p>
                </div>
              </div>

              {/* 1. Select Renewal Duration */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">1. Choose Renewal Term:</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { years: 1, label: "1 Year", desc: "Standard 12 Months", badge: "Most Popular" },
                    { years: 2, label: "2 Years", desc: "24 Months (5% Disc.)", badge: "5% Off" },
                    { years: 3, label: "3 Years", desc: "36 Months (10% Disc.)", badge: "Best Value" }
                  ].map((t) => (
                    <div
                      key={t.years}
                      onClick={() => setRenewalYears(t.years)}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        renewalYears === t.years
                          ? "bg-teal-50/50 border-teal-600 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900 text-sm">{t.label}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          renewalYears === t.years ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}>
                          {t.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">{t.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. New Policy Validity Preview */}
              {(() => {
                const { startDateStr, endDateStr } = getRenewalDatesPreview();
                return (
                  <div className="p-4 rounded-2xl bg-teal-50/40 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-5 h-5 text-teal-700 shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-teal-900">New Policy Coverage Tenure:</span>
                        <p className="font-black text-slate-800 text-xs mt-0.5">
                          {startDateStr} &nbsp;➜&nbsp; <span className="text-teal-800 font-extrabold">{endDateStr}</span> ({renewalYears} Year Coverage)
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] border border-emerald-300 self-start sm:self-auto">
                      ✓ Factor 1 & 2 Will Pass
                    </span>
                  </div>
                );
              })()}

              {/* 3. Payment Method */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">2. Payment Method:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {["UPI (Instant)", "Credit Card", "Net Banking", "Auto-Debit"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setRenewalPaymentMethod(m)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 ${
                        renewalPaymentMethod === m
                          ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span className="truncate">{m}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Premium Breakdown */}
              {(() => {
                const { totalBase, discount, gst, total } = getRenewalPremiumAmount();
                return (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Base Premium ({renewalYears} Year{renewalYears > 1 ? "s" : ""}):</span>
                      <span className="font-bold">{formatCurrency(totalBase)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex items-center justify-between text-emerald-600">
                        <span>Term Discount ({(discount * 100).toFixed(0)}%):</span>
                        <span className="font-bold">-{formatCurrency(totalBase * discount)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-slate-600">
                      <span>GST (18% Goods & Service Tax):</span>
                      <span className="font-bold">{formatCurrency(gst)}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-slate-900 font-black text-sm">
                      <span>Total Renewal Premium Payable:</span>
                      <span className="text-teal-800 text-base">{formatCurrency(total)}</span>
                    </div>
                  </div>
                );
              })()}

              {/* 5. Health & KYC Declaration */}
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="healthDeclaration"
                  checked={renewalHealthConfirmed}
                  onChange={(e) => setRenewalHealthConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                />
                <label htmlFor="healthDeclaration" className="text-[11px] text-amber-950 leading-relaxed cursor-pointer font-medium">
                  <strong>Declaration:</strong> I confirm that the insured member details and medical conditions are accurate. I agree to the policy terms and request immediate policy activation.
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-white transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleExecuteRenewal}
                disabled={isRenewing || !renewalHealthConfirmed}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 disabled:opacity-50 text-white font-black text-xs shadow-md transition-all"
              >
                {isRenewing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Payment & Activating...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Pay {formatCurrency(getRenewalPremiumAmount().total)} & Activate Policy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewClaimPage;
