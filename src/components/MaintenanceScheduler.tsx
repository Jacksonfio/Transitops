import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, Wrench, X, Check, Loader2, AlertTriangle,
  CheckCircle, Clock, AlertCircle, ChevronRight
} from 'lucide-react';
import { useApp } from '../context';
import { MaintenanceLog, MaintenanceStatus, MaintenanceType } from '../types';

const MAINTENANCE_TYPES: MaintenanceType[] = [
  'Oil Change', 'Brake Service', 'Engine Repair', 'Tyre Replacement',
  'Battery', 'Transmission', 'Electrical', 'Inspection', 'Body Work', 'Other'
];

function StatusBadge({ status }: { status: MaintenanceStatus }) {
  const map: Record<MaintenanceStatus, string> = {
    'Scheduled': 'badge badge-draft',
    'In Progress': 'badge badge-dispatched',
    'Completed': 'badge badge-completed',
    'Cancelled': 'badge badge-cancelled',
  };
  return <span className={map[status]}>{status}</span>;
}

const EMPTY: Omit<MaintenanceLog, 'id' | 'createdAt'> = {
  vehicleId: '', type: 'Oil Change', description: '', status: 'Scheduled',
  scheduledDate: new Date().toISOString().split('T')[0], cost: 0,
  mechanic: '', odometerAtService: 0, notes: '',
};

