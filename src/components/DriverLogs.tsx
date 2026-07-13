import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, Users, Edit2, Trash2, X, Check, Loader2,
  AlertTriangle, Shield, Phone, Calendar, Star, AlertCircle
} from 'lucide-react';
import { useApp } from '../context';
import { Driver, DriverStatus } from '../types';
import { TableSkeleton } from './SkeletonLoader';

const LICENSE_CATEGORIES = ['CDL-A', 'CDL-B', 'CDL-C', 'Class A', 'Class B', 'Class C', 'LMV', 'HMV', 'HPMV'];
const STATUS_OPTIONS: DriverStatus[] = ['Available', 'Off Duty', 'Suspended'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function StatusBadge({ status }: { status: DriverStatus }) {
  const map: Record<DriverStatus, string> = {
    'Available': 'badge badge-available',
    'On Trip': 'badge badge-on-trip',
    'Off Duty': 'badge badge-off-duty',
    'Suspended': 'badge badge-suspended',
  };
  return <span className={map[status]}>{status}</span>;
}

function LicenseStatus({ expiry }: { expiry: string }) {
  const days = Math.floor((new Date(expiry).getTime() - Date.now()) / 86400000);
  if (days < 0) return <span className="badge badge-suspended">Expired {Math.abs(days)}d ago</span>;
  if (days <= 30) return <span className="badge badge-in-shop">Expires in {days}d</span>;
  return <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{expiry}</span>;
}

function SafetyScore({ score }: { score: number }) {
  const color = score >= 90 ? 'text-emerald-600' : score >= 75 ? 'text-amber-600' : 'text-red-500';
  return (
    <div className="flex items-center gap-1.5">
      <Star className={`w-3.5 h-3.5 ${color}`} />
      <span className={`font-bold text-sm ${color}`}>{score}</span>
      <span className="text-slate-400 text-xs">/100</span>
    </div>
  );
}

const EMPTY_DRIVER: Omit<Driver, 'id'> = {
  name: '', licenseNumber: '', licenseCategory: 'CDL-A',
  licenseExpiry: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
  phone: '', emergencyContact: '', joiningDate: new Date().toISOString().split('T')[0],
  experienceYears: 1, bloodGroup: 'O+', safetyScore: 90, status: 'Available',
  fatigueIndex: 0,
};

export default function DriverManagement() {
  const { drivers, vehicles, addDriver, updateDriver, deleteDriver, isLoading } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [form, setForm] = useState<Omit<Driver, 'id'>>(EMPTY_DRIVER);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = drivers.filter(d => {
    const q = search.toLowerCase();
    const matchQ = !q || d.name.toLowerCase().includes(q) || d.licenseNumber.toLowerCase().includes(q) || d.phone.includes(q);
    const matchStatus = !filterStatus || d.status === filterStatus;
    return matchQ && matchStatus;
  });

  const openAdd = () => { setEditDriver(null); setForm(EMPTY_DRIVER); setFormError(''); setShowModal(true); };
  const openEdit = (d: Driver) => { setEditDriver(d); setForm({ ...d }); setFormError(''); setShowModal(true); };
  const fld = (key: keyof typeof form, val: any) => setForm(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    if (!form.licenseNumber.trim()) { setFormError('License Number is required.'); return; }
    if (!form.phone.trim()) { setFormError('Phone is required.'); return; }
    setSaving(true); setFormError('');
    try {
      if (editDriver) await updateDriver(editDriver.id, form);
      else await addDriver(form);
      setShowModal(false);
    } catch (e: any) { setFormError(e.message || 'Error occurred'); }
    setSaving(false);
  };

  const expiringSoon = drivers.filter(d => {
    const days = Math.floor((new Date(d.licenseExpiry).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 30;
  }).length;
  const expired = drivers.filter(d => new Date(d.licenseExpiry) < new Date()).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-48 bg-[#D7E3DB] dark:bg-[#2D3A32] rounded animate-pulse" />
            <div className="h-4 w-32 bg-[#D7E3DB] dark:bg-[#2D3A32] rounded mt-2 animate-pulse" />
          </div>
        </div>
        <div className="bg-white dark:bg-[#1C2526] rounded-2xl p-6 border border-[#E2EAE7] dark:border-[#2D3A32]">
          <TableSkeleton rows={6} cols={7} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Driver Management</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {drivers.length} drivers · {drivers.filter(d => d.status === 'Available').length} available
            {expired > 0 && <span className="ml-2 text-red-500 font-medium">· {expired} expired license{expired > 1 ? 's' : ''}</span>}
            {expiringSoon > 0 && <span className="ml-2 text-amber-500 font-medium">· {expiringSoon} expiring soon</span>}
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Driver
        </button>
      </div>

      {/* Warning banner */}
      {(expired > 0 || expiringSoon > 0) && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {expired > 0 && `${expired} driver(s) have expired licenses and cannot be dispatched. `}
            {expiringSoon > 0 && `${expiringSoon} driver(s) have licenses expiring within 30 days.`}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search drivers..." className="form-input pl-9" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-select w-44">
          <option value="">All Statuses</option>
          {(['Available', 'On Trip', 'Off Duty', 'Suspended'] as DriverStatus[]).map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Driver Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No drivers found.</p>
          </div>
        )}
        {filtered.map(d => {
          const days = Math.floor((new Date(d.licenseExpiry).getTime() - Date.now()) / 86400000);
          const isLicenseExpired = days < 0;
          const isExpiringSoon = days >= 0 && days <= 30;
          const currentVehicle = d.currentVehicleId ? vehicles.find(v => v.id === d.currentVehicleId) : null;

          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white dark:bg-[#1C2526] rounded-2xl p-5 shadow-sm border transition-shadow hover:shadow-md ${isLicenseExpired ? 'border-red-200 dark:border-red-800' :
                  isExpiringSoon ? 'border-amber-200 dark:border-amber-800' :
                    'border-[#E2EAE7] dark:border-[#2D3A32]'
                }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${d.status === 'Available' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white' :
                      d.status === 'On Trip' ? 'bg-gradient-to-br from-[#0F766E] to-[#115E59] text-[#111827]' :
                        d.status === 'Suspended' ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' :
                          'bg-gradient-to-br from-slate-400 to-slate-500 text-white'
                    }`}>
                    {d.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{d.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{d.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-[#0F766E]/10 dark:hover:bg-[#0F766E]/10 text-slate-400 hover:text-[#0F766E] transition">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setConfirmDelete(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition" disabled={d.status === 'On Trip'}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <StatusBadge status={d.status} />
                  <SafetyScore score={d.safetyScore} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Shield className="w-3 h-3" />
                    <span className="font-medium">{d.licenseCategory}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Phone className="w-3 h-3" />
                    <span>{d.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>{d.experienceYears} yrs exp</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span className="w-3 text-center font-bold">{d.bloodGroup || '—'}</span>
                  </div>
                </div>

                <div className={`text-xs rounded-lg px-3 py-2 ${isLicenseExpired ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                    isExpiringSoon ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' :
                      'bg-[#F8FAF8] dark:bg-[#2D3A32] text-slate-600 dark:text-slate-400'
                  }`}>
                  <span className="font-semibold">License:</span> {d.licenseNumber} · Expires {d.licenseExpiry}
                  {isLicenseExpired && <span className="font-bold ml-1">⚠ EXPIRED</span>}
                  {isExpiringSoon && <span className="font-bold ml-1">({days}d left)</span>}
                </div>

                {currentVehicle && (
                  <div className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg px-3 py-2">
                    🚛 Assigned: {currentVehicle.name} ({currentVehicle.registrationNumber})
                  </div>
                )}

                {/* Fatigue index */}
                {d.fatigueIndex !== undefined && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Fatigue Index</span>
                      <span className={`text-xs font-bold ${d.fatigueIndex >= 70 ? 'text-red-500' : d.fatigueIndex >= 40 ? 'text-amber-600' : 'text-emerald-600'}`}>{d.fatigueIndex}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${d.fatigueIndex}%`, background: d.fatigueIndex >= 70 ? '#EF4444' : d.fatigueIndex >= 40 ? '#F59E0B' : '#10B981' }} />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-content w-full max-w-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#0F766E]" />
                  {editDriver ? 'Edit Driver' : 'Add New Driver'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-red-600 dark:text-red-400 text-sm">{formError}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Full Name *</label>
                  <input value={form.name} onChange={e => fld('name', e.target.value)} className="form-input" placeholder="Ravi Kumar" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">License Number *</label>
                  <input value={form.licenseNumber} onChange={e => fld('licenseNumber', e.target.value)} className="form-input font-mono" placeholder="TN1234567890" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">License Category</label>
                  <select value={form.licenseCategory} onChange={e => fld('licenseCategory', e.target.value)} className="form-select">
                    {LICENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">License Expiry *</label>
                  <input type="date" value={form.licenseExpiry} onChange={e => fld('licenseExpiry', e.target.value)} className="form-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Phone *</label>
                  <input value={form.phone} onChange={e => fld('phone', e.target.value)} className="form-input" placeholder="+91-9876543210" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Emergency Contact</label>
                  <input value={form.emergencyContact || ''} onChange={e => fld('emergencyContact', e.target.value)} className="form-input" placeholder="+91-9012345678" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Joining Date</label>
                  <input type="date" value={form.joiningDate} onChange={e => fld('joiningDate', e.target.value)} className="form-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Experience (years)</label>
                  <input type="number" value={form.experienceYears} onChange={e => fld('experienceYears', Number(e.target.value))} className="form-input" min={0} max={50} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Blood Group</label>
                  <select value={form.bloodGroup || ''} onChange={e => fld('bloodGroup', e.target.value)} className="form-select">
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Safety Score (0-100)</label>
                  <input type="number" value={form.safetyScore} onChange={e => fld('safetyScore', Number(e.target.value))} className="form-input" min={0} max={100} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Status</label>
                  <select value={form.status} onChange={e => fld('status', e.target.value)} className="form-select">
                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#E2EAE7] dark:border-[#2D3A32]">
                <button onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editDriver ? 'Save Changes' : 'Add Driver'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-content w-full max-w-sm text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Remove Driver?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">This will permanently remove the driver profile.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="btn-outline flex-1">Cancel</button>
                <button onClick={() => { deleteDriver(confirmDelete!); setConfirmDelete(null); }} className="btn-danger flex-1">Remove</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
