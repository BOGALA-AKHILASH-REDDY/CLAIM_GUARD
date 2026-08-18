import React, { useState } from "react";
import { ShieldCheck, ArrowRight, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import confetti from "canvas-confetti";

const BeforeAfterCompare = ({ onRecheckComplete, initialClaim }) => {
  const [isRechecking, setIsRechecking] = useState(false);
  const [hasRechecked, setHasRechecked] = useState(false);

  const handleSimulateRecheck = async () => {
    setIsRechecking(true);
    // Trigger celebratory confetti
    try {
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#10b981', '#38bdf8', '#f59e0b']
        });
      }, 1000);

      if (onRecheckComplete) {
        await onRecheckComplete();
      }
      setHasRechecked(true);
    } finally {
      setIsRechecking(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Denial Prevention: Before vs. After Correction
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Demonstrating real-time claim rescue by resolving missing documentation and pre-authorization.
            </p>
          </div>

          <button
            onClick={handleSimulateRecheck}
            disabled={isRechecking}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold shadow-md shadow-blue-600/20 transition-all duration-200 disabled:opacity-50 text-xs sm:text-sm whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRechecking ? "animate-spin" : ""}`} />
            {isRechecking ? "Auditing 16 Factors..." : hasRechecked ? "Recheck Again" : "FIX ISSUES & RECHECK CLAIM"}
          </button>
        </div>

        {/* Side by side cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* BEFORE CARD */}
          <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-200/80 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-100/90 px-2.5 py-1 rounded-lg border border-rose-200">
                  BEFORE CORRECTION
                </span>
                <span className="text-xs font-semibold text-slate-500">Initial Scan</span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <span className="text-3xl font-black text-rose-600">58%</span>
                  <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider mt-0.5">High Denial Risk</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-500 block">Est. Claimable:</span>
                  <p className="text-sm font-extrabold text-slate-700">Cannot Finalize</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-rose-200/60 space-y-2.5">
                <div className="flex items-start gap-2.5 text-xs text-rose-950 bg-white/90 p-3 rounded-xl border border-rose-200/80 shadow-xs">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Factor #8 Pre-Authorization:</span> Missing / Not Obtained for procedure
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-rose-950 bg-white/90 p-3 rounded-xl border border-rose-200/80 shadow-xs">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Factor #12 Required Docs:</span> Hospital Discharge Summary Missing
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-rose-200/60 text-[11px] text-slate-600 font-medium">
              Status: <span className="text-rose-700 font-bold">NEEDS CORRECTION</span> (2 Blockers Flagged)
            </div>
          </div>

          {/* AFTER CARD */}
          <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-200/80 flex flex-col justify-between shadow-xs relative">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-200">
                  AFTER RECHECK & FIX
                </span>
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  16 Factors Validated
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <span className="text-3xl font-black text-emerald-600">94%</span>
                  <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mt-0.5">Low Risk (Claim is Approved)</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-500 block">Est. Claimable:</span>
                  <p className="text-lg font-black text-emerald-700">₹1,00,000</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-emerald-200/60 space-y-2.5">
                <div className="flex items-start gap-2.5 text-xs text-emerald-950 bg-white/90 p-3 rounded-xl border border-emerald-200/80 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Pre-Authorization:</span> Approved & Verified on File
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-emerald-950 bg-white/90 p-3 rounded-xl border border-emerald-200/80 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Discharge Summary:</span> Attached & Medical Audit Passed
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-200/60 text-[11px] text-slate-600 font-medium flex items-center justify-between">
              <div>
                Status: <span className="text-emerald-700 font-bold">✓ CLAIM IS APPROVED</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                +36% Confidence Gain
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterCompare;
