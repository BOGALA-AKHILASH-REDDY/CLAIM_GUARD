import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldCheck, Search, Bell, User as UserIcon, 
  LogOut, Menu, X, ChevronDown, Activity,
  FileText, Users, Shield, ArrowRight, CheckCircle2, AlertOctagon
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { formatCurrency, getRiskBadgeColor, getStatusBadgeColor } from "../utils/formatters";

const Navbar = ({ onToggleSidebar, activePage, onNavigateTab, onSelectClaim, onSelectPolicyholder }) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const notifications = [
    { id: 1, title: "Pre-Auth Document Verified", desc: "Claim CLM-1001 authorization approved", time: "5m ago", unread: true },
    { id: 2, title: "Nominee Transfer Approved", desc: "POL-1003 death certificate validated", time: "1h ago", unread: true },
    { id: 3, title: "16-Factor Audit Passed", desc: "Claim CLM-1004 confidence score 94%", time: "2h ago", unread: false },
  ];

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearchOpen(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await api.get(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchResults(res.data);
        setIsSearchOpen(true);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectResult = (targetTab, recordId) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    if (targetTab === "claim-analysis") {
      if (onSelectClaim) onSelectClaim(recordId);
      if (onNavigateTab) onNavigateTab("claim-analysis");
    } else if (targetTab === "policyholder") {
      if (onSelectPolicyholder) {
        onSelectPolicyholder(recordId);
      } else if (onNavigateTab) {
        onNavigateTab("policyholder");
      }
    } else if (onNavigateTab) {
      onNavigateTab(targetTab);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Sidebar Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Global Search Engine with Live Dropdown */}
        <div className="relative flex-1 max-w-lg mx-4" ref={searchRef}>
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults && searchResults.total_results > 0) setIsSearchOpen(true); }}
              placeholder="Search Policyholders, Claims, Policies, Diagnoses..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100/90 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setIsSearchOpen(false); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {isSearchOpen && searchResults && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[480px] overflow-y-auto">
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-600 uppercase tracking-wider">
                  Search Results ({searchResults.total_results})
                </span>
                <span className="text-slate-400">Click result to view</span>
              </div>

              {searchResults.total_results === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No matching claims, policyholders, or policies found for "{searchQuery}"
                </div>
              ) : (
                <div className="divide-y divide-slate-100 p-1">
                  {/* Category 1: Claims */}
                  {searchResults.results.claims.length > 0 && (
                    <div className="p-2">
                      <span className="text-[10px] font-extrabold uppercase text-teal-700 tracking-wider flex items-center gap-1 mb-1 px-2">
                        <FileText className="w-3 h-3" /> Claims ({searchResults.results.claims.length})
                      </span>
                      <div className="space-y-1">
                        {searchResults.results.claims.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => handleSelectResult(c.target_tab, c.record_id)}
                            className="p-2.5 rounded-xl hover:bg-teal-50/70 transition-colors cursor-pointer flex items-center justify-between group"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-teal-800">{c.id}</span>
                                <span className="font-bold text-xs text-slate-900">{c.title.split(" - ")[1]}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">{c.subtitle}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeColor(c.status)}`}>
                                {c.status}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category 2: Policyholders */}
                  {searchResults.results.policyholders.length > 0 && (
                    <div className="p-2">
                      <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1 mb-1 px-2">
                        <UserIcon className="w-3 h-3" /> Policyholder Profile ({searchResults.results.policyholders.length})
                      </span>
                      <div className="space-y-1">
                        {searchResults.results.policyholders.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => handleSelectResult(p.target_tab, p.record_id)}
                            className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/80">{p.id}</span>
                              <span className="font-bold text-xs text-slate-900">{p.title.includes(" - ") ? p.title.split(" - ")[1] : p.title}</span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category 3: Policies */}
                  {searchResults.results.policies.length > 0 && (
                    <div className="p-2">
                      <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1 mb-1 px-2">
                        <Shield className="w-3 h-3" /> Policies ({searchResults.results.policies.length})
                      </span>
                      <div className="space-y-1">
                        {searchResults.results.policies.map((pol) => (
                          <div
                            key={pol.id}
                            onClick={() => handleSelectResult(pol.target_tab, pol.record_id)}
                            className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group"
                          >
                            <div>
                              <span className="font-mono font-bold text-xs text-slate-900">{pol.title}</span>
                              <p className="text-[11px] text-slate-500 mt-0.5">{pol.subtitle}</p>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {pol.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Notifications & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-500 rounded-full ring-2 ring-white" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Notifications (3)
                  </span>
                  <span className="text-[10px] text-teal-600 font-semibold cursor-pointer hover:underline">
                    Mark read
                  </span>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors text-left cursor-pointer">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-800">{n.title}</p>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200/60"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {user?.full_name ? user.full_name.charAt(0) : "P"}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.full_name || "Dr. Arvind Sharma"}
                </p>
                <p className="text-[10px] font-semibold text-teal-600 capitalize leading-tight">
                  {user?.role === "provider" ? "Hospital Provider" : `Policyholder (${user?.user_id})`}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">{user?.full_name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || user?.user_id}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
