import React, { useState } from "react";
import { 
  ShieldCheck, FileText, Stethoscope, Lock, 
  Receipt, Building2, UserCheck, AlertCircle, 
  Search, CheckCircle2, Info, ArrowUpRight,
  Clock, ShieldAlert, Sparkles, Filter
} from "lucide-react";

const RECOMMENDATION_CATEGORIES = [
  { id: "all", label: "All Guidelines" },
  { id: "policy", label: "Policy & Eligibility" },
  { id: "preauth", label: "Pre-Authorization & Surgery" },
  { id: "clinical", label: "Clinical & Medical Records" },
  { id: "billing", label: "Billing & Pharmacy" },
  { id: "banking", label: "Banking & Settlement" },
  { id: "timelines", label: "Timelines & Compliance" },
];

const GENERAL_RECOMMENDATIONS = [
  // 1. Policy & Eligibility
  {
    id: "rec-1",
    category: "policy",
    categoryLabel: "Policy & Eligibility",
    badge: "MANDATORY CHECK",
    badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
    title: "Verify Active Policy Status & Premium Clearance",
    description: "Always confirm that the insurance policy is in 'Active' state with no lapsed premium installments before scheduling planned hospital admissions.",
    whyItMatters: "Claims filed under policies in grace period or lapse status are automatically rejected by insurance TPA systems.",
    checklist: [
      "Check policy valid tenure and expiry date",
      "Confirm recent premium payment receipt status",
      "Verify grace period terms if renewal is imminent"
    ],
    icon: ShieldCheck
  },
  {
    id: "rec-2",
    category: "policy",
    categoryLabel: "Policy & Eligibility",
    badge: "COVERAGE AUDIT",
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
    title: "Sum Insured & Sub-limit Verification",
    description: "Cross-check available sum insured balance and specific room rent / ICU sub-limits prior to hospital admission.",
    whyItMatters: "Exceeding room rent limits (e.g. 1% of Sum Insured) triggers proportionate deduction across all associated medical bills and doctor fees.",
    checklist: [
      "Verify room tariff eligibility against policy schedule",
      "Check specific disease capping (Cataract, Hernia, Joint Replacement)",
      "Confirm cumulative bonus or top-up coverage availability"
    ],
    icon: Building2
  },
  {
    id: "rec-balance-exhausted",
    category: "policy",
    categoryLabel: "Policy & Eligibility",
    badge: "CRITICAL COVERAGE EXHAUSTION",
    badgeColor: "bg-rose-50 text-rose-800 border-rose-300 font-bold",
    title: "Policy Balance Completely Utilized (₹0 Available Balance)",
    description: "When the policy sum insured is 100% utilized and remaining available balance reaches ₹0, all new claim submissions are blocked until the balance is restored.",
    whyItMatters: "Submitting claims under an exhausted sum insured will result in immediate rejection under Factor 3 & Factor 10 (Coverage Amount vs Claim Amount). Policyholders must renew or top up their coverage.",
    checklist: [
      "Verify remaining available balance in Policy & Coverage and Pre-Claim Check",
      "Execute policy renewal or top-up coverage enhancement",
      "Ensure available balance covers the estimated hospital treatment procedure cost"
    ],
    icon: AlertCircle
  },
  {
    id: "rec-3",
    category: "policy",
    categoryLabel: "Policy & Eligibility",
    badge: "WAITING PERIOD COMPLIANCE",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    title: "Waiting Period & Pre-Existing Disease (PED) Check",
    description: "Verify that the diagnosis does not fall under initial 30-day waiting periods, 2-year specific illness moratoriums, or pre-existing declared conditions.",
    whyItMatters: "Pre-existing conditions claimed before completing the mandated 36/48-month waiting period account for over 35% of all insurance claim rejections.",
    checklist: [
      "Inspect policy issue date against hospitalization date",
      "Review declared pre-existing diseases in original proposal form",
      "Confirm exemption status for accidental emergency admissions"
    ],
    icon: AlertCircle
  },
  {
    id: "rec-4",
    category: "policy",
    categoryLabel: "Policy & Eligibility",
    badge: "PATIENT KYC",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    title: "Patient & Insured Member Identity Matching",
    description: "Ensure the patient's name, gender, date of birth, and Member ID match the Government ID (Aadhaar / Passport) and policy records character-for-character.",
    whyItMatters: "Spelling discrepancies between hospital registration and insurer database cause immediate verification failure and claim rejection.",
    checklist: [
      "Verify Government photo ID proof with policy E-card",
      "Ensure relationship code (Self, Spouse, Child, Parent) is accurate",
      "Update contact information for OTP verification"
    ],
    icon: UserCheck
  },

  // 2. Pre-Authorization & Surgery
  {
    id: "rec-5",
    category: "preauth",
    categoryLabel: "Pre-Authorization & Surgery",
    badge: "48-HOUR ADVANCE INTIMATION",
    badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
    title: "Planned Hospitalization Pre-Authorization Request",
    description: "Submit a complete cashless pre-authorization form with provisional medical diagnosis and estimated cost at least 48 hours prior to planned hospital admission.",
    whyItMatters: "Failure to secure pre-authorization for elective surgical procedures converts cashless coverage into cumbersome reimbursement requiring extensive retrospective review.",
    checklist: [
      "Attach treating doctor's admission advice note",
      "Include estimated cost breakdown from hospital billing desk",
      "Attach diagnostic investigation reports backing surgical indication"
    ],
    icon: Lock
  },
  {
    id: "rec-6",
    category: "preauth",
    categoryLabel: "Pre-Authorization & Surgery",
    badge: "EMERGENCY PROTOCOL",
    badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
    title: "Emergency Admission Intimation (Within 24 Hours)",
    description: "For unplanned or emergency admissions, notify the insurer/TPA within 24 hours of casualty entry with emergency admission certificate.",
    whyItMatters: "Unnotified emergency admissions risk denial under the non-intimation clause or delayed guarantee of payment.",
    checklist: [
      "Submit Emergency Medical Officer (EMO) clinical summary",
      "Generate initial cashless authorization token",
      "Track initial sanction response within the 4-hour statutory window"
    ],
    icon: Clock
  },
  {
    id: "rec-7",
    category: "preauth",
    categoryLabel: "Pre-Authorization & Surgery",
    badge: "ENHANCEMENT REQUEST",
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
    title: "Interim Billing & Length-of-Stay Enhancement",
    description: "Submit interim enhancement intimations immediately if clinical complications arise, surgery duration is extended, or ICU stay is required.",
    whyItMatters: "Final bills exceeding approved initial pre-authorization amounts without interim enhancement require delayed dispute resolution during discharge.",
    checklist: [
      "Provide updated daily clinical progress chart",
      "Include itemized interim billing statement",
      "Submit revised treating consultant clinical justification"
    ],
    icon: Sparkles
  },

  // 3. Clinical & Medical Records
  {
    id: "rec-8",
    category: "clinical",
    categoryLabel: "Clinical & Medical Records",
    badge: "DOCTOR SIGNED SUMMARY",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    title: "Comprehensive Discharge Summary Requirements",
    description: "Ensure the discharge summary contains exact admission/discharge timestamps, chief complaints, physical findings, clinical course, and treating doctor's signature with registration number.",
    whyItMatters: "Vague, incomplete, or unsigned discharge summaries are the primary cause of clinical audits, investigations, and claim processing delays.",
    checklist: [
      "Clearly document past medical history and history of present illness",
      "Explicitly mention line of treatment (Conservative / Surgical / Medical)",
      "Include post-discharge advice and medication schedule"
    ],
    icon: Stethoscope
  },
  {
    id: "rec-9",
    category: "clinical",
    categoryLabel: "Clinical & Medical Records",
    badge: "DIAGNOSTIC EVIDENCE",
    badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
    title: "Complete Diagnostic & Pathology Investigation Reports",
    description: "Attach all original diagnostic reports (Blood tests, ECG, X-Rays, CT / MRI scans, Histopathology, Biopsy) that corroborate the final ICD-10 medical diagnosis.",
    whyItMatters: "Treatments unsupported by objective diagnostic evidence may be categorized as 'Active Hospitalization Not Justified' leading to claim repudiation.",
    checklist: [
      "Ensure all lab reports carry patient identification and collection date",
      "Attach radiologist / pathologist verified digital signatures",
      "Include intra-operative photos or implant barcodes where applicable"
    ],
    icon: FileText
  },

  // 4. Billing & Pharmacy
  {
    id: "rec-10",
    category: "billing",
    categoryLabel: "Billing & Pharmacy",
    badge: "ITEMIZED INVOICE",
    badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
    title: "Fully Itemized Final Hospital Bill with Receipt",
    description: "Provide a consolidated final bill containing item-by-item breakdown of room rent, nursing tariffs, physician consultations, OT charges, medicines, and consumables alongside payment receipt.",
    whyItMatters: "Lump-sum or consolidated bills without detailed itemization cannot be audited by TPA algorithms and are returned for clarification.",
    checklist: [
      "Verify final bill is stamped and signed by authorized hospital billing officer",
      "Ensure payment receipt displays transaction mode (Cash, Card, UPI, NEFT)",
      "Confirm advance payment deposits are reconciled with final payable amount"
    ],
    icon: Receipt
  },
  {
    id: "rec-11",
    category: "billing",
    categoryLabel: "Billing & Pharmacy",
    badge: "PRESCRIPTION MATCHING",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    title: "Pharmacy Invoices & Doctor's Prescription Linkage",
    description: "Every single pharmacy receipt, injectables voucher, or medical consumable bill must be backed by a corresponding prescription on the treating doctor's letterhead.",
    whyItMatters: "Over-the-counter medicine purchases or unprescribed drugs are automatically disallowed during claim assessment.",
    checklist: [
      "Verify pharmacy bills list drug batch number and GST details",
      "Ensure prescription date matches pharmacy purchase date",
      "Attach implant stickers and purchase invoice for orthopedic / cardiac devices"
    ],
    icon: Receipt
  },

  // 5. Banking & Settlement
  {
    id: "rec-12",
    category: "banking",
    categoryLabel: "Banking & Settlement",
    badge: "NEFT SETTLEMENT",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    title: "Bank Account Proof & Cancelled Cheque Verification",
    description: "Upload a legible scanned copy of a cancelled cheque or first page of bank passbook clearly showing policyholder's printed name, account number, and bank IFSC code.",
    whyItMatters: "Bank details with third-party names or unclear IFSC codes result in NEFT payment bounce and prolonged financial settlement delays.",
    checklist: [
      "Ensure bank account is in the primary policyholder's name",
      "Avoid handwritten account details on cheque leaf",
      "Verify IFSC code matches current active branch after banking mergers"
    ],
    icon: Building2
  },
  {
    id: "rec-13",
    category: "banking",
    categoryLabel: "Banking & Settlement",
    badge: "CO-PAYMENT CALCULATION",
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
    title: "Applicable Co-Pay & Voluntary Deductible Awareness",
    description: "Factor in any policy-mandated co-payments (e.g. 10%-20% for senior citizens, non-network hospitals, or zone upgrades) when estimating payable claim amounts.",
    whyItMatters: "Clear understanding of co-pay obligations prevents post-approval disputes and ensures transparent out-of-pocket financial planning.",
    checklist: [
      "Check policy wording for senior citizen co-pay clauses",
      "Review voluntary deductible thresholds chosen during policy purchase",
      "Confirm zone-based reimbursement percentages if treated outside home zone"
    ],
    icon: Info
  },

  // 6. Timelines & Compliance
  {
    id: "rec-14",
    category: "timelines",
    categoryLabel: "Timelines & Compliance",
    badge: "30-DAY GRACE DEADLINE",
    badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
    title: "Strict 30-Day Post-Discharge Submission Deadline",
    description: "Submit the complete reimbursement claim docket with all original documents within 30 days of patient hospital discharge.",
    whyItMatters: "Claims submitted beyond the statutory 30-day grace period are liable for summary rejection under the late-submission condition unless justified with valid medical emergency proof.",
    checklist: [
      "Track discharge date against submission calendar",
      "File pre-hospitalization bills (up to 30 days prior to admission)",
      "File post-hospitalization bills (up to 60/90 days post discharge)"
    ],
    icon: Clock
  },
  {
    id: "rec-15",
    category: "timelines",
    categoryLabel: "Timelines & Compliance",
    badge: "ANTI-DUPLICATE AUDIT",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
    title: "Duplicate Claim & Overlapping Invoice Prevention",
    description: "Ensure that bills or claim requests are not inadvertently lodged across multiple policies or submitted twice for the same treatment episode.",
    whyItMatters: "Submitting overlapping or duplicate invoices flags the claim under fraud prevention algorithms and mandates forensic investigation.",
    checklist: [
      "Verify unique invoice numbers on all hospital and pharmacy vouchers",
      "If claiming across two policies, obtain settlement letter from primary insurer",
      "Confirm clear demarcation of balance amounts for secondary insurer claim"
    ],
    icon: ShieldAlert
  }
];

const ClaimRecommendationsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecommendations = GENERAL_RECOMMENDATIONS.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.whyItMatters.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Claim Denial Prevention & Quality Assurance Guidelines
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Standard Recommendations to Prevent Claim Denial
          </h1>
          <p className="text-sm text-teal-100/80 mt-2 leading-relaxed">
            Essential pre-submission clinical, financial, and policy guidelines recommended for healthcare providers and policyholders to guarantee 100% first-pass claim approval and eliminate repudiation risks.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {RECOMMENDATION_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-teal-700 text-white shadow-xs"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search recommendations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRecommendations.map((rec) => {
          const Icon = rec.icon;
          return (
            <div
              key={rec.id}
              className="bg-white rounded-2xl border border-slate-200/80 hover:border-teal-400/60 hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between"
            >
              <div>
                {/* Header: Badge & Category */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border ${rec.badgeColor}`}>
                    {rec.badge}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {rec.categoryLabel}
                  </span>
                </div>

                {/* Title */}
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-black text-slate-900 tracking-tight leading-snug">
                    {rec.title}
                  </h2>
                </div>

                {/* Core Description */}
                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  {rec.description}
                </p>

                {/* Why it Matters Callout */}
                <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Why this prevents denial:</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed pl-5">
                    {rec.whyItMatters}
                  </p>
                </div>
              </div>

              {/* Actionable Checklist */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Verification Checklist:
                </p>
                <ul className="space-y-1.5">
                  {rec.checklist.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-tight">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRecommendations.length === 0 && (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
          <p className="font-bold text-sm">No guidelines found matching your search</p>
          <p className="text-xs text-slate-400 mt-1">Try selecting a different category filter or clear the search query.</p>
        </div>
      )}
    </div>
  );
};

export default ClaimRecommendationsPage;
