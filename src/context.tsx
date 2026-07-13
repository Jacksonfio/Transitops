import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
    Vehicle, Driver, Trip, MaintenanceLog, FuelLog,
    Expense, Alert, User, FleetKPIs, Geofence, VehiclePosition, TrackingAlert
} from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import * as supabaseAuth from './lib/auth';
import * as db from './lib/database';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface AppState {
    user: User | null;
    isDark: boolean;
    vehicles: Vehicle[];
    drivers: Driver[];
    trips: Trip[];
    maintenanceLogs: MaintenanceLog[];
    fuelLogs: FuelLog[];
    expenses: Expense[];
    alerts: Alert[];
    isLoading: boolean;
    kpis: FleetKPIs;
    // Tracking
    geofences: Geofence[];
    vehiclePositions: VehiclePosition[];
    trackingAlerts: TrackingAlert[];
}

interface AppActions {
    login: (email: string, password: string, remember?: boolean) => Promise<boolean>;
    register: (name: string, email: string, password: string, role?: string) => Promise<{ ok: boolean, error?: string }>;
    logout: () => void;
    toggleDark: () => void;
    fetchData: () => Promise<void>;
    // Vehicle CRUD
    addVehicle: (v: Omit<Vehicle, 'id'>) => Promise<void>;
    updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<void>;
    deleteVehicle: (id: string) => Promise<void>;
    // Driver CRUD
    addDriver: (d: Omit<Driver, 'id'>) => Promise<void>;
    updateDriver: (id: string, data: Partial<Driver>) => Promise<void>;
    deleteDriver: (id: string) => Promise<void>;
    // Trip
    createTrip: (t: Omit<Trip, 'id' | 'createdAt'>) => Promise<{ ok: boolean; error?: string }>;
    updateTrip: (id: string, data: Partial<Trip>) => Promise<void>;
    updateTripStatus: (id: string, status: Trip['status'], extra?: Partial<Trip>) => Promise<void>;
    // Maintenance
    addMaintenance: (m: Omit<MaintenanceLog, 'id' | 'createdAt'>) => Promise<void>;
    updateMaintenanceStatus: (id: string, status: MaintenanceLog['status']) => Promise<void>;
    // Fuel
    addFuelLog: (f: Omit<FuelLog, 'id'>) => Promise<void>;
    // Expense
    addExpense: (e: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
    // Alerts
    resolveAlert: (id: string) => Promise<void>;
    // Geofencing
    addGeofence: (g: Omit<Geofence, 'id' | 'createdAt'>) => Promise<void>;
    updateGeofence: (id: string, data: Partial<Geofence>) => Promise<void>;
    deleteGeofence: (id: string) => Promise<void>;
    resolveTrackingAlert: (id: string) => Promise<void>;
    showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
    addNotification: (notification: Omit<Alert, 'id' | 'createdAt'>) => Promise<void>;
}

type AppContextType = AppState & AppActions;

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}

