import React, { useState, useEffect } from "react";
import { 
  History, Search, Filter, Eye, Download, ShieldCheck, ArrowUpDown, 
  X, CheckCircle2, AlertTriangle, XCircle, FileText, RefreshCw,
  Building2, CreditCard, Calendar, ArrowRight, Clock, UserCheck
} from "lucide-react";
import api from "../services/api";
import { formatCurrency, getRiskBadgeColor, getStatusBadgeColor } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";

const ClaimHistoryPage = ({ onSelectClaim }) => {
  const { user } = useAuth();
  const isPolicyholder = user?.role === "policyholder" || Boolean(user?.policyholder_id);
  const loggedInPid = user?.policyholder_id || (user?.role === "policyholder" ? user?.user_id : null);

  const [activeLedgerTab, setActiveLedgerTab] = useState("claims"); // "claims" or "renewals"
  const [claims, setClaims] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [claimTypeFilter, setClaimTypeFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Selected claim modal for full details
  const [viewingClaim, setViewingClaim] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [scopeFilter, setScopeFilter] = useState("MINE"); // For providers: "ALL" or "MINE"

  const fetchClaims = async () => {
    try {
      setLoading(true);
      // Strict claim isolation: policyholders always filter by their own ID
      const targetPid = isPolicyholder ? loggedInPid : (scopeFilter === "MINE" ? loggedInPid : "");
      const pidParam = targetPid ? `&policyholder_id=${targetPid}` : "";
      
      const res = await api.get(
        `/claims?limit=200${pidParam}${search ? `&search=${search}` : ""}${
          statusFilter !== "ALL" ? `&status=${statusFilter}` : ""
        }${riskFilter !== "ALL" ? `&risk=${riskFilter}` : ""}${
          claimTypeFilter !== "ALL" ? `&claim_type=${claimTypeFilter}` : ""
        }`
      );
      setClaims(res.data);
    } catch (err) {
      console.error("Error fetching claims:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRenewals = async () => {
    try {
      setLoading(true);
      const targetPid = isPolicyholder ? loggedInPid : (scopeFilter === "MINE" ? loggedInPid : "");
      const pidParam = targetPid ? `?policyholder_id=${targetPid}` : "";
      const res = await api.get(`/policies/renewals/history${pidParam}`);
      setRenewals(res.data);
    } catch (err) {
      console.error("Error fetching renewals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeLedgerTab === "claims") {
      fetchClaims();
    } else {
      fetchRenewals();
    }
  }, [search, statusFilter, claimTypeFilter, riskFilter, scopeFilter, loggedInPid, isPolicyholder, activeLedgerTab]);

  const openClaimDetails = async (claimId) => {
    try {
      setLoadingDetails(true);
      const res = await api.get(`/claims/${claimId}`);
      setViewingClaim(res.data);
    } catch (err) {
      console.error("Error fetching claim details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-teal-600" />
            {isPolicyholder ? `My History & Audit Ledger (${user?.full_name || loggedInPid})` : "Claims & Policy History Ledger"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isPolicyholder 
              ? `Historical claims record and policy renewal ledger for policyholder ${loggedInPid}.` 
              : "Searchable historical ledger of all evaluated claims, 16-factor audit logs, and policy renewals with verified status transitions."}
          </p>
        </div>
        <button
          onClick={activeLedgerTab === "claims" ? fetchClaims : fetchRenewals}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors self-start sm:self-auto"
          title="Refresh Table"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Ledger Tab Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-fit border border-slate-200 text-xs">
        <button
          onClick={() => setActiveLedgerTab("claims")}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeLedgerTab === "claims"
              ? "bg-white text-teal-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Claims Audit Ledger ({claims.length})</span>
        </button>
        <button
          onClick={() => setActiveLedgerTab("renewals")}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeLedgerTab === "renewals"
              ? "bg-white text-teal-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <RefreshCw className="w-4 h-4 text-teal-600" />
          <span>Policy Renewals & Reactivations ({renewals.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. CLAIMS AUDIT LEDGER VIEW */}
      {/* ========================================================================= */}
      {activeLedgerTab === "claims" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Claim ID, Patient, Policy, Diagnosis..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Scope Filter for Providers / Admins only */}
              {!isPolicyholder && (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-500">Scope:</span>
                  <select
                    value={scopeFilter}
                    onChange={(e) => setScopeFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  >
                    <option value="ALL">All Claim Audits</option>
                    {loggedInPid && <option value="MINE">My Claims ({loggedInPid})</option>}
                  </select>
                </div>
              )}

              {/* Policyholder active indicator */}
              {isPolicyholder && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 font-bold text-xs">
                  <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                  Account: {loggedInPid}
                </span>
              )}

              {/* Claim Type Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-500">Type:</span>
                <select
                  value={claimTypeFilter}
                  onChange={(e) => setClaimTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  <option value="ALL">All Types</option>
                  <option value="Cashless">Cashless</option>
                  <option value="Reimbursement">Reimbursement</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Ready for Submission">Ready for Submission</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="Claim is Approved">Approved</option>
                  <option value="Needs Review">Needs Review</option>
                  <option value="Needs Correction">Needs Correction</option>
                  <option value="High Risk">High Risk</option>
                </select>
              </div>

              {/* Risk Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-500">Risk:</span>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  <option value="ALL">All Risk Levels</option>
                  <option value="LOW">Low Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="HIGH">High Risk</option>
                </select>
              </div>
            </div>
          </div>

          {/* Claims Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Claim ID</th>
                    <th className="py-3.5 px-4">Policy Number</th>
                    <th className="py-3.5 px-4">Patient</th>
                    <th className="py-3.5 px-4">Claim Type</th>
                    <th className="py-3.5 px-4">Claim Amount</th>
                    <th className="py-3.5 px-4">Est. Claimable</th>
                    <th className="py-3.5 px-4 text-center">Confidence</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">Submission Date</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="10" className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                        Loading claims ledger...
                      </td>
                    </tr>
                  ) : claims.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="py-12 text-center text-slate-400">
                        No claims match the selected search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    claims.map((c) => (
                      <tr key={c.claim_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-teal-800">{c.claim_id}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">{c.policy_number}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{c.patient_name}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{c.disease_diagnosis}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                            c.claim_type === "Cashless"
                              ? "bg-teal-50 text-teal-800 border border-teal-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}>
                            {c.claim_type || "Reimbursement"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{formatCurrency(c.claim_amount)}</td>
                        <td className="py-3.5 px-4 font-black text-teal-800">
                          {c.estimated_claimable_amount > 0 ? formatCurrency(c.estimated_claimable_amount) : "₹0"}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full font-black text-[11px] border ${getRiskBadgeColor(c.risk_level)}`}>
                            {c.confidence_score}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusBadgeColor(c.status)}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                          {c.claim_submission_date || "2026-08-14"}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => openClaimDetails(c.claim_id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Details & History
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. POLICY RENEWALS & REACTIVATIONS LEDGER VIEW */}
      {/* ========================================================================= */}
      {activeLedgerTab === "renewals" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Policy Renewal & Instant Reactivation Audit Trail
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete audit records of renewed policies with previous tenure vs extended tenure, premium payment receipts, and timestamps.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Renewal ID</th>
                  <th className="py-3.5 px-4">Policy Number</th>
                  <th className="py-3.5 px-4">Policyholder</th>
                  <th className="py-3.5 px-4">Previous Expiry</th>
                  <th className="py-3.5 px-4">New Active Term</th>
                  <th className="py-3.5 px-4">Premium Paid</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Processed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                      Loading policy renewal records...
                    </td>
                  </tr>
                ) : renewals.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-400">
                      No policy renewal records found. Inactive policies renewed via Step 1 or Policy Services will be logged here.
                    </td>
                  </tr>
                ) : (
                  renewals.map((r) => (
                    <tr key={r.renewal_id || r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-800">{r.renewal_id}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 font-bold text-[11px]">{r.policy_number}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{r.policyholder_id}</td>
                      <td className="py-3.5 px-4 font-mono text-rose-600 text-[11px]">{r.previous_end_date}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-emerald-800 text-[11px]">
                          {r.new_start_date} ➜ {r.new_end_date}
                        </div>
                        <span className="text-[10px] text-slate-400">Active Extended Tenure</span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900">{formatCurrency(r.premium_amount)}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                          <CreditCard className="w-3 h-3 text-slate-500" />
                          {r.payment_method}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {r.renewal_status || "Active & Renewed"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {r.created_at ? String(r.created_at).substring(0, 19).replace("T", " ") : "Just now"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CLAIM DETAILS & COMPLETE AUDIT HISTORY MODAL */}
      {/* ========================================================================= */}
      {viewingClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-teal-800">{viewingClaim.claim_id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusBadgeColor(viewingClaim.status)}`}>
                    {viewingClaim.status}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Claim Audit & Activity Details: {viewingClaim.patient_name} ({viewingClaim.disease_diagnosis})
                </h3>
              </div>
              <button
                onClick={() => setViewingClaim(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto text-xs">
              {/* Financial & Policy Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-teal-50/40 border border-teal-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Policy Number</span>
                  <p className="font-mono font-bold text-slate-800">{viewingClaim.policy_number}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Claim Type</span>
                  <p className="font-bold text-slate-800">{viewingClaim.claim_type}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Requested Amount</span>
                  <p className="font-bold text-slate-800">{formatCurrency(viewingClaim.claim_amount)}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-teal-700 uppercase">Est. Claimable Amount</span>
                  <p className="font-black text-teal-800 text-sm">{formatCurrency(viewingClaim.estimated_claimable_amount)}</p>
                </div>
              </div>

              {/* Complete Audit & Activity Timeline */}
              {viewingClaim.history && viewingClaim.history.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                    <History className="w-4 h-4 text-teal-600" />
                    Complete Claim Audit & Status History ({viewingClaim.history.length} Events)
                  </h4>
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {viewingClaim.history.map((h, idx) => (
                      <div
                        key={h.id || idx}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                            {h.action.toLowerCase().includes("renew") ? (
                              <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                            ) : h.action.toLowerCase().includes("submit") ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-teal-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900 text-xs">{h.action}</span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-200 text-slate-700">
                                {h.actor || "System Audit"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-medium">
                              {h.notes || `Status transitioned to ${h.new_status}`}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 sm:justify-end">
                            {h.previous_status && (
                              <>
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${getStatusBadgeColor(h.previous_status)}`}>
                                  {h.previous_status}
                                </span>
                                <span className="text-slate-400 font-bold">➜</span>
                              </>
                            )}
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${getStatusBadgeColor(h.new_status)}`}>
                              {h.new_status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            {h.timestamp ? String(h.timestamp).substring(0, 19).replace("T", " ") : "Recent"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 16 Factor Validation Checklist */}
              <div>
                <h4 className="font-black text-slate-900 text-xs mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  16-Factor Audit Results ({viewingClaim.confidence_score}% Confidence Score)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {viewingClaim.validations?.map((v) => (
                    <div
                      key={v.factor_number}
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        v.status === "PASS"
                          ? "bg-emerald-50/40 border-emerald-200 text-emerald-950"
                          : v.status === "WARNING"
                          ? "bg-amber-50/40 border-amber-200 text-amber-950"
                          : "bg-rose-50/40 border-rose-200 text-rose-950"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold block truncate">#{v.factor_number} {v.factor_name}</span>
                        <span className="text-[10px] opacity-70 block truncate">{v.message}</span>
                      </div>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded ${
                          v.status === "PASS"
                            ? "bg-emerald-100 text-emerald-800"
                            : v.status === "WARNING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attached Documents */}
              {viewingClaim.documents && viewingClaim.documents.length > 0 && (
                <div>
                  <h4 className="font-black text-slate-900 text-xs mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-600" />
                    Attached Claim Documentation ({viewingClaim.documents.length} Files)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {viewingClaim.documents.map((d) => (
                      <div key={d.doc_id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{d.document_name || d.filename}</p>
                          <p className="text-[10px] text-slate-400">{d.document_type} • {d.verification_status}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          d.verification_status === "Verified" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {d.verification_status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <a
                href={`http://127.0.0.1:8000/api/claims/${viewingClaim.claim_id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download Audit PDF Report
              </a>
              <button
                onClick={() => setViewingClaim(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimHistoryPage;

