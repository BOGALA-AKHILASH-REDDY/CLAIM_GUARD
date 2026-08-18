import React, { useState } from "react";
import { 
  ShieldCheck, ArrowRight, Building2, Phone, Mail, 
  MapPin, Award, Clock,
  CheckCircle2, HeartHandshake, Zap, Activity, Users, 
  HeartPulse, RefreshCw, CreditCard, Layers,
  UserPlus, AlertOctagon, Gift, Shield
} from "lucide-react";

// Social Media SVG Icons
const TwitterXIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const InstagramIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const YouTubeIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const WhatsAppIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.301-.15-1.778-.877-2.054-.977-.275-.1-.475-.15-.675.15-.2.3-.775.977-.95 1.176-.176.2-.351.225-.652.075-.3-.15-1.267-.467-2.414-1.49-.893-.797-1.495-1.782-1.671-2.082-.175-.3-.018-.463.132-.613.136-.134.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.625-.925-2.225-.244-.585-.492-.505-.675-.515-.175-.01-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.026-1.05 2.5 0 1.474 1.075 2.898 1.225 3.098.15.2 2.115 3.23 5.124 4.53.716.31 1.275.495 1.71.633.72.23 1.374.197 1.892.12.577-.087 1.778-.727 2.029-1.43.25-.702.25-1.303.175-1.43-.075-.126-.275-.2-.575-.35zM12.042 2.012c-5.518 0-9.996 4.478-9.996 9.996 0 1.763.46 3.486 1.332 5.001L2 22l5.127-1.344a9.96 9.96 0 0 0 4.915 1.282c5.518 0 9.996-4.478 9.996-9.996 0-5.518-4.478-9.996-9.996-9.996z"/>
  </svg>
);

