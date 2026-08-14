import React, { useState, useEffect } from "react";
import { Users, UserPlus, Trash2, Edit, CheckCircle2, AlertTriangle, ShieldCheck, HeartPulse } from "lucide-react";
import Modal from "../components/Modal";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const InsuredMembersPage = () => {
  const { user } = useAuth();
  const isPolicyholder = user?.role === "policyholder";
  const loggedInPid = user?.policyholder_id || user?.user_id;

  const [policyholders, setPolicyholders] = useState([]);
  const [selectedPhId, setSelectedPhId] = useState(loggedInPid || "POL-1001");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [newMember, setNewMember] = useState({
    name: "",
    relationship: "Spouse",
    age: 32,
    dob: "1994-05-15",
    gender: "Female",
    eligibility_status: "Eligible"
  });

  const fetchPolicyholders = async () => {
    try {
      const res = await api.get("/policyholders?limit=50");
      setPolicyholders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMembers = async (phId) => {
    try {
      setLoading(true);
      const res = await api.get(`/members/${phId}`);
      setMembers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loggedInPid) {
      setSelectedPhId(loggedInPid);
    } else {
      fetchPolicyholders();
    }
  }, [loggedInPid]);

  useEffect(() => {
    if (selectedPhId) {
      fetchMembers(selectedPhId);
    }
  }, [selectedPhId]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/members/${selectedPhId}`, newMember);
      setIsAddModalOpen(false);
      fetchMembers(selectedPhId);
      setNewMember({
        name: "",
        relationship: "Child",
        age: 8,
        dob: "2018-08-10",
        gender: "Male",
        eligibility_status: "Eligible"
      });
    } catch (err) {
      alert("Failed to add member.");
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm(`Are you sure you want to remove member ${memberId}?`)) return;
    try {
      await api.delete(`/members/${memberId}`);
      fetchMembers(selectedPhId);
    } catch (err) {
      alert("Failed to delete member.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Insured Family Members & Beneficiaries
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage covered dependents, relationship status, and eligibility waiting periods.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500">Policyholder:</label>
            {loggedInPid ? (
              <span className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 font-mono font-bold text-xs border border-teal-200">
                {loggedInPid} - {user?.full_name || "Self"}
              </span>
            ) : (
              <select
                value={selectedPhId}
                onChange={(e) => setSelectedPhId(e.target.value)}
                className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              >
                {policyholders.map((ph) => (
                  <option key={ph.policyholder_id} value={ph.policyholder_id}>
                    {ph.policyholder_id} - {ph.full_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300">Family Floater Summary</span>
          <h2 className="text-xl font-extrabold mt-0.5">{selectedPhId} Coverage Unit</h2>
          <p className="text-xs text-slate-300 mt-1">
            Total of <span className="font-bold text-white">{members.length} Insured Members</span> covered under this master health policy.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
          <ShieldCheck className="w-8 h-8 text-teal-300" />
          <div>
            <p className="text-[10px] text-slate-300 font-semibold uppercase">Floater Status</p>
            <p className="text-sm font-extrabold text-white">Active & Eligible</p>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Insured Members List ({members.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">All members eligible for cashless inpatient claims</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Member ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Relationship</th>
                <th className="py-3 px-4">Age / Gender</th>
                <th className="py-3 px-4">Date of Birth</th>
                <th className="py-3 px-4">Eligibility Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.member_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-700">{m.member_id}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{m.name}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-semibold text-slate-700 text-[11px]">
                      {m.relationship}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-600">{m.age} yrs • {m.gender}</td>
                  <td className="py-3.5 px-4 text-slate-500">{m.dob}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {m.eligibility_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDeleteMember(m.member_id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Add Insured Member to ${selectedPhId}`}
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Legal Name</label>
            <input
              type="text"
              required
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              placeholder="e.g. Ananya Reddy"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Relationship</label>
              <select
                value={newMember.relationship}
                onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              >
                <option value="Spouse">Spouse</option>
                <option value="Child / Son">Child / Son</option>
                <option value="Child / Daughter">Child / Daughter</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Grandchild">Grandchild</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gender</label>
              <select
                value={newMember.gender}
                onChange={(e) => setNewMember({ ...newMember, gender: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Age</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={newMember.age}
                onChange={(e) => setNewMember({ ...newMember, age: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date of Birth</label>
              <input
                type="date"
                required
                value={newMember.dob}
                onChange={(e) => setNewMember({ ...newMember, dob: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all"
            >
              Save Member
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InsuredMembersPage;
