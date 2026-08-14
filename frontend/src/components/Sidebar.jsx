import React, { useState } from "react";
import {
  LayoutDashboard, User, Users, HeartPulse, Shield, CreditCard,
  UserPlus, RefreshCw, AlertOctagon, Gift, PlusCircle, History,
  FileSearch, CheckSquare, FolderOpen, BarChart3, Settings, LogOut,
  ChevronDown, ChevronRight, X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ activeTab, onSelectTab, isOpen, onClose }) => {
  const { logout, user } = useAuth();
  
  // Expandable sections state
  const [openSections, setOpenSections] = useState({
    policyMgmt: true,
    policyServices: true,
    claims: true,
  });

  const toggleSection = (sec) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const navItemClass = (tabId) => {
    const isActive = activeTab === tabId;
    return `w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 text-left ${
      isActive
        ? "bg-brand-50 text-brand-800 font-bold border border-brand-200/80 shadow-sm"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
    }`;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header Branding */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-800 flex items-center justify-center text-white shadow-md">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-slate-900 leading-tight">CLAIMGUARD</h2>
              <p className="text-[10px] font-semibold text-teal-600 leading-tight">Provider Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {/* Main Dashboard */}
          <div>
            <button
              onClick={() => { onSelectTab("dashboard"); onClose(); }}
              className={navItemClass("dashboard")}
            >
              <LayoutDashboard className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Dashboard</span>
            </button>
          </div>

          {/* Group 1: Policy Management */}
          <div>
            <button
              onClick={() => toggleSection("policyMgmt")}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600"
            >
              <span>Policy Management</span>
              {openSections.policyMgmt ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {openSections.policyMgmt && (
              <div className="mt-1 space-y-0.5 pl-1.5">
                <button onClick={() => { onSelectTab("policyholder"); onClose(); }} className={navItemClass("policyholder")}>
                  <User className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span>Policyholder</span>
                </button>
                <button onClick={() => { onSelectTab("members"); onClose(); }} className={navItemClass("members")}>
                  <Users className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span>Insured Members</span>
                </button>
                <button onClick={() => { onSelectTab("health"); onClose(); }} className={navItemClass("health")}>
                  <HeartPulse className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span>Health Information</span>
                </button>
                <button onClick={() => { onSelectTab("policy-coverage"); onClose(); }} className={navItemClass("policy-coverage")}>
                  <Shield className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span>Policy & Coverage</span>
                </button>
                <button onClick={() => { onSelectTab("payments"); onClose(); }} className={navItemClass("payments")}>
                  <CreditCard className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span>Premium & Payments</span>
                </button>
              </div>
            )}
          </div>

          {/* Group 2: Policy Services */}
          <div>
            <button
              onClick={() => toggleSection("policyServices")}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600"
            >
              <span>Policy Services</span>
              {openSections.policyServices ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {openSections.policyServices && (
              <div className="mt-1 space-y-0.5 pl-1.5">
                <button onClick={() => { onSelectTab("services-transfer"); onClose(); }} className={navItemClass("services-transfer")}>
                  <UserPlus className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span>Policy Transfer (Nominee)</span>
                </button>
                <button onClick={() => { onSelectTab("services-continuation"); onClose(); }} className={navItemClass("services-continuation")}>
                  <RefreshCw className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span>Policy Continuation</span>
                </button>
                <button onClick={() => { onSelectTab("services-surrender"); onClose(); }} className={navItemClass("services-surrender")}>
                  <AlertOctagon className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span>Surrender / Closure (70/30)</span>
                </button>
                <button onClick={() => { onSelectTab("services-benefit"); onClose(); }} className={navItemClass("services-benefit")}>
                  <Gift className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span>Benefit Transfer</span>
                </button>
              </div>
            )}
          </div>

          {/* Group 3: Claims Module (CORE ENGINE) */}
          <div>
            <div className="flex items-center justify-between px-2 py-1">
              <button
                onClick={() => { onSelectTab("claims"); onClose(); }}
                className="flex items-center gap-1.5 text-[11px] font-extrabold text-teal-700 uppercase tracking-wider hover:text-teal-900 text-left"
              >
                <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                <span>CLAIMS (CORE ENGINE)</span>
              </button>
              <button
                onClick={() => toggleSection("claims")}
                className="p-1 rounded text-teal-600 hover:text-teal-800"
              >
                {openSections.claims ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>

            {openSections.claims && (
              <div className="mt-1.5 space-y-1 pl-1">
                {/* Highlighted New Claim pill button as per design */}
                <button
                  onClick={() => { onSelectTab("new-claim"); onClose(); }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left border ${
                    activeTab === "new-claim"
                      ? "bg-teal-800 text-white border-teal-800 shadow-md shadow-teal-800/20"
                      : "bg-white text-teal-900 border-slate-700/80 hover:bg-slate-50 hover:border-slate-900 shadow-xs"
                  }`}
                >
                  <PlusCircle className={`w-4 h-4 shrink-0 ${activeTab === "new-claim" ? "text-teal-300" : "text-teal-700"}`} />
                  <span>New Claim</span>
                </button>

                <button onClick={() => { onSelectTab("claim-history"); onClose(); }} className={navItemClass("claim-history")}>
                  <History className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span>Claim History</span>
                </button>
                <button onClick={() => { onSelectTab("claim-analysis"); onClose(); }} className={navItemClass("claim-analysis")}>
                  <FileSearch className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span>Claim Analysis</span>
                </button>
                <button onClick={() => { onSelectTab("claim-recommendations"); onClose(); }} className={navItemClass("claim-recommendations")}>
                  <CheckSquare className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span>Recommendations</span>
                </button>
              </div>
            )}
          </div>

          {/* Group 4: Documents, Reports, Settings */}
          <div className="pt-2 border-t border-slate-100 space-y-0.5">
            <button onClick={() => { onSelectTab("documents"); onClose(); }} className={navItemClass("documents")}>
              <FolderOpen className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Documents</span>
            </button>
            <button onClick={() => { onSelectTab("reports"); onClose(); }} className={navItemClass("reports")}>
              <BarChart3 className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Reports & Analytics</span>
            </button>
            <button onClick={() => { onSelectTab("settings"); onClose(); }} className={navItemClass("settings")}>
              <Settings className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Configured Rules</span>
            </button>
          </div>
        </div>

        {/* Footer: User profile & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {user?.full_name ? user.full_name.charAt(0) : "P"}
              </div>
              <div className="truncate text-left">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.full_name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
