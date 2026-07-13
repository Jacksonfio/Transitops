import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, Filter, Truck, Edit2, Trash2, X, Check,
  ChevronDown, Loader2, AlertTriangle, Zap, Route, Fuel, DollarSign
} from 'lucide-react';
import { useApp } from '../context';
import { Vehicle, VehicleStatus, VehicleType } from '../types';
import { TableSkeleton } from './SkeletonLoader';

const VEHICLE_TYPES: VehicleType[] = ['Truck', 'Van', 'Bus', 'Trailer', 'SUV', 'Motorcycle'];
const FUEL_TYPES = ['Diesel', 'Petrol', 'Electric', 'Hybrid', 'CNG'] as const;
const STATUS_OPTIONS: VehicleStatus[] = ['Available', 'In Shop', 'Retired'];

function StatusBadge({ status }: { status: VehicleStatus }) {
  const map: Record<VehicleStatus, string> = {
    'Available': 'badge badge-available',
    'On Trip': 'badge badge-on-trip',
    'In Shop': 'badge badge-in-shop',
    'Retired': 'badge badge-retired',
  };
  return <span className={map[status]}>{status}</span>;
}

function HealthBadge({ score }: { score?: number }) {
  const s = score || 0;
  const color = s >= 80 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' :
    s >= 60 ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' :
      'text-red-500 bg-red-50 dark:bg-red-900/20';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      <Zap className="w-3 h-3" /> {s}
    </span>
  );
}

const EMPTY_VEHICLE: Omit<Vehicle, 'id'> = {
  registrationNumber: '', name: '', model: '', manufacturer: '',
  type: 'Truck', loadCapacity: 1000, odometer: 0, acquisitionCost: 0,
  purchaseDate: new Date().toISOString().split('T')[0],
  insuranceExpiry: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
  status: 'Available', fuelType: 'Diesel', healthScore: 90,
};

