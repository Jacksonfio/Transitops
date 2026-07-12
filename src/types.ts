// ─────────────────────────────────────────────
//  TransitOps – Shared Type Definitions
// ─────────────────────────────────────────────

// ── Auth / RBAC ──────────────────────────────
export type UserRole =
  | 'admin'
  | 'fleet_manager'
  | 'dispatcher'
  | 'driver'
  | 'safety_officer'
  | 'financial_analyst';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  lastLogin?: string;
}

// ── Vehicle ──────────────────────────────────
export type VehicleStatus = 'Available' | 'On Trip' | 'In Shop' | 'Retired';
export type VehicleType = 'Truck' | 'Van' | 'Bus' | 'Trailer' | 'SUV' | 'Motorcycle';

export interface Vehicle {
  id: string;
  registrationNumber: string;      // unique
  name: string;                    // e.g. "Van-05"
  model: string;
  manufacturer: string;
  type: VehicleType;
  loadCapacity: number;            // kg
  odometer: number;                // km
  acquisitionCost: number;         // USD
  purchaseDate: string;
  insuranceExpiry: string;
  status: VehicleStatus;
  fuelType: 'Diesel' | 'Petrol' | 'Electric' | 'Hybrid' | 'CNG';
  currentDriverId?: string | null;
  gpsDeviceId?: string;
  notes?: string;
  // AI / computed
  healthScore?: number;            // 0-100
}

// ── Driver ───────────────────────────────────
export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;           // unique
  licenseCategory: string;         // CDL A, B, C etc.
  licenseExpiry: string;
  phone: string;
  emergencyContact?: string;
  joiningDate: string;
  experienceYears: number;
  bloodGroup?: string;
  safetyScore: number;             // 0-100
  status: DriverStatus;
  currentVehicleId?: string | null;
  // AI
  fatigueIndex?: number;           // 0-100
}

// ── Trip ─────────────────────────────────────
export type TripStatus = 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoDescription: string;
  cargoWeight: number;             // kg
  plannedDistance: number;         // km
  estimatedDuration: number;       // hours
  revenue: number;                 // USD
  status: TripStatus;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  createdAt: string;
  dispatchedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  finalOdometer?: number;
  fuelConsumed?: number;           // liters
  // AI
  estimatedFuelCost?: number;
  estimatedCO2?: number;           // kg
}

// ── Maintenance ──────────────────────────────
export type MaintenanceStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
export type MaintenanceType =
  | 'Oil Change'
  | 'Brake Service'
  | 'Engine Repair'
  | 'Tyre Replacement'
  | 'Battery'
  | 'Transmission'
  | 'Electrical'
  | 'Inspection'
  | 'Body Work'
  | 'Other';

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  description: string;
  status: MaintenanceStatus;
  scheduledDate: string;
  completedDate?: string;
  cost: number;                    // USD
  mechanic: string;
  odometerAtService?: number;
  notes?: string;
  createdAt: string;
}

// ── Fuel Log ─────────────────────────────────
export interface FuelLog {
  id: string;
  vehicleId: string;
  driverId: string;
  tripId?: string;
  fuelStation: string;
  fuelType: string;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  odometer: number;
  date: string;
  notes?: string;
}

// ── Expense ──────────────────────────────────
export type ExpenseCategory =
  | 'Fuel'
  | 'Maintenance'
  | 'Toll'
  | 'Parking'
  | 'Insurance'
  | 'Permit'
  | 'Driver Salary'
  | 'Other';

export interface Expense {
  id: string;
  vehicleId?: string;
  driverId?: string;
  tripId?: string;
  category: ExpenseCategory;
  amount: number;                  // USD
  description: string;
  date: string;
  createdAt: string;
  receipt?: string;               // filename/URL
}

// ── Alert / Notification ─────────────────────
export type AlertSeverity = 'Info' | 'Warning' | 'Critical';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  category: 'License' | 'Insurance' | 'Maintenance' | 'Trip' | 'Vehicle' | 'System';
  vehicleId?: string;
  driverId?: string;
  resolved: boolean;
  createdAt: string;
}

// ── Analytics types ──────────────────────────
export interface VehicleAnalytics {
  vehicleId: string;
  totalTrips: number;
  totalDistance: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalRevenue: number;
  fuelEfficiency: number;          // km/L
  roi: number;                     // %
  utilizationRate: number;         // %
}

export interface FleetKPIs {
  totalVehicles: number;
  availableVehicles: number;
  vehiclesOnTrip: number;
  vehiclesInShop: number;
  retiredVehicles: number;
  totalDrivers: number;
  availableDrivers: number;
  driversOnTrip: number;
  suspendedDrivers: number;
  pendingTrips: number;
  activeTrips: number;
  completedTrips: number;
  fleetUtilization: number;        // %
  totalRevenue: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  operationalCost: number;
  profit: number;
  fleetROI: number;
  fleetReadinessScore: number;    // 0-100
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}
