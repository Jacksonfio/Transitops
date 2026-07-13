import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useApp } from './context';
import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import ErrorBoundary from './components/ErrorBoundary';
import FleetDashboard from './components/FleetDashboard';
import VehicleDirectory from './components/VehicleDirectory';
import DriverLogs from './components/DriverLogs';
import TripDispatcher from './components/TripDispatcher';
import MaintenanceScheduler from './components/MaintenanceScheduler';
import FuelExpenseManager from './components/FuelExpenseManager';
import AnalyticsReports from './components/AnalyticsReports';
import AICommandCenter from './components/AICommandCenter';
import FleetTracking from './components/FleetTracking';
import SettingsPage from './components/SettingsPage';
import NotificationBell from './components/NotificationBell';

export default function App() {
  const { user, isDark, toggleDark } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) {
    return (
      <div className={isDark ? 'dark' : ''}>
        <LoginPage />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <FleetDashboard />;
      case 'vehicles': return <VehicleDirectory />;
      case 'drivers': return <DriverLogs />;
      case 'trips': return <TripDispatcher />;
      case 'maintenance': return <MaintenanceScheduler />;
      case 'fuel': return <FuelExpenseManager />;
      case 'analytics': return <AnalyticsReports />;
      case 'ai': return <AICommandCenter />;
      case 'tracking': return <FleetTracking />;
      case 'settings': return <SettingsPage />;
      default: return <FleetDashboard />;
    }
  };

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="flex h-screen bg-[#0A0A0A] dark:bg-[#000000] text-white overflow-hidden font-sans transition-colors duration-200">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="flex items-center justify-end gap-4 px-6 py-3 border-b border-[#2A2A2A] bg-[#1A1A1A] dark:bg-[#0A0A0A]/90 backdrop-blur-md shrink-0">
            <NotificationBell />
            <div className="w-px h-6 bg-[#2A2A2A]" />
            <button
              onClick={() => toggleDark()}
              className="p-2 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#FF6B00]/50 transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-[#FF8C00]" /> : <Moon className="w-4 h-4 text-[#B0B0B0]" />}
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-8 w-full" id="main-content">
            <div className="max-w-7xl mx-auto pb-24">
              <ErrorBoundary>
                {renderContent()}
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
