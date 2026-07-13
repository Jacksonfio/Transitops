import { supabase, isSupabaseConfigured } from './supabase';
import type { Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, Alert } from '../types';

// ── Generic helpers ────────────────────────────────────────────
function mapVehicle(row: any): Vehicle { return row && { id: row.id, registrationNumber: row.registration_number, name: row.name, model: row.model, manufacturer: row.manufacturer, type: row.type, loadCapacity: row.load_capacity, odometer: row.odometer, acquisitionCost: row.acquisition_cost, purchaseDate: row.purchase_date, insuranceExpiry: row.insurance_expiry, status: row.status, fuelType: row.fuel_type, currentDriverId: row.current_driver_id, healthScore: row.health_score, notes: row.notes }; }
function mapDriver(row: any): Driver { return row && { id: row.id, name: row.name, licenseNumber: row.license_number, licenseCategory: row.license_category, licenseExpiry: row.license_expiry, phone: row.phone, emergencyContact: row.emergency_contact, joiningDate: row.joining_date, experienceYears: row.experience_years, bloodGroup: row.blood_group, safetyScore: row.safety_score, status: row.status, currentVehicleId: row.current_vehicle_id, fatigueIndex: row.fatigue_index }; }
function mapTrip(row: any): Trip { return row && { id: row.id, source: row.source, destination: row.destination, vehicleId: row.vehicle_id, driverId: row.driver_id, cargoDescription: row.cargo_description, cargoWeight: row.cargo_weight, plannedDistance: row.planned_distance, estimatedDuration: row.estimated_duration, revenue: row.revenue, status: row.status, priority: row.priority, createdAt: row.created_at, dispatchedAt: row.dispatched_at, completedAt: row.completed_at, cancelledAt: row.cancelled_at, finalOdometer: row.final_odometer, fuelConsumed: row.fuel_consumed, estimatedFuelCost: row.estimated_fuel_cost, estimatedCO2: row.estimated_co2 }; }
function mapMaintenance(row: any): MaintenanceLog { return row && { id: row.id, vehicleId: row.vehicle_id, type: row.type, description: row.description, status: row.status, scheduledDate: row.scheduled_date, completedDate: row.completed_date, cost: row.cost, mechanic: row.mechanic, odometerAtService: row.odometer_at_service, notes: row.notes, createdAt: row.created_at }; }
function mapFuelLog(row: any): FuelLog { return row && { id: row.id, vehicleId: row.vehicle_id, driverId: row.driver_id, tripId: row.trip_id, fuelStation: row.fuel_station, fuelType: row.fuel_type, liters: row.liters, pricePerLiter: row.price_per_liter, totalCost: row.total_cost, odometer: row.odometer, date: row.date, notes: row.notes }; }
function mapExpense(row: any): Expense { return row && { id: row.id, vehicleId: row.vehicle_id, driverId: row.driver_id, tripId: row.trip_id, category: row.category, amount: row.amount, description: row.description, date: row.date, receipt: row.receipt_url, createdAt: row.created_at }; }
function mapAlert(row: any): Alert { return row && { id: row.id, severity: row.severity, title: row.title, message: row.message, category: row.category, vehicleId: row.vehicle_id, driverId: row.driver_id, resolved: row.resolved, createdAt: row.created_at }; }

// ── Vehicles ───────────────────────────────────────────────────
export async function fetchVehicles(): Promise<Vehicle[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false });
  return (data || []).map(mapVehicle);
}

export async function createVehicle(v: Omit<Vehicle, 'id'>): Promise<Vehicle> {
  const { data } = await supabase.from('vehicles').insert({
    registration_number: v.registrationNumber, name: v.name, model: v.model,
    manufacturer: v.manufacturer, type: v.type, load_capacity: v.loadCapacity,
    odometer: v.odometer, acquisition_cost: v.acquisitionCost, purchase_date: v.purchaseDate,
    insurance_expiry: v.insuranceExpiry, status: v.status, fuel_type: v.fuelType,
  }).select().single();
  return mapVehicle(data);
}

export async function updateVehicle(id: string, v: Partial<Vehicle>): Promise<void> {
  const updates: any = {};
  if (v.registrationNumber !== undefined) updates.registration_number = v.registrationNumber;
  if (v.name !== undefined) updates.name = v.name;
  if (v.model !== undefined) updates.model = v.model;
  if (v.manufacturer !== undefined) updates.manufacturer = v.manufacturer;
  if (v.type !== undefined) updates.type = v.type;
  if (v.loadCapacity !== undefined) updates.load_capacity = v.loadCapacity;
  if (v.odometer !== undefined) updates.odometer = v.odometer;
  if (v.acquisitionCost !== undefined) updates.acquisition_cost = v.acquisitionCost;
  if (v.purchaseDate !== undefined) updates.purchase_date = v.purchaseDate;
  if (v.insuranceExpiry !== undefined) updates.insurance_expiry = v.insuranceExpiry;
  if (v.status !== undefined) updates.status = v.status;
  if (v.fuelType !== undefined) updates.fuel_type = v.fuelType;
  if (v.currentDriverId !== undefined) updates.current_driver_id = v.currentDriverId;
  if (v.healthScore !== undefined) updates.health_score = v.healthScore;
  if (v.notes !== undefined) updates.notes = v.notes;
  await supabase.from('vehicles').update(updates).eq('id', id);
}

