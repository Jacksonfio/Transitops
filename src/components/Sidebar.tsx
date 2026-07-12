import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    LayoutDashboard, Truck, Users, Navigation, Wrench,
    Fuel, DollarSign, BarChart3, Sparkles, Bell, Sun, Moon,
    ChevronRight, LogOut, Shield, Menu, X, Settings
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
];

const ROLE_LABELS: Record<UserRole, string> = {
    admin: 'Administrator',
    fleet_manager: 'Fleet Manager',
    dispatcher: 'Dispatcher',
    driver: 'Driver',
    safety_officer: 'Safety Officer',
    financial_analyst: 'Financial Analyst',
};

const ROLE_COLORS: Record<UserRole, string> = {
    admin: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
    fleet_manager: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    dispatcher: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30',
    driver: 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-700',
    safety_officer: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
    financial_analyst: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
};

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
    const { user, logout, isDark, toggleDark, alerts } = useApp();
    const [mobileOpen, setMobileOpen] = useState(false);

    const unreadAlerts = alerts.filter(a => !a.resolved).length;
    const criticalAlerts = alerts.filter(a => !a.resolved && a.severity === 'Critical').length;

    const visibleNav = NAV_ITEMS.filter(item => user && item.roles.includes(user.role));

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                        <Truck className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-slate-900 dark:text-white font-bold text-base tracking-tight leading-none">TransitOps</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium tracking-widest uppercase mt-0.5">Smart Transport</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-3">Navigation</p>
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
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                {/* Alert pill */}
                {unreadAlerts > 0 && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${criticalAlerts > 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'}`}>
                        <Bell className="w-3.5 h-3.5" />
                        <span>{unreadAlerts} unread {criticalAlerts > 0 ? `(${criticalAlerts} critical)` : ''}</span>
                    </div>
                )}

                {/* Dark mode toggle */}
                <button
                    onClick={toggleDark}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition w-full"
                >
                    {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                </button>

                {/* User card */}
                {user && (
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                                <span className="text-white font-bold text-sm">{user.name.charAt(0)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-slate-900 dark:text-white text-xs font-semibold truncate">{user.name}</p>
                                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${ROLE_COLORS[user.role]}`}>
                                    <Shield className="w-2.5 h-2.5" />
                                    {ROLE_LABELS[user.role]}
                                </span>
                            </div>
                            <button
                                onClick={logout}
                                className="text-slate-400 hover:text-red-500 transition p-1 rounded"
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
                className="lg:hidden fixed top-4 left-4 z-50 bg-white dark:bg-slate-800 rounded-xl p-2.5 shadow-lg border border-slate-200 dark:border-slate-700"
            >
                <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
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

            {/* Sidebar (mobile: drawer, desktop: fixed) */}
            <aside className={`
        fixed lg:static top-0 left-0 h-full w-64 z-50
        bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
        shadow-xl lg:shadow-none
        transform transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:flex flex-col shrink-0
      `}>
                {/* Mobile close */}
                <button
                    onClick={() => setMobileOpen(false)}
                    className="lg:hidden absolute top-4 right-4 text-slate-400 hover:text-slate-700"
                >
                    <X className="w-5 h-5" />
                </button>
                <SidebarContent />
            </aside>
        </>
    );
}
