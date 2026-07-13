import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Shield, Mail, Save, Loader2, LogOut, Moon, Sun, Monitor, BadgeCheck, Bell, Palette, Lock, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context';
import { UserRole } from '../types';

const ROLE_LABELS: Record<UserRole, string> = {
    admin: 'Administrator',
    fleet_manager: 'Fleet Manager',
    dispatcher: 'Dispatcher',
    driver: 'Driver',
    safety_officer: 'Safety Officer',
    financial_analyst: 'Financial Analyst',
};

export default function SettingsPage() {
    const { user, logout, isDark, toggleDark } = useApp();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }, 600);
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            setSaved(true);
            setPasswordForm({ current: '', newPass: '', confirm: '' });
            setTimeout(() => setSaved(false), 2000);
        }, 600);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-[#111827] dark:text-white">Settings</h2>
                <p className="text-[#6B7280] dark:text-[#6B7280] text-sm mt-1">Manage your profile and preferences</p>
            </div>

            {/* Profile Section */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#1C2526] rounded-2xl shadow-sm border border-[#E2EAE7] dark:border-[#2D3A32] p-6"
            >
                <h3 className="font-semibold text-[#111827] dark:text-white flex items-center gap-2 mb-6">
                    <User className="w-4 h-4 text-[#0F766E]" /> Profile Information
                </h3>

                <form onSubmit={handleSave} className="space-y-5">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0F766E] to-[#15803D] flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-2xl">{user?.name?.charAt(0) || 'U'}</span>
                        </div>
                        <div>
                            <p className="font-bold text-[#111827] dark:text-white text-lg">{user?.name}</p>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#0F766E]/10 text-[#115E59]">
                                <BadgeCheck className="w-3 h-3" /> {ROLE_LABELS[user?.role || 'driver']}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-[#6B7280] dark:text-[#6B7280] mb-1.5 uppercase tracking-wider">Full Name</label>
                            <input value={name} onChange={e => setName(e.target.value)} className="form-input" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[#6B7280] dark:text-[#6B7280] mb-1.5 uppercase tracking-wider">Email</label>
                            <input value={email} onChange={e => setEmail(e.target.value)} className="form-input" type="email" />
                        </div>
                    </div>

                    <button type="submit" disabled={saving} className="btn-primary">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saved ? 'Saved!' : 'Save Changes'}
                    </button>
                </form>
            </motion.div>

            {/* Password Section */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-[#1C2526] rounded-2xl shadow-sm border border-[#E2EAE7] dark:border-[#2D3A32] p-6"
            >
                <h3 className="font-semibold text-[#111827] dark:text-white flex items-center gap-2 mb-6">
                    <Lock className="w-4 h-4 text-[#0F766E]" /> Change Password
                </h3>

                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
                    <div>
                        <label className="block text-xs font-semibold text-[#6B7280] dark:text-[#6B7280] mb-1.5 uppercase tracking-wider">Current Password</label>
                        <div className="relative">
                            <input type={showNewPass ? 'text' : 'password'} value={passwordForm.current} onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))} className="form-input pr-10" required />
                            <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#0F766E]">
                                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-[#6B7280] dark:text-[#6B7280] mb-1.5 uppercase tracking-wider">New Password</label>
                        <input type="password" value={passwordForm.newPass} onChange={e => setPasswordForm(p => ({ ...p, newPass: e.target.value }))} className="form-input" required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-[#6B7280] dark:text-[#6B7280] mb-1.5 uppercase tracking-wider">Confirm New Password</label>
                        <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} className="form-input" required />
                    </div>

                    <button type="submit" disabled={saving} className="btn-primary">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saved ? 'Password Updated!' : 'Update Password'}
                    </button>
                </form>
            </motion.div>

            {/* Preferences Section */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-[#1C2526] rounded-2xl shadow-sm border border-[#E2EAE7] dark:border-[#2D3A32] p-6"
            >
                <h3 className="font-semibold text-[#111827] dark:text-white flex items-center gap-2 mb-6">
                    <Palette className="w-4 h-4 text-[#0F766E]" /> Appearance
                </h3>

                <div className="flex items-center justify-between p-4 rounded-xl bg-[#F8FAF8] dark:bg-[#0F1712]">
                    <div className="flex items-center gap-3">
                        {isDark ? <Moon className="w-5 h-5 text-[#0F766E]" /> : <Sun className="w-5 h-5 text-[#0F766E]" />}
                        <div>
                            <p className="font-medium text-sm text-[#111827] dark:text-white">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                            <p className="text-xs text-[#6B7280] dark:text-[#6B7280]">{isDark ? 'Deep Emerald luxury dark theme' : 'Alabaster mint light theme'}</p>
                        </div>
                    </div>
                    <button
                        onClick={toggleDark}
                        className={`relative w-12 h-6 rounded-full transition-colors ${isDark ? 'bg-[#0F766E]' : 'bg-[#E2EAE7]'}`}
                    >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                </div>
            </motion.div>

            {/* Danger Zone */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-[#1C2526] rounded-2xl shadow-sm border border-red-200 dark:border-red-900/30 p-6"
            >
                <h3 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 mb-2">
                    <LogOut className="w-4 h-4" /> Sign Out
                </h3>
                <p className="text-xs text-[#6B7280] dark:text-[#6B7280] mb-4">You will be redirected to the login page.</p>
                <button onClick={logout} className="btn-danger">
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </motion.div>
        </div>
    );
}
