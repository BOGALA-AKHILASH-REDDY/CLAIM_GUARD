import React, { useState, useEffect } from "react";
import { 
  CheckSquare, CheckCircle2, AlertTriangle, AlertOctagon, 
  FileText, ArrowRight, ShieldAlert, UserCheck, Stethoscope, Lock,
  Receipt, CopyCheck, RefreshCw, Eye
} from "lucide-react";
import api from "../services/api";
import { formatCurrency } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";

const CATEGORY_ICONS = {
  "Policy Issues": ShieldAlert,
  "Eligibility Issues": UserCheck,
  "Treatment Issues": Stethoscope,
  "Authorization Issues": Lock,
  "Documentation Issues": FileText,
  "Amount / Coverage Issues": Receipt,
  "Duplicate Claim Issues": CopyCheck
};

const ClaimRecommendationsPage = ({ onSelectClaim, onNavigateTab }) => {
  const { user } = useAuth();
  const isPolicyholder = user?.role === "policyholder";
  const loggedInPid = user?.policyholder_id || user?.user_id;

  const [categories, setCategories] = useState([]);
  const [totalOpen, setTotalOpen] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fixingId, setFixingId] = useState(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const pidQuery = isPolicyholder && loggedInPid ? `?policyholder_id=${loggedInPid}` : "";
      const res = await api.get(`/claims/recommendations/grouped${pidQuery}`);
      setCategories(res.data.categories || []);
      setTotalOpen(res.data.total_open_recommendations || 0);
    } catch (err) {
      console.error("Error fetching grouped recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [isPolicyholder, loggedInPid]);

  const handleFixItem = async (claimId, recId) => {
    try {
      setFixingId(recId);
      await api.post(`/claims/${claimId}/recommendations/${recId}/fix`);
      alert("Issue resolved! Claim factor re-audited.");
      fetchRecommendations();
    } catch (err) {
      alert("Failed to resolve issue.");
    } finally {
      setFixingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-teal-600" />
              Claim Denial Prevention Recommendations Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black">
              {totalOpen} Actionable Items
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Grouped denial prevention tasks categorized across 7 risk categories with instant 1-click corrective resolution.
          </p>
        </div>

        <button
          onClick={fetchRecommendations}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors self-start sm:self-auto"
          title="Refresh Items"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* 7 Categorized Sections */}
      {loading ? (
        <div className="bg-white p-12 text-center text-slate-400 rounded-2xl">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
          Loading categorized denial prevention recommendations...
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.category_name] || CheckSquare;
            const hasItems = cat.items && cat.items.length > 0;

            return (
              <div key={cat.category_name} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                {/* Category Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900 tracking-tight">{cat.category_name}</h2>
                      <p className="text-[11px] text-slate-500">
                        {hasItems ? `${cat.items.length} open claim item(s) requiring attention` : "Zero issues detected — fully compliant"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full font-black text-xs ${
                      hasItems
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {hasItems ? `${cat.items.length} Action Needed` : "✓ Clear"}
                  </span>
                </div>

                {/* Items Grid */}
                {hasItems ? (
                  <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cat.items.map((item) => (
                      <div
                        key={item.rec_id}
                        className="p-4 rounded-2xl border bg-amber-50/40 border-amber-200 flex flex-col justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-black text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                              {item.severity} SEVERITY
                            </span>
                            <span className="font-mono font-bold text-teal-800 text-[11px]">{item.claim_id}</span>
                          </div>

                          <h3 className="font-black text-slate-900 text-xs mt-2">{item.issue_title}</h3>
                          <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">{item.recommended_action}</p>

                          <div className="mt-3 pt-2 border-t border-amber-200/60 text-[11px] text-slate-500 space-y-0.5">
                            <p>Patient: <strong className="text-slate-800">{item.patient_name}</strong></p>
                            <p>Policy: <span className="font-mono text-slate-700">{item.policy_number}</span></p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                          <button
                            onClick={() => {
                              if (onSelectClaim) onSelectClaim(item.claim_id);
                              if (onNavigateTab) onNavigateTab("claim-analysis");
                            }}
                            className="text-teal-700 font-bold hover:underline text-[11px]"
                          >
                            View Audit →
                          </button>

                          <button
                            onClick={() => handleFixItem(item.claim_id, item.rec_id)}
                            disabled={fixingId === item.rec_id}
                            className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-xs transition-all"
                          >
                            {fixingId === item.rec_id ? "Fixing..." : "Fix Now"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No active {cat.category_name.toLowerCase()} found across policy records.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClaimRecommendationsPage;
