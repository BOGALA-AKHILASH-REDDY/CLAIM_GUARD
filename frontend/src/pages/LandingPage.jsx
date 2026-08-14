import React, { useState } from "react";
import { 
  ShieldCheck, ArrowRight, Building2, Phone, Mail, 
  MapPin, Globe, Award, Clock, ExternalLink, FileText, 
  CheckCircle2, HeartHandshake, Headphones, Smartphone,
  Shield, Check, MessageSquare, Zap, Activity, Users, 
  HeartPulse, RefreshCw, CreditCard, Stethoscope, ChevronRight,
  Sparkles, Layers, FileCheck, HelpCircle, UserCheck,
  UserPlus, AlertOctagon, Gift
} from "lucide-react";

// Social Media SVG Icons
const LinkedInIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.22a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0-1.6-1.6Z"/>
  </svg>
);

const TwitterXIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.301-.15-1.778-.877-2.054-.977-.275-.1-.475-.15-.675.15-.2.3-.775.977-.95 1.176-.176.2-.351.225-.652.075-.3-.15-1.267-.467-2.414-1.49-.893-.797-1.495-1.782-1.671-2.082-.175-.3-.018-.463.132-.613.136-.134.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.625-.925-2.225-.244-.585-.492-.505-.675-.515-.175-.01-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.026-1.05 2.5 0 1.474 1.075 2.898 1.225 3.098.15.2 2.115 3.23 5.124 4.53.716.31 1.275.495 1.71.633.72.23 1.374.197 1.892.12.577-.087 1.778-.727 2.029-1.43.25-.702.25-1.303.175-1.43-.075-.126-.275-.2-.575-.35zM12.042 2.012c-5.518 0-9.996 4.478-9.996 9.996 0 1.763.46 3.486 1.332 5.001L2 22l5.127-1.344a9.96 9.96 0 0 0 4.915 1.282c5.518 0 9.996-4.478 9.996-9.996 0-5.518-4.478-9.996-9.996-9.996z"/>
  </svg>
);

