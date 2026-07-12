import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
    Vehicle, Driver, Trip, MaintenanceLog, FuelLog,
    Expense, Alert, User, FleetKPIs
} from './types';

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
}

interface AppActions {
    login: (email: string, password: string) => Promise<boolean>;
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
    showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
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

    const pendingTrips = trips.filter(t => t.status === 'Draft').length;
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

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/fleet-data');
            const data = await res.json();
            setVehicles(data.vehicles || []);
            setDrivers(data.drivers || []);
            setTrips(data.trips || []);
            setMaintenanceLogs(data.maintenanceLogs || []);
            setFuelLogs(data.fuelLogs || []);
            setExpenses(data.expenses || []);
            setAlerts(data.alerts || []);
            setKpis(computeKPIs(
                data.vehicles || [], data.drivers || [], data.trips || [],
                data.fuelLogs || [], data.expenses || [], data.maintenanceLogs || []
            ));
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Check saved session
    useEffect(() => {
        const saved = localStorage.getItem('transitops_user');
        if (saved) setUser(JSON.parse(saved));
        fetchData();
        const interval = setInterval(() => fetchData(), 15000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const login = async (email: string, password: string) => {
        if (password !== 'TransitOps@2026') return false;
        const res = await fetch(`/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            localStorage.setItem('transitops_user', JSON.stringify(data.user));
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('transitops_user');
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

    const addVehicle = async (v: Omit<Vehicle, 'id'>) => {
        await api('/api/vehicles', 'POST', v);
        await fetchData();
        showToast('Vehicle registered successfully!');
    };

    const updateVehicle = async (id: string, data: Partial<Vehicle>) => {
        await api(`/api/vehicles/${id}`, 'PATCH', data);
        await fetchData();
        showToast('Vehicle updated!');
    };

    const deleteVehicle = async (id: string) => {
        await api(`/api/vehicles/${id}`, 'DELETE');
        await fetchData();
        showToast('Vehicle removed.', 'warning');
    };

    const addDriver = async (d: Omit<Driver, 'id'>) => {
        await api('/api/drivers', 'POST', d);
        await fetchData();
        showToast('Driver added successfully!');
    };

    const updateDriver = async (id: string, data: Partial<Driver>) => {
        await api(`/api/drivers/${id}`, 'PATCH', data);
        await fetchData();
        showToast('Driver updated!');
    };

    const deleteDriver = async (id: string) => {
        await api(`/api/drivers/${id}`, 'DELETE');
        await fetchData();
        showToast('Driver removed.', 'warning');
    };

    const createTrip = async (t: Omit<Trip, 'id' | 'createdAt'>) => {
        const res = await api('/api/trips', 'POST', t);
        const data = await res.json();
        if (!res.ok) return { ok: false, error: data.error };
        await fetchData();
        showToast('Trip created & dispatched!');
        return { ok: true };
    };

    const updateTripStatus = async (id: string, status: Trip['status'], extra?: Partial<Trip>) => {
        await api(`/api/trips/${id}/status`, 'PATCH', { status, ...extra });
        await fetchData();
        const msgs: Record<string, string> = {
            Dispatched: 'Trip dispatched!',
            Completed: 'Trip completed! Vehicle & Driver marked Available.',
            Cancelled: 'Trip cancelled. Status restored.',
        };
        showToast(msgs[status] || 'Trip updated.', status === 'Cancelled' ? 'warning' : 'success');
    };

    const addMaintenance = async (m: Omit<MaintenanceLog, 'id' | 'createdAt'>) => {
        await api('/api/maintenance', 'POST', m);
        await fetchData();
        showToast('Maintenance record created. Vehicle set to In Shop.');
    };

    const updateMaintenanceStatus = async (id: string, status: MaintenanceLog['status']) => {
        await api(`/api/maintenance/${id}/status`, 'PATCH', { status });
        await fetchData();
        showToast(status === 'Completed' ? 'Maintenance closed. Vehicle restored to Available.' : 'Maintenance updated.', 'info');
    };

    const addFuelLog = async (f: Omit<FuelLog, 'id'>) => {
        await api('/api/fuel', 'POST', f);
        await fetchData();
        showToast('Fuel log recorded!');
    };

    const addExpense = async (e: Omit<Expense, 'id' | 'createdAt'>) => {
        await api('/api/expenses', 'POST', e);
        await fetchData();
        showToast('Expense recorded!');
    };

    const resolveAlert = async (id: string) => {
        await api(`/api/alerts/${id}/resolve`, 'PATCH');
        await fetchData();
    };

    const value: AppContextType = {
        user, isDark, vehicles, drivers, trips, maintenanceLogs, fuelLogs, expenses, alerts, isLoading, kpis,
        login, logout, toggleDark: () => setIsDark(d => !d), fetchData,
        addVehicle, updateVehicle, deleteVehicle,
        addDriver, updateDriver, deleteDriver,
        createTrip, updateTripStatus,
        addMaintenance, updateMaintenanceStatus,
        addFuelLog, addExpense,
        resolveAlert, showToast,
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
                                    t.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                            }`} />
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{t.message}</p>
                    </div>
                ))}
            </div>
        </AppContext.Provider>
    );
}