function computeKPIs(
    vehicles: Vehicle[], drivers: Driver[], trips: Trip[],
    fuelLogs: FuelLog[], expenses: Expense[], maintenanceLogs: MaintenanceLog[]
): FleetKPIs {
    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
    const vehiclesOnTrip = vehicles.filter(v => v.status === 'On Trip').length;
    const vehiclesInShop = vehicles.filter(v => v.status === 'In Shop').length;
    const retiredVehicles = vehicles.filter(v => v.status === 'Retired').length;

    const totalDrivers = drivers.length;
    const availableDrivers = drivers.filter(d => d.status === 'Available').length;
    const driversOnTrip = drivers.filter(d => d.status === 'On Trip').length;
    const suspendedDrivers = drivers.filter(d => d.status === 'Suspended').length;

    const pendingTrips = trips.filter(t => t.status === 'Draft' || t.status === 'Pending').length;
    const activeTrips = trips.filter(t => t.status === 'Dispatched').length;
    const completedTrips = trips.filter(t => t.status === 'Completed').length;

    const fleetUtilization = totalVehicles > 0
        ? Math.round((vehiclesOnTrip / (totalVehicles - retiredVehicles - vehiclesInShop)) * 100) || 0
        : 0;

    const totalRevenue = trips.filter(t => t.status === 'Completed').reduce((s, t) => s + t.revenue, 0);
    const totalFuelCost = fuelLogs.reduce((s, f) => s + f.totalCost, 0);
    const totalMaintenanceCost = maintenanceLogs.filter(m => m.status === 'Completed').reduce((s, m) => s + m.cost, 0);
    const operationalCost = totalFuelCost + totalMaintenanceCost;
    const profit = totalRevenue - operationalCost;
    const totalAcquisitionCost = vehicles.reduce((s, v) => s + v.acquisitionCost, 0);
    const fleetROI = totalAcquisitionCost > 0 ? Math.round((profit / totalAcquisitionCost) * 100) : 0;

    // Fleet Readiness (0-100)
    const licenseOk = drivers.filter(d => {
        const exp = new Date(d.licenseExpiry);
        return exp > new Date() && d.status !== 'Suspended';
    }).length;
    const driverReadiness = totalDrivers > 0 ? (licenseOk / totalDrivers) * 30 : 0;
    const vehicleReadiness = totalVehicles > 0 ? (availableVehicles / totalVehicles) * 40 : 0;
    const maintenanceOk = vehicles.filter(v => v.status !== 'In Shop').length;
    const maintenanceReadiness = totalVehicles > 0 ? (maintenanceOk / totalVehicles) * 30 : 0;
    const fleetReadinessScore = Math.min(100, Math.round(driverReadiness + vehicleReadiness + maintenanceReadiness));

    return {
        totalVehicles, availableVehicles, vehiclesOnTrip, vehiclesInShop, retiredVehicles,
        totalDrivers, availableDrivers, driversOnTrip, suspendedDrivers,
        pendingTrips, activeTrips, completedTrips, fleetUtilization,
        totalRevenue, totalFuelCost, totalMaintenanceCost, operationalCost, profit, fleetROI,
        fleetReadinessScore,
    };
}