export async function deleteVehicle(id: string): Promise<void> {
  await supabase.from('vehicles').delete().eq('id', id);
}

// ── Drivers ────────────────────────────────────────────────────
export async function fetchDrivers(): Promise<Driver[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await supabase.from('drivers').select('*').order('created_at', { ascending: false });
  return (data || []).map(mapDriver);
}

export async function createDriver(d: Omit<Driver, 'id'>): Promise<Driver> {
  const { data } = await supabase.from('drivers').insert({
    name: d.name, license_number: d.licenseNumber, license_category: d.licenseCategory,
    license_expiry: d.licenseExpiry, phone: d.phone, emergency_contact: d.emergencyContact,
    joining_date: d.joiningDate, experience_years: d.experienceYears, blood_group: d.bloodGroup,
    safety_score: d.safetyScore, status: d.status,
  }).select().single();
  return mapDriver(data);
}

export async function updateDriver(id: string, d: Partial<Driver>): Promise<void> {
  const updates: any = {};
  if (d.name !== undefined) updates.name = d.name;
  if (d.licenseNumber !== undefined) updates.license_number = d.licenseNumber;
  if (d.licenseCategory !== undefined) updates.license_category = d.licenseCategory;
  if (d.licenseExpiry !== undefined) updates.license_expiry = d.licenseExpiry;
  if (d.phone !== undefined) updates.phone = d.phone;
  if (d.emergencyContact !== undefined) updates.emergency_contact = d.emergencyContact;
  if (d.joiningDate !== undefined) updates.joining_date = d.joiningDate;
  if (d.experienceYears !== undefined) updates.experience_years = d.experienceYears;
  if (d.bloodGroup !== undefined) updates.blood_group = d.bloodGroup;
  if (d.safetyScore !== undefined) updates.safety_score = d.safetyScore;
  if (d.status !== undefined) updates.status = d.status;
  if (d.currentVehicleId !== undefined) updates.current_vehicle_id = d.currentVehicleId;
  if (d.fatigueIndex !== undefined) updates.fatigue_index = d.fatigueIndex;
  await supabase.from('drivers').update(updates).eq('id', id);
}

export async function deleteDriver(id: string): Promise<void> {
  await supabase.from('drivers').delete().eq('id', id);
}

// ── Trips ──────────────────────────────────────────────────────
export async function fetchTrips(): Promise<Trip[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await supabase.from('trips').select('*').order('created_at', { ascending: false });
  return (data || []).map(mapTrip);
}

export async function createTrip(t: Omit<Trip, 'id' | 'createdAt'>): Promise<Trip> {
  // Validate business rules server-side via RPC or handle here
  const { data, error } = await supabase.from('trips').insert({
    source: t.source, destination: t.destination, vehicle_id: t.vehicleId,
    driver_id: t.driverId, cargo_description: t.cargoDescription,
    cargo_weight: t.cargoWeight, planned_distance: t.plannedDistance,
    estimated_duration: t.estimatedDuration, revenue: t.revenue,
    status: t.status, priority: t.priority,
    dispatched_at: t.status === 'Dispatched' ? new Date().toISOString() : null,
  }).select().single();

  if (error) throw error;

  // If dispatched, update vehicle & driver status
  if (t.status === 'Dispatched') {
    await supabase.from('vehicles').update({ status: 'On Trip', current_driver_id: t.driverId }).eq('id', t.vehicleId);
    await supabase.from('drivers').update({ status: 'On Trip', current_vehicle_id: t.vehicleId }).eq('id', t.driverId);
  }

  return mapTrip(data);
}

export async function updateTrip(id: string, data: Partial<Trip>): Promise<void> {
  const updates: any = {};
  if (data.source !== undefined) updates.source = data.source;
  if (data.destination !== undefined) updates.destination = data.destination;
  if (data.status !== undefined) updates.status = data.status;
  if (data.priority !== undefined) updates.priority = data.priority;
  if (data.cargoDescription !== undefined) updates.cargo_description = data.cargoDescription;
  if (data.cargoWeight !== undefined) updates.cargo_weight = data.cargoWeight;
  if (data.plannedDistance !== undefined) updates.planned_distance = data.plannedDistance;
  if (data.estimatedDuration !== undefined) updates.estimated_duration = data.estimatedDuration;
  if (data.revenue !== undefined) updates.revenue = data.revenue;
  await supabase.from('trips').update(updates).eq('id', id);
}

