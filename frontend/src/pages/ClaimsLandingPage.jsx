import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, PlusCircle, History, FileSearch, CheckSquare, 
  ArrowRight, Clock, CheckCircle2, AlertTriangle, XCircle, 
  TrendingUp, FileText, RefreshCw, Eye, Download, Shield
} from "lucide-react";
import api from "../services/api";
import { formatCurrency, getStatusBadgeColor, getRiskBadgeColor } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";

const ClaimsLandingPage = ({ onNavigateTab, onSelectClaim }) => {
  const { user } = useAuth();
  const isPolicyholder = user?.role === "policyholder";
  const loggedInPid = user?.policyholder_id || user?.user_id;

  const [analytics, setAnalytics] = useState(null);
  const [recentClaims, setRecentClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const pidQuery = isPolicyholder && loggedInPid ? `?policyholder_id=${loggedInPid}` : "";
      const pidParam = isPolicyholder && loggedInPid ? `&policyholder_id=${loggedInPid}` : "";
      
      const [analyticsRes, claimsRes] = await Promise.all([
        api.get(`/claims/analytics/summary${pidQuery}`),
        api.get(`/claims?limit=8${pidParam}`)
      ]);

      setAnalytics(analyticsRes.data);
      setRecentClaims(claimsRes.data);
    } catch (err) {
      console.error("Failed to load claims hub:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isPolicyholder, loggedInPid]);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold mb-3">
            <Shield className="w-3.5 h-3.5" />
            Healthcare Claim Pre-Submission Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Claim Denial Prevention & Processing Module
          </h1>
          <p className="text-sm text-teal-100/80 mt-1 max-w-2xl">
            Verify insurance claims before submission. Automatically determine eligibility, recommended claim pathway, missing documentation, claimable amounts, and prevent denials.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateTab("new-claim")}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-teal-500/30 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            + New Claim Wizard
          </button>
          <button
            onClick={fetchData}
            title="Refresh Data"
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4 PRIMARY NAVIGATION MODULE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: New Claim */}
        <div
          onClick={() => onNavigateTab("new-claim")}
          className="group relative bg-white p-5 rounded-2xl border-2 border-teal-500/30 hover:border-teal-600 hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-bold mb-3 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h2 className="text-base font-black text-slate-900 tracking-tight group-hover:text-teal-700 transition-colors">
              + New Claim
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Step-by-step 7-phase wizard to evaluate patient eligibility, hospital pathway, documents, and 16-factor audit.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700">
            <span>Launch Wizard</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Claim History */}
        <div
          onClick={() => onNavigateTab("claim-history")}
          className="group relative bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-slate-400 hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold mb-3 group-hover:scale-110 transition-transform">
              <History className="w-5 h-5" />
            </div>
            <h2 className="text-base font-black text-slate-900 tracking-tight group-hover:text-teal-700 transition-colors">
              Claim History
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Searchable ledger of all evaluated claims with statuses, scores, estimated amounts, and audit details.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>View Ledger</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Claim Analysis */}
        <div
          onClick={() => onNavigateTab("claim-analysis")}
          className="group relative bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-teal-500/50 hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-bold mb-3 group-hover:scale-110 transition-transform">
              <FileSearch className="w-5 h-5" />
            </div>
            <h2 className="text-base font-black text-slate-900 tracking-tight group-hover:text-teal-700 transition-colors">
              Claim Analysis
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Deep-dive 16-factor validation scorecard, financial breakdown calculations, denial probability & PDF exports.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700">
            <span>Analyze Metrics</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: Claim Recommendations */}
        <div
          onClick={() => onNavigateTab("claim-recommendations")}
          className="group relative bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-amber-500/50 hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 font-bold mb-3 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h2 className="text-base font-black text-slate-900 tracking-tight group-hover:text-teal-700 transition-colors">
              Claim Recommendations
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Categorized denial prevention items across 7 failure buckets with single-click auto-correction.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
            <span>Fix Issues</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* 4 SUMMARY STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Claims</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {loading ? "..." : analytics?.total_claims || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Evaluated in claim repository</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Claims</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {loading ? "..." : (analytics?.pending_claims || 0) + (analytics?.needs_correction_claims || 0)}
          </p>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">Requires audit / corrections</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Approved Claims</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {loading ? "..." : (analytics?.approved_claims || 0) + (analytics?.ready_for_submission_claims || 0) + (analytics?.submitted_claims || 0)}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Pre-submission verified</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Rejected Claims</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 font-bold">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {loading ? "..." : analytics?.rejected_claims || 0}
          </p>
          <p className="text-[11px] text-rose-600 font-semibold mt-1">Exclusions / High risk</p>
        </div>
      </div>

      {/* RECENT CLAIMS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <History className="w-4 h-4 text-teal-600" />
              Recent Claims & Audit Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live records with calculated claimable amounts, confidence scores, and statuses.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab("claim-history")}
            className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 hover:underline"
          >
            <span>View Complete History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Claim Number</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Policy Number</th>
                <th className="py-3 px-4">Claim Type</th>
                <th className="py-3 px-4">Claim Amount</th>
                <th className="py-3 px-4">Est. Claimable</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    Loading recent claims ledger...
                  </td>
                </tr>
              ) : recentClaims.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    No claims created yet. Click "+ New Claim" to start.
                  </td>
                </tr>
              ) : (
                recentClaims.map((c) => (
                  <tr key={c.claim_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-800">{c.claim_id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{c.patient_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{c.policy_number}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                        c.claim_type === "Cashless" 
                          ? "bg-teal-50 text-teal-800 border border-teal-200" 
                          : "bg-slate-100 text-slate-800 border border-slate-200"
                      }`}>
                        {c.claim_type || "Reimbursement"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatCurrency(c.claim_amount)}</td>
                    <td className="py-3 px-4 font-black text-teal-800">
                      {c.estimated_claimable_amount > 0 ? formatCurrency(c.estimated_claimable_amount) : "₹0"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusBadgeColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {c.claim_submission_date || "2026-08-14"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          if (onSelectClaim) onSelectClaim(c.claim_id);
                          onNavigateTab("claim-analysis");
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Audit
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
  );
};

export default ClaimsLandingPage;
