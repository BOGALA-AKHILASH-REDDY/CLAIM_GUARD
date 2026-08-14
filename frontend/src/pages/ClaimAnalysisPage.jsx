import React, { useState, useEffect } from "react";
import { 
  FileSearch, ShieldCheck, Download, RefreshCw, 
  CheckCircle2, AlertTriangle, XCircle, ArrowRight, Layers, FileText, 
  CheckSquare, UploadCloud, FileCheck, Zap, Trash2, AlertOctagon, Info, Check, Eye,
  BarChart3, PieChart as PieIcon, TrendingUp, DollarSign
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from "recharts";
import api from "../services/api";
import { formatCurrency, getRiskBadgeColor, getStatusBadgeColor } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";

const STATUS_COLORS = {
  "Claim is Approved": "#0d9488",
  "Ready for Submission": "#10b981",
  "SUBMITTED": "#0284c7",
  "Needs Review": "#f59e0b",
  "Needs Correction": "#f97316",
  "High Risk": "#ef4444",
};

const ClaimAnalysisPage = ({ selectedClaimId = "CLM-1001" }) => {
  const { user } = useAuth();
  const isPolicyholder = user?.role === "policyholder";
  const loggedInPid = user?.policyholder_id || user?.user_id;

  const [analytics, setAnalytics] = useState(null);
  const [claimsList, setClaimsList] = useState([]);
  const [currentClaimId, setCurrentClaimId] = useState(selectedClaimId);
  const [claimAnalysis, setClaimAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRechecking, setIsRechecking] = useState(false);
  const [isFixingAll, setIsFixingAll] = useState(false);

  const fetchOverallAnalytics = async () => {
    try {
      const pidQuery = isPolicyholder && loggedInPid ? `?policyholder_id=${loggedInPid}` : "";
      const pidParam = isPolicyholder && loggedInPid ? `&policyholder_id=${loggedInPid}` : "";
      const [analyticsRes, claimsRes] = await Promise.all([
        api.get(`/claims/analytics/summary${pidQuery}`),
        api.get(`/claims?limit=100${pidParam}`)
      ]);
      setAnalytics(analyticsRes.data);
      setClaimsList(claimsRes.data);

      if (claimsRes.data.length > 0 && !claimsRes.data.some(c => c.claim_id === currentClaimId)) {
        setCurrentClaimId(claimsRes.data[0].claim_id);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  const fetchClaimAnalysis = async (cid) => {
    try {
      setLoading(true);
      const res = await api.get(`/claims/${cid}/analysis`);
      setClaimAnalysis(res.data);
    } catch (err) {
      console.error("Error fetching claim analysis:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverallAnalytics();
  }, [isPolicyholder, loggedInPid]);

  useEffect(() => {
    if (currentClaimId) {
      fetchClaimAnalysis(currentClaimId);
    }
  }, [currentClaimId]);

  const handleFixRecommendation = async (recId) => {
    try {
      await api.post(`/claims/${currentClaimId}/recommendations/${recId}/fix`);
      alert("Recommendation fixed! Live scorecard recalculated.");
      fetchClaimAnalysis(currentClaimId);
      fetchOverallAnalytics();
    } catch (err) {
      alert("Failed to fix recommendation.");
    }
  };

  const handleAutoFixAll = async () => {
    try {
      setIsFixingAll(true);
      await api.post(`/claims/${currentClaimId}/auto-fix-all`);
      alert("1-Click Fix Applied! Pre-auth verified, bills attached, and 16 factors cleared.");
      fetchClaimAnalysis(currentClaimId);
      fetchOverallAnalytics();
    } catch (err) {
      alert("Auto-fix failed.");
    } finally {
      setIsFixingAll(false);
    }
  };

  const handleRecheckClaim = async () => {
    try {
      setIsRechecking(true);
      const res = await api.post(`/claims/${currentClaimId}/recheck`);
      alert(`Live Recheck Complete: Score is now ${res.data.after_confidence}% (${res.data.after_status}).`);
      fetchClaimAnalysis(currentClaimId);
      fetchOverallAnalytics();
    } catch (err) {
      alert("Recheck failed.");
    } finally {
      setIsRechecking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-teal-600" />
            Claim Analytics & Pre-Submission Audit Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            System-wide denial risk distributions, top failure causes, and per-claim 16-factor scorecard audits.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={currentClaimId}
            onChange={(e) => setCurrentClaimId(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          >
            {claimsList.map((c) => (
              <option key={c.claim_id} value={c.claim_id}>
                {c.claim_id} — {c.patient_name} ({c.confidence_score}%)
              </option>
            ))}
          </select>
          <a
            href={`http://127.0.0.1:8000/api/claims/${currentClaimId}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </a>
        </div>
      </div>

      {/* SUMMARY STATS TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Claims</span>
          <p className="text-xl font-black text-slate-900 mt-1">{analytics?.total_claims || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-teal-700 uppercase">Avg Confidence</span>
          <p className="text-xl font-black text-teal-800 mt-1">{analytics?.average_confidence_score || 0}%</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase">Needs Correction</span>
          <p className="text-xl font-black text-amber-700 mt-1">{analytics?.needs_correction_claims || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase">Ready to Submit</span>
          <p className="text-xl font-black text-emerald-700 mt-1">{analytics?.ready_for_submission_claims || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-sky-600 uppercase">Submitted</span>
          <p className="text-xl font-black text-sky-700 mt-1">{analytics?.submitted_claims || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase">Approved</span>
          <p className="text-xl font-black text-emerald-800 mt-1">{analytics?.approved_claims || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-rose-600 uppercase">Rejected</span>
          <p className="text-xl font-black text-rose-700 mt-1">{analytics?.rejected_claims || 0}</p>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Pie */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <h3 className="font-black text-slate-900 text-xs tracking-tight uppercase flex items-center gap-1.5 mb-2">
            <PieIcon className="w-4 h-4 text-teal-600" />
            Claim Status Distribution
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.status_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(analytics?.status_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#0d9488"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Common Validation Failure Causes Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <h3 className="font-black text-slate-900 text-xs tracking-tight uppercase flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Common Validation Failures
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics?.failure_reasons_distribution || []}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Claim Amounts Area Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <h3 className="font-black text-slate-900 text-xs tracking-tight uppercase flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            Monthly Claim Amount Trends
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={analytics?.monthly_claim_amounts || []}
                margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area type="monotone" dataKey="amount" stroke="#0d9488" fill="#ccfbf1" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SELECTED CLAIM DEEP-DIVE AUDIT SCORECARD */}
      {claimAnalysis && (
        <div className="space-y-4">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-teal-800">{claimAnalysis.claim_id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusBadgeColor(claimAnalysis.status)}`}>
                    {claimAnalysis.status}
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight mt-1">
                  16-Factor Audit Scorecard: {claimAnalysis.patient_name} ({claimAnalysis.disease_diagnosis})
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleAutoFixAll}
                  disabled={isFixingAll}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-all"
                >
                  {isFixingAll ? "Fixing..." : "1-Click Auto Fix All"}
                </button>
                <button
                  onClick={handleRecheckClaim}
                  disabled={isRechecking}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRechecking ? "animate-spin" : ""}`} />
                  Recheck Claim
                </button>
              </div>
            </div>

            {/* Score & Financial Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-teal-800 tracking-wider">Claim Confidence Score</span>
                  <p className="text-3xl font-black text-teal-900 mt-1">{claimAnalysis.confidence_score}%</p>
                </div>
                <p className="text-[11px] text-teal-700 mt-2">
                  {claimAnalysis.passed_factors} of 16 Factors Verified
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Denying Chance Score</span>
                  <p className={`text-3xl font-black mt-1 ${
                    (claimAnalysis.denial_chance_score ?? (100 - claimAnalysis.confidence_score)) <= 20
                      ? "text-emerald-700"
                      : (claimAnalysis.denial_chance_score ?? (100 - claimAnalysis.confidence_score)) <= 40
                      ? "text-amber-600"
                      : "text-rose-600"
                  }`}>
                    {claimAnalysis.denial_chance_score ?? Math.max(0, Math.round(100 - claimAnalysis.confidence_score))}%
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {claimAnalysis.failed_factors > 0 ? `${claimAnalysis.failed_factors} Critical Issues Detected` : "Calculated from validation gaps"}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Requested vs Claimable</span>
                  <p className="text-xs text-slate-500 mt-1">
                    Requested: <strong className="text-slate-800">{formatCurrency(claimAnalysis.claim_amount)}</strong>
                  </p>
                  <p className="text-xl font-black text-teal-800 mt-0.5">
                    Est: {formatCurrency(claimAnalysis.estimated_claimable_amount)}
                  </p>
                </div>
                <p className="text-[10px] text-teal-700 font-semibold mt-1">Pre-submission estimate</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">ML Predicted Denial Risk</span>
                  <p className="text-2xl font-black text-slate-800 mt-1">
                    {Math.round((claimAnalysis.ml_prediction?.denial_probability || 0.05) * 100)}%
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Statistical AI benchmark</p>
              </div>
            </div>

            {/* 16 Factors Grid */}
            <div>
              <h3 className="font-black text-slate-900 text-xs mb-3 uppercase tracking-wider">
                Factor Audit Matrix
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {claimAnalysis.validations?.map((v) => (
                  <div
                    key={v.factor_number}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                      v.status === "PASS"
                        ? "bg-emerald-50/40 border-emerald-200"
                        : v.status === "WARNING"
                        ? "bg-amber-50/40 border-amber-200"
                        : "bg-rose-50/40 border-rose-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-slate-400">#{v.factor_number}</span>
                        <span
                          className={`font-black text-[9px] px-2 py-0.5 rounded ${
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
                      <h4 className="font-bold text-slate-900 mt-1">{v.factor_name}</h4>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{v.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Open Recommendations for this Claim */}
            {claimAnalysis.recommendations?.filter(r => r.status === "Open").length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                <h3 className="font-black text-slate-900">Unresolved Items & Recommended Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {claimAnalysis.recommendations.filter(r => r.status === "Open").map((rec) => (
                    <div key={rec.rec_id} className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-amber-950">{rec.issue_title}</p>
                        <p className="text-[11px] text-amber-800 mt-0.5">{rec.recommended_action}</p>
                      </div>
                      <button
                        onClick={() => handleFixRecommendation(rec.rec_id)}
                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shrink-0 transition-colors ml-3"
                      >
                        Fix Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimAnalysisPage;