export function AppProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isDark, setIsDark] = useState(() => localStorage.getItem('dark') === 'true');
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
    const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [kpis, setKpis] = useState<FleetKPIs>({} as FleetKPIs);
    const [useDemoData, setUseDemoData] = useState(() => localStorage.getItem('transitops_demo_mode') === 'true');
    // Tracking
    const [geofences, setGeofences] = useState<Geofence[]>([]);
    const [vehiclePositions, setVehiclePositions] = useState<VehiclePosition[]>([]);
    const [trackingAlerts, setTrackingAlerts] = useState<TrackingAlert[]>([]);

    // Toast
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: string }>>([]);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    // Dark mode
    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        localStorage.setItem('dark', String(isDark));
    }, [isDark]);

    const applyFleetData = (
        vehicles: Vehicle[],
        drivers: Driver[],
        trips: Trip[],
        maintenanceLogs: MaintenanceLog[],
        fuelLogs: FuelLog[],
        expenses: Expense[],
        alerts: Alert[] = [],
        geofences: Geofence[] = [],
        vehiclePositions: VehiclePosition[] = [],
        trackingAlerts: TrackingAlert[] = []
    ) => {
        setVehicles(vehicles);
        setDrivers(drivers);
        setTrips(trips);
        setMaintenanceLogs(maintenanceLogs);
        setFuelLogs(fuelLogs);
        setExpenses(expenses);
        setAlerts(alerts);
        setGeofences(geofences);
        setVehiclePositions(vehiclePositions);
        setTrackingAlerts(trackingAlerts);
        setKpis(computeKPIs(vehicles, drivers, trips, fuelLogs, expenses, maintenanceLogs));
    };

    const fetchDemoData = async () => {
        const res = await fetch('/api/fleet-data');
        const data = await res.json();
        applyFleetData(
            data.vehicles || [], data.drivers || [], data.trips || [],
            data.maintenanceLogs || [], data.fuelLogs || [], data.expenses || [],
            data.alerts || [],
            data.geofences || [],
            data.vehiclePositions || [],
            data.trackingAlerts || []
        );
    };

    const enableDemoMode = () => {
        setUseDemoData(true);
        localStorage.setItem('transitops_demo_mode', 'true');
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            if (isSupabaseConfigured() && !useDemoData) {
                const [vehicles, drivers, trips, maintenanceLogs, fuelLogs, expenses] = await Promise.all([
                    db.fetchVehicles(), db.fetchDrivers(), db.fetchTrips(),
                    db.fetchMaintenance(), db.fetchFuelLogs(), db.fetchExpenses(),
                ]);
                const hasSupabaseFleet = vehicles.length > 0 || drivers.length > 0 || trips.length > 0;
                if (hasSupabaseFleet) {
                    applyFleetData(vehicles, drivers, trips, maintenanceLogs, fuelLogs, expenses, []);
                } else {
                    enableDemoMode();
                    await fetchDemoData();
                    showToast('Supabase has no fleet rows, so TransitOps loaded demo data for this development session.', 'info');
                }
            } else {
                await fetchDemoData();
            }
        } catch (e) {
            console.error(e);
            enableDemoMode();
            await fetchDemoData();
            showToast('Could not load Supabase data, so TransitOps switched to demo data.', 'warning');
        } finally {
            setIsLoading(false);
        }
    }, [useDemoData, showToast]);

    const persistUser = (profile: User, remember = true) => {
        setUser(profile);
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem('transitops_user', JSON.stringify(profile));
        if (remember) sessionStorage.removeItem('transitops_user');
        else localStorage.removeItem('transitops_user');
    };

    // Check saved session and recover Supabase auth state.
    useEffect(() => {
        let mounted = true;
        const recover = async () => {
            if (isSupabaseConfigured()) {
                const session = await supabaseAuth.getSession();
                if (session?.user && mounted) {
                    const profile = await supabaseAuth.fetchProfile(session.user.id);
                    if (profile) persistUser(profile, true);
                }
            } else {
                const saved = localStorage.getItem('transitops_user') || sessionStorage.getItem('transitops_user');
                if (saved) setUser(JSON.parse(saved));
            }
        };
        recover();
        fetchData();
        const interval = setInterval(() => fetchData(), 15000);
        const authSub = supabaseAuth.onAuthChange(async session => {
            if (!isSupabaseConfigured() || !mounted) return;
            if (session?.user) {
                const profile = await supabaseAuth.fetchProfile(session.user.id);
                if (profile) persistUser(profile, true);
            } else {
                setUser(null);
                localStorage.removeItem('transitops_user');
                sessionStorage.removeItem('transitops_user');
            }
        });
        return () => {
            mounted = false;
            clearInterval(interval);
            authSub.subscription.unsubscribe();
        };
    }, [fetchData]);

    // Real-time subscriptions (Supabase only)
    useEffect(() => {
        if (!isSupabaseConfigured()) return;
        const tables = ['vehicles', 'drivers', 'trips', 'maintenance_logs', 'fuel_logs', 'expenses', 'notifications'];
        const channels = tables.map(table =>
            supabase
                .channel(`${table}-live`)
                .on('postgres_changes', { event: '*', schema: 'public', table }, (payload: RealtimePostgresChangesPayload<any>) => {
                    if (['vehicles', 'drivers', 'trips', 'maintenance_logs', 'fuel_logs', 'expenses'].includes(table)) {
                        fetchData();
                    } else if (table === 'notifications') {
                        db.fetchNotifications(user?.id || '').then(setAlerts);
                    }
                })
                .subscribe()
        );
        return () => channels.forEach(c => supabase.removeChannel(c));
    }, [user?.id, fetchData]);

    const login = async (email: string, password: string, remember = true) => {
        if (isSupabaseConfigured()) {
            try {
                const result = await supabaseAuth.signInWithEmail(email, password);
                if (result?.user) {
                    const profile = await supabaseAuth.fetchProfile(result.user.id);
                    if (profile) {
                        persistUser(profile, remember);
                        return true;
                    }
                }
            } catch (e: any) {
                console.error('Supabase login error:', e.message);
                enableDemoMode();
            }
        }
        // Fallback to mock
        if (password !== 'TransitOps@2026') return false;
        const res = await fetch(`/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (res.ok) {
            const data = await res.json();
            enableDemoMode();
            persistUser(data.user, remember);
            await fetchDemoData();
            return true;
        }
        return false;
    };

    const register = async (name: string, email: string, password: string, role?: string) => {
        if (isSupabaseConfigured()) {
            try {
                const result = await supabaseAuth.signUp(name, email, password, role);
                if (result?.user) {
                    const profile = await supabaseAuth.fetchProfile(result.user.id);
                    if (profile) {
                        setUser(profile);
                        localStorage.setItem('transitops_user', JSON.stringify(profile));
                        return { ok: true };
                    }
                }
            } catch (e: any) {
                return { ok: false, error: e.message };
            }
        }
        // Fallback to mock
        const res = await fetch(`/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role }),
        });
        if (res.ok) {
            const data = await res.json();
            persistUser(data.user, true);
            return { ok: true };
        }
        const data = await res.json();
        return { ok: false, error: data.error };
    };

    const logout = () => {
        if (isSupabaseConfigured()) supabaseAuth.signOut();
        setUser(null);
        localStorage.removeItem('transitops_user');
        sessionStorage.removeItem('transitops_user');
    };

    // ── API helpers ──────────────────────────────────────────────────────────────
    const api = async (url: string, method = 'POST', body?: unknown) => {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
        });
        return res;
    };

    const withSupabase = <T,>(supabaseFn: () => Promise<T>, mockFn: () => Promise<T>): Promise<T> => {
        return isSupabaseConfigured() && !useDemoData ? supabaseFn() : mockFn();
    };

    const addVehicle = async (v: Omit<Vehicle, 'id'>) => {
        await withSupabase(
            () => db.createVehicle(v).then(() => {}),
            () => api('/api/vehicles', 'POST', v).then(() => {})
        );
        await fetchData();
        showToast('Vehicle registered successfully!');
    };

    const updateVehicle = async (id: string, data: Partial<Vehicle>) => {
        await withSupabase(
            () => db.updateVehicle(id, data),
            () => api(`/api/vehicles/${id}`, 'PATCH', data).then(() => {})
        );
        await fetchData();
        showToast('Vehicle updated!');
    };

    const deleteVehicle = async (id: string) => {
        await withSupabase(
            () => db.deleteVehicle(id),
            () => api(`/api/vehicles/${id}`, 'DELETE').then(() => {})
        );
        await fetchData();
        showToast('Vehicle removed.', 'warning');
    };

    const addDriver = async (d: Omit<Driver, 'id'>) => {
        await withSupabase(
            () => db.createDriver(d).then(() => {}),
            () => api('/api/drivers', 'POST', d).then(() => {})
        );
        await fetchData();
        showToast('Driver added successfully!');
    };

    const updateDriver = async (id: string, data: Partial<Driver>) => {
        await withSupabase(
            () => db.updateDriver(id, data),
            () => api(`/api/drivers/${id}`, 'PATCH', data).then(() => {})
        );
        await fetchData();
        showToast('Driver updated!');
    };

    const deleteDriver = async (id: string) => {
        await withSupabase(
            () => db.deleteDriver(id),
            () => api(`/api/drivers/${id}`, 'DELETE').then(() => {})
        );
        await fetchData();
        showToast('Driver removed.', 'warning');
    };

    const createTrip = async (t: Omit<Trip, 'id' | 'createdAt'>) => {
        try {
            if (isSupabaseConfigured() && !useDemoData) {
                await db.createTrip(t);
                await fetchData();
                showToast('Trip created & dispatched!');
                return { ok: true };
            }
            const res = await api('/api/trips', 'POST', t);
            const data = await res.json();
            if (!res.ok) return { ok: false, error: data.error };
            await fetchData();
            showToast('Trip created & dispatched!');
            return { ok: true };
        } catch (e: any) {
            return { ok: false, error: e.message };
        }
    };

    const updateTrip = async (id: string, data: Partial<Trip>) => {
        await withSupabase(
            () => db.updateTrip(id, data),
            () => api(`/api/trips/${id}`, 'PATCH', data).then(() => {})
        );
        await fetchData();
        showToast('Trip updated successfully!');
    };

    const updateTripStatus = async (id: string, status: Trip['status'], extra?: Partial<Trip>) => {
        await withSupabase(
            () => db.updateTripStatus(id, status, extra),
            () => api(`/api/trips/${id}/status`, 'PATCH', { status, ...extra }).then(() => {})
        );
        await fetchData();
        const msgs: Record<string, string> = {
            Dispatched: 'Trip dispatched!',
            Completed: 'Trip completed! Vehicle & Driver marked Available.',
            Cancelled: 'Trip cancelled. Status restored.',
        };
        showToast(msgs[status] || 'Trip updated.', status === 'Cancelled' ? 'warning' : 'success');
    };

    const addMaintenance = async (m: Omit<MaintenanceLog, 'id' | 'createdAt'>) => {
        await withSupabase(
            () => db.createMaintenance(m),
            () => api('/api/maintenance', 'POST', m).then(() => {})
        );
        await fetchData();
        showToast('Maintenance record created. Vehicle set to In Shop.');
    };

    const updateMaintenanceStatus = async (id: string, status: MaintenanceLog['status']) => {
        await withSupabase(
            () => db.updateMaintenanceStatus(id, status),
            () => api(`/api/maintenance/${id}/status`, 'PATCH', { status }).then(() => {})
        );
        await fetchData();
        showToast(status === 'Completed' ? 'Maintenance closed. Vehicle restored to Available.' : 'Maintenance updated.', 'info');
    };

    const addFuelLog = async (f: Omit<FuelLog, 'id'>) => {
        await withSupabase(
            () => db.createFuelLog(f),
            () => api('/api/fuel', 'POST', f).then(() => {})
        );
        await fetchData();
        showToast('Fuel log recorded!');
    };

    const addExpense = async (e: Omit<Expense, 'id' | 'createdAt'>) => {
        await withSupabase(
            () => db.createExpense(e),
            () => api('/api/expenses', 'POST', e).then(() => {})
        );
        await fetchData();
        showToast('Expense recorded!');
    };

    const resolveAlert = async (id: string) => {
        if (isSupabaseConfigured()) {
            await db.resolveNotification(id);
        } else {
            await api(`/api/alerts/${id}/resolve`, 'PATCH');
        }
        await fetchData();
    };

    const addNotification = async (notification: Omit<Alert, 'id' | 'createdAt'>) => {
        await withSupabase(
            () => api('/api/alerts', 'POST', notification).then(() => {}),
            () => api('/api/alerts', 'POST', notification).then(() => {})
        );
        await fetchData();
    };

    const addGeofence = async (g: Omit<Geofence, 'id' | 'createdAt'>) => {
        await withSupabase(
            () => api('/api/geofences', 'POST', g).then(() => {}),
            () => api('/api/geofences', 'POST', g).then(() => {})
        );
        await fetchData();
        showToast('Geofence created successfully!');
    };

    const updateGeofence = async (id: string, data: Partial<Geofence>) => {
        await withSupabase(
            () => api(`/api/geofences/${id}`, 'PATCH', data).then(() => {}),
            () => api(`/api/geofences/${id}`, 'PATCH', data).then(() => {})
        );
        await fetchData();
        showToast('Geofence updated!');
    };

    const deleteGeofence = async (id: string) => {
        await withSupabase(
            () => api(`/api/geofences/${id}`, 'DELETE').then(() => {}),
            () => api(`/api/geofences/${id}`, 'DELETE').then(() => {})
        );
        await fetchData();
        showToast('Geofence removed.', 'warning');
    };

    const resolveTrackingAlert = async (id: string) => {
        await api(`/api/tracking-alerts/${id}/resolve`, 'PATCH');
        await fetchData();
        showToast('Tracking alert resolved.');
    };

    const value: AppContextType = {
        user, isDark, vehicles, drivers, trips, maintenanceLogs, fuelLogs, expenses, alerts, isLoading, kpis,
        geofences, vehiclePositions, trackingAlerts,
        login, register, logout, toggleDark: () => setIsDark(d => !d), fetchData,
        addVehicle, updateVehicle, deleteVehicle,
        addDriver, updateDriver, deleteDriver,
        createTrip, updateTrip, updateTripStatus,
        addMaintenance, updateMaintenanceStatus,
        addFuelLog, addExpense,
        resolveAlert, addNotification,
        addGeofence, updateGeofence, deleteGeofence, resolveTrackingAlert,
        showToast,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type} pointer-events-auto`}>
                        <div className={`flex-shrink-0 w-4 h-4 rounded-full mt-0.5 ${t.type === 'success' ? 'bg-green-500' :
                            t.type === 'error' ? 'bg-red-500' :
                                t.type === 'warning' ? 'bg-amber-500' : 'bg-[#D4AF37]'
                            }`} />
                        <p className="text-sm font-medium text-[#0B1311] dark:text-[#F5F5F7]">{t.message}</p>
                    </div>
                ))}
            </div>
        </AppContext.Provider>
    );
}
