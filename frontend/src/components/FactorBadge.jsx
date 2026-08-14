import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

const FactorBadge = ({ status, size = "md" }) => {
  const s = (status || "").toUpperCase();

  const isSmall = size === "sm";

  if (s === "PASS") {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 ${isSmall ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}`}>
        <CheckCircle2 className={`${isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} text-emerald-600`} />
        PASS
      </span>
    );
  } else if (s === "WARNING" || s === "WARN") {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-amber-300 bg-amber-50 text-amber-800 ${isSmall ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}`}>
        <AlertTriangle className={`${isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} text-amber-600`} />
        WARNING
      </span>
    );
  } else if (s === "FAIL") {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-rose-300 bg-rose-50 text-rose-700 ${isSmall ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}`}>
        <XCircle className={`${isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} text-rose-600`} />
        FAIL
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 font-medium rounded-full border border-slate-200 bg-slate-100 text-slate-700 px-2.5 py-1 text-xs">
      <Info className="w-3.5 h-3.5 text-slate-500" />
      {status || "UNKNOWN"}
    </span>
  );
};

export default FactorBadge;
