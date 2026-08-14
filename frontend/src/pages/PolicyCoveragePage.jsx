import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, Shield, AlertCircle, Calendar, CheckCircle2, 
  XCircle, TrendingUp, DollarSign, Layers, Percent, Clock, AlertTriangle, RefreshCw 
} from "lucide-react";
import api from "../services/api";
import { formatCurrency } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";

const PolicyCoveragePage = () => {
  const { user } = useAuth();
  const isPolicyholder = user?.role === "policyholder";
  const loggedInPid = user?.policyholder_id || user?.user_id;

  const [policies, setPolicies] = useState([]);
  const [selectedPol, setSelectedPol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const url = loggedInPid ? `/policies/policyholder/${loggedInPid}` : "/policies";
      const res = await api.get(url);
      setPolicies(res.data);
      if (res.data.length > 0) {
        setSelectedPol(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [loggedInPid]);

  const handleQuickRenew = async () => {
    if (!selectedPol) return;
    try {
      setRenewing(true);
      const res = await api.post(`/policies/${selectedPol.policy_number}/renew`, {
        policy_number: selectedPol.policy_number,
        renewal_years: 1,
        premium_amount: 25000,
        payment_method: "UPI (Instant)",
        notes: "Quick renewal from Policy Coverage portal."
      });
      alert(`Policy ${selectedPol.policy_number} has been renewed and activated until ${res.data.policy.end_date}!`);
      setSelectedPol(res.data.policy);
      fetchPolicies();
    } catch (err) {
      console.error(err);
      alert("Renewal failed.");
    } finally {
      setRenewing(false);
    }
  };

  if (loading || !selectedPol) {
    return (
      <div className="bg-white p-12 text-center text-slate-400 rounded-2xl">
        Loading Policy & Coverage details...
      </div>
    );
  }

  const utilizationPct = Math.min(100, Math.round((selectedPol.used_coverage / Math.max(1, selectedPol.sum_insured)) * 100));

  return (
    <div className="space-y-6">
      {/* Top Header with Policy Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            Policy Terms & Coverage Utilization
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review sum insured caps, deductibles, co-pays, sub-limits, and coverage exhaustion thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500">Select Policy:</label>
          <select
            value={selectedPol.policy_number}
            onChange={(e) => {
              const p = policies.find((item) => item.policy_number === e.target.value);
              if (p) setSelectedPol(p);
            }}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          >
            {policies.map((p) => (
              <option key={p.policy_number} value={p.policy_number}>
                {p.policy_number} - {p.policyholder_id} ({p.policy_type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Coverage Utilization Progress Bar Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">{selectedPol.policy_type}</h2>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {selectedPol.policy_number}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${selectedPol.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                {selectedPol.status}
              </span>
              {selectedPol.status !== "Active" && (
                <button
                  onClick={handleQuickRenew}
                  disabled={renewing}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-white" />
                  <span>{renewing ? "Activating..." : "Renew & Activate Policy"}</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Policy Term: <span className="font-semibold text-slate-700">{selectedPol.start_date}</span> to <span className="font-semibold text-slate-700">{selectedPol.end_date}</span>
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Sum Insured</span>
              <p className="text-xl font-black text-slate-900">{formatCurrency(selectedPol.sum_insured)}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-teal-600">Available Balance</span>
              <p className="text-xl font-black text-teal-600">{formatCurrency(selectedPol.available_coverage)}</p>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-700">Coverage Utilization Index</span>
            <span className="font-extrabold text-slate-800">{utilizationPct}% Utilized ({formatCurrency(selectedPol.used_coverage)})</span>
          </div>
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                utilizationPct > 80 ? "bg-rose-500" : utilizationPct > 50 ? "bg-amber-500" : "bg-teal-500"
              }`}
              style={{ width: `${Math.max(3, utilizationPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid of Policy Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Deductibles & Co-Payments */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Deductibles & Co-Pay</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 font-medium">Policy Deductible:</span>
              <span className="font-extrabold text-slate-800">{formatCurrency(selectedPol.deductible)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 font-medium">Co-Payment Requirement:</span>
              <span className="font-extrabold text-slate-800">{selectedPol.co_payment}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Deductible is deducted upfront before co-payment split is calculated.
          </p>
        </div>

        {/* Card 2: Sub-Limits & Capping */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Sub-Limits & Capping</h3>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <p className="font-bold text-slate-800">{selectedPol.sub_limits || "Standard Policy Room Rent & Disease Limits"}</p>
          </div>
          <p className="text-[11px] text-slate-400">
            Cataract capped at ₹50,000; Knee Replacement capped at ₹2,00,000.
          </p>
        </div>

        {/* Card 3: Waiting Periods */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Waiting Periods</h3>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <p className="font-bold text-slate-800">{selectedPol.waiting_period || "30 Days Initial Waiting Period Completed"}</p>
          </div>
          <p className="text-[11px] text-slate-400">
            Factor #4 checks whether patient treatments fall within active waiting periods.
          </p>
        </div>
      </div>

      {/* Covered Treatments vs General Exclusions Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Covered Treatments */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Covered Treatments (Factor #7 PASS)</h3>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-slate-700 leading-relaxed">
            {selectedPol.covered_treatments}
          </div>
        </div>

        {/* Exclusions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <XCircle className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Configured Exclusions (Factor #7 FAIL)</h3>
          </div>
          <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100 text-xs text-slate-700 leading-relaxed">
            {selectedPol.exclusions}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyCoveragePage;