export default function VehicleDirectory() {
  const { vehicles, drivers, addVehicle, updateVehicle, deleteVehicle, isLoading } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<Omit<Vehicle, 'id'>>(EMPTY_VEHICLE);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase();
    const matchQ = !q || v.name.toLowerCase().includes(q) || v.registrationNumber.toLowerCase().includes(q) || v.manufacturer.toLowerCase().includes(q) || v.model.toLowerCase().includes(q);
    const matchType = !filterType || v.type === filterType;
    const matchStatus = !filterStatus || v.status === filterStatus;
    return matchQ && matchType && matchStatus;
  });

  const openAdd = () => {
    setEditVehicle(null);
    setForm(EMPTY_VEHICLE);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditVehicle(v);
    setForm({ ...v });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.registrationNumber.trim()) { setFormError('Registration Number is required.'); return; }
    if (!form.name.trim()) { setFormError('Vehicle Name is required.'); return; }
    if (!form.model.trim()) { setFormError('Model is required.'); return; }
    if (form.loadCapacity <= 0) { setFormError('Load Capacity must be > 0.'); return; }

    setSaving(true);
    setFormError('');
    try {
      if (editVehicle) {
        await updateVehicle(editVehicle.id, form);
      } else {
        await addVehicle(form);
      }
      setShowModal(false);
    } catch (e: any) {
      setFormError(e.message || 'An error occurred');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await deleteVehicle(id);
    setConfirmDelete(null);
  };

  const fld = (key: keyof typeof form, val: any) => setForm(p => ({ ...p, [key]: val }));

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
          <TableSkeleton rows={6} cols={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Vehicle Registry</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{vehicles.length} vehicles · {vehicles.filter(v => v.status === 'Available').length} available</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Register Vehicle
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vehicles..." className="form-input pl-9" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="form-select w-40">
          <option value="">All Types</option>
          {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-select w-44">
          <option value="">All Statuses</option>
          {(['Available', 'On Trip', 'In Shop', 'Retired'] as VehicleStatus[]).map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1C2526] rounded-2xl shadow-sm border border-[#E2EAE7] dark:border-[#2D3A32] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Registration</th>
                <th>Type</th>
                <th>Load Cap.</th>
                <th>Odometer</th>
                <th>Health</th>
                <th>Status</th>
                <th>Driver</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-slate-400">No vehicles found.</td></tr>
              )}
              {filtered.map(v => {
                const driver = v.currentDriverId ? drivers.find(d => d.id === v.currentDriverId) : null;
                return (
                  <React.Fragment key={v.id}>
                    <tr
                      className="cursor-pointer"
                      onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${v.status === 'Available' ? 'bg-emerald-500 text-white' :
                              v.status === 'On Trip' ? 'bg-[#0F766E] text-[#111827]' :
                                v.status === 'In Shop' ? 'bg-amber-500 text-white' : 'bg-slate-400 text-white'
                            }`}>
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">{v.name}</p>
                            <p className="text-xs text-slate-500">{v.manufacturer} {v.model}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300">{v.registrationNumber}</span></td>
                      <td><span className="badge bg-slate-100 dark:bg-[#2D3A32] text-slate-600 dark:text-slate-300">{v.type}</span></td>
                      <td className="font-medium">{v.loadCapacity.toLocaleString()} kg</td>
                      <td className="font-mono text-xs">{v.odometer.toLocaleString()} km</td>
                      <td><HealthBadge score={v.healthScore} /></td>
                      <td><StatusBadge status={v.status} /></td>
                      <td className="text-sm text-slate-600 dark:text-slate-400">{driver?.name || <span className="text-slate-300">—</span>}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button onClick={e => { e.stopPropagation(); openEdit(v); }} className="p-1.5 rounded-lg hover:bg-[#0F766E]/10 dark:hover:bg-[#0F766E]/10 text-slate-400 hover:text-[#0F766E] transition">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); setConfirmDelete(v.id); }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition" disabled={v.status === 'On Trip'}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {expandedId === v.id && (
                      <tr>
                        <td colSpan={9} className="bg-[#F8FAF8] dark:bg-[#2D3A32]/50 px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Acquisition Cost</p>
                              <p className="font-bold text-slate-900 dark:text-white">${v.acquisitionCost.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Fuel Type</p>
                              <p className="font-bold text-slate-900 dark:text-white">{v.fuelType}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Insurance Expiry</p>
                              <p className={`font-bold ${new Date(v.insuranceExpiry) < new Date() ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{v.insuranceExpiry}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Purchase Date</p>
                              <p className="font-bold text-slate-900 dark:text-white">{v.purchaseDate}</p>
                            </div>
                            {v.notes && (
                              <div className="col-span-4">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Notes</p>
                                <p className="text-slate-600 dark:text-slate-300">{v.notes}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
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
                  <Truck className="w-5 h-5 text-[#0F766E]" />
                  {editVehicle ? 'Edit Vehicle' : 'Register New Vehicle'}
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
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Registration Number *</label>
                  <input value={form.registrationNumber} onChange={e => fld('registrationNumber', e.target.value)} className="form-input font-mono" placeholder="TN-01-AB-1234" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Vehicle Name *</label>
                  <input value={form.name} onChange={e => fld('name', e.target.value)} className="form-input" placeholder="Thunder-01" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Manufacturer *</label>
                  <input value={form.manufacturer} onChange={e => fld('manufacturer', e.target.value)} className="form-input" placeholder="Mercedes-Benz" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Model *</label>
                  <input value={form.model} onChange={e => fld('model', e.target.value)} className="form-input" placeholder="Actros 1845" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Vehicle Type</label>
                  <select value={form.type} onChange={e => fld('type', e.target.value)} className="form-select">
                    {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Fuel Type</label>
                  <select value={form.fuelType} onChange={e => fld('fuelType', e.target.value)} className="form-select">
                    {FUEL_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Load Capacity (kg) *</label>
                  <input type="number" value={form.loadCapacity} onChange={e => fld('loadCapacity', Number(e.target.value))} className="form-input" min={1} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Current Odometer (km)</label>
                  <input type="number" value={form.odometer} onChange={e => fld('odometer', Number(e.target.value))} className="form-input" min={0} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Acquisition Cost ($)</label>
                  <input type="number" value={form.acquisitionCost} onChange={e => fld('acquisitionCost', Number(e.target.value))} className="form-input" min={0} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Status</label>
                  <select value={form.status} onChange={e => fld('status', e.target.value)} className="form-select">
                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Purchase Date</label>
                  <input type="date" value={form.purchaseDate} onChange={e => fld('purchaseDate', e.target.value)} className="form-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Insurance Expiry</label>
                  <input type="date" value={form.insuranceExpiry} onChange={e => fld('insuranceExpiry', e.target.value)} className="form-input" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Notes</label>
                  <textarea value={form.notes || ''} onChange={e => fld('notes', e.target.value)} className="form-input resize-none h-20" placeholder="Optional notes..." />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#E2EAE7] dark:border-[#2D3A32]">
                <button onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editVehicle ? 'Save Changes' : 'Register Vehicle'}
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
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Delete Vehicle?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">This will permanently remove the vehicle record.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="btn-outline flex-1">Cancel</button>
                <button onClick={() => handleDelete(confirmDelete)} className="btn-danger flex-1">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
