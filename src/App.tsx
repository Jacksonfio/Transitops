import React, { useState } from 'react';
import { useApp } from './context';
import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import FleetDashboard from './components/FleetDashboard';
import VehicleDirectory from './components/VehicleDirectory';
import DriverLogs from './components/DriverLogs';
import TripDispatcher from './components/TripDispatcher';
import MaintenanceScheduler from './components/MaintenanceScheduler';
import FuelExpenseManager from './components/FuelExpenseManager';
import AnalyticsReports from './components/AnalyticsReports';
import AICommandCenter from './components/AICommandCenter';

export default function App() {
  const { user, isDark } = useApp();
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
      default: return <FleetDashboard />;
    }
  };

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-200">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pt-20 lg:pt-8 w-full" id="main-content">
          <div className="max-w-7xl mx-auto pb-24">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
