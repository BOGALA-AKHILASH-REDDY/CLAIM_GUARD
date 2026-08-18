import React, { useState, useEffect } from "react";
import { 
  User, Edit2, ShieldCheck, Mail, Phone, 
  MapPin, Calendar, CheckCircle2, AlertCircle, Eye, EyeOff 
} from "lucide-react";
import Modal from "../components/Modal";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const PolicyholderPage = ({ selectedPolicyholderId, onSelectPolicyholder }) => {
  const [selectedPh, setSelectedPh] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { user } = useAuth();
  const isPolicyholder = user?.role === "policyholder" || Boolean(user?.policyholder_id);
  const loggedInPid = user?.policyholder_id || (user?.role === "policyholder" ? user?.user_id : null);

  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [maskKyc, setMaskKyc] = useState(true);

  const fetchPolicyholders = async () => {
    try {
      setLoading(true);
      const targetPid = loggedInPid || selectedPolicyholderId || "POL-1001";
      const singleRes = await api.get(`/policyholders/${targetPid}`);
      setSelectedPh(singleRes.data);
    } catch (err) {
      console.error("Error fetching policyholder:", err);
      // Fallback
      try {
        const res = await api.get("/policyholders?limit=1");
        if (res.data && res.data.length > 0) {
          setSelectedPh(res.data[0]);
        }
      } catch (e) {
        console.error("Fallback fetch error:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicyholders();
  }, [selectedPolicyholderId, loggedInPid]);

  const handleOpenEdit = (ph) => {
    setEditFormData({
      full_name: ph.full_name,
      address: ph.address,
      contact_number: ph.contact_number,
      email: ph.email,
      kyc_info: ph.kyc_info,
      kyc_status: ph.kyc_status,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedPh) return;
    setIsSaving(true);
    try {
      const res = await api.put(`/policyholders/${selectedPh.policyholder_id}`, editFormData);
      setSelectedPh(res.data);
      setIsEditModalOpen(false);
    } catch (err) {
      alert("Failed to update policyholder details.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatKyc = (val) => {
    if (!val) return "N/A";
    if (!maskKyc) return val;
    return val.replace(/\d(?=\d{3})/g, "•");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <User className="w-5 h-5 text-teal-600" />
            Policyholder Registry & KYC Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access demographic profiles, verified identity records, and coverage allocations.
          </p>
        </div>
      </div>

      {/* Main Profile View (Full Width) */}
      <div className="space-y-6">
        {selectedPh ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-teal-800 text-white font-black text-xl flex items-center justify-center shadow-md shadow-teal-800/20">
                  {selectedPh.full_name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900">{selectedPh.full_name}</h2>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                      {selectedPh.policyholder_id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Age: <span className="font-semibold text-slate-700">{selectedPh.age} Years</span> • Gender: <span className="font-semibold text-slate-700">{selectedPh.gender}</span> • DOB: <span className="font-semibold text-slate-700">{selectedPh.dob}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(selectedPh)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold text-xs border border-teal-200 transition-colors shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Section 1: Contact & Address */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact & Address</h3>
                
                <div className="flex items-start gap-3 text-xs">
                  <MapPin className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-400 font-medium">Residential Address:</span>
                    <p className="font-bold text-slate-800 mt-0.5">{selectedPh.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <Phone className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-400 font-medium">Contact Number:</span>
                    <p className="font-bold text-slate-800 mt-0.5">{selectedPh.contact_number}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <Mail className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-400 font-medium">Email Address:</span>
                    <p className="font-bold text-slate-800 mt-0.5">{selectedPh.email}</p>
                  </div>
                </div>
              </div>

              {/* Section 2: KYC & Identification */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">KYC & Identity Verification</h3>
                  <button
                    type="button"
                    onClick={() => setMaskKyc(!maskKyc)}
                    className="text-[11px] font-bold text-teal-600 hover:underline flex items-center gap-1"
                  >
                    {maskKyc ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {maskKyc ? "Reveal KYC" : "Mask KYC"}
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">KYC Document Record:</span>
                    <span className="font-mono font-bold text-slate-800">{formatKyc(selectedPh.kyc_info)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Verification Status:</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                      <CheckCircle2 className="w-3 h-3" /> {selectedPh.kyc_status}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-200 text-xs">
                  <span className="text-slate-500 font-medium block">Plan Type:</span>
                  <span className="font-black text-teal-900 mt-0.5 block">
                    Family Floater ({selectedPh.members?.length || 1} Insured Members)
                  </span>
                </div>
              </div>
            </div>

            {/* Active Policies & Coverage */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Active Policies & Coverage ({selectedPh.policies?.length || 0})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPh.policies?.map((pol) => (
                  <div key={pol.policy_number} className="p-4 rounded-xl border border-teal-200 bg-teal-50/30 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-teal-900 text-sm">{pol.policy_number}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {pol.status}
                      </span>
                    </div>
                    <p className="text-slate-600">Type: <span className="font-bold text-slate-800">{pol.policy_type}</span></p>
                    <p className="text-slate-600">Sum Insured: <span className="font-bold text-slate-800">₹{pol.sum_insured?.toLocaleString("en-IN")}</span></p>
                    <p className="text-slate-600">Available Coverage: <span className="font-black text-teal-700">₹{pol.available_coverage?.toLocaleString("en-IN")}</span></p>
                    <p className="text-slate-400 text-[11px]">Tenure: {pol.start_date} to {pol.end_date}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Covered Insured Members */}
            {selectedPh.members && selectedPh.members.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Covered Insured Members ({selectedPh.members.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedPh.members.map((mem) => (
                    <div key={mem.member_id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-slate-900">{mem.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          Eligible
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        {mem.relationship} • {mem.age || 25} yrs • DOB: {mem.dob || "N/A"}
                      </p>
                      <span className="font-mono text-[10px] text-slate-400 block mt-1">{mem.member_id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
            {loading ? "Loading policyholder records..." : "No policyholder profile found."}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && selectedPh && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Profile: ${selectedPh.full_name}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={editFormData.full_name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Residential Address</label>
              <textarea
                rows={2}
                value={editFormData.address || ""}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Number</label>
                <input
                  type="text"
                  value={editFormData.contact_number || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, contact_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editFormData.email || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">KYC Info / Document</label>
                <input
                  type="text"
                  value={editFormData.kyc_info || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, kyc_info: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">KYC Status</label>
                <select
                  value={editFormData.kyc_status || "Verified"}
                  onChange={(e) => setEditFormData({ ...editFormData, kyc_status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  <option value="Verified">Verified</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PolicyholderPage;