export default function MaintenanceScheduler() {
  const { vehicles, maintenanceLogs, addMaintenance, updateMaintenanceStatus } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<MaintenanceStatus | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Omit<MaintenanceLog, 'id' | 'createdAt'>>({ ...EMPTY });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = maintenanceLogs.filter(m => {
    const v = vehicles.find(x => x.id === m.vehicleId);
    const q = search.toLowerCase();
    const matchQ = !q || m.type.toLowerCase().includes(q) || m.mechanic.toLowerCase().includes(q) || (v?.name || '').toLowerCase().includes(q);
    const matchStatus = !filterStatus || m.status === filterStatus;
    return matchQ && matchStatus;
  });

  const handleSave = async () => {
    if (!form.vehicleId) { setFormError('Please select a vehicle.'); return; }
    if (!form.description.trim()) { setFormError('Description is required.'); return; }
    if (!form.mechanic.trim()) { setFormError('Mechanic / Shop name is required.'); return; }

    setSaving(true); setFormError('');
    try {
      await addMaintenance(form);
      setShowModal(false);
    } catch (e: any) { setFormError(e.message || 'Error'); }
    setSaving(false);
  };

  const handleStatusUpdate = async (log: MaintenanceLog, newStatus: MaintenanceStatus) => {
    await updateMaintenanceStatus(log.id, newStatus);
  };

  const fld = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));

  const availableVehicles = vehicles.filter(v => v.status !== 'On Trip');

  const counts = { Scheduled: 0, 'In Progress': 0, Completed: 0, Cancelled: 0 };
  maintenanceLogs.forEach(m => { counts[m.status] = (counts[m.status] || 0) + 1; });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Maintenance</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {maintenanceLogs.length} records · {counts['In Progress']} in progress · {counts['Scheduled']} scheduled
          </p>
        </div>
        <button onClick={() => { setForm({ ...EMPTY }); setFormError(''); setShowModal(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Maintenance
        </button>
      </div>

      {/* In-shop vehicles warning */}
      {vehicles.filter(v => v.status === 'In Shop').length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {vehicles.filter(v => v.status === 'In Shop').length} vehicle(s) currently In Shop:&nbsp;
            {vehicles.filter(v => v.status === 'In Shop').map(v => v.name).join(', ')}.
            These are excluded from trip dispatch.
          </p>
        </div>
      )}

      {/* Status filters */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(counts) as [MaintenanceStatus, number][]).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filterStatus === status ? 'bg-blue-600 text-white border-blue-600' :
                'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-300'
              }`}
          >
            {count} {status}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by vehicle, type, mechanic..." className="form-input pl-9" />
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Wrench className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No maintenance records found</p>
          </div>
        )}
        {filtered.map(m => {
          const vehicle = vehicles.find(v => v.id === m.vehicleId);
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    m.status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                      m.status === 'Scheduled' ? 'bg-amber-100 dark:bg-amber-900/30' :
                        'bg-slate-100 dark:bg-slate-700'
                  }`}>
                  <Wrench className={`w-4.5 h-4.5 ${m.status === 'In Progress' ? 'text-blue-600 dark:text-blue-400' :
                      m.status === 'Completed' ? 'text-emerald-600 dark:text-emerald-400' :
                        m.status === 'Scheduled' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'
                    }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="font-mono text-xs font-bold text-slate-400">{m.id}</span>
                    <StatusBadge status={m.status} />
                    <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{m.type}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{vehicle?.name || m.vehicleId}</span>
                    <span className="text-slate-400 text-xs">({vehicle?.registrationNumber})</span>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{m.description}</p>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {m.scheduledDate}</span>
                    {m.completedDate && <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CheckCircle className="w-3 h-3" /> Completed: {m.completedDate}</span>}
                    <span>🔧 {m.mechanic}</span>
                    {m.odometerAtService && <span>📏 {m.odometerAtService.toLocaleString()} km</span>}
                    {m.notes && <span>📝 {m.notes}</span>}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">${m.cost.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mb-3">estimated cost</p>

                  <div className="flex flex-col gap-1.5">
                    {m.status === 'Scheduled' && (
                      <button onClick={() => handleStatusUpdate(m, 'In Progress')} className="btn-outline text-xs px-3 py-1.5 hover:border-blue-400 hover:text-blue-600">
                        Start Work
                      </button>
                    )}
                    {m.status === 'In Progress' && (
                      <button onClick={() => handleStatusUpdate(m, 'Completed')} className="btn-success text-xs px-3 py-1.5">
                        <CheckCircle className="w-3 h-3" /> Close & Restore
                      </button>
                    )}
                    {(m.status === 'Scheduled' || m.status === 'In Progress') && (
                      <button onClick={() => handleStatusUpdate(m, 'Cancelled')} className="btn-outline text-xs px-3 py-1.5 hover:border-red-400 hover:text-red-500">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-content w-full max-w-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-blue-600" /> Create Maintenance Record
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-amber-700 dark:text-amber-300 text-xs font-medium">
                    Creating this record will automatically set the vehicle status to <strong>In Shop</strong> and remove it from dispatch availability.
                  </p>
                </div>
              </div>

              {formError && (
                <div className="mb-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-red-600 dark:text-red-400 text-sm">{formError}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Vehicle *</label>
                  <select value={form.vehicleId} onChange={e => fld('vehicleId', e.target.value)} className="form-select">
                    <option value="">Select Vehicle</option>
                    {availableVehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber}) — {v.status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Maintenance Type</label>
                  <select value={form.type} onChange={e => fld('type', e.target.value)} className="form-select">
                    {MAINTENANCE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Initial Status</label>
                  <select value={form.status} onChange={e => fld('status', e.target.value)} className="form-select">
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Description *</label>
                  <textarea value={form.description} onChange={e => fld('description', e.target.value)} className="form-input resize-none h-20" placeholder="Describe the maintenance work to be done..." />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Scheduled Date</label>
                  <input type="date" value={form.scheduledDate} onChange={e => fld('scheduledDate', e.target.value)} className="form-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Estimated Cost ($)</label>
                  <input type="number" value={form.cost || ''} onChange={e => fld('cost', Number(e.target.value))} className="form-input" min={0} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Mechanic / Shop *</label>
                  <input value={form.mechanic} onChange={e => fld('mechanic', e.target.value)} className="form-input" placeholder="Ram Auto Works" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Odometer at Service (km)</label>
                  <input type="number" value={form.odometerAtService || ''} onChange={e => fld('odometerAtService', Number(e.target.value))} className="form-input" min={0} />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Notes</label>
                  <input value={form.notes || ''} onChange={e => fld('notes', e.target.value)} className="form-input" placeholder="Additional notes..." />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Create Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