const LandingPage = ({ onGetStarted }) => {
  const [activeMethodTab, setActiveMethodTab] = useState("claim_methods");

  const insuranceHighlights = [
    {
      icon: Award,
      title: "99.4% Settlement Ratio",
      desc: "Industry-leading claims settlement record with guaranteed fast-track processing and transparent automated audit trails.",
      badge: "IRDAI Audited",
      color: "from-teal-600 to-teal-800"
    },
    {
      icon: Building2,
      title: "12,500+ Hospital Network",
      desc: "Instant cashless hospitalization across premier hospital chains and diagnostic centers with zero out-of-pocket delays.",
      badge: "Nationwide",
      color: "from-blue-600 to-indigo-800"
    },
    {
      icon: HeartHandshake,
      title: "₹1 Crore Coverage Sum",
      desc: "Flexible individual, family floater, and senior citizen plans with restoration benefits and critical illness riders.",
      badge: "Comprehensive",
      color: "from-emerald-600 to-teal-800"
    },
    {
      icon: Zap,
      title: "45-Minute Cashless Approvals",
      desc: "Rapid digital pre-authorization integration across network hospitals with automated AI eligibility and policy clearance.",
      badge: "Express TAT",
      color: "from-amber-500 to-orange-700"
    }
  ];

  // Comprehensive Insurance Policies Catalog
  const policyTypes = [
    {
      id: "family-care",
      title: "Comprehensive Family Care",
      subtitle: "Complete protection for self, spouse, children & dependent parents",
      sumInsured: "₹10 Lakhs – ₹1 Crore",
      coPay: "0% Co-Payment",
      tag: "Most Popular",
      tagColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
      icon: Users,
      features: [
        "Cashless hospitalization in 12,500+ network hospitals",
        "Maternity cover & newborn baby protection from Day 1",
        "AYUSH treatment (Ayurveda, Yoga, Unani, Siddha, Homeopathy)",
        "100% Sum Insured restoration on complete exhaustion",
        "Zero room rent capping & no sub-limits on ICU charges"
      ]
    },
    {
      id: "standard-guard",
      title: "Standard Health Guard",
      subtitle: "Tailored individual protection with essential hospitalization cover",
      sumInsured: "₹5 Lakhs – ₹50 Lakhs",
      coPay: "0% – 10% Flexible",
      tag: "Essential Shield",
      tagColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      icon: ShieldCheck,
      features: [
        "100% in-patient medical care and daycare surgical procedures",
        "Pre-hospitalization (60 days) & Post-hospitalization (90 days)",
        "Free annual preventive full-body health check-ups",
        "Fast-track 16-factor automated pre-audit verification",
        "Zero cumulative bonus penalty on non-claim renewal years"
      ]
    },
    {
      id: "senior-citizen",
      title: "Senior Citizen Health Shield",
      subtitle: "Dedicated medical care for elderly parents aged 60 years and above",
      sumInsured: "₹3 Lakhs – ₹25 Lakhs",
      coPay: "Standard 20% Co-Pay",
      tag: "Senior Care",
      tagColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      icon: HeartPulse,
      features: [
        "Pre-existing illness coverage with reduced waiting period",
        "Specialized geriatric care, home nursing & ICU at home support",
        "Cataract, joint replacement & dialysis structured benefits",
        "Doctor tele-consultation & doorstep medicine delivery support",
        "No mandatory pre-policy medical checkup up to 65 years"
      ]
    },
    {
      id: "critical-illness",
      title: "Critical Illness & Cancer Shield",
      subtitle: "Guaranteed lump-sum payout upon diagnosis of 36 severe medical conditions",
      sumInsured: "₹10 Lakhs – ₹1 Crore (Lump Sum)",
      coPay: "0% Co-Pay (Fixed Payout)",
      tag: "High Protection",
      tagColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      icon: Activity,
      features: [
        "Instant lump-sum benefit on diagnosis of 36 critical illnesses",
        "Covers Cancer, Heart Attack, Stroke, Bypass Surgery, Renal Failure",
        "Zero survival period clause after initial 30 days confirmation",
        "Income replacement protection during prolonged recovery periods",
        "Worldwide emergency medical second opinion from top specialists"
      ]
    },
    {
      id: "super-topup",
      title: "Super Top-Up Buffer Shield",
      subtitle: "High-value buffer coverage at ultra-affordable low premiums",
      sumInsured: "₹25 Lakhs – ₹1 Crore",
      coPay: "0% Co-Pay (Post Deductible)",
      tag: "High Value Buffer",
      tagColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      icon: Layers,
      features: [
        "Provides massive secondary safety net over existing employer policy",
        "Flexible deductible options ranging from ₹3 Lakhs to ₹10 Lakhs",
        "Covers aggregate medical expenses across multiple hospitalizations",
        "Zero waiting period carryover from existing base health plan",
        "100% Tax exemption benefit under Section 80D of IT Act"
      ]
    },
    {
      id: "corporate-group",
      title: "Corporate Group Health Shield",
      subtitle: "Customized healthcare benefits for enterprises and employee teams",
      sumInsured: "Custom Employer Tiers",
      coPay: "Custom Configured",
      tag: "Enterprise",
      tagColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      icon: Building2,
      features: [
        "Day-1 pre-existing condition waiver with no waiting period",
        "Cashless OPD consultations, prescription pharmacy & dental care",
        "Family inclusion: Covers spouse, children & dependent parents",
        "Dedicated corporate claims relationship manager & digital dashboard",
        "Employee health wellness webinars & ergonomic screening programs"
      ]
    }
  ];

  // Claim Settlement Pathways (Matching Image 4)
  const settlementPathways = [
    {
      id: "cashless",
      title: "CASHLESS CLAIM",
      subtitle: "Direct hospital insurance desk settlement without upfront out-of-pocket medical bill payments.",
      recommended: true,
      icon: ShieldCheck,
      iconBg: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40",
      cardBorder: "border-teal-500/50 bg-slate-900/90 shadow-xl shadow-teal-500/10",
      steps: [
        "Network hospital admission",
        "Hospital insurance / TPA help desk",
        "Pre-authorization request dispatch",
        "Insurer medical board review",
        "Cashless approval & direct hospital settlement"
      ],
      actionText: "✓ Selected Pathway",
      actionClass: "text-teal-400 hover:text-teal-300"
    },
    {
      id: "reimbursement",
      title: "REIMBURSEMENT CLAIM",
      subtitle: "Upfront payment by policyholder followed by documentation submission for direct bank transfer.",
      recommended: false,
      icon: CreditCard,
      iconBg: "bg-amber-500/20 text-amber-400 border border-amber-500/40",
      cardBorder: "border-slate-800 bg-slate-900/60 hover:border-slate-700",
      steps: [
        "Non-network hospital or direct admission",
        "Patient pays hospital expenses upfront",
        "Original bills & discharge summary collected",
        "Claim & KYC docs submitted to insurer",
        "Approved amount reimbursed directly to bank"
      ],
      actionText: "Select Reimbursement",
      actionClass: "text-slate-300 hover:text-white"
    }
  ];

  // Policy Services (Matching Image 2 & Project Dashboard)
  const policyServices = [
    {
      id: "transfer",
      title: "Policy Transfer (Nominee)",
      tag: "Nominee Rights",
      icon: UserPlus,
      color: "border-teal-500/40 bg-teal-950/30 hover:border-teal-400",
      desc: "Seamless digital transfer of active health policy ownership to designated legal nominees or primary beneficiaries upon life events.",
      points: [
        "Municipal death certificate & legal heir verification",
        "Zero waiting period loss or tenure reset",
        "Retains original policy start date & accrued NCB",
        "Instant member relationship re-alignment"
      ]
    },
    {
      id: "continuation",
      title: "Policy Continuation",
      tag: "Seamless Renewal",
      icon: RefreshCw,
      color: "border-blue-500/40 bg-blue-950/30 hover:border-blue-400",
      desc: "Guaranteed uninterrupted health coverage continuity with cumulative bonus carryover, tenure extension, and immediate reactivation.",
      points: [
        "100% No-Claim Bonus (NCB) protection & rollover",
        "Instant digital endorsement with zero policy lapse",
        "No fresh medical underwriting or re-tests required",
        "Grace period forgiveness & automated reactivation"
      ]
    },
    {
      id: "surrender",
      title: "Surrender / Closure (70/30)",
      tag: "70/30 Rule-Based",
      icon: AlertOctagon,
      color: "border-amber-500/40 bg-amber-950/30 hover:border-amber-400",
      desc: "Automated, transparent calculation for policyholders wishing to close their policy. 70% unutilized premium refunded directly while retaining 30% operational costs.",
      points: [
        "Transparent 70% pro-rata unutilized premium refund",
        "Standard 30% operational & administrative charge",
        "Direct NEFT bank credit within 48-72 hours",
        "Instant digital surrender acknowledgment & audit trail"
      ]
    },
    {
      id: "benefit",
      title: "Benefit Transfer",
      tag: "Bonus Portability",
      icon: Gift,
      color: "border-purple-500/40 bg-purple-950/30 hover:border-purple-400",
      desc: "Transfer accumulated wellness rewards, non-claim bonuses (NCB), and family floater benefits across active family members or upgraded tiers.",
      points: [
        "100% accumulated wellness & preventive health points",
        "NCB bonus portability to individual spouse/children",
        "Upgraded plan tier benefit carryover with zero forfeiture",
        "Real-time ledger balance sync with dashboard"
      ]
    }
  ];

  // Sleek Online Social Channels
  const socialChannels = [
    {
      name: "Instagram",
      icon: InstagramIcon,
      destination: "instagram.com/claimguard_health",
      url: "https://www.instagram.com",
      color: "hover:border-pink-500/60 hover:shadow-pink-500/20 text-pink-400 bg-pink-950/30",
      btnText: "Visit Instagram"
    },
    {
      name: "Twitter / X",
      icon: TwitterXIcon,
      destination: "x.com/ClaimGuardCare",
      url: "https://x.com",
      color: "hover:border-slate-400/60 hover:shadow-slate-400/20 text-slate-200 bg-slate-800/40",
      btnText: "Visit Twitter / X"
    },
    {
      name: "Facebook",
      icon: FacebookIcon,
      destination: "facebook.com/ClaimGuardInsurance",
      url: "https://www.facebook.com",
      color: "hover:border-blue-500/60 hover:shadow-blue-500/20 text-blue-400 bg-blue-950/30",
      btnText: "Visit Facebook"
    },
    {
      name: "LinkedIn",
      icon: LinkedInIcon,
      destination: "linkedin.com/company/claimguard-insurance",
      url: "https://www.linkedin.com",
      color: "hover:border-sky-500/60 hover:shadow-sky-500/20 text-sky-400 bg-sky-950/30",
      btnText: "Visit LinkedIn"
    },
    {
      name: "YouTube",
      icon: YouTubeIcon,
      destination: "youtube.com/@ClaimGuardHealth",
      url: "https://www.youtube.com",
      color: "hover:border-red-500/60 hover:shadow-red-500/20 text-red-400 bg-red-950/30",
      btnText: "Visit YouTube"
    },
    {
      name: "WhatsApp Assist",
      icon: WhatsAppIcon,
      destination: "wa.me/919346749462",
      url: "https://wa.me/919346749462",
      color: "hover:border-emerald-500/60 hover:shadow-emerald-500/20 text-emerald-400 bg-emerald-950/30",
      btnText: "Visit WhatsApp Assist"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-teal-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white">CLAIMGUARD</span>
              <span className="text-xs text-teal-400 font-bold block -mt-1">Healthcare Insurance Intelligence</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              24x7 Claims Portal Online
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/80 border border-teal-500/30 text-teal-300 text-xs font-bold mb-6">
            Provider Claim Denial Prevention & Insurance Policy Management System
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-none sm:leading-tight">
            Prevent Claim Denials <br />
            <span className="bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
              Before Submission.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
            CLAIMGUARD empowers healthcare providers and insurance administrators to audit health insurance claims against 
            <span className="text-teal-300 font-semibold"> 16 major validation factors</span>, compute accurate claimable amounts under configured policy rules, predict denial risk via Machine Learning, and recheck corrected claims in real-time.
          </p>

          {/* Primary CTA */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-base shadow-xl shadow-teal-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Key Metrics Strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
              <span className="text-2xl sm:text-3xl font-black text-teal-400">16</span>
              <p className="text-xs text-slate-400 mt-1 font-semibold uppercase">Validation Factors</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">94%</span>
              <p className="text-xs text-slate-400 mt-1 font-semibold uppercase">Claim Confidence</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
              <span className="text-2xl sm:text-3xl font-black text-cyan-400">200+</span>
              <p className="text-xs text-slate-400 mt-1 font-semibold uppercase">Seeded Policies</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
              <span className="text-2xl sm:text-3xl font-black text-amber-400">70/30</span>
              <p className="text-xs text-slate-400 mt-1 font-semibold uppercase">Configured Surrender Rule</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: INSURANCE COMPANY DETAILS & CORPORATE HIGHLIGHTS */}
      {/* ========================================================================= */}
      <section className="py-20 bg-slate-950 border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-3.5 py-1 rounded-full border border-teal-500/30">
              Corporate Overview & Network
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">
              About CLAIMGUARD Health Insurance
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-3 leading-relaxed">
              CLAIMGUARD is a premier digital health insurer and healthcare administration network dedicated to eliminating claim disputes, providing hassle-free cashless hospitalization, and delivering 100% transparent policy servicing nationwide.
            </p>
          </div>

          {/* 4 Core Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {insuranceHighlights.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={idx}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-teal-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shadow-md`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold text-teal-400 bg-teal-950/80 px-2.5 py-1 rounded-lg border border-teal-500/30">
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Insurance Company Contact & Headquarter Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
            {/* HQ Card */}
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Corporate HQ</h4>
                  <span className="text-sm font-bold text-white">Hyderabad & Bangalore</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                CLAIMGUARD Assurance Tower, Financial District, Nanakramguda, Hyderabad, TS 500032
              </p>
            </div>

            {/* Claims Helpline Card */}
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">24x7 Claims Helpline</h4>
                  <span className="text-sm font-bold text-white">1800-425-25246</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Toll-Free Emergency Desk: 1800-425-CLAIM • Direct Landline: +91 40 6820 9000
              </p>
            </div>

            {/* Official Support Email */}
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Official Email</h4>
                  <span className="text-sm font-bold text-white">support@claimguard.health</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Claims Desk: claims@claimguard-insurance.in • Grievance: grievance@claimguard.in
              </p>
            </div>

            {/* Operating Hours & Regulatory Info */}
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Service Availability</h4>
                  <span className="text-sm font-bold text-white">24/7/365 Desk</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Emergency Hospitalization: 24/7 • Policy Administration: Mon-Sat (9 AM - 8 PM)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3 (NEW): TYPES OF POLICIES PROVIDED BY CLAIMGUARD */}
      {/* ========================================================================= */}
      <section className="py-20 bg-slate-900/90 border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-3.5 py-1 rounded-full border border-teal-500/30">
              Insurance Solutions
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">
              Insurance Policies Provided by CLAIMGUARD
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-3 leading-relaxed">
              Explore our comprehensive health protection tiers engineered to cover every life stage — from individual young professionals to extended families, senior parents, and corporate organizations.
            </p>
          </div>

          {/* Policy Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {policyTypes.map((policy) => {
              const PolicyIcon = policy.icon;
              return (
                <div
                  key={policy.id}
                  className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-7 flex flex-col justify-between hover:border-teal-500/50 hover:shadow-2xl hover:shadow-teal-500/10 transition-all duration-300 group"
                >
                  <div>
                    {/* Header: Icon & Tag */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-teal-950 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
                        <PolicyIcon className="w-6 h-6" />
                      </div>
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${policy.tagColor}`}>
                        {policy.tag}
                      </span>
                    </div>

                    {/* Title & Subtitle */}
                    <h3 className="text-xl font-black text-white group-hover:text-teal-300 transition-colors">
                      {policy.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 mb-5 leading-relaxed">
                      {policy.subtitle}
                    </p>

                    {/* Coverage & Co-Pay Badges */}
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 mb-5">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Sum Insured</span>
                        <span className="text-xs font-black text-emerald-400">{policy.sumInsured}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Co-Payment</span>
                        <span className="text-xs font-black text-cyan-400">{policy.coPay}</span>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Key Coverage Benefits:
                      </span>
                      {policy.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                          <span className="leading-tight">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Clean Footer without Explore Plan button */}
                  <div className="pt-5 mt-6 border-t border-slate-900 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-400" />
                      16-Factor Audited Plan
                    </span>
                    <span className="text-[10px] font-bold text-teal-400/90 bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                      IRDAI Certified
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: DIFFERENT TYPES OF METHODS PROVIDED (UPGRADED WITH WORKFLOW PATHWAYS & POLICY SERVICES) */}
      {/* ========================================================================= */}
      <section className="py-20 bg-slate-950 border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-3.5 py-1 rounded-full border border-teal-500/30">
              Operational Frameworks
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">
              Different Types of Methods Provided
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-3 leading-relaxed">
              Experience modern, reliable insurance execution powered by state-of-the-art claim settlement workflows and automated policy administration methods.
            </p>

            {/* Interactive Toggle Tabs */}
            <div className="mt-8 inline-flex p-1.5 bg-slate-900 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveMethodTab("claim_methods")}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                  activeMethodTab === "claim_methods"
                    ? "bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/25"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Claim Settlement Methods
              </button>
              <button
                onClick={() => setActiveMethodTab("policy_methods")}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                  activeMethodTab === "policy_methods"
                    ? "bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/25"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Policy Lifecycle & Servicing Methods
              </button>
            </div>
          </div>

          {/* TAB 1: CLAIM SETTLEMENT PATHWAYS (MATCHING IMAGE 4) */}
          {activeMethodTab === "claim_methods" && (
            <div className="space-y-6">
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 mb-6 text-center sm:text-left">
                <h3 className="text-base font-extrabold text-white">
                  Step 3: Choose Claim Settlement Pathway
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Select between Cashless Pre-Authorization or Direct Reimbursement. The system recommends the optimal pathway based on your hospital choice.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {settlementPathways.map((pathway) => {
                  const IconComponent = pathway.icon;
                  return (
                    <div
                      key={pathway.id}
                      className={`p-6 sm:p-8 rounded-3xl border ${pathway.cardBorder} flex flex-col justify-between transition-all duration-300 hover:scale-[1.01]`}
                    >
                      <div>
                        {/* Header: Icon & Recommendation Badge */}
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${pathway.iconBg}`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          {pathway.recommended && (
                            <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 tracking-wider">
                              RECOMMENDED
                            </span>
                          )}
                        </div>

                        {/* Title & Description */}
                        <h4 className="text-xl font-black text-white tracking-wide">
                          {pathway.title}
                        </h4>
                        <p className="text-xs text-slate-300 mt-2 mb-6 leading-relaxed">
                          {pathway.subtitle}
                        </p>

                        {/* 5-Step Process Container */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                          {pathway.steps.map((step, sIdx) => (
                            <div key={sIdx} className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-black flex items-center justify-center shrink-0">
                                {sIdx + 1}
                              </div>
                              <span className="text-xs font-medium text-slate-200">
                                {step}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: POLICY SERVICES (MATCHING IMAGE 2 & PROJECT DASHBOARD) */}
          {activeMethodTab === "policy_methods" && (
            <div className="space-y-6">
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 mb-6 text-center sm:text-left">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2 justify-center sm:justify-start">
                  <Shield className="w-4 h-4 text-teal-400" />
                  <span>POLICY SERVICES</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Access end-to-end policy lifecycle administration, nominee rights transfers, surrender refund calculators, and accumulated benefit portability.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {policyServices.map((service) => {
                  const ServiceIcon = service.icon;
                  return (
                    <div
                      key={service.id}
                      className={`p-6 sm:p-8 rounded-3xl border ${service.color} backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between`}
                    >
                      <div>
                        {/* Header: Icon & Tag */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-teal-400 shadow-md">
                              <ServiceIcon className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider">
                                CORE SERVICE
                              </span>
                              <h4 className="text-lg font-black text-white">
                                {service.title}
                              </h4>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                            {service.tag}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
                          {service.desc}
                        </p>

                        {/* Key Points */}
                        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                          {service.points.map((pt, pIdx) => (
                            <div key={pIdx} className="flex items-start gap-2 text-xs text-slate-300">
                              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                              <span className="leading-tight">{pt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: VISIT US ONLINE & SOCIAL MEDIA NETWORK (STREAMLINED ICONS) */}
      {/* ========================================================================= */}
      <section className="py-20 border-t border-slate-800 bg-slate-900/90 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-3.5 py-1 rounded-full border border-teal-500/30">
              Connect With Us Online
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">
              Visit CLAIMGUARD Insurance Online
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-2">
              Follow our official digital handles for live updates, healthcare advisories, and instant claims support. Click any icon below to visit our official portal:
            </p>
          </div>

          {/* Sleek Online Social Channels Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {socialChannels.map((channel, index) => {
              const ChannelIcon = channel.icon;
              return (
                <a
                  key={index}
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-5 rounded-2xl border border-slate-800 ${channel.color} transition-all duration-300 hover:-translate-y-1 group flex flex-col items-center text-center justify-between shadow-lg`}
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-950/80 border border-slate-700/80 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <ChannelIcon />
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                    {channel.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 mb-3 truncate max-w-full block">
                    {channel.destination}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-400 group-hover:underline">
                    <span>Visit</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
              );
            })}
          </div>

          {/* Direct WhatsApp & Digital Assist Banner */}
          <div className="bg-gradient-to-r from-teal-950/90 via-slate-900 to-slate-950 border border-teal-500/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <WhatsAppIcon />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Need Quick Claim Assistance via WhatsApp?</h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Message our 24x7 verified WhatsApp chatbot at <span className="text-emerald-400 font-bold">+91 93467 49462</span> for instant policy download and claim tracking.
                </p>
              </div>
            </div>
            <a
              href="https://wa.me/919346749462"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all transform hover:scale-105 active:scale-95 shrink-0"
            >
              <WhatsAppIcon />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Professional Insurance Footer */}
      <footer className="border-t border-slate-800 py-12 bg-slate-950 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
            {/* Col 1 */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-base font-black text-white tracking-tight">CLAIMGUARD</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                CLAIMGUARD Health Insurance Corporation Limited. Registered with Insurance Regulatory and Development Authority of India (IRDAI).
              </p>
              <span className="inline-block text-[11px] text-teal-400 font-bold bg-teal-950/60 px-2.5 py-1 rounded border border-teal-800/40">
                IRDAI Reg. No. 162/2026
              </span>
            </div>

            {/* Col 2 */}
            <div>
              <h5 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Insurance Plans</h5>
              <ul className="space-y-2 text-slate-400">
                <li>Comprehensive Family Care</li>
                <li>Standard Health Guard</li>
                <li>Senior Citizen Health Shield</li>
                <li>Critical Illness Protection</li>
                <li>Super Top-Up Buffer Shield</li>
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h5 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Policy Services & Methods</h5>
              <ul className="space-y-2 text-slate-400">
                <li>45-Min Cashless Hospitalization</li>
                <li>16-Factor Pre-Audit Engine</li>
                <li>70/30 Configured Surrender Refund</li>
                <li>Nominee Ownership Transfer</li>
                <li>WhatsApp 3-Step Assist</li>
              </ul>
            </div>

            {/* Col 4 */}
            <div>
              <h5 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Grievance & Support</h5>
              <ul className="space-y-2 text-slate-400">
                <li>Toll Free: 1800-425-25246</li>
                <li>WhatsApp Desk: +91 93467 49462</li>
                <li>Email: support@claimguard.health</li>
                <li>Claims TAT: 45 Mins Average</li>
                <li>CIN: U66010TG2026PLC123456</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex items-center justify-center text-center">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-500">
              <span className="hover:text-slate-300 transition-colors cursor-pointer">Privacy Policy</span>
              <span>•</span>
              <span className="hover:text-slate-300 transition-colors cursor-pointer">Terms of Service</span>
              <span>•</span>
              <span className="hover:text-slate-300 transition-colors cursor-pointer">IRDAI Disclosures</span>
              <span>•</span>
              <span className="hover:text-slate-300 transition-colors cursor-pointer">Security Practices</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

