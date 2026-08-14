import React from "react";
import { ShieldCheck, ShieldAlert, AlertOctagon } from "lucide-react";

const ConfidenceGauge = ({ score = 0, risk = "LOW", showDetails = true, denialRisk = null }) => {
  // If denialRisk is explicitly passed use it, otherwise derive risk denial percentage from acceptance score (100 - score)
  const denialPercentage = denialRisk !== null 
    ? Math.min(100, Math.max(0, Math.round(denialRisk)))
    : Math.min(100, Math.max(0, 100 - Math.round(score)));

  let strokeColor = "#10b981"; // Emerald for low denial risk
  let bgColor = "bg-emerald-50";
  let textColor = "text-emerald-700";
  let borderColor = "border-emerald-200";
  let Icon = ShieldCheck;
  let label = "LOW DENIAL RISK (Claim Approved)";

  if (denialPercentage >= 40 || risk === "HIGH") {
    strokeColor = "#ef4444"; // Red for high denial risk
    bgColor = "bg-rose-50";
    textColor = "text-rose-700";
    borderColor = "border-rose-200";
    Icon = AlertOctagon;
    label = "HIGH DENIAL RISK (Action Required)";
  } else if (denialPercentage >= 15 || risk === "MEDIUM") {
    strokeColor = "#f59e0b"; // Amber for medium denial risk
    bgColor = "bg-amber-50";
    textColor = "text-amber-700";
    borderColor = "border-amber-200";
    Icon = ShieldAlert;
    label = "MEDIUM DENIAL RISK (Needs Review)";
  }

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (denialPercentage / 100) * circumference;

  return (
    <div className={`flex flex-col items-center p-5 rounded-2xl border ${borderColor} ${bgColor} transition-all duration-300`}>
      <div className="relative flex items-center justify-center">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="#e2e8f0"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke={strokeColor}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
          <span className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">
            {denialPercentage}%
          </span>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight text-center leading-tight mt-1 max-w-[85px]">
            Risk percentage to deny
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center gap-1.5 font-bold text-xs">
            <Icon className={`w-4 h-4 ${textColor}`} />
            <span className={textColor}>{label}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 max-w-[220px]">
            Based on 16-factor policy completeness & ML denial risk prediction
          </p>
        </div>
      )}
    </div>
  );
};

export default ConfidenceGauge;

