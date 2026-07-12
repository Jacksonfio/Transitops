import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Truck, Eye, EyeOff, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '../context';

const DEMO_ACCOUNTS = [
    { email: 'admin@transitops.com', role: 'Admin', color: '#8B5CF6' },
    { email: 'manager@transitops.com', role: 'Fleet Manager', color: '#2563EB' },
    { email: 'dispatch@transitops.com', role: 'Dispatcher', color: '#10B981' },
    { email: 'safety@transitops.com', role: 'Safety Officer', color: '#F59E0B' },
    { email: 'finance@transitops.com', role: 'Finance Analyst', color: '#EF4444' },
];

export default function LoginPage() {
    const { login } = useApp();
    const [email, setEmail] = useState('admin@transitops.com');
    const [password, setPassword] = useState('TransitOps@2026');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [remember, setRemember] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const ok = await login(email, password);
        if (!ok) setError('Invalid email or password. Use the demo credentials below.');
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
                {/* Grid */}
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }} />
            </div>

            {/* Left panel — branding */}
            <div className="hidden lg:flex flex-1 flex-col justify-between p-16 relative">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Truck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-xl tracking-tight">TransitOps</h1>
                        <p className="text-blue-400 text-xs font-medium">Smart Transport Platform</p>
                    </div>
                </div>

                <div>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                    >
                        <h2 className="text-5xl font-bold text-white leading-tight mb-6">
                            Fleet Operations,<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                                Reimagined.
                            </span>
                        </h2>
                        <p className="text-slate-400 text-lg leading-relaxed mb-12 max-w-md">
                            A centralized command center for vehicle management, driver compliance,
                            dispatch, maintenance, and analytics — powered by AI.
                        </p>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.4 }}
                        className="grid grid-cols-3 gap-6"
                    >
                        {[
                            { label: 'Vehicles Tracked', value: '8+' },
                            { label: 'Active Trips', value: '2' },
                            { label: 'Fleet Health', value: '87%' },
                        ].map(s => (
                            <div key={s.label} className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10">
                                <p className="text-3xl font-bold text-white">{s.value}</p>
                                <p className="text-slate-400 text-sm mt-1">{s.label}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>

                <p className="text-slate-600 text-xs">© 2026 TransitOps Platform. Enterprise Fleet Management.</p>
            </div>

            {/* Right panel — login form */}
            <div className="flex-1 lg:max-w-md flex items-center justify-center p-8 relative">
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 p-10 shadow-2xl"
                >
                    {/* Mobile logo */}
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                            <Truck className="w-4 h-4 text-white" />
                        </div>
                        <h1 className="text-white font-bold text-lg">TransitOps</h1>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-white">Welcome back</h2>
                        <p className="text-slate-400 mt-1">Sign in to your operations dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-slate-300 text-sm font-medium mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition text-sm"
                                placeholder="you@transitops.com"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-slate-300 text-sm font-medium mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition text-sm"
                                    placeholder="••••••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(s => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                                >
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember & Forgot */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={e => setRemember(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/30 bg-white/10 accent-blue-500"
                                />
                                <span className="text-slate-400 text-sm">Remember me</span>
                            </label>
                            <button type="button" className="text-blue-400 text-sm hover:text-blue-300 transition">
                                Forgot password?
                            </button>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl py-3.5 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                            {loading ? 'Authenticating...' : 'Sign In Securely'}
                        </button>
                    </form>

                    {/* Demo accounts */}
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <p className="text-slate-500 text-xs text-center mb-4 uppercase tracking-wider font-medium">Demo Accounts (password: TransitOps@2026)</p>
                        <div className="grid grid-cols-1 gap-2">
                            {DEMO_ACCOUNTS.map(acc => (
                                <button
                                    key={acc.email}
                                    onClick={() => setEmail(acc.email)}
                                    className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl px-4 py-2.5 transition cursor-pointer text-left border border-white/10 hover:border-white/20"
                                >
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: acc.color }} />
                                    <div>
                                        <p className="text-slate-300 text-xs font-medium">{acc.role}</p>
                                        <p className="text-slate-500 text-xs">{acc.email}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
