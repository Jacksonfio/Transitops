import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    LayoutDashboard, Truck, Users, Navigation, Wrench,
    Fuel, DollarSign, BarChart3, Sparkles, Bell, Sun, Moon,
    ChevronRight, LogOut, Shield, Menu, X, UserCog, MapPin
} from 'lucide-react';
import { useApp } from '../context';
import { UserRole } from '../types';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst', 'driver'] },
    { id: 'vehicles', label: 'Vehicles', icon: Truck, roles: ['admin', 'fleet_manager', 'dispatcher'] },
    { id: 'drivers', label: 'Drivers', icon: Users, roles: ['admin', 'fleet_manager', 'safety_officer', 'dispatcher'] },
    { id: 'trips', label: 'Trip Management', icon: Navigation, roles: ['admin', 'fleet_manager', 'dispatcher'] },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, roles: ['admin', 'fleet_manager'] },
    { id: 'fuel', label: 'Fuel & Expenses', icon: Fuel, roles: ['admin', 'fleet_manager', 'financial_analyst', 'dispatcher'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'fleet_manager', 'financial_analyst'] },
    { id: 'ai', label: 'AI Copilot', icon: Sparkles, roles: ['admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'] },
    { id: 'tracking', label: 'Fleet Tracking', icon: MapPin, roles: ['admin', 'fleet_manager', 'dispatcher', 'safety_officer'] },
    { id: 'settings', label: 'Settings', icon: UserCog, roles: ['admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst', 'driver'] },
];

const ROLE_LABELS: Record<UserRole, string> = {
    admin: 'Administrator',
    fleet_manager: 'Fleet Manager',
    dispatcher: 'Dispatcher',
    driver: 'Driver',
    safety_officer: 'Safety Officer',
    financial_analyst: 'Financial Analyst',
};

const ROLE_BADGE_COLORS: Record<UserRole, string> = {
    admin: 'bg-white/10 text-white',
    fleet_manager: 'bg-emerald-500/20 text-emerald-400',
    dispatcher: 'bg-sky-500/20 text-sky-400',
    driver: 'bg-gray-500/20 text-gray-400',
    safety_officer: 'bg-amber-500/20 text-amber-400',
    financial_analyst: 'bg-rose-500/20 text-rose-400',
};

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
    const { user, logout, isDark, toggleDark, alerts } = useApp();
    const [mobileOpen, setMobileOpen] = useState(false);

    const unreadAlerts = alerts.filter(a => !a.resolved).length;
    const criticalAlerts = alerts.filter(a => !a.resolved && a.severity === 'Critical').length;

    const visibleNav = NAV_ITEMS.filter(item => user && item.roles.includes(user.role));

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-[#1C2526]">
            {/* Logo */}
            <div className="p-5 border-b border-[#2A2A2A]">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-[#FF6B00] to-[#E55F00] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF6B00]/30 shrink-0">
                        <Truck className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-base tracking-tight leading-none">TransitOps</h1>
                        <p className="text-[#9CA3AF] text-[10px] font-medium tracking-widest uppercase mt-0.5">Enterprise Fleet</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <p className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-widest px-3 mb-3">Navigation</p>
                {visibleNav.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
                            className={`nav-item w-full ${isActive ? 'active' : ''}`}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="flex-1 text-left">{item.label}</span>
                            {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
                            {item.id === 'dashboard' && criticalAlerts > 0 && (
                                <span className="w-2 h-2 rounded-full bg-[#B91C1C] animate-pulse" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div className="p-4 border-t border-[#2A2A2A] space-y-3">
                {/* Alert pill */}
                {unreadAlerts > 0 && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${criticalAlerts > 0 ? 'bg-[#FF3D00]/10 text-[#FF3D00] border border-[#FF3D00]/30' : 'bg-[#FFB300]/10 text-[#FFB300] border border-[#FFB300]/30'}`}>
                        <Bell className="w-3.5 h-3.5" />
                        <span>{unreadAlerts} unread {criticalAlerts > 0 ? `(${criticalAlerts} critical)` : ''}</span>
                    </div>
                )}

                {/* Dark mode toggle */}
                <button
                    onClick={toggleDark}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#D1D5DB] hover:bg-white/10 transition w-full"
                >
                    {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                </button>

                {/* User card */}
                {user && (
                    <div className="bg-[#0A0A0A] rounded-xl p-3 border border-[#2A2A2A]">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#E55F00] flex items-center justify-center shrink-0">
                                <span className="text-white font-bold text-sm">{user.name.charAt(0)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-semibold truncate">{user.name}</p>
                                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${ROLE_BADGE_COLORS[user.role]}`}>
                                    <Shield className="w-2.5 h-2.5" />
                                    {ROLE_LABELS[user.role]}
                                </span>
                            </div>
                            <button
                                onClick={logout}
                                className="text-[#808080] hover:text-[#FF3D00] transition p-1 rounded"
                                title="Logout"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile hamburger */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 bg-[#1A1A1A] dark:bg-[#0A0A0A] rounded-xl p-2.5 shadow-lg border border-[#2A2A2A]"
            >
                <Menu className="w-5 h-5 text-white" />
            </button>

            {/* Mobile overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setMobileOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`
        fixed lg:static top-0 left-0 h-full w-64 z-50 bg-black border-r border-[#2A2A2A]
        shadow-xl lg:shadow-none
        transform transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:flex flex-col shrink-0
      `}>
                {/* Mobile close */}
                <button
                    onClick={() => setMobileOpen(false)}
                    className="lg:hidden absolute top-4 right-4 text-[#6B7280] hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>
                <SidebarContent />
            </aside>
        </>
    );
}
