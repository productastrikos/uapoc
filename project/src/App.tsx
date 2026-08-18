import React, { useState } from "react";
import Header from "./components/Layout/Header";
import CollapsibleSidebar from "./components/Layout/CollapsibleSidebar";
import AOCCDashboard from "./components/Modules/AOCCDashboard";
import LoginPage from "./components/LoginPage";
import { useAuthStore } from "./store/useAuthStore";
import AirsideOperations from "./components/Modules/AirsideOperations";
import TerminalOperations from "./components/Modules/TerminalOperations";
import LandsideOperations from "./components/Modules/LandsideOperations";
import SecurityOperations from "./components/Modules/SecurityOperations";
import MaintenanceOperations from "./components/Modules/MaintenanceOperations";
import CommercialOperations from "./components/Modules/CommercialOperations";
import SustainabilityOperations from "./components/Modules/SustainabilityOperations";
import SOPConsole from "./components/Modules/SOPConsole";
import AnalyticsReporting from "./components/Modules/AnalyticsReporting";
import PassengerJourney from "./components/Modules/PassengerJourney";
import PassengerSystems from "./components/Modules/PassengerSystems";
import { User } from "./types";
import { LanguageProvider, useLanguage } from "./hooks/useLanguage";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider, useToast } from "./hooks/useToast";
import { ToastContainer } from "./components/UI/Toast";

const AppContent: React.FC = () => {
  const { t } = useLanguage();
  const { toasts, removeToast } = useToast();
  const [activeModule, setActiveModule] = useState("aocc");
  const { isAuthenticated } = useAuthStore();

  const currentUser: User = {
    id: "1",
    name: "Captain Nguyễn Văn Nam",
    role: "U-APOC_Operator",
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift shortcuts
      if (event.shiftKey && event.ctrlKey) {
        switch (event.key) {
          case "!": // Ctrl+Shift+1
            event.preventDefault();
            setActiveModule("sustainability");
            break;
          case "@": // Ctrl+Shift+2
            event.preventDefault();
            setActiveModule("sops");
            break;
        }
      }
      // Ctrl+Number shortcuts
      else if (event.ctrlKey && !event.shiftKey && !event.altKey) {
        switch (event.key) {
          case "1":
            event.preventDefault();
            setActiveModule("aocc");
            break;
          case "2":
            event.preventDefault();
            setActiveModule("passenger-journey");
            break;
          case "3":
            event.preventDefault();
            setActiveModule("passenger-systems");
            break;
          case "4":
            event.preventDefault();
            setActiveModule("airside");
            break;
          case "5":
            event.preventDefault();
            setActiveModule("terminal");
            break;
          case "6":
            event.preventDefault();
            setActiveModule("landside");
            break;
          case "7":
            event.preventDefault();
            setActiveModule("security");
            break;
          case "8":
            event.preventDefault();
            setActiveModule("maintenance");
            break;
          case "9":
            event.preventDefault();
            setActiveModule("commercial");
            break;
          case "0":
            event.preventDefault();
            setActiveModule("reports");
            break;
        }
      }
      // "g" focus search
      else if (!event.ctrlKey && !event.shiftKey && !event.altKey) {
        if (event.key === "g" || event.key === "G") {
          event.preventDefault();
          const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const renderActiveModule = () => {
    switch (activeModule) {
      case "aocc":
        return <AOCCDashboard />;
      case "passenger-journey":
        return <PassengerJourney />;
      case "passenger-systems":
        return <PassengerSystems />;
      case "airside":
        return <AirsideOperations />;
      case "terminal":
        return <TerminalOperations />;
      case "landside":
        return <LandsideOperations />;
      case "security":
        return <SecurityOperations />;
      case "maintenance":
        return <MaintenanceOperations />;
      case "commercial":
        return <CommercialOperations />;
      case "sustainability":
        return <SustainabilityOperations />;
      case "sops":
        return <SOPConsole />;
      case "reports":
        return <AnalyticsReporting />;
      default:
        return <AOCCDashboard />;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => {}} />;
  }

  return (
    <div className="h-screen bg-primary-900 bg-gradient-mesh overflow-hidden flex flex-col">
      <Header currentUser={currentUser} />
      <div className="flex flex-1 overflow-hidden">
        <CollapsibleSidebar
          activeModule={activeModule}
          onModuleChange={setActiveModule}
          user={currentUser}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Dynamic Module Content */}
          <main className="flex-1 overflow-y-auto no-scrollbar px-6 py-6">
            <ErrorBoundary>{renderActiveModule()}</ErrorBoundary>
          </main>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <ToastProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </ToastProvider>
    </LanguageProvider>
  );
};

export default App;