const LandingPage = ({ onGetStarted }) => {
  const [activeMethodTab, setActiveMethodTab] = useState("claim_methods");

  const insuranceHighlights = [
    {
      icon: Award,
      title: "99.4% Settlement Ratio",
      desc: "Guaranteed fast-track processing and transparent automated audit trails.",
      badge: "Audited",
      iconColor: "text-blue-600 bg-blue-50"
    },
    {
      icon: Building2,
      title: "12,500+ Hospital Network",
      desc: "Instant cashless hospitalization across hospital chains and diagnostic centers.",
      badge: "Network",
      iconColor: "text-sky-600 bg-sky-50"
    },
    {
      icon: HeartHandshake,
      title: "₹1 Crore Coverage Sum",
      desc: "Individual, family floater, and senior citizen plans with restoration benefits.",
      badge: "Coverage",
      iconColor: "text-indigo-600 bg-indigo-50"
    },
    {
      icon: Zap,
      title: "45-Minute Cashless Approvals",
      desc: "Digital pre-authorization integration with automated policy validation.",
      badge: "Express TAT",
      iconColor: "text-blue-700 bg-blue-50"
    }
  ];

  // Claim Settlement Pathways
  const settlementPathways = [
    {
      id: "cashless",
      title: "Cashless Claim Pathway",
      subtitle: "Direct hospital insurance desk settlement without upfront out-of-pocket medical bill payments.",
      recommended: true,
      icon: ShieldCheck,
      iconBg: "bg-blue-100 text-blue-700 border border-blue-200",
      cardBorder: "border-blue-500 bg-white shadow-md shadow-blue-500/5",
      steps: [
        "Network hospital admission",
        "Hospital insurance / TPA desk verification",
        "Pre-authorization request dispatch",
        "Automated rule review & policy validation",
        "Instant cashless approval & settlement"
      ]
    },
    {
      id: "reimbursement",
      title: "Reimbursement Claim Pathway",
      subtitle: "Upfront bill payment followed by documentation submission for direct bank disbursement.",
      recommended: false,
      icon: CreditCard,
      iconBg: "bg-slate-100 text-slate-700 border border-slate-200",
      cardBorder: "border-slate-200 bg-white shadow-xs",
      steps: [
        "Hospitalization & upfront payment",
        "Collection of discharge summary & bills",
        "16-Factor pre-audit verification",
        "Claim & KYC submission to insurer",
        "Approved amount transferred to bank"
      ]
    }
  ];

  // Policy Services
  const policyServices = [
    {
      id: "transfer",
      title: "Policy Transfer (Nominee)",
      tag: "Nominee Rights",
      icon: UserPlus,
      color: "border-slate-200 bg-white hover:border-blue-300",
      desc: "Digital transfer of active health policy ownership to designated legal nominees or primary beneficiaries upon life events.",
      points: [
        "Death certificate & legal heir verification",
        "Retains original policy start date & NCB",
        "Zero waiting period loss or tenure reset"
      ]
    },
    {
      id: "continuation",
      title: "Policy Continuation & Pre-Claim Check",
      tag: "4-Pillar Engine",
      icon: RefreshCw,
      color: "border-slate-200 bg-white hover:border-blue-300",
      desc: "Pre-claim verification of premium status, active grace-period, remaining balance, and policy conditions before submitting claims.",
      points: [
        "Validates active premium payments",
        "Tracks 30-day grace period status",
        "Identifies corrective actions before claim filing"
      ]
    },
    {
      id: "surrender",
      title: "Policy Surrender / Closure",
      tag: "70/30 Rule",
      icon: AlertOctagon,
      color: "border-slate-200 bg-white hover:border-blue-300",
      desc: "Rule-based calculation for policyholders closing their policy: 70% unutilized premium refunded with 30% operational retention.",
      points: [
        "Transparent 70% pro-rata premium refund",
        "Standard 30% administrative fee calculation",
        "Direct NEFT bank credit processing"
      ]
    },
    {
      id: "benefit",
      title: "Benefit Transfer & Portability",
      tag: "Portability",
      icon: Gift,
      color: "border-slate-200 bg-white hover:border-blue-300",
      desc: "Transfer accumulated wellness rewards, non-claim bonuses (NCB), and family floater benefits across active members.",
      points: [
        "Accumulated wellness points transfer",
        "NCB bonus portability to individual members",
        "Plan upgrade carryover with zero forfeiture"
      ]
    }
  ];

  // 4 Verified Social Channels
  const socialChannels = [
    {
      name: "Instagram",
      icon: InstagramIcon,
      url: "https://www.instagram.com",
      color: "hover:border-pink-400 hover:text-pink-600 hover:bg-pink-50/60 bg-white border-slate-200 text-slate-700"
    },
    {
      name: "Twitter / X",
      icon: TwitterXIcon,
      url: "https://x.com",
      color: "hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50/60 bg-white border-slate-200 text-slate-700"
    },
    {
      name: "YouTube",
      icon: YouTubeIcon,
      url: "https://www.youtube.com",
      color: "hover:border-red-400 hover:text-red-600 hover:bg-red-50/60 bg-white border-slate-200 text-slate-700"
    },
    {
      name: "WhatsApp Assist",
      icon: WhatsAppIcon,
      url: "https://wa.me/919346749462",
      color: "hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/60 bg-white border-slate-200 text-slate-700"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* Top Header */}
      <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur sticky top-0 z-50 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900">CLAIMGUARD</span>
              <span className="text-[11px] text-blue-600 font-semibold block -mt-0.5">Healthcare Denial Prevention</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-20 px-4 sm:px-6 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold mb-6 shadow-xs">
          Provider Claim Denial Prevention & Insurance Policy Management
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          Provider Claim Denial <br />
          <span className="text-blue-600">Prevention Companion.</span>
        </h1>

        {/* Primary Action */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Key Metrics Grid */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-3xl mx-auto text-left">
          <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-300 transition-colors">
            <div className="text-3xl font-black text-blue-600">16</div>
            <div className="text-xs text-slate-600 font-bold mt-1">Validation Rules</div>
          </div>
          <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-sky-300 transition-colors">
            <div className="text-3xl font-black text-sky-600">94%</div>
            <div className="text-xs text-slate-600 font-bold mt-1">Approval Confidence</div>
          </div>
          <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-colors">
            <div className="text-3xl font-black text-indigo-600">200+</div>
            <div className="text-xs text-slate-600 font-bold mt-1">Active Policies</div>
          </div>
          <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-300 transition-colors">
            <div className="text-3xl font-black text-blue-700">70/30</div>
            <div className="text-xs text-slate-600 font-bold mt-1">Surrender Rule</div>
          </div>
        </div>
      </section>

      {/* Platform Architecture & Infrastructure */}
      <section className="py-16 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-10 text-center sm:text-left">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Platform Architecture & Infrastructure
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              End-to-end digital claims pre-audit and healthcare insurance administration.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {insuranceHighlights.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={idx}
                  className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between hover:border-blue-300 hover:bg-white hover:shadow-sm transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className={`w-10 h-10 rounded-xl ${item.iconColor} flex items-center justify-center font-bold shadow-2xs`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full border border-blue-200">
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1.5">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contact Strip */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Headquarters</span>
                <span className="text-slate-800 font-semibold">Financial District, Hyderabad</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
              <Phone className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">24x7 Claims Helpline</span>
                <span className="text-slate-800 font-semibold">1800-425-25246</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
              <Mail className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Support Desk</span>
                <span className="text-slate-800 font-semibold">support@claimguard.health</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Operational Methods & Frameworks */}
      <section className="py-16 border-t border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Operational Frameworks
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Standardized workflows for claim settlements and policy lifecycle administration.
              </p>
            </div>

            <div className="inline-flex p-1 bg-slate-200/80 rounded-xl border border-slate-300/60 self-start sm:self-auto">
              <button
                onClick={() => setActiveMethodTab("claim_methods")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMethodTab === "claim_methods"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Settlement Pathways
              </button>
              <button
                onClick={() => setActiveMethodTab("policy_methods")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMethodTab === "policy_methods"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Policy Lifecycle
              </button>
            </div>
          </div>

          {/* TAB 1: CLAIM SETTLEMENT PATHWAYS */}
          {activeMethodTab === "claim_methods" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {settlementPathways.map((pathway) => {
                const IconComponent = pathway.icon;
                return (
                  <div
                    key={pathway.id}
                    className={`p-6 sm:p-7 rounded-2xl border ${pathway.cardBorder} flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pathway.iconBg}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        {pathway.recommended && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                            RECOMMENDED
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-slate-900">
                        {pathway.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
                        {pathway.subtitle}
                      </p>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                        {pathway.steps.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-2.5 text-xs text-slate-700">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {sIdx + 1}
                            </span>
                            <span className="font-medium">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: POLICY SERVICES */}
          {activeMethodTab === "policy_methods" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {policyServices.map((service) => {
                const ServiceIcon = service.icon;
                return (
                  <div
                    key={service.id}
                    className={`p-6 sm:p-7 rounded-2xl border ${service.color} shadow-xs flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
                            <ServiceIcon className="w-4 h-4" />
                          </div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {service.title}
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {service.tag}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed mb-4">
                        {service.desc}
                      </p>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                        {service.points.map((pt, pIdx) => (
                          <div key={pIdx} className="flex items-start gap-2 text-xs text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <span className="font-medium">{pt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Visit Us Online (Icon-Only Display) */}
      <section className="py-14 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Visit CLAIMGUARD Online
          </h2>

          <div className="flex items-center justify-center gap-4">
            {socialChannels.map((channel, index) => {
              const ChannelIcon = channel.icon;
              return (
                <a
                  key={index}
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={channel.name}
                  title={channel.name}
                  className={`w-12 h-12 rounded-xl border ${channel.color} transition-all hover:scale-105 hover:shadow-md flex items-center justify-center cursor-pointer shadow-xs`}
                >
                  <ChannelIcon className="w-5 h-5" />
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Minimal Clean Developer Footer */}
      <footer className="py-6 border-t border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 CLAIMGUARD. Healthcare Insurance Claim Denial Prevention System.</span>
          <div className="flex gap-4 text-slate-500 text-[11px]">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
