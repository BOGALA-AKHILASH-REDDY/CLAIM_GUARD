export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export const getRiskBadgeColor = (risk) => {
  const r = (risk || "").toUpperCase();
  if (r === "LOW") {
    return "bg-emerald-100 text-emerald-800 border-emerald-300";
  } else if (r === "MEDIUM") {
    return "bg-amber-100 text-amber-800 border-amber-300";
  } else {
    return "bg-rose-100 text-rose-800 border-rose-300";
  }
};

export const getStatusBadgeColor = (status) => {
  const s = (status || "").toLowerCase();
  if (s.includes("approval") || s.includes("approved") || s.includes("ready") || s.includes("paid") || s.includes("verified") || s.includes("active") || s.includes("pass")) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  } else if (s.includes("review") || s.includes("pending") || s.includes("warning") || s.includes("grace")) {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  } else if (s.includes("overdue") || s.includes("lapsed") || s.includes("inactive") || s.includes("rejected") || s.includes("fail") || s.includes("high risk") || s.includes("correction")) {
    return "bg-rose-50 text-rose-700 border border-rose-200";
  }
  return "bg-slate-100 text-slate-700 border border-slate-200";
};
