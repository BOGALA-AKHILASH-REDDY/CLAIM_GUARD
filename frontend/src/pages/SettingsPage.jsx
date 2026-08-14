import React, { useState, useEffect } from "react";
import { Settings, Save, RefreshCw, Sliders, ShieldCheck, AlertCircle } from "lucide-react";
import api from "../services/api";

const SettingsPage = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await api.get("/policy-services/rules");
      setRules(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleUpdateRule = async (ruleKey, newVal) => {
    try {
      setSavingKey(ruleKey);
      await api.put(`/policy-services/rules/${ruleKey}`, {
        rule_value: String(newVal)
      });
      alert(`Rule '${ruleKey}' updated successfully to ${newVal}!`);
      fetchRules();
    } catch (err) {
      alert("Failed to update rule.");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600" />
            Configurable Policy & Denial Prevention Rules
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic business rules powering calculation engines, penalty percentages, and eligibility thresholds.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
        <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 text-xs flex items-start gap-2.5 text-teal-900">
          <AlertCircle className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold uppercase block">Configured Business Rules Disclaimer</span>
            <p className="mt-0.5 text-teal-800">
              All financial calculations (such as the 70% Surrender Refund, 30% Penalty, and 30-Day Grace Period) are driven by the dynamic registry below. Changes take effect across all claims immediately.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {rules.map((r) => (
            <div key={r.rule_key} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="max-w-md">
                <span className="font-mono font-bold text-teal-700 text-[11px] block">{r.rule_key}</span>
                <h4 className="font-bold text-slate-900 text-sm mt-0.5">{r.rule_name}</h4>
                <p className="text-slate-500 mt-0.5">{r.description}</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  defaultValue={r.rule_value}
                  id={`input-${r.rule_key}`}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs w-32 text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />

                <button
                  onClick={() => {
                    const val = document.getElementById(`input-${r.rule_key}`)?.value;
                    handleUpdateRule(r.rule_key, val);
                  }}
                  disabled={savingKey === r.rule_key}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingKey === r.rule_key ? "Saving..." : "Save Rule"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