export async function updateTripStatus(id: string, status: Trip['status'], extra?: Partial<Trip>): Promise<void> {
  const updates: any = { status };
  if (status === 'Dispatched') updates.dispatched_at = new Date().toISOString();
  if (status === 'Completed') {
    updates.completed_at = new Date().toISOString();
    if (extra?.finalOdometer !== undefined) updates.final_odometer = extra.finalOdometer;
    if (extra?.fuelConsumed !== undefined) updates.fuel_consumed = extra.fuelConsumed;
  }
  if (status === 'Cancelled') updates.cancelled_at = new Date().toISOString();

  // Fetch trip first to get vehicle/driver IDs
  const { data: trip } = await supabase.from('trips').select('vehicle_id, driver_id').eq('id', id).single();

  await supabase.from('trips').update(updates).eq('id', id);

  if (trip) {
    if (status === 'Dispatched') {
      await supabase.from('vehicles').update({ status: 'On Trip' }).eq('id', trip.vehicle_id);
      await supabase.from('drivers').update({ status: 'On Trip' }).eq('id', trip.driver_id);
    }
    if (status === 'Completed' || status === 'Cancelled') {
      await supabase.from('vehicles').update({ status: 'Available', current_driver_id: null, ...(extra?.finalOdometer ? { odometer: extra.finalOdometer } : {}) }).eq('id', trip.vehicle_id);
      await supabase.from('drivers').update({ status: 'Available', current_vehicle_id: null }).eq('id', trip.driver_id);
    }
  }
}

// ── Maintenance ────────────────────────────────────────────────
export async function fetchMaintenance(): Promise<MaintenanceLog[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await supabase.from('maintenance_logs').select('*').order('created_at', { ascending: false });
  return (data || []).map(mapMaintenance);
}

export async function createMaintenance(m: Omit<MaintenanceLog, 'id' | 'createdAt'>): Promise<void> {
  await supabase.from('maintenance_logs').insert({
    vehicle_id: m.vehicleId, type: m.type, description: m.description,
    status: m.status, scheduled_date: m.scheduledDate, cost: m.cost,
    mechanic: m.mechanic, odometer_at_service: m.odometerAtService, notes: m.notes,
  });
  // Set vehicle to In Shop
  if (m.status === 'Scheduled' || m.status === 'In Progress') {
    await supabase.from('vehicles').update({ status: 'In Shop' }).eq('id', m.vehicleId);
  }
}

export async function updateMaintenanceStatus(id: string, status: MaintenanceLog['status']): Promise<void> {
  const updates: any = { status };
  if (status === 'Completed') updates.completed_date = new Date().toISOString().split('T')[0];
  
  const { data: m } = await supabase.from('maintenance_logs').select('vehicle_id').eq('id', id).single();
  await supabase.from('maintenance_logs').update(updates).eq('id', id);
  
  if (m && status === 'Completed') {
    await supabase.from('vehicles').update({ status: 'Available' }).eq('id', m.vehicle_id).neq('status', 'Retired');
  }
}

// ── Fuel Logs ─────────────────────────────────────────────────
export async function fetchFuelLogs(): Promise<FuelLog[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await supabase.from('fuel_logs').select('*').order('date', { ascending: false });
  return (data || []).map(mapFuelLog);
}

export async function createFuelLog(f: Omit<FuelLog, 'id'>): Promise<void> {
  await supabase.from('fuel_logs').insert({
    vehicle_id: f.vehicleId, driver_id: f.driverId, trip_id: f.tripId,
    fuel_station: f.fuelStation, fuel_type: f.fuelType, liters: f.liters,
    price_per_liter: f.pricePerLiter, total_cost: f.totalCost,
    odometer: f.odometer, date: f.date, notes: f.notes,
  });
  // Update odometer
  await supabase.from('vehicles').update({ odometer: f.odometer }).eq('id', f.vehicleId).lt('odometer', f.odometer);
}

// ── Expenses ───────────────────────────────────────────────────
export async function fetchExpenses(): Promise<Expense[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false });
  return (data || []).map(mapExpense);
}

export async function createExpense(e: Omit<Expense, 'id' | 'createdAt'>): Promise<void> {
  await supabase.from('expenses').insert({
    vehicle_id: e.vehicleId, driver_id: e.driverId, trip_id: e.tripId,
    category: e.category, amount: e.amount, description: e.description,
    date: e.date,
  });
}

// ── Notifications ─────────────────────────────────────────────
export async function fetchNotifications(userId: string): Promise<Alert[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data || []).map(mapAlert);
}

export async function resolveNotification(id: string): Promise<void> {
  await supabase.from('notifications').update({ resolved: true }).eq('id', id);
}

// ── Real-time subscriptions ────────────────────────────────────
export function subscribeToTable(table: string, callback: (payload: any) => void) {
  if (!isSupabaseConfigured()) return { unsubscribe: () => {} };
  return supabase
    .channel(`${table}-changes`)
    .on('postgres_changes', { event: '*', schema: 'public', table: table }, callback)
    .subscribe();
}

// ── Storage ────────────────────────────────────────────────────
export async function uploadFile(bucket: string, path: string, file: File) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return { ...data, publicUrl };
}

export async function deleteFile(bucket: string, path: string) {
  await supabase.storage.from(bucket).remove([path]);
}

export async function listFiles(bucket: string, prefix: string) {
  const { data } = await supabase.storage.from(bucket).list(prefix);
  return data || [];
}
