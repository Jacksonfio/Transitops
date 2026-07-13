import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, Navigation, X, Check, Loader2, AlertTriangle,
  CheckCircle, XCircle, Truck, Users, MapPin, Package, DollarSign,
  Zap, TrendingUp, Clock, ArrowRight
} from 'lucide-react';
import { useApp } from '../context';
import { Trip, TripStatus } from '../types';
import { TableSkeleton } from './SkeletonLoader';

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'] as const;

function StatusBadge({ status }: { status: TripStatus }) {
  const map: Record<TripStatus, string> = {
    'Draft': 'badge badge-draft',
    'Pending': 'badge badge-pending',
    'Dispatched': 'badge badge-dispatched',
    'Completed': 'badge badge-completed',
    'Cancelled': 'badge badge-cancelled',
  };
  return <span className={map[status]}>{status}</span>;
}

const EMPTY_TRIP = {
  source: '', destination: '', vehicleId: '', driverId: '',
  cargoDescription: '', cargoWeight: 0, plannedDistance: 0,
  estimatedDuration: 1, revenue: 0,
  status: 'Dispatched' as TripStatus, priority: 'Medium' as const,
};

export default function TripManagement() {
  const { trips, vehicles, drivers, createTrip, updateTripStatus, isLoading } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<TripStatus | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_TRIP });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showComplete, setShowComplete] = useState<Trip | null>(null);
  const [completeForm, setCompleteForm] = useState({ finalOdometer: 0, fuelConsumed: 0 });

  const filtered = trips.filter(t => {
    const q = search.toLowerCase();
    const matchQ = !q || t.source.toLowerCase().includes(q) || t.destination.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.cargoDescription.toLowerCase().includes(q);
    const matchStatus = !filterStatus || t.status === filterStatus;
    return matchQ && matchStatus;
  });

  const fld = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));

  const suggestAI = async () => {
    if (!form.cargoWeight) return;
    setLoadingAI(true);
    try {
      const res = await fetch('/api/ai/optimize-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cargoWeight: form.cargoWeight, source: form.source, destination: form.destination }),
      });
      const data = await res.json();
      setAiSuggestion(data);
      if (data.recommendedVehicle) fld('vehicleId', data.recommendedVehicle.id);
      if (data.recommendedDriver) fld('driverId', data.recommendedDriver.id);
    } catch { }
    setLoadingAI(false);
  };

  const handleCreate = async () => {
    if (!form.source.trim()) { setFormError('Source is required.'); return; }
    if (!form.destination.trim()) { setFormError('Destination is required.'); return; }
    if (!form.vehicleId) { setFormError('Please select a vehicle.'); return; }
    if (!form.driverId) { setFormError('Please select a driver.'); return; }
    if (!form.cargoDescription.trim()) { setFormError('Cargo description is required.'); return; }
    if (form.cargoWeight <= 0) { setFormError('Cargo weight must be > 0.'); return; }

    setSaving(true); setFormError('');
    const result = await createTrip({
      ...form,
      cargoWeight: Number(form.cargoWeight),
      plannedDistance: Number(form.plannedDistance),
      estimatedDuration: Number(form.estimatedDuration),
      revenue: Number(form.revenue),
      status: form.status as TripStatus,
    });
    if (!result.ok) { setFormError(result.error || 'Failed to create trip'); setSaving(false); return; }
    setShowModal(false);
    setSaving(false);
  };

  const handleStatusChange = async (trip: Trip, newStatus: TripStatus) => {
    if (newStatus === 'Completed') {
      setShowComplete(trip);
      setCompleteForm({ finalOdometer: trip.vehicleId ? (vehicles.find(v => v.id === trip.vehicleId)?.odometer || 0) + trip.plannedDistance : 0, fuelConsumed: 0 });
      return;
    }
    await updateTripStatus(trip.id, newStatus);
  };

  const handleComplete = async () => {
    if (!showComplete) return;
    await updateTripStatus(showComplete.id, 'Completed', {
      finalOdometer: completeForm.finalOdometer,
      fuelConsumed: completeForm.fuelConsumed,
    });
    setShowComplete(null);
  };

  const availableVehicles = vehicles.filter(v => v.status === 'Available');
  const eligibleDrivers = drivers.filter(d => {
    if (d.status !== 'Available') return false;
    const exp = new Date(d.licenseExpiry);
    return exp > new Date();
  });

  // Summary counts
  const counts = { Draft: 0, Pending: 0, Dispatched: 0, Completed: 0, Cancelled: 0 };
  trips.forEach(t => counts[t.status]++);

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
          <TableSkeleton rows={5} cols={7} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Trip Management</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{trips.length} total trips</p>
        </div>
        <button onClick={() => { setForm({ ...EMPTY_TRIP }); setFormError(''); setAiSuggestion(null); setShowModal(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Create Trip
        </button>
      </div>

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(counts) as [TripStatus, number][]).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filterStatus === status
                ? 'bg-[#0F766E] text-[#111827] border-[#0F766E]'
                : 'bg-white dark:bg-[#1C2526] text-slate-600 dark:text-[#6B7280] border-[#E2EAE7] dark:border-[#2D3A32] hover:border-[#0F766E]/50'
              }`}
          >
            <span className={`badge badge-${status.toLowerCase()} ${filterStatus === status ? 'bg-[#115E59] text-white border-0' : ''}`} style={filterStatus === status ? { background: 'rgba(11,19,17,0.2)', color: '#111827' } : {}}>
              {count}
            </span>
            {status}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search trips by route, cargo, ID..." className="form-input pl-9" />
      </div>

      {/* Trip Cards */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Navigation className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No trips found</p>
          </div>
        )}
        {filtered.map(t => {
          const vehicle = vehicles.find(v => v.id === t.vehicleId);
          const driver = drivers.find(d => d.id === t.driverId);

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#1C2526] rounded-2xl shadow-sm border border-[#E2EAE7] dark:border-[#2D3A32] p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.status === 'Dispatched' ? 'bg-[#0F766E]/10' :
                    t.status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                      t.status === 'Cancelled' ? 'bg-red-100 dark:bg-red-900/30' :
                        'bg-slate-100 dark:bg-[#2D3A32]'
                  }`}>
                  <Navigation className={`w-4.5 h-4.5 ${t.status === 'Dispatched' ? 'text-[#0F766E]' :
                      t.status === 'Completed' ? 'text-emerald-600 dark:text-emerald-400' :
                        t.status === 'Cancelled' ? 'text-red-500' : 'text-slate-500'
                    }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-mono text-xs font-bold text-slate-400">{t.id}</span>
                    <StatusBadge status={t.status} />
                    <span className={`badge priority-${t.priority.toLowerCase()}`}>{t.priority}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-900 dark:text-white text-sm truncate max-w-[200px]">{t.source}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-900 dark:text-white text-sm truncate max-w-[200px]">{t.destination}</span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {vehicle?.name || t.vehicleId}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {driver?.name || t.driverId}</span>
                    <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {t.cargoDescription} · {t.cargoWeight.toLocaleString()} kg</span>
                    <span className="flex items-center gap-1"><Navigation className="w-3 h-3" /> {t.plannedDistance} km</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t.estimatedDuration}h</span>
                  </div>

                  {t.fuelConsumed && t.fuelConsumed > 0 && (
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        Fuel: {t.fuelConsumed}L · Efficiency: {t.fuelConsumed > 0 ? (t.plannedDistance / t.fuelConsumed).toFixed(1) : '—'} km/L
                      </span>
                      {t.estimatedCO2 && <span className="text-slate-400">CO₂: ~{t.estimatedCO2} kg</span>}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">${t.revenue.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">revenue</p>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-1.5">
                    {(t.status === 'Draft' || t.status === 'Pending') && (
                      <button onClick={() => handleStatusChange(t, 'Dispatched')} className="btn-primary text-xs px-3 py-1.5">
                        <Navigation className="w-3 h-3" /> Dispatch
                      </button>
                    )}
                    {t.status === 'Dispatched' && (
                      <>
                        <button onClick={() => handleStatusChange(t, 'Completed')} className="btn-success text-xs px-3 py-1.5">
                          <CheckCircle className="w-3 h-3" /> Complete
                        </button>
                        <button onClick={() => handleStatusChange(t, 'Cancelled')} className="btn-outline text-xs px-3 py-1.5 hover:border-red-400 hover:text-red-500">
                          <XCircle className="w-3 h-3" /> Cancel
                        </button>
                      </>
                    )}
                    {(t.status === 'Completed' || t.status === 'Cancelled') && (
                      <span className={`text-xs px-3 py-1.5 rounded-lg text-center font-medium ${t.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-[#2D3A32] text-slate-500'}`}>
                        {t.status === 'Completed' ? '✓ Closed' : '✗ Voided'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Create Trip Modal */}
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
                  <Navigation className="w-5 h-5 text-[#0F766E]" /> Create New Trip
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-red-600 dark:text-red-400 text-sm">{formError}</p>
                </div>
              )}

              {aiSuggestion && (
                <div className="mb-4 bg-[#0F766E]/10 border border-[#0F766E]/30 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-[#0F766E]" />
                    <p className="text-[#115E59] text-sm font-semibold">AI Dispatch Recommended</p>
                  </div>
                  <p className="text-[#115E59] text-xs">{aiSuggestion.reasoning}</p>
                  {aiSuggestion.recommendedVehicle && <p className="text-xs text-[#115E59] mt-1">Vehicle: <strong>{aiSuggestion.recommendedVehicle.name}</strong> (Health: {aiSuggestion.recommendedVehicle.healthScore}%)</p>}
                  {aiSuggestion.recommendedDriver && <p className="text-xs text-[#115E59]">Driver: <strong>{aiSuggestion.recommendedDriver.name}</strong> (Safety: {aiSuggestion.recommendedDriver.safetyScore}/100)</p>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Source *</label>
                  <input value={form.source} onChange={e => fld('source', e.target.value)} className="form-input" placeholder="Chennai Port" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Destination *</label>
                  <input value={form.destination} onChange={e => fld('destination', e.target.value)} className="form-input" placeholder="Bangalore Warehouse" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Cargo Description *</label>
                  <input value={form.cargoDescription} onChange={e => fld('cargoDescription', e.target.value)} className="form-input" placeholder="Electronic Components" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Cargo Weight (kg) *</label>
                  <input type="number" value={form.cargoWeight || ''} onChange={e => fld('cargoWeight', Number(e.target.value))} className="form-input" min={1} placeholder="1200" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Planned Distance (km)</label>
                  <input type="number" value={form.plannedDistance || ''} onChange={e => fld('plannedDistance', Number(e.target.value))} className="form-input" min={1} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Est. Duration (hours)</label>
                  <input type="number" value={form.estimatedDuration || ''} onChange={e => fld('estimatedDuration', Number(e.target.value))} className="form-input" min={0.5} step={0.5} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Revenue ($)</label>
                  <input type="number" value={form.revenue || ''} onChange={e => fld('revenue', Number(e.target.value))} className="form-input" min={0} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Priority</label>
                  <select value={form.priority} onChange={e => fld('priority', e.target.value)} className="form-select">
                    {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>

                {/* AI Assign button */}
                <div className="col-span-2">
                  <button
                    type="button"
                    onClick={suggestAI}
                    disabled={loadingAI || !form.cargoWeight}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0F766E] to-[#115E59] hover:from-[#14B8A6] hover:to-[#0F766E] text-[#111827] rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    AI Auto-Assign (Best Vehicle & Driver)
                  </button>
                  <p className="text-xs text-slate-400 text-center mt-1">Enter cargo weight first, then click to get AI recommendations</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Vehicle *</label>
                  <select value={form.vehicleId} onChange={e => fld('vehicleId', e.target.value)} className="form-select">
                    <option value="">Select Vehicle</option>
                    {availableVehicles.map(v => (
                      <option key={v.id} value={v.id} disabled={form.cargoWeight > v.loadCapacity}>
                        {v.name} ({v.registrationNumber}) — Cap: {v.loadCapacity}kg{form.cargoWeight > v.loadCapacity ? ' ❌ Over Capacity' : ''}
                      </option>
                    ))}
                  </select>
                  {availableVehicles.length === 0 && <p className="text-xs text-red-500 mt-1">No available vehicles</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Driver *</label>
                  <select value={form.driverId} onChange={e => fld('driverId', e.target.value)} className="form-select">
                    <option value="">Select Driver</option>
                    {eligibleDrivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} — Safety: {d.safetyScore}/100</option>
                    ))}
                  </select>
                  {eligibleDrivers.length === 0 && <p className="text-xs text-red-500 mt-1">No eligible drivers (check license validity)</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Create As</label>
                  <select value={form.status} onChange={e => fld('status', e.target.value)} className="form-select">
                    <option value="Draft">Draft (not dispatched)</option>
                    <option value="Pending">Pending approval</option>
                    <option value="Dispatched">Dispatched immediately</option>
                  </select>
                </div>
              </div>

              {/* Validation preview */}
              {form.vehicleId && form.cargoWeight > 0 && (() => {
                const v = vehicles.find(x => x.id === form.vehicleId);
                if (v && form.cargoWeight > v.loadCapacity) {
                  return (
                    <div className="mt-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-red-600 dark:text-red-400 text-sm">
                        ⚠ Cargo weight ({form.cargoWeight} kg) exceeds vehicle capacity ({v.loadCapacity} kg)
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="mt-4 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <p className="text-emerald-600 dark:text-emerald-400 text-sm">
                      ✓ Cargo weight OK ({form.cargoWeight} kg ≤ {v?.loadCapacity} kg capacity)
                    </p>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#E2EAE7] dark:border-[#2D3A32]">
                <button onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
                <button onClick={handleCreate} disabled={saving} className="btn-primary">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Create Trip
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Complete Trip Modal */}
      <AnimatePresence>
        {showComplete && (
          <div className="modal-overlay" onClick={() => setShowComplete(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-content w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" /> Complete Trip {showComplete.id}
                </h3>
                <button onClick={() => setShowComplete(null)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Final Odometer Reading (km)</label>
                  <input type="number" value={completeForm.finalOdometer} onChange={e => setCompleteForm(p => ({ ...p, finalOdometer: Number(e.target.value) }))} className="form-input" min={0} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Fuel Consumed (liters)</label>
                  <input type="number" value={completeForm.fuelConsumed} onChange={e => setCompleteForm(p => ({ ...p, fuelConsumed: Number(e.target.value) }))} className="form-input" min={0} step={0.1} />
                </div>
                {completeForm.fuelConsumed > 0 && showComplete.plannedDistance > 0 && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-sm text-emerald-700 dark:text-emerald-400">
                    Fuel Efficiency: <strong>{(showComplete.plannedDistance / completeForm.fuelConsumed).toFixed(2)} km/L</strong>
                    <br />Est. CO₂: <strong>{(completeForm.fuelConsumed * 2.68).toFixed(0)} kg</strong>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowComplete(null)} className="btn-outline flex-1">Cancel</button>
                  <button onClick={handleComplete} className="btn-success flex-1">
                    <CheckCircle className="w-4 h-4" /> Complete Trip
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
