import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, ArrowRight, RefreshCw, CheckCircle2, XCircle, FileText } from "lucide-react";
import confetti from "canvas-confetti";
import FactorBadge from "./FactorBadge";

const BeforeAfterCompare = ({ onRecheckComplete, initialClaim }) => {
  const [isRechecking, setIsRechecking] = useState(false);
  const [hasRechecked, setHasRechecked] = useState(false);

  const handleSimulateRecheck = async () => {
    setIsRechecking(true);
    // Trigger confetti
    try {
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0d9488', '#10b981', '#3b82f6', '#f59e0b']
        });
      }, 1200);

      if (onRecheckComplete) {
        await onRecheckComplete();
      }
      setHasRechecked(true);
    } finally {
      setIsRechecking(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-teal-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Denial Prevention: Before vs. After Correction
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Demonstrating real-time claim rescue by resolving missing documentation and pre-authorization.
            </p>
          </div>

          <button
            onClick={handleSimulateRecheck}
            disabled={isRechecking}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 font-extrabold shadow-lg shadow-teal-500/30 transition-all duration-200 disabled:opacity-50 text-sm whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 ${isRechecking ? "animate-spin" : ""}`} />
            {isRechecking ? "Auditing 16 Factors..." : hasRechecked ? "Recheck Again" : "FIX ISSUES & RECHECK CLAIM"}
          </button>
        </div>

        {/* Side by side cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* BEFORE CARD */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-rose-500/30 shadow-inner flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-800/50">
                  BEFORE CORRECTION
                </span>
                <span className="text-xs font-semibold text-slate-400">Initial Scan</span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <span className="text-3xl font-black text-rose-400">58%</span>
                  <p className="text-[11px] font-bold text-rose-300 uppercase tracking-wider mt-0.5">High Denial Risk</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-slate-400">Est. Claimable:</span>
                  <p className="text-sm font-extrabold text-slate-300">Cannot Finalize</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-start gap-2 text-xs text-rose-300/90 bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/40">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Factor #8 Pre-Authorization:</span> Missing / Not Obtained for procedure
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs text-rose-300/90 bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/40">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Factor #12 Required Docs:</span> Hospital Discharge Summary Missing
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-medium">
              Status: <span className="text-rose-400 font-bold">NEEDS CORRECTION</span> (2 Blockers Flagged)
            </div>
          </div>

          {/* AFTER CARD */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-emerald-500/30 shadow-inner flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/50">
                  AFTER RECHECK & FIX
                </span>
                <span className="text-xs font-semibold text-teal-300 flex items-center gap-1">
                  16 Factors Validated
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <span className="text-3xl font-black text-emerald-400">94%</span>
                  <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mt-0.5">Low Risk (Claim is Approved)</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-slate-400">Est. Claimable:</span>
                  <p className="text-lg font-black text-emerald-400">₹1,00,000</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-start gap-2 text-xs text-emerald-300/90 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-900/40">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Pre-Authorization:</span> Approved & Verified on File
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs text-emerald-300/90 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-900/40">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Discharge Summary:</span> Attached & Medical Audit Passed
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-medium flex items-center justify-between">
              <div>
                Status: <span className="text-emerald-400 font-bold">✓ CLAIM IS APPROVED</span>
              </div>
              <span className="text-teal-400 font-semibold">+36% Confidence Gain</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterCompare;
