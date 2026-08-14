import React, { useState, useEffect } from "react";
import { 
  User, Search, Edit2, ShieldCheck, Mail, Phone, 
  MapPin, Calendar, CheckCircle2, AlertCircle, Eye, EyeOff 
} from "lucide-react";
import Modal from "../components/Modal";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const PolicyholderPage = ({ selectedPolicyholderId, onSelectPolicyholder }) => {
  const [policyholders, setPolicyholders] = useState([]);
  const [selectedPh, setSelectedPh] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { user } = useAuth();
  const isPolicyholder = user?.role === "policyholder";
  const loggedInPid = user?.policyholder_id || user?.user_id;

  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [maskKyc, setMaskKyc] = useState(true);

  const fetchPolicyholders = async () => {
    try {
      setLoading(true);
      const targetPid = selectedPolicyholderId || loggedInPid || "POL-1001";

      // 1. Fetch full list or search filtered list
      const res = await api.get(`/policyholders?limit=200${search ? `&search=${search}` : ""}`);
      const phList = res.data;
      setPolicyholders(phList);

      // 2. Select target policyholder
      if (phList.length > 0) {
        if (targetPid) {
          const match = phList.find(p => p.policyholder_id.toUpperCase() === targetPid.toUpperCase());
          if (match) {
            setSelectedPh(match);
          } else {
            try {
              const singleRes = await api.get(`/policyholders/${targetPid}`);
              setSelectedPh(singleRes.data);
            } catch {
              setSelectedPh(phList[0]);
            }
          }
        } else {
          setSelectedPh(phList[0]);
        }
      } else if (targetPid) {
        try {
          const singleRes = await api.get(`/policyholders/${targetPid}`);
          setSelectedPh(singleRes.data);
          setPolicyholders([singleRes.data]);
        } catch {
          setSelectedPh(null);
        }
      } else {
        setSelectedPh(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicyholders();
  }, [search, selectedPolicyholderId]);

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
      fetchPolicyholders();
    } catch (err) {
      alert("Failed to update policyholder details.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatKyc = (val) => {
    if (!val) return "N/A";
    if (!maskKyc) return val;
    // Mask characters
    return val.replace(/\d(?=\d{3})/g, "•");
  };

  return (
    <div className="space-y-6">
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

      {/* Main Grid: Left Selector List, Right Detailed Profile View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Searchable Policyholder List (200 records) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col h-[700px]">
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, Name, Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {policyholders.map((ph) => {
              const isSelected = selectedPh?.policyholder_id === ph.policyholder_id;
              return (
                <div
                  key={ph.policyholder_id}
                  onClick={() => {
                    setSelectedPh(ph);
                    if (onSelectPolicyholder) onSelectPolicyholder(ph.policyholder_id);
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-all border text-left flex items-center justify-between ${
                    isSelected
                      ? "bg-teal-50 border-teal-300 shadow-xs"
                      : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="overflow-hidden py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-100/60 px-1.5 py-0.5 rounded border border-teal-200">
                        {ph.policyholder_id}
                      </span>
                      <span className="font-bold text-xs text-slate-900 truncate">{ph.full_name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-400 font-semibold">
            Showing {policyholders.length} Policyholders
          </div>
        </div>

        {/* Right Column: Active Policyholder Details Card */}
        <div className="lg:col-span-8 space-y-6">
          {selectedPh ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
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

                {Boolean(loggedInPid && selectedPh?.policyholder_id && loggedInPid.trim().toUpperCase() === selectedPh.policyholder_id.trim().toUpperCase()) && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(selectedPh)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold text-xs border border-teal-200 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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

                  <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-100 text-xs">
                    <span className="text-slate-500 font-medium">Plan Type:</span>
                    <p className="font-bold text-teal-900 mt-0.5">
                      {selectedPh.coverage_type} ({selectedPh.total_members} Insured Member{selectedPh.total_members > 1 ? "s" : ""})
                    </p>
                  </div>
                </div>
              </div>

              {/* Insured Family Members Quick Preview */}
              {selectedPh.members && selectedPh.members.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Covered Insured Members ({selectedPh.members.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedPh.members.map((m) => (
                      <div key={m.member_id} className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{m.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {m.relationship} • {m.age} yrs • DOB: {m.dob}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                          {m.eligibility_status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
              Select a policyholder to view details
            </div>
          )}
        </div>
      </div>

      {/* Edit Policyholder Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Policyholder - ${selectedPh?.policyholder_id}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
            <input
              type="text"
              required
              value={editFormData.full_name || ""}
              onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
              <input
                type="email"
                required
                value={editFormData.email || ""}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Number</label>
              <input
                type="text"
                required
                value={editFormData.contact_number || ""}
                onChange={(e) => setEditFormData({ ...editFormData, contact_number: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Residential Address</label>
            <textarea
              rows={2}
              required
              value={editFormData.address || ""}
              onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">KYC Info</label>
              <input
                type="text"
                required
                value={editFormData.kyc_info || ""}
                onChange={(e) => setEditFormData({ ...editFormData, kyc_info: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">KYC Status</label>
              <select
                value={editFormData.kyc_status || "Verified"}
                onChange={(e) => setEditFormData({ ...editFormData, kyc_status: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              >
                <option value="Verified">Verified</option>
                <option value="Pending Verification">Pending Verification</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PolicyholderPage;
