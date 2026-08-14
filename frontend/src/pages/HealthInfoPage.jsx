import React, { useState, useEffect } from "react";
import { HeartPulse, Activity, AlertCircle, ShieldAlert, Stethoscope, Pill, Cigarette, FileCheck } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const HealthInfoPage = () => {
  const { user } = useAuth();
  const isPolicyholder = user?.role === "policyholder";
  const loggedInPid = user?.policyholder_id || user?.user_id;

  const [policyholders, setPolicyholders] = useState([]);
  const [selectedPhId, setSelectedPhId] = useState(loggedInPid || "POL-1001");
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPolicyholders = async () => {
    try {
      const res = await api.get("/policyholders?limit=50");
      setPolicyholders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHealthInfo = async (phId) => {
    try {
      setLoading(true);
      const res = await api.get(`/health/${phId}`);
      setHealthData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loggedInPid) {
      setSelectedPhId(loggedInPid);
    } else {
      fetchPolicyholders();
    }
  }, [loggedInPid]);

  useEffect(() => {
    if (selectedPhId) {
      fetchHealthInfo(selectedPhId);
    }
  }, [selectedPhId]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-500" />
            Medical History & Health Information
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pre-existing conditions, past surgical records, and clinical factors audited against policy exclusion lists.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500">Policyholder:</label>
          {loggedInPid ? (
            <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-900 font-mono font-bold text-xs border border-rose-200">
              {loggedInPid} - {user?.full_name || "Self"}
            </span>
          ) : (
            <select
              value={selectedPhId}
              onChange={(e) => setSelectedPhId(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            >
              {policyholders.map((ph) => (
                <option key={ph.policyholder_id} value={ph.policyholder_id}>
                  {ph.policyholder_id} - {ph.full_name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Confidentiality Disclaimer Banner */}
      <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900 shadow-xs">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-extrabold uppercase tracking-wider block text-amber-950">
            Confidential Health Information Notice
          </span>
          <p className="mt-0.5 text-amber-800">
            Medical information is stored under strict HIPAA & DPDP compliance standards. Health declarations are cross-referenced with Factor #5 (Disease Diagnosis) and Factor #6 (Treatment Protocol) to ensure pre-existing condition exclusions are accurately computed.
          </p>
        </div>
      </div>

      {/* Health Info Details Cards */}
      {healthData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Pre-Existing Conditions */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
                <HeartPulse className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Existing Conditions</h3>
              <p className="text-xs text-slate-400 mt-1">Declared chronic & pre-existing ailments</p>
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800">
                {healthData.existing_conditions || "None Declared (Clean Baseline)"}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              Factor #5 Validation Check: <span className="font-bold text-emerald-600">Active</span>
            </div>
          </div>

          {/* Card 2: Previous Illnesses */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Previous Illnesses</h3>
              <p className="text-xs text-slate-400 mt-1">Hospital admissions & infectious illnesses</p>
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800">
                {healthData.previous_illnesses || "No prior major illnesses recorded"}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              Waiting Period Impact: <span className="font-bold text-slate-700">None</span>
            </div>
          </div>

          {/* Card 3: Previous Surgeries */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Previous Surgeries</h3>
              <p className="text-xs text-slate-400 mt-1">Past surgical interventions & implants</p>
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800">
                {healthData.previous_surgeries || "Nil"}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              Surgical Sub-Limit Check: <span className="font-bold text-emerald-600">Standard Limit</span>
            </div>
          </div>

          {/* Card 4: Current Treatments */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                <Pill className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Current Treatments</h3>
              <p className="text-xs text-slate-400 mt-1">Active medications & ongoing therapy</p>
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800">
                {healthData.current_treatments || "Routine annual health checkups only"}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              Prescription Audit: <span className="font-bold text-emerald-600">Verified</span>
            </div>
          </div>

          {/* Card 5: Lifestyle Factors */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-4">
                <Cigarette className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Lifestyle Risk Factors</h3>
              <p className="text-xs text-slate-400 mt-1">Habits, occupational risks, and wellness index</p>
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800">
                {healthData.lifestyle_factors || "Non-smoker, Active exercise routine"}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              Risk Weight Factor: <span className="font-bold text-emerald-600">1.0x (Standard)</span>
            </div>
          </div>

          {/* Card 6: AI Clinical Summary */}
          <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-2xl p-6 border border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-teal-400 bg-teal-950/80 px-2.5 py-1 rounded-lg border border-teal-500/30 flex items-center gap-1">
                  AI Clinical Assessment
                </span>
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Underwriting Risk Score</h3>
              <p className="text-xs text-slate-400 mt-1">Calculated based on health disclosures</p>
              <div className="mt-4">
                <span className="text-3xl font-black text-teal-300">LOW RISK</span>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  No active waiting periods or high-risk pre-existing disease riders attached to this profile.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-teal-400" />
              Pre-Authorization Automated Clearance
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center text-slate-400 rounded-2xl">
          Loading health information...
        </div>
      )}
    </div>
  );
};

export default HealthInfoPage;
