import React, { useState, useEffect } from "react";
import { CreditCard, CheckCircle2, AlertCircle, Clock, ArrowRight, RefreshCw, DollarSign, Calendar } from "lucide-react";
import api from "../services/api";
import { formatCurrency, getStatusBadgeColor } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";

const PaymentsPage = () => {
  const { user } = useAuth();
  const isPolicyholder = user?.role === "policyholder" || Boolean(user?.policyholder_id);
  const loggedInPid = user?.policyholder_id || (user?.role === "policyholder" ? user?.user_id : null);

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const url = loggedInPid ? `/payments?policyholder_id=${loggedInPid}` : "/payments";
      const res = await api.get(url);
      setPayments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [loggedInPid]);

  const handlePay = async (paymentId) => {
    try {
      setPayingId(paymentId);
      await api.post(`/payments/pay/${paymentId}`, null, {
        params: { payment_method: "UPI (Instant)" }
      });
      alert(`Premium payment for ${paymentId} settled successfully! Policy status restored to Active.`);
      fetchPayments();
    } catch (err) {
      alert("Payment processing failed.");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-600" />
            Premium Ledger & Payment Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track premium schedules, overdue arrears, grace periods, and restore active claim eligibility.
          </p>
        </div>

        <button
          onClick={fetchPayments}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Policy Premium Records ({payments.length})</h3>
            <p className="text-xs text-slate-500">Live payment statuses linked to Factor #1 (Policy Status Active/Lapsed)</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Policyholder</th>
                <th className="py-3 px-4">Policy Number</th>
                <th className="py-3 px-4">Premium Amount</th>
                <th className="py-3 px-4">Frequency</th>
                <th className="py-3 px-4">Next Due Date</th>
                <th className="py-3 px-4">Outstanding</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((pm) => {
                const isPaid = pm.payment_status === "Paid";
                return (
                  <tr key={pm.payment_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700">{pm.payment_id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{pm.policyholder_id}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">{pm.policy_number}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{formatCurrency(pm.premium_amount)}</td>
                    <td className="py-3.5 px-4 text-slate-600">{pm.payment_frequency}</td>
                    <td className="py-3.5 px-4 text-slate-500">{pm.next_due_date || "Annual Cycle"}</td>
                    <td className="py-3.5 px-4 font-extrabold text-rose-600">
                      {pm.outstanding_amount > 0 ? formatCurrency(pm.outstanding_amount) : "₹0 (Cleared)"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeColor(pm.payment_status)}`}>
                        {pm.payment_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!isPaid ? (
                        <button
                          onClick={() => handlePay(pm.payment_id)}
                          disabled={payingId === pm.payment_id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
                        >
                          {payingId === pm.payment_id ? "Processing..." : "Pay Now"}
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
