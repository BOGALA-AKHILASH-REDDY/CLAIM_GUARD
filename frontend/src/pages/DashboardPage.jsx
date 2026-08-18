import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, AlertTriangle, AlertOctagon, TrendingUp, 
  Users, CreditCard, HeartPulse, FileText, CheckCircle2, 
  ArrowUpRight, ExternalLink, RefreshCw, Eye
} from "lucide-react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area, Legend 
} from "recharts";
import MetricCard from "../components/MetricCard";
import FactorBadge from "../components/FactorBadge";
import BeforeAfterCompare from "../components/BeforeAfterCompare";
import api from "../services/api";
import { formatCurrency, getRiskBadgeColor, getStatusBadgeColor } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";

const DashboardPage = ({ onNavigateTab, onSelectClaim }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDemoBanner, setShowDemoBanner] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get("/dashboard");
      setData(res.data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleDemoRecheckDone = async () => {
    await api.post("/claims/CLM-1001/recheck");
    await fetchDashboard();
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-500">Loading CLAIMGUARD Engine Analytics...</p>
      </div>
    );
  }

  const kpis = data.kpis;
  const charts = data.charts;

  return (
    <div className="space-y-6">
      {/* Top Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Good Morning, {user?.full_name || "Healthcare Provider"}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Engine Online
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold">
              Total Registry: {kpis.insured_members_count} Members
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {data.server_time} • Central Claim Denial Prevention & Policy Intelligence • Total Organization Live Overview
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab("new-claim")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            + New Claim Audit
          </button>
          <button
            onClick={fetchDashboard}
            title="Refresh Data"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 8 TOP SUMMARY KPI CARDS (Features 1 to 8) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="1. Policy Status"
          value={kpis.policy_status}
          subtitle={`${kpis.active_policies_count} Active Policies Registered`}
          icon={ShieldCheck}
          color="teal"
          trend="+100% Verified"
          trendType="up"
        />
        <MetricCard
          title="2. Total Coverage"
          value={formatCurrency(kpis.total_coverage)}
          subtitle="Aggregate Policy Sum Insured"
          icon={ShieldCheck}
          color="blue"
        />
        <MetricCard
          title="3. Insured Members"
          value={kpis.insured_members_count}
          subtitle="Family Members & Primary Policyholders"
          icon={Users}
          color="indigo"
        />
        <MetricCard
          title="4. Total Premium"
          value={formatCurrency(kpis.total_premium)}
          subtitle="Gross Annualized Premium Volume"
          icon={CreditCard}
          color="emerald"
        />
        <MetricCard
          title="5. Payment Status"
          value={`${kpis.payment_status.paid} Paid`}
          subtitle={`${kpis.payment_status.pending} Pending / ${kpis.payment_status.overdue} Overdue`}
          icon={CreditCard}
          color="amber"
        />
        <MetricCard
          title="6. Total Claims"
          value={kpis.total_claims}
          subtitle="Processed Through 16 Factors"
          icon={FileText}
          color="blue"
        />
        <MetricCard
          title="7. High Risk Claims"
          value={kpis.high_risk_claims}
          subtitle="Denial Risk Detected Pre-Submission"
          icon={AlertOctagon}
          color="rose"
          trend="Needs Attention"
          trendType="down"
        />
        <MetricCard
          title="8. Available Coverage"
          value={formatCurrency(kpis.available_coverage)}
          subtitle={`Utilized: ${formatCurrency(kpis.used_coverage)}`}
          icon={TrendingUp}
          color="teal"
        />
      </div>

      {/* Hackathon Interactive Before vs After Section */}
      {showDemoBanner && (
        <BeforeAfterCompare onRecheckComplete={handleDemoRecheckDone} />
      )}

      {/* DASHBOARD CHARTS ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Claim Risk Distribution */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800">Claim Risk Distribution</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">ML + 16 Factors</span>
            </div>
            <p className="text-xs text-slate-500">Distribution of claims by denial probability</p>
          </div>

          <div className="h-56 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.risk_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {charts.risk_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val, name) => [`${val} Claims`, name]}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-1 text-center">
            {charts.risk_distribution.map((item, idx) => (
              <div key={idx} className="p-1.5 rounded-lg bg-slate-50">
                <span className="text-xs font-black" style={{ color: item.color }}>{item.value}</span>
                <p className="text-[10px] text-slate-500 font-semibold truncate">{item.name.split(" ")[0]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Common Claim Denial Issues */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Common Pre-Submission Claim Issues</h3>
              <p className="text-xs text-slate-500">Major reasons for flagged warnings & denial risk</p>
            </div>
            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
              16 Factors Monitored
            </span>
          </div>

          <div className="h-60 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.common_issues} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="issue" type="category" width={160} tick={{ fontSize: 11, fill: "#475569" }} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }} />
                <Bar dataKey="count" fill="#0d9488" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Pre-authorization and documentation account for 60%+ of avoidable rejections.</span>
            <button onClick={() => onNavigateTab("claim-recommendations")} className="text-teal-600 font-bold hover:underline">
              View Recommendations →
            </button>
          </div>
        </div>
      </div>

      {/* DASHBOARD CHARTS ROW 2: MONTHLY CLAIM TRENDS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Monthly Claim Trends & Denial Prevention</h3>
            <p className="text-xs text-slate-500">Tracking claim submission volumes and rescued claims</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded-full bg-teal-600" /> Total Claims
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="w-3 h-3 rounded-full bg-emerald-500" /> Claims Ready
            </span>
            <span className="flex items-center gap-1.5 text-rose-600">
              <span className="w-3 h-3 rounded-full bg-rose-500" /> Denial Prevented
            </span>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={charts.monthly_trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorReady" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }} />
              <Area type="monotone" dataKey="claims" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorClaims)" name="Total Claims" />
              <Area type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorReady)" name="Claim is Approved" />
              <Line type="monotone" dataKey="denial_prevented" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Prevented Denials" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RECENT CLAIMS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800">Recent Claim Audits</h3>
            <p className="text-xs text-slate-500">Live 16-factor evaluation results from the registry</p>
          </div>
          <button
            onClick={() => onNavigateTab("claim-history")}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 hover:underline"
          >
            View All 200 Claims <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Claim ID</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Policy Number</th>
                <th className="py-3 px-4">Claim Amount</th>
                <th className="py-3 px-4">Est. Claimable</th>
                <th className="py-3 px-4 text-center">Confidence</th>
                <th className="py-3 px-4 text-center">Risk</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recent_claims.map((claim) => (
                <tr key={claim.claim_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-teal-700">{claim.claim_id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{claim.patient_name}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{claim.policy_number}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{formatCurrency(claim.claim_amount)}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {claim.estimated_claimable_amount > 0 ? formatCurrency(claim.estimated_claimable_amount) : "Cannot Finalize"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-extrabold text-xs text-slate-800">
                      {claim.confidence_score}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRiskBadgeColor(claim.risk_level)}`}>
                      {claim.risk_level}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeColor(claim.status)}`}>
                      {claim.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        if (onSelectClaim) onSelectClaim(claim.claim_id);
                        onNavigateTab("claim-analysis");
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
