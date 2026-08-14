import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const MetricCard = ({ title, value, subtitle, icon: Icon, color = "teal", trend, trendType = "up" }) => {
  const colorMap = {
    teal: {
      bg: "bg-teal-50",
      text: "text-teal-700",
      border: "border-teal-100",
      iconBg: "bg-teal-600 text-white",
    },
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-100",
      iconBg: "bg-blue-600 text-white",
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-100",
      iconBg: "bg-emerald-600 text-white",
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-100",
      iconBg: "bg-amber-600 text-white",
    },
    rose: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-100",
      iconBg: "bg-rose-600 text-white",
    },
    indigo: {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-100",
      iconBg: "bg-indigo-600 text-white",
    },
  };

  const scheme = colorMap[color] || colorMap.teal;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-2xl font-extrabold text-slate-800 mt-1 tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${scheme.iconBg} group-hover:scale-105 transition-transform duration-200`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">{subtitle}</span>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 font-bold ${trendType === "up" ? "text-emerald-600" : "text-rose-600"}`}>
            {trendType === "up" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
