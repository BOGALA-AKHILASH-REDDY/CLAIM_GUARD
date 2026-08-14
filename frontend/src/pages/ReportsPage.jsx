import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, ShieldCheck, DollarSign, Award, Download } from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, PieChart, Pie, Cell 
} from "recharts";
import api from "../services/api";
import { formatCurrency } from "../utils/formatters";

const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await api.get("/reports");
        setReportData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading || !reportData) {
    return (
      <div className="bg-white p-12 text-center text-slate-400 rounded-2xl">
        Loading Reports & Analytics...
      </div>
    );
  }

  const { summary, charts } = reportData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            Provider Denial Prevention Intelligence & Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated audit analytics, savings metrics, and denial reduction efficacy reports.
          </p>
        </div>
      </div>

      {/* Denial Prevention ROI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-teal-800 to-slate-950 text-white p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">Denial Prevention Rate</span>
            <h3 className="text-3xl font-black mt-1 text-white">{summary.denial_prevention_stats.prevention_rate_pct}%</h3>
          </div>
          <p className="text-xs text-slate-300 mt-3">Avoidable claims rescued prior to submission</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Claims Rescued</span>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{summary.denial_prevention_stats.claims_rescued_count}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-3">High risk claims corrected and validated</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estimated INR Saved</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(summary.denial_prevention_stats.estimated_savings_inr)}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-3">Prevented downstream rework & penalty losses</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg. Audit Speed</span>
            <h3 className="text-3xl font-black text-teal-600 mt-1">{summary.denial_prevention_stats.average_turnaround_mins}s</h3>
          </div>
          <p className="text-xs text-slate-500 mt-3">Instant automated 16-factor response time</p>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Denial Factors Distribution */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Top Claim Denial Contributors (%)</h3>
          <p className="text-xs text-slate-500 mb-4">Breakdown of root cause factors across dataset</p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.denial_factors} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="factor" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }} />
                <Bar dataKey="percentage" fill="#0d9488" radius={[6, 6, 0, 0]} name="Percentage (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Claim Amount by Risk Category */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Claim Portfolio by Risk Level</h3>
          <p className="text-xs text-slate-500 mb-4">Volume and currency exposure distribution</p>

          <div className="space-y-4 pt-2">
            {charts.risk_breakdown.map((r, i) => (
              <div key={i} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold block" style={{ color: r.color }}>{r.risk}</span>
                  <span className="text-slate-500">{r.count} Total Claims</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">{formatCurrency(r.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
