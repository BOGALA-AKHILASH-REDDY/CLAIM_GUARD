import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import PolicyholderPage from "./pages/PolicyholderPage";
import InsuredMembersPage from "./pages/InsuredMembersPage";
import HealthInfoPage from "./pages/HealthInfoPage";
import PolicyCoveragePage from "./pages/PolicyCoveragePage";
import PaymentsPage from "./pages/PaymentsPage";
import PolicyServicesPage from "./pages/PolicyServicesPage";
import ClaimsLandingPage from "./pages/ClaimsLandingPage";
import NewClaimPage from "./pages/NewClaimPage";
import ClaimAnalysisPage from "./pages/ClaimAnalysisPage";
import ClaimHistoryPage from "./pages/ClaimHistoryPage";
import ClaimRecommendationsPage from "./pages/ClaimRecommendationsPage";
import DocumentsPage from "./pages/DocumentsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";

const AppContent = () => {
  const { user, token, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedClaimId, setSelectedClaimId] = useState("CLM-1001");
  const [selectedPolicyholderId, setSelectedPolicyholderId] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-xl font-black tracking-tight">CLAIMGUARD</h2>
          <p className="text-xs text-slate-400 mt-1">Starting Healthcare Intelligence Engine...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Landing Page or Login Page
  if (!user || !token) {
    if (showLogin) {
      return <LoginPage onBackToLanding={() => setShowLogin(false)} />;
    }
    return <LandingPage onGetStarted={() => setShowLogin(true)} />;
  }

  // Logged in -> Render Main Application
  const renderActivePage = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardPage
            onNavigateTab={setActiveTab}
            onSelectClaim={(cid) => {
              setSelectedClaimId(cid);
              setActiveTab("claim-analysis");
            }}
          />
        );
      case "policyholder":
        return (
          <PolicyholderPage
            selectedPolicyholderId={selectedPolicyholderId}
            onSelectPolicyholder={setSelectedPolicyholderId}
          />
        );
      case "members":
        return <InsuredMembersPage />;
      case "health":
        return <HealthInfoPage />;
      case "policy-coverage":
        return <PolicyCoveragePage />;
      case "payments":
        return <PaymentsPage />;
      case "services-transfer":
        return <PolicyServicesPage initialTab="transfer" onNavigateTab={setActiveTab} />;
      case "services-surrender":
        return <PolicyServicesPage initialTab="surrender" onNavigateTab={setActiveTab} />;
      case "services-continuation":
        return <PolicyServicesPage initialTab="continuation" onNavigateTab={setActiveTab} />;
      case "services-benefit":
        return <PolicyServicesPage initialTab="benefit" onNavigateTab={setActiveTab} />;
      case "claims":
        return (
          <ClaimsLandingPage
            onNavigateTab={setActiveTab}
            onSelectClaim={(cid) => {
              setSelectedClaimId(cid);
              setActiveTab("claim-analysis");
            }}
          />
        );
      case "new-claim":
        return (
          <NewClaimPage
            onClaimCreated={(cid) => {
              setSelectedClaimId(cid);
            }}
            onViewClaimAnalysis={(cid) => {
              if (cid) setSelectedClaimId(cid);
              setActiveTab("claim-analysis");
            }}
            onNavigateBack={() => setActiveTab("claims")}
            onNavigateTab={setActiveTab}
          />
        );
      case "claim-analysis":
        return <ClaimAnalysisPage selectedClaimId={selectedClaimId} />;
      case "claim-history":
        return (
          <ClaimHistoryPage
            onSelectClaim={(cid) => {
              setSelectedClaimId(cid);
              setActiveTab("claim-analysis");
            }}
          />
        );
      case "claim-recommendations":
        return (
          <ClaimRecommendationsPage
            onSelectClaim={(cid) => {
              setSelectedClaimId(cid);
              setActiveTab("claim-analysis");
            }}
            onNavigateTab={setActiveTab}
          />
        );
      case "documents":
        return <DocumentsPage />;
      case "reports":
        return <ReportsPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigateTab={setActiveTab} onSelectClaim={setSelectedClaimId} />;
    }
  };

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
  };

  const handleSelectPolicyholder = (pid) => {
    setSelectedPolicyholderId(pid);
    setActiveTab("policyholder");
  };

  return (
    <MainLayout
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      onSelectClaim={setSelectedClaimId}
      onSelectPolicyholder={handleSelectPolicyholder}
    >
      {renderActivePage()}
    </MainLayout>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
