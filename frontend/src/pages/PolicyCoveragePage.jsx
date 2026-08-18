import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, Shield, AlertCircle, Calendar, CheckCircle2, 
  XCircle, TrendingUp, DollarSign, Layers, Percent, Clock, 
  AlertTriangle, RefreshCw, MinusCircle, PlusCircle, ArrowDownRight,
  ArrowUpRight, FileText, Check, Lock, Building2
} from "lucide-react";
import api from "../services/api";
import { formatCurrency } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";

const PolicyCoveragePage = () => {
  const { user } = useAuth();
  const isPolicyholder = user?.role === "policyholder" || Boolean(user?.policyholder_id);
  const loggedInPid = user?.policyholder_id || (user?.role === "policyholder" ? user?.user_id : null);

  const [policies, setPolicies] = useState([]);
  const [selectedPol, setSelectedPol] = useState(null);
  const [claimsList, setClaimsList] = useState([]);
  const [renewalsList, setRenewalsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);

  const fetchPoliciesAndTransactions = async () => {
    try {
      setLoading(true);
      const polUrl = loggedInPid ? `/policies/policyholder/${loggedInPid}` : "/policies";
      const claimsUrl = loggedInPid ? `/claims?policyholder_id=${loggedInPid}&limit=100` : "/claims?limit=100";
      const renewalsUrl = loggedInPid ? `/policies/renewals/history?policyholder_id=${loggedInPid}` : "/policies/renewals/history";

      const [polRes, claimsRes, renRes] = await Promise.all([
        api.get(polUrl),
        api.get(claimsUrl).catch(() => ({ data: [] })),
        api.get(renewalsUrl).catch(() => ({ data: [] }))
      ]);

      const allPolicies = polRes.data || [];
      const allClaims = claimsRes.data || [];
      const allRenewals = renRes.data || [];

      setPolicies(allPolicies);
      setClaimsList(allClaims);
      setRenewalsList(allRenewals);

      if (allPolicies.length > 0) {
        const savedPolNum = localStorage.getItem("claimguard_selected_pol");
        const matching = savedPolNum ? allPolicies.find(p => p.policy_number === savedPolNum) : null;
        const initial = matching || allPolicies[0];
        setSelectedPol(initial);
        localStorage.setItem("claimguard_selected_pol", initial.policy_number);
        if (initial.policyholder_id) {
          localStorage.setItem("claimguard_selected_pid", initial.policyholder_id);
        }
      }
    } catch (err) {
      console.error("Error fetching policy data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoliciesAndTransactions();
  }, [loggedInPid]);

  useEffect(() => {
    const handlePolSync = (e) => {
      const targetPolNum = e?.detail?.policy_number || localStorage.getItem("claimguard_selected_pol");
      if (targetPolNum && policies.length > 0) {
        const found = policies.find(p => p.policy_number === targetPolNum);
        if (found && found.policy_number !== selectedPol?.policy_number) {
          setSelectedPol(found);
        }
      }
    };
    window.addEventListener("claimguard_policy_changed", handlePolSync);
    return () => window.removeEventListener("claimguard_policy_changed", handlePolSync);
  }, [policies, selectedPol]);

  const handleQuickRenew = async () => {
    if (!selectedPol) return;
    try {
      setRenewing(true);
      const res = await api.post(`/policies/${selectedPol.policy_number}/renew`, {
        policy_number: selectedPol.policy_number,
        renewal_years: 1,
        premium_amount: 25000,
        payment_method: "UPI (Instant)",
        notes: "Quick renewal from Policy Coverage portal."
      });
      alert(`Policy ${selectedPol.policy_number} has been renewed and activated until ${res.data.policy.end_date}!`);
      setSelectedPol(res.data.policy);
      fetchPoliciesAndTransactions();
    } catch (err) {
      console.error(err);
      alert("Renewal failed.");
    } finally {
      setRenewing(false);
    }
  };

  if (loading || !selectedPol) {
    return (
      <div className="bg-white p-12 text-center text-slate-400 rounded-2xl">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
        Loading Policy & Coverage details...
      </div>
    );
  }

  function strStatus(status) {
    return String(status || "").toUpperCase();
  }

  // Filter claims associated with this specific policy
  const policyClaims = claimsList.filter(
    (c) => c.policy_number === selectedPol.policy_number || 
           (c.policyholder_id === selectedPol.policyholder_id && (!c.policy_number || c.policy_number === selectedPol.policy_number))
  );

  const totalSumInsured = parseFloat(selectedPol.sum_insured) || 2500000;

  // Calculate actual deducted money from valid submitted / approved claims
  const rawCalculatedDeductions = policyClaims.reduce((acc, c) => {
    const s = strStatus(c.status);
    const isActiveClaim = (
      (s.includes("SUBMIT") || s.includes("APPROV") || s.includes("PAID") || s.includes("SETTLE") || s.includes("PROCESSING") || s.includes("CLOSED")) &&
      !s.includes("REJECT") && !s.includes("CORRECT") && !s.includes("DRAFT") && !s.includes("CANCEL")
    );
    if (isActiveClaim) {
      return acc + (parseFloat(c.estimated_claimable_amount) || parseFloat(c.claim_amount) || 0);
    }
    return acc;
  }, 0);

  // Strictly bound total deducted money to NEVER exceed the Total Sum Insured
  const candidateDeductions = Math.max(parseFloat(selectedPol.used_coverage) || 0, rawCalculatedDeductions);
  const totalDeductedMoney = Math.min(totalSumInsured, candidateDeductions);
  const remainingAvailableBalance = Math.max(0, totalSumInsured - totalDeductedMoney);
  const utilizationPct = Math.min(100, Math.round((totalDeductedMoney / Math.max(1, totalSumInsured)) * 100));

  // Build the unified financial transactions ledger (Money Added vs Money Deducted)
  const transactionsLedger = [];

  // 1. Initial Credit: Policy Allocation
  transactionsLedger.push({
    id: `ALLOC-${selectedPol.policy_number}`,
    date: selectedPol.start_date || "2024-01-01",
    type: "CREDIT",
    typeLabel: "+ Money Added (Credit)",
    description: `Initial Policy Coverage Allocation (${selectedPol.policy_type})`,
    category: "Policy Sum Insured",
    amount: totalSumInsured,
    impact: "+",
    status: "Active & Allocated"
  });

  // 2. Additional Credits: Renewals / Sum Insured Expansions
  const matchingRenewals = renewalsList.filter(r => r.policy_number === selectedPol.policy_number);
  matchingRenewals.forEach((ren, idx) => {
    transactionsLedger.push({
      id: ren.renewal_id || `REN-${idx + 1}`,
      date: ren.created_at ? ren.created_at.substring(0, 10) : (ren.new_start_date || "2025-01-01"),
      type: "CREDIT",
      typeLabel: "+ Money Added (Credit)",
      description: `Policy Renewal & Coverage Extension (Valid to ${ren.new_end_date})`,
      category: "Policy Renewal",
      amount: ren.premium_amount || 25000,
      impact: "+",
      status: "Settled & Extended"
    });
  });

  // 3. Debits: Approved & Submitted Claim Deductions
  let runningBalance = totalSumInsured;
  policyClaims.forEach((claim) => {
    const s = strStatus(claim.status);
    const isValidDeduction = s.includes("SUBMIT") || s.includes("APPROV") || s.includes("READY") || (!s.includes("REJECT") && !s.includes("CORRECTION"));
    const claimAmt = parseFloat(claim.claim_amount) || parseFloat(claim.estimated_claimable_amount) || 0;
    
    // Only deduct up to remaining balance
    const actualDeducted = isValidDeduction ? Math.min(runningBalance, claimAmt) : 0;
    runningBalance = Math.max(0, runningBalance - actualDeducted);

    transactionsLedger.push({
      id: claim.claim_id,
      date: claim.claim_submission_date || "2026-08-16",
      type: isValidDeduction ? "DEBIT" : "PENDING_REVIEW",
      typeLabel: isValidDeduction ? "- Claim Deducted (Debit)" : "Pending Review",
      description: `Claim Payout: ${claim.disease_diagnosis || 'Medical Treatment'} (${claim.patient_name || user?.full_name}) - ${claim.hospital_name || 'Hospital'}`,
      category: "Medical Claim Payout",
      amount: claimAmt,
      deductedAmount: actualDeducted,
      impact: isValidDeduction ? "-" : "0",
      status: isValidDeduction ? (claim.status || "Approved") : "Needs Review (₹0 Deducted)"
    });
  });

  // Sort chronological
  transactionsLedger.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Compute exact running balances chronologically
  let curBal = 0;
  const ledgerWithBalances = transactionsLedger.map((txn) => {
    if (txn.type === "CREDIT") {
      if (curBal === 0) {
        curBal = txn.amount;
      } else {
        curBal = Math.min(totalSumInsured, curBal + (txn.amount || 0));
      }
    } else if (txn.type === "DEBIT") {
      const ded = txn.deductedAmount !== undefined ? txn.deductedAmount : txn.amount;
      curBal = Math.max(0, curBal - ded);
    }
    return { ...txn, balanceAfter: curBal };
  });

  return (
    <div className="space-y-6">
      {/* Top Header with Policy Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            Policy Terms & Coverage Utilization
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time automatic claim money deductions, remaining available balance, and complete credit/debit transaction history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500">Select Policy:</label>
          <select
            value={selectedPol.policy_number}
            onChange={(e) => {
              const p = policies.find((item) => item.policy_number === e.target.value);
              if (p) {
                setSelectedPol(p);
                localStorage.setItem("claimguard_selected_pol", p.policy_number);
                if (p.policyholder_id) {
                  localStorage.setItem("claimguard_selected_pid", p.policyholder_id);
                }
                window.dispatchEvent(new CustomEvent("claimguard_policy_changed", {
                  detail: { policy_number: p.policy_number, policyholder_id: p.policyholder_id }
                }));
              }
            }}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          >
            {policies.map((p) => (
              <option key={p.policy_number} value={p.policy_number}>
                {p.policy_number} - {p.policyholder_id} ({p.policy_type})
              </option>
            ))}
          </select>
          <button
            onClick={fetchPoliciesAndTransactions}
            title="Refresh Balances"
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Coverage Utilization & Automatic Money Deduction Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        {/* Top Info Bar with Total, Deducted, and Remaining Money */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">{selectedPol.policy_type}</h2>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {selectedPol.policy_number}
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${selectedPol.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                {selectedPol.status}
              </span>
              {selectedPol.status !== "Active" && (
                <button
                  onClick={handleQuickRenew}
                  disabled={renewing}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-white" />
                  <span>{renewing ? "Activating..." : "Renew & Activate Policy"}</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Policy Term: <span className="font-semibold text-slate-700">{selectedPol.start_date}</span> to <span className="font-semibold text-slate-700">{selectedPol.end_date}</span>
            </p>
          </div>

          {/* 3 Metric Pillars: Total Sum Insured, Total Claimed Deducted, Remaining Balance */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
            {/* 1. Total Sum Insured (Money Added) */}
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center sm:justify-end gap-1">
                <PlusCircle className="w-3 h-3 text-teal-600" />
                Total Sum Insured
              </span>
              <p className="text-base sm:text-xl font-black text-slate-900 mt-0.5">{formatCurrency(totalSumInsured)}</p>
            </div>

            {/* 2. Automatically Deducted Claim Money */}
            <div className="text-left sm:text-right border-x border-slate-200 px-2 sm:px-4">
              <span className="text-[10px] uppercase font-bold text-rose-600 flex items-center sm:justify-end gap-1">
                <MinusCircle className="w-3 h-3" />
                Claimed Deducted
              </span>
              <p className="text-base sm:text-xl font-black text-rose-600 mt-0.5">- {formatCurrency(totalDeductedMoney)}</p>
            </div>

            {/* 3. Remaining Available Balance */}
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-teal-700 block">Available Balance</span>
              <p className="text-base sm:text-xl font-black text-teal-600 mt-0.5">{formatCurrency(remainingAvailableBalance)}</p>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <span>Coverage Utilization Index</span>
              {totalDeductedMoney > 0 && (
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {formatCurrency(totalDeductedMoney)} Deducted by Approved Claims
                </span>
              )}
            </span>
            <span className="font-extrabold text-slate-800">
              {utilizationPct}% Utilized • {formatCurrency(remainingAvailableBalance)} Remaining Available
            </span>
          </div>
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                utilizationPct >= 100 ? "bg-rose-600" : utilizationPct > 50 ? "bg-amber-500" : "bg-teal-500"
              }`}
              style={{ width: `${Math.max(2, utilizationPct)}%` }}
            />
          </div>
        </div>

        {/* Policy Balance Completely Utilized Recommendation Feature */}
        {remainingAvailableBalance <= 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-rose-950 shadow-sm animate-fadeIn">
            <div className="flex items-start gap-3.5">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black text-rose-950 flex items-center gap-2">
                  ⚠️ RECOMMENDATION: Policy Balance Completely Utilized (₹0 Remaining)
                  <span className="px-2.5 py-0.5 text-[10px] bg-rose-200 text-rose-900 rounded-full font-black uppercase">
                    100% EXHAUSTED
                  </span>
                </h4>
                <p className="text-xs text-rose-800 mt-1 font-medium leading-relaxed">
                  Your policy coverage limit of <strong>{formatCurrency(totalSumInsured)}</strong> is 100% exhausted. New claim submissions will be rejected until the coverage balance is restored via policy renewal or top-up buffer enhancement.
                </p>
              </div>
            </div>
            <button
              onClick={handleQuickRenew}
              disabled={renewing}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs shadow-md transition-all shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${renewing ? "animate-spin" : ""}`} />
              <span>{renewing ? "Renewing..." : "Renew Policy & Restore Sum Insured ➔"}</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* HISTORY OF MONEY ADDING & DEDUCTING (FINANCIAL TRANSACTION AUDIT LEDGER) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-teal-600" />
              Policy Financial Balance & Transaction Ledger (Money Adding & Deducting History)
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Chronological audit trail of all policy coverage allocations (+ Credits) and approved claim payouts (- Debits).
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-emerald-600" /> Total Added: {formatCurrency(totalSumInsured)}
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3 text-rose-600" /> Total Deducted: -{formatCurrency(totalDeductedMoney)}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Transaction Ref</th>
                <th className="py-3.5 px-4">Transaction Type</th>
                <th className="py-3.5 px-4">Description & Event Details</th>
                <th className="py-3.5 px-4 text-right">Amount Added / Deducted</th>
                <th className="py-3.5 px-4 text-right">Available Balance After</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledgerWithBalances.map((txn, idx) => {
                const isCredit = txn.type === "CREDIT";
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    {/* Date */}
                    <td className="py-3.5 px-4 font-medium text-slate-600 whitespace-nowrap">
                      {txn.date}
                    </td>

                    {/* Reference */}
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-800 text-[11px] whitespace-nowrap">
                      {txn.id}
                    </td>

                    {/* Type Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[10px] border ${
                        isCredit
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : txn.type === "DEBIT"
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}>
                        {isCredit ? (
                          <PlusCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                        ) : (
                          <MinusCircle className="w-3 h-3 text-rose-600 shrink-0" />
                        )}
                        {txn.typeLabel}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-bold text-slate-900 text-xs">{txn.description}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{txn.category}</p>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className={`font-mono font-black text-xs ${isCredit ? "text-emerald-700" : "text-rose-600"}`}>
                        {isCredit ? `+ ${formatCurrency(txn.amount)}` : `- ${formatCurrency(txn.deductedAmount ?? txn.amount)}`}
                      </span>
                    </td>

                    {/* Balance After */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-teal-700 whitespace-nowrap">
                      {formatCurrency(txn.balanceAfter)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                        isCredit || strStatus(txn.status).includes("APPROV") || strStatus(txn.status).includes("SUBMIT")
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid of Policy Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Deductibles & Co-Payments */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Deductibles & Co-Pay</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 font-medium">Policy Deductible:</span>
              <span className="font-extrabold text-slate-800">{formatCurrency(selectedPol.deductible)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 font-medium">Co-Payment Requirement:</span>
              <span className="font-extrabold text-slate-800">{selectedPol.co_payment}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Deductible is deducted upfront before co-payment split is calculated.
          </p>
        </div>

        {/* Card 2: Sub-Limits & Capping */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Sub-Limits & Capping</h3>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <p className="font-bold text-slate-800">{selectedPol.sub_limits || "Standard Policy Room Rent & Disease Limits"}</p>
          </div>
          <p className="text-[11px] text-slate-400">
            Cataract capped at ₹50,000; Knee Replacement capped at ₹2,00,000.
          </p>
        </div>

        {/* Card 3: Waiting Periods */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Waiting Periods</h3>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <p className="font-bold text-slate-800">{selectedPol.waiting_period || "30 Days Initial Waiting Period Completed"}</p>
          </div>
          <p className="text-[11px] text-slate-400">
            Factor #4 checks whether patient treatments fall within active waiting periods.
          </p>
        </div>
      </div>

      {/* Covered Treatments vs General Exclusions Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Covered Treatments */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Covered Treatments (Factor #7 PASS)</h3>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-slate-700 leading-relaxed">
            {selectedPol.covered_treatments}
          </div>
        </div>

        {/* Exclusions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <XCircle className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Configured Exclusions (Factor #7 FAIL)</h3>
          </div>
          <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100 text-xs text-slate-700 leading-relaxed">
            {selectedPol.exclusions}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyCoveragePage;
