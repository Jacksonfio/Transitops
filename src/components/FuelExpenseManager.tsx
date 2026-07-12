import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Plus, Search, Fuel, DollarSign, X, Check, Loader2,
    AlertTriangle, TrendingDown, Receipt, Gauge
} from 'lucide-react';
import { useApp } from '../context';
import { FuelLog, Expense, ExpenseCategory } from '../types';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
    'Fuel', 'Maintenance', 'Toll', 'Parking', 'Insurance', 'Permit', 'Driver Salary', 'Other'
];

const CATEGORY_CONFIG: Record<ExpenseCategory, { color: string; bg: string }> = {
    'Fuel': { color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/20' },
    'Maintenance': { color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/20' },
    'Toll': { color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
    'Parking': { color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-700' },
    'Insurance': { color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20' },
    'Permit': { color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/20' },
    'Driver Salary': { color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/20' },
    'Other': { color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700' },
};

export default function FuelExpenseManager() {
    const { vehicles, drivers, trips, fuelLogs, expenses, addFuelLog, addExpense } = useApp();
    const [activeTab, setActiveTab] = useState<'fuel' | 'expenses'>('fuel');
    const [search, setSearch] = useState('');
    const [showFuelModal, setShowFuelModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [fuelForm, setFuelForm] = useState({
        vehicleId: '', driverId: '', tripId: '',
        fuelStation: '', fuelType: 'Diesel', liters: 0, pricePerLiter: 0, totalCost: 0, odometer: 0, date: new Date().toISOString().split('T')[0], notes: '',
    });
    const [expForm, setExpForm] = useState({
        vehicleId: '', driverId: '', tripId: '', category: 'Toll' as ExpenseCategory,
        amount: 0, description: '', date: new Date().toISOString().split('T')[0],
    });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const fFld = (key: string, val: any) => {
        setFuelForm(p => {
            const next = { ...p, [key]: val };
            if (key === 'liters' || key === 'pricePerLiter') {
                next.totalCost = parseFloat((Number(next.liters) * Number(next.pricePerLiter)).toFixed(2));
            }
            return next;
        });
    };
    const eFld = (key: string, val: any) => setExpForm(p => ({ ...p, [key]: val }));

    const handleFuelSave = async () => {
        if (!fuelForm.vehicleId) { setFormError('Please select a vehicle.'); return; }
        if (!fuelForm.fuelStation.trim()) { setFormError('Fuel station is required.'); return; }
        if (fuelForm.liters <= 0) { setFormError('Liters must be > 0.'); return; }
        setSaving(true); setFormError('');
        await addFuelLog({ ...fuelForm, liters: Number(fuelForm.liters), pricePerLiter: Number(fuelForm.pricePerLiter), totalCost: Number(fuelForm.totalCost), odometer: Number(fuelForm.odometer) });
        setShowFuelModal(false); setSaving(false);
    };

    const handleExpenseSave = async () => {
        if (!expForm.description.trim()) { setFormError('Description is required.'); return; }
        if (expForm.amount <= 0) { setFormError('Amount must be > 0.'); return; }
        setSaving(true); setFormError('');
        await addExpense({ ...expForm, amount: Number(expForm.amount) });
        setShowExpenseModal(false); setSaving(false);
    };

    // Compute summaries
    const totalFuel = fuelLogs.reduce((s, f) => s + f.totalCost, 0);
    const totalLiters = fuelLogs.reduce((s, f) => s + f.liters, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const expenseByCategory = EXPENSE_CATEGORIES.reduce((acc, cat) => {
        acc[cat] = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
        return acc;
    }, {} as Record<string, number>);

    const filteredFuel = fuelLogs.filter(f => {
        const q = search.toLowerCase();
        const v = vehicles.find(x => x.id === f.vehicleId);
        return !q || f.fuelStation.toLowerCase().includes(q) || (v?.name || '').toLowerCase().includes(q);
    });

    const filteredExpenses = expenses.filter(e => {
        const q = search.toLowerCase();
        return !q || e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Fuel & Expenses</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track all operational costs and fuel consumption</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setFuelForm(p => ({ ...p, vehicleId: '', driverId: '', tripId: '' })); setFormError(''); setShowFuelModal(true); }} className="btn-primary">
                        <Fuel className="w-4 h-4" /> Log Fuel
                    </button>
                    <button onClick={() => { setExpForm(p => ({ ...p, vehicleId: '', driverId: '', tripId: '' })); setFormError(''); setShowExpenseModal(true); }} className="btn-outline">
                        <DollarSign className="w-4 h-4" /> Add Expense
                    </button>
                </div>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Fuel Cost</p>
                    <p className="text-2xl font-bold text-amber-600">${totalFuel.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    <p className="text-xs text-slate-500 mt-1">{totalLiters.toFixed(0)} liters total</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-500">${totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    <p className="text-xs text-slate-500 mt-1">{expenses.length} records</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Fuel Logs</p>
                    <p className="text-2xl font-bold text-blue-600">{fuelLogs.length}</p>
                    <p className="text-xs text-slate-500 mt-1">entries recorded</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Operational Cost</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">${(totalFuel + totalExpenses).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    <p className="text-xs text-slate-500 mt-1">Fuel + All Expenses</p>
                </div>
            </div>

            {/* Expense breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-blue-600" /> Expense Breakdown by Category
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {EXPENSE_CATEGORIES.filter(c => expenseByCategory[c] > 0).map(cat => {
                        const cfg = CATEGORY_CONFIG[cat];
                        return (
                            <div key={cat} className={`${cfg.bg} rounded-xl p-3`}>
                                <p className={`text-xs font-semibold ${cfg.color} mb-1`}>{cat}</p>
                                <p className={`text-lg font-bold ${cfg.color}`}>${expenseByCategory[cat].toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                        );
                    })}
                    {Object.values(expenseByCategory).every(v => v === 0) && (
                        <p className="col-span-4 text-center text-slate-400 py-4 text-sm">No expenses recorded yet.</p>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button onClick={() => setActiveTab('fuel')} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${activeTab === 'fuel' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                    <Fuel className="w-4 h-4 inline mr-2" />Fuel Logs ({fuelLogs.length})
                </button>
                <button onClick={() => setActiveTab('expenses')} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${activeTab === 'expenses' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                    <DollarSign className="w-4 h-4 inline mr-2" />Expenses ({expenses.length})
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="form-input pl-9" />
            </div>

            {/* Fuel Logs Table */}
            {activeTab === 'fuel' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Vehicle</th>
                                    <th>Driver</th>
                                    <th>Station</th>
                                    <th>Fuel Type</th>
                                    <th>Liters</th>
                                    <th>Price/L</th>
                                    <th>Total Cost</th>
                                    <th>Odometer</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFuel.length === 0 && <tr><td colSpan={10} className="text-center py-10 text-slate-400">No fuel logs found.</td></tr>}
                                {filteredFuel.map(f => {
                                    const vehicle = vehicles.find(v => v.id === f.vehicleId);
                                    const driver = drivers.find(d => d.id === f.driverId);
                                    return (
                                        <tr key={f.id}>
                                            <td><span className="font-mono text-xs text-slate-400">{f.id}</span></td>
                                            <td className="font-medium">{vehicle?.name || f.vehicleId}</td>
                                            <td>{driver?.name || f.driverId || '—'}</td>
                                            <td>{f.fuelStation}</td>
                                            <td><span className="badge bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">{f.fuelType}</span></td>
                                            <td className="font-mono">{f.liters} L</td>
                                            <td className="font-mono">${f.pricePerLiter.toFixed(2)}</td>
                                            <td className="font-bold text-amber-600">${f.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                            <td className="font-mono text-xs">{f.odometer.toLocaleString()} km</td>
                                            <td className="text-slate-500">{f.date}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Expenses Table */}
            {activeTab === 'expenses' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Vehicle</th>
                                    <th>Driver</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-slate-400">No expenses found.</td></tr>}
                                {filteredExpenses.map(e => {
                                    const vehicle = e.vehicleId ? vehicles.find(v => v.id === e.vehicleId) : null;
                                    const driver = e.driverId ? drivers.find(d => d.id === e.driverId) : null;
                                    const cfg = CATEGORY_CONFIG[e.category];
                                    return (
                                        <tr key={e.id}>
                                            <td><span className="font-mono text-xs text-slate-400">{e.id}</span></td>
                                            <td><span className={`badge ${cfg.bg} ${cfg.color}`}>{e.category}</span></td>
                                            <td>{e.description}</td>
                                            <td>{vehicle?.name || '—'}</td>
                                            <td>{driver?.name || '—'}</td>
                                            <td className="font-bold text-red-500">${e.amount.toLocaleString()}</td>
                                            <td className="text-slate-500">{e.date}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Fuel Log Modal */}
            <AnimatePresence>
                {showFuelModal && (
                    <div className="modal-overlay" onClick={() => setShowFuelModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="modal-content w-full max-w-xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Fuel className="w-5 h-5 text-amber-600" /> Log Fuel Fillup
                                </h3>
                                <button onClick={() => setShowFuelModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
                            </div>
                            {formError && <div className="mb-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3"><AlertTriangle className="w-4 h-4 text-red-500" /><p className="text-red-600 dark:text-red-400 text-sm">{formError}</p></div>}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Vehicle *</label>
                                    <select value={fuelForm.vehicleId} onChange={e => fFld('vehicleId', e.target.value)} className="form-select">
                                        <option value="">Select Vehicle</option>
                                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Driver</label>
                                    <select value={fuelForm.driverId} onChange={e => fFld('driverId', e.target.value)} className="form-select">
                                        <option value="">Select Driver</option>
                                        {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Fuel Station *</label>
                                    <input value={fuelForm.fuelStation} onChange={e => fFld('fuelStation', e.target.value)} className="form-input" placeholder="HP Petrol Pump, Delhi" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Fuel Type</label>
                                    <select value={fuelForm.fuelType} onChange={e => fFld('fuelType', e.target.value)} className="form-select">
                                        {['Diesel', 'Petrol', 'Electric', 'CNG', 'LPG'].map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Liters *</label>
                                    <input type="number" value={fuelForm.liters || ''} onChange={e => fFld('liters', e.target.value)} className="form-input" min={0} step={0.1} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Price per Liter ($)</label>
                                    <input type="number" value={fuelForm.pricePerLiter || ''} onChange={e => fFld('pricePerLiter', e.target.value)} className="form-input" min={0} step={0.01} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Total Cost ($)</label>
                                    <input type="number" value={fuelForm.totalCost || ''} onChange={e => fFld('totalCost', e.target.value)} className="form-input bg-amber-50 dark:bg-amber-900/20 font-bold" readOnly />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Odometer (km)</label>
                                    <input type="number" value={fuelForm.odometer || ''} onChange={e => fFld('odometer', e.target.value)} className="form-input" min={0} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Date</label>
                                    <input type="date" value={fuelForm.date} onChange={e => fFld('date', e.target.value)} className="form-input" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Notes</label>
                                    <input value={fuelForm.notes} onChange={e => fFld('notes', e.target.value)} className="form-input" placeholder="Optional notes..." />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <button onClick={() => setShowFuelModal(false)} className="btn-outline">Cancel</button>
                                <button onClick={handleFuelSave} disabled={saving} className="btn-primary">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    Save Fuel Log
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Expense Modal */}
            <AnimatePresence>
                {showExpenseModal && (
                    <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="modal-content w-full max-w-lg"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-red-500" /> Add Expense
                                </h3>
                                <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
                            </div>
                            {formError && <div className="mb-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3"><AlertTriangle className="w-4 h-4 text-red-500" /><p className="text-red-600 dark:text-red-400 text-sm">{formError}</p></div>}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Category</label>
                                    <select value={expForm.category} onChange={e => eFld('category', e.target.value)} className="form-select">
                                        {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Description *</label>
                                    <input value={expForm.description} onChange={e => eFld('description', e.target.value)} className="form-input" placeholder="NH44 Delhi-Agra Tolls" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Amount ($) *</label>
                                    <input type="number" value={expForm.amount || ''} onChange={e => eFld('amount', Number(e.target.value))} className="form-input" min={0} step={0.01} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Vehicle</label>
                                        <select value={expForm.vehicleId} onChange={e => eFld('vehicleId', e.target.value)} className="form-select">
                                            <option value="">None</option>
                                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Driver</label>
                                        <select value={expForm.driverId} onChange={e => eFld('driverId', e.target.value)} className="form-select">
                                            <option value="">None</option>
                                            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Date</label>
                                    <input type="date" value={expForm.date} onChange={e => eFld('date', e.target.value)} className="form-input" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <button onClick={() => setShowExpenseModal(false)} className="btn-outline">Cancel</button>
                                <button onClick={handleExpenseSave} disabled={saving} className="btn-primary">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    Add Expense
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
