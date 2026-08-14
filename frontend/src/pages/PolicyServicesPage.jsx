import React, { useState, useEffect } from "react";
import { 
  UserPlus, RefreshCw, AlertOctagon, Gift, ShieldCheck, 
  CheckCircle2, AlertCircle, FileText, ArrowRight, DollarSign, Clock 
} from "lucide-react";
import api from "../services/api";
import { formatCurrency } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";

const PolicyServicesPage = ({ initialTab = "transfer" }) => {
  const { user } = useAuth();
  const loggedInPid = user?.policyholder_id || user?.user_id;

  const [activeSubTab, setActiveSubTab] = useState(initialTab);
  
  // Sync tab when prop changes
  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

  // Registry data
  const [policyholders, setPolicyholders] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [surrenders, setSurrenders] = useState([]);
  const [arrears, setArrears] = useState([]);
  const [benefitTransfers, setBenefitTransfers] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [phRes, tRes, sRes, aRes, bRes, rRes] = await Promise.all([
        api.get("/policyholders?limit=100"),
        api.get("/policy-services/transfers"),
        api.get("/policy-services/surrenders"),
        api.get("/policy-services/arrears"),
        api.get("/policy-services/benefit-transfers"),
        api.get("/policies/renewals/history")
      ]);
      setPolicyholders(phRes.data);
      setTransfers(tRes.data);
      setSurrenders(sRes.data);
      setArrears(aRes.data);
      setBenefitTransfers(bRes.data);
      setRenewals(rRes.data);

      // Auto-bind to logged in user if available
      const currentPid = loggedInPid || "POL-1001";
      const ph = phRes.data.find((p) => p.policyholder_id === currentPid) || phRes.data[0];
      if (ph) {
        const polNum = ph.policies && ph.policies.length > 0 ? ph.policies[0].policy_number : `HLT-2026-${ph.policyholder_id}`;
        const nomName = ph.members && ph.members.length > 0 ? ph.members[0].name : "Family Nominee";
        const nomRel = ph.members && ph.members.length > 0 ? ph.members[0].relationship : "Spouse";
        const sumIns = ph.policies && ph.policies.length > 0 ? ph.policies[0].sum_insured : 1000000;

        setTransferForm({
          policyholder_id: ph.policyholder_id,
          policy_number: polNum,
          nominee_id: `NOM-${ph.policyholder_id}-01`,
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

        setBenefitForm({
          policyholder_id: ph.policyholder_id,
          policy_number: polNum,
          beneficiary_id: `BEN-${ph.policyholder_id}-02`,
          beneficiary_name: nomName,
          relationship: nomRel,
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
      await api.post("/policy-services/transfer", transferForm);
      alert(`Nominee Transfer Request for ${transferForm.policyholder_id} (${transferForm.nominee_name}) registered and approved!`);
      fetchAllData();
    } catch (err) {
      console.error(err);
      alert("Failed to submit transfer request.");
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

  const handleSettleArrear = async (arrearId, amt) => {
    try {
      await api.post("/policy-services/arrears/settle", {
        arrear_id: arrearId,
        payment_amount: amt,
        payment_method: "UPI"
      });
      alert(`Arrears for ${arrearId} settled! Policy restored to Active status and claim eligibility reactivated.`);
      fetchAllData();
    } catch (err) {
      alert("Settlement failed.");
    }
  };

  const handleBenefitSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post("/policy-services/benefit-transfer", benefitForm);
      alert("Benefit Rollover Transfer registered and approved!");
      fetchAllData();
    } catch (err) {
      alert("Failed to submit benefit transfer.");
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
                      onChange={(e) => setTransferForm({ ...transferForm, policyholder_id: e.target.value })}
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Relationship</label>
                    <select
                      value={transferForm.relationship}
                      onChange={(e) => setTransferForm({ ...transferForm, relationship: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
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

      {/* FEATURE 3: ARREARS & CONTINUATION */}
      {activeSubTab === "continuation" && (
        <div className="space-y-6">
          {/* Dedicated Feature Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
                <span className="w-2 h-2 rounded-full bg-teal-600" />
                Policy Services
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-teal-600" />
                Policy Continuation & Overdue Arrears
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Clear overdue premium arrears within 30-day grace period to restore active policy coverage and claim eligibility.
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

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">Arrears & Grace Status</h3>
                <p className="text-xs text-slate-500">
                  Lapsed policies due to pending premium can be restored immediately by clearing outstanding arrears.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                30-Day Grace Protection
              </span>
            </div>

            <div className="space-y-3">
              {arrears.map((a) => {
                const isSettled = a.settlement_status === "Settled";
                return (
                  <div key={a.arrear_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">{a.arrear_id}</span>
                        <span className="font-bold text-slate-900">{a.policyholder_id}</span>
                        <span className="font-mono text-slate-500">({a.policy_number})</span>
                      </div>
                      <p className="text-slate-500 mt-1">
                        Grace Period: <span className="font-bold text-slate-700">{a.grace_period_days} Days</span> • Total Due: <span className="font-bold text-slate-800">{formatCurrency(a.total_due)}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-rose-500">Outstanding</span>
                        <p className="text-base font-extrabold text-rose-600">
                          {isSettled ? "₹0 (Cleared)" : formatCurrency(a.outstanding_balance)}
                        </p>
                      </div>

                      {!isSettled ? (
                        <button
                          onClick={() => handleSettleArrear(a.arrear_id, a.outstanding_balance)}
                          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shadow-sm transition-all whitespace-nowrap"
                        >
                          Settle Arrear & Restore Policy
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-bold border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Eligibility Restored
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
                      onChange={(e) => setBenefitForm({ ...benefitForm, policyholder_id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Relationship</label>
                    <select
                      value={benefitForm.relationship}
                      onChange={(e) => setBenefitForm({ ...benefitForm, relationship: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="Spouse">Spouse / Soulmate</option>
                      <option value="Child">Child</option>
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
