import {
  Vehicle, Driver, Trip, MaintenanceLog,
  FuelLog, Expense, Alert, User, Geofence, VehiclePosition, TrackingAlert
} from './types';

// ── Users ────────────────────────────────────────────────────────────────────
export const initialUsers: User[] = [
  { id: 'U-01', name: 'Admin User', email: 'admin@transitops.com', role: 'admin', avatar: '' },
  { id: 'U-02', name: 'Fleet Manager', email: 'manager@transitops.com', role: 'fleet_manager', avatar: '' },
  { id: 'U-03', name: 'John Dispatcher', email: 'dispatch@transitops.com', role: 'dispatcher', avatar: '' },
  { id: 'U-04', name: 'Safety Officer', email: 'safety@transitops.com', role: 'safety_officer', avatar: '' },
  { id: 'U-05', name: 'Finance Analyst', email: 'finance@transitops.com', role: 'financial_analyst', avatar: '' },
];

// password for all demo users: "TransitOps@2026"

// ── Vehicles ─────────────────────────────────────────────────────────────────
export const initialVehicles: Vehicle[] = [
  {
    id: 'VH-001', registrationNumber: 'TN-01-AB-1234', name: 'Thunder-01',
    model: 'Actros 1845', manufacturer: 'Mercedes-Benz', type: 'Truck',
    loadCapacity: 25000, odometer: 120000, acquisitionCost: 85000,
    purchaseDate: '2021-03-15', insuranceExpiry: '2026-12-31',
    status: 'Available', fuelType: 'Diesel', healthScore: 87,
  },
  {
    id: 'VH-002', registrationNumber: 'TN-02-CD-5678', name: 'Swift-02',
    model: 'Sprinter 316', manufacturer: 'Mercedes-Benz', type: 'Van',
    loadCapacity: 1500, odometer: 84000, acquisitionCost: 42000,
    purchaseDate: '2022-06-10', insuranceExpiry: '2026-09-30',
    status: 'On Trip', fuelType: 'Diesel', currentDriverId: 'DR-002', healthScore: 72,
  },
  {
    id: 'VH-003', registrationNumber: 'TN-03-EF-9012', name: 'Titan-03',
    model: 'T680', manufacturer: 'Kenworth', type: 'Truck',
    loadCapacity: 30000, odometer: 210000, acquisitionCost: 95000,
    purchaseDate: '2019-08-22', insuranceExpiry: '2026-08-22',
    status: 'In Shop', fuelType: 'Diesel', healthScore: 45,
  },
  {
    id: 'VH-004', registrationNumber: 'TN-04-GH-3456', name: 'Eagle-04',
    model: 'Transit Custom', manufacturer: 'Ford', type: 'Van',
    loadCapacity: 1000, odometer: 56000, acquisitionCost: 38000,
    purchaseDate: '2023-01-20', insuranceExpiry: '2027-01-20',
    status: 'Available', fuelType: 'Diesel', healthScore: 92,
  },
  {
    id: 'VH-005', registrationNumber: 'MH-05-IJ-7890', name: 'Falcon-05',
    model: 'BS-6 Sleeper', manufacturer: 'Tata Motors', type: 'Truck',
    loadCapacity: 20000, odometer: 178000, acquisitionCost: 72000,
    purchaseDate: '2020-11-05', insuranceExpiry: '2025-11-05',
    status: 'Retired', fuelType: 'Diesel', healthScore: 22,
  },
  {
    id: 'VH-006', registrationNumber: 'DL-06-KL-2345', name: 'Maverick-06',
    model: 'Cascadia', manufacturer: 'Freightliner', type: 'Truck',
    loadCapacity: 28000, odometer: 65000, acquisitionCost: 110000,
    purchaseDate: '2024-02-18', insuranceExpiry: '2028-02-18',
    status: 'Available', fuelType: 'Diesel', healthScore: 96,
  },
  {
    id: 'VH-007', registrationNumber: 'KA-07-MN-6789', name: 'Prowler-07',
    model: 'E-Transit', manufacturer: 'Ford', type: 'Van',
    loadCapacity: 800, odometer: 22000, acquisitionCost: 55000,
    purchaseDate: '2024-07-01', insuranceExpiry: '2028-07-01',
    status: 'On Trip', fuelType: 'Electric', currentDriverId: 'DR-005', healthScore: 98,
  },
  {
    id: 'VH-008', registrationNumber: 'GJ-08-OP-0123', name: 'Atlas-08',
    model: 'Volvo FH16', manufacturer: 'Volvo', type: 'Truck',
    loadCapacity: 32000, odometer: 145000, acquisitionCost: 130000,
    purchaseDate: '2021-09-10', insuranceExpiry: '2026-11-30',
    status: 'Available', fuelType: 'Diesel', healthScore: 78,
  },
];

// ── Drivers ──────────────────────────────────────────────────────────────────
export const initialDrivers: Driver[] = [
  {
    id: 'DR-001', name: 'Ravi Kumar', licenseNumber: 'TN1234567890',
    licenseCategory: 'CDL-A', licenseExpiry: '2027-06-30',
    phone: '+91-9876543210', emergencyContact: '+91-9012345678',
    joiningDate: '2019-04-10', experienceYears: 8, bloodGroup: 'O+',
    safetyScore: 94, status: 'Available', fatigueIndex: 15,
  },
  {
    id: 'DR-002', name: 'Priya Sharma', licenseNumber: 'MH9876543210',
    licenseCategory: 'CDL-B', licenseExpiry: '2026-12-15',
    phone: '+91-9345678901', emergencyContact: '+91-9123456789',
    joiningDate: '2021-08-22', experienceYears: 5, bloodGroup: 'A+',
    safetyScore: 88, status: 'On Trip', currentVehicleId: 'VH-002', fatigueIndex: 42,
  },
  {
    id: 'DR-003', name: 'Arun Singh', licenseNumber: 'DL3456789012',
    licenseCategory: 'CDL-A', licenseExpiry: '2024-03-10', // EXPIRED
    phone: '+91-9567890123', emergencyContact: '+91-9234567890',
    joiningDate: '2018-11-14', experienceYears: 10, bloodGroup: 'B+',
    safetyScore: 76, status: 'Suspended', fatigueIndex: 78,
  },
  {
    id: 'DR-004', name: 'Meena Patel', licenseNumber: 'GJ5678901234',
    licenseCategory: 'CDL-A', licenseExpiry: '2027-09-20',
    phone: '+91-9789012345', emergencyContact: '+91-9345678901',
    joiningDate: '2022-03-01', experienceYears: 4, bloodGroup: 'AB-',
    safetyScore: 91, status: 'Off Duty', fatigueIndex: 20,
  },
  {
    id: 'DR-005', name: 'Sanjay Reddy', licenseNumber: 'KA7890123456',
    licenseCategory: 'CDL-B', licenseExpiry: '2026-07-25', // Expiring soon
    phone: '+91-9901234567', emergencyContact: '+91-9456789012',
    joiningDate: '2020-07-15', experienceYears: 6, bloodGroup: 'O-',
    safetyScore: 82, status: 'On Trip', currentVehicleId: 'VH-007', fatigueIndex: 60,
  },
  {
    id: 'DR-006', name: 'Deepa Nair', licenseNumber: 'KL0123456789',
    licenseCategory: 'CDL-C', licenseExpiry: '2028-02-14',
    phone: '+91-9012345679', emergencyContact: '+91-9567890123',
    joiningDate: '2023-10-05', experienceYears: 2, bloodGroup: 'A-',
    safetyScore: 97, status: 'Available', fatigueIndex: 5,
  },
];

// ── Trips ─────────────────────────────────────────────────────────────────────
export const initialTrips: Trip[] = [
  {
    id: 'TR-1001', source: 'Chennai Port', destination: 'Bangalore Warehouse',
    vehicleId: 'VH-002', driverId: 'DR-002',
    cargoDescription: 'Electronic Components', cargoWeight: 1200,
    plannedDistance: 346, estimatedDuration: 6, revenue: 4500,
    status: 'Dispatched', priority: 'High',
    createdAt: '2026-07-10T08:00:00Z', dispatchedAt: '2026-07-10T09:30:00Z',
    estimatedFuelCost: 380, estimatedCO2: 95,
  },
  {
    id: 'TR-1002', source: 'Mumbai Depot', destination: 'Pune Factory',
    vehicleId: 'VH-007', driverId: 'DR-005',
    cargoDescription: 'Automotive Parts', cargoWeight: 650,
    plannedDistance: 148, estimatedDuration: 3, revenue: 2200,
    status: 'Dispatched', priority: 'Medium',
    createdAt: '2026-07-11T07:00:00Z', dispatchedAt: '2026-07-11T08:00:00Z',
    estimatedFuelCost: 140, estimatedCO2: 28,
  },
  {
    id: 'TR-1003', source: 'Delhi Hub', destination: 'Jaipur Distribution',
    vehicleId: 'VH-001', driverId: 'DR-001',
    cargoDescription: 'FMCG Goods', cargoWeight: 18000,
    plannedDistance: 280, estimatedDuration: 5, revenue: 7800,
    status: 'Completed', priority: 'High',
    createdAt: '2026-07-08T06:00:00Z', dispatchedAt: '2026-07-08T07:00:00Z',
    completedAt: '2026-07-08T14:00:00Z',
    finalOdometer: 120280, fuelConsumed: 85, estimatedCO2: 224,
  },
  {
    id: 'TR-1004', source: 'Hyderabad Hub', destination: 'Vijayawada Port',
    vehicleId: 'VH-006', driverId: 'DR-004',
    cargoDescription: 'Steel Coils', cargoWeight: 25000,
    plannedDistance: 270, estimatedDuration: 5, revenue: 8200,
    status: 'Completed', priority: 'Urgent',
    createdAt: '2026-07-05T05:00:00Z', dispatchedAt: '2026-07-05T06:00:00Z',
    completedAt: '2026-07-05T12:30:00Z',
    finalOdometer: 65270, fuelConsumed: 102, estimatedCO2: 269,
  },
  {
    id: 'TR-1005', source: 'Ahmedabad Plant', destination: 'Surat Terminal',
    vehicleId: 'VH-004', driverId: 'DR-006',
    cargoDescription: 'Textile Goods', cargoWeight: 850,
    plannedDistance: 265, estimatedDuration: 4.5, revenue: 3100,
    status: 'Draft', priority: 'Low',
    createdAt: '2026-07-12T10:00:00Z',
    estimatedFuelCost: 280, estimatedCO2: 70,
  },
  {
    id: 'TR-1006', source: 'Kolkata Dock', destination: 'Bhubaneswar Hub',
    vehicleId: 'VH-008', driverId: 'DR-001',
    cargoDescription: 'Heavy Machinery Parts', cargoWeight: 28000,
    plannedDistance: 440, estimatedDuration: 8, revenue: 12500,
    status: 'Cancelled', priority: 'High',
    createdAt: '2026-07-09T08:00:00Z',
    cancelledAt: '2026-07-09T10:00:00Z',
  },
];

// ── Maintenance Logs ─────────────────────────────────────────────────────────
export const initialMaintenanceLogs: MaintenanceLog[] = [
  {
    id: 'MN-001', vehicleId: 'VH-003',
    type: 'Engine Repair', description: 'Engine overhaul due to oil leakage and coolant loss',
    status: 'In Progress', scheduledDate: '2026-07-08', cost: 4500,
    mechanic: 'Ram Auto Works', odometerAtService: 210000,
    notes: 'Waiting for parts delivery. ETA 3 days.', createdAt: '2026-07-07T09:00:00Z',
  },
  {
    id: 'MN-002', vehicleId: 'VH-001',
    type: 'Oil Change', description: 'Routine 10,000 km oil and filter change',
    status: 'Completed', scheduledDate: '2026-06-15', completedDate: '2026-06-15', cost: 250,
    mechanic: 'Fleet Center Bay 2', odometerAtService: 115000,
    createdAt: '2026-06-14T10:00:00Z',
  },
  {
    id: 'MN-003', vehicleId: 'VH-005',
    type: 'Inspection', description: 'Annual roadworthiness inspection',
    status: 'Completed', scheduledDate: '2026-05-20', completedDate: '2026-05-22', cost: 800,
    mechanic: 'State Transport Authority', odometerAtService: 176000,
    createdAt: '2026-05-19T08:00:00Z',
  },
  {
    id: 'MN-004', vehicleId: 'VH-008',
    type: 'Tyre Replacement', description: 'Replace all 6 tyres (steer + drive axles)',
    status: 'Scheduled', scheduledDate: '2026-07-20', cost: 3200,
    mechanic: 'Volvo Service Centre', odometerAtService: 145000,
    createdAt: '2026-07-12T09:00:00Z',
  },
  {
    id: 'MN-005', vehicleId: 'VH-002',
    type: 'Brake Service', description: 'Brake pad replacement and caliber check',
    status: 'Scheduled', scheduledDate: '2026-07-25', cost: 650,
    mechanic: 'Fleet Center Bay 1',
    createdAt: '2026-07-12T10:00:00Z',
  },
];

// ── Fuel Logs ─────────────────────────────────────────────────────────────────
export const initialFuelLogs: FuelLog[] = [
  {
    id: 'FL-001', vehicleId: 'VH-001', driverId: 'DR-001', tripId: 'TR-1003',
    fuelStation: 'HP Petrol Pump, Delhi', fuelType: 'Diesel',
    liters: 85, pricePerLiter: 95.4, totalCost: 8109, odometer: 120000,
    date: '2026-07-08',
  },
  {
    id: 'FL-002', vehicleId: 'VH-002', driverId: 'DR-002', tripId: 'TR-1001',
    fuelStation: 'Indian Oil, Chennai', fuelType: 'Diesel',
    liters: 45, pricePerLiter: 94.8, totalCost: 4266, odometer: 84000,
    date: '2026-07-10',
  },
  {
    id: 'FL-003', vehicleId: 'VH-006', driverId: 'DR-004', tripId: 'TR-1004',
    fuelStation: 'BPCL, Hyderabad', fuelType: 'Diesel',
    liters: 102, pricePerLiter: 94.2, totalCost: 9608.4, odometer: 64900,
    date: '2026-07-05',
  },
  {
    id: 'FL-004', vehicleId: 'VH-001', driverId: 'DR-001',
    fuelStation: 'IOCL Highway Pump', fuelType: 'Diesel',
    liters: 60, pricePerLiter: 95.1, totalCost: 5706, odometer: 119500,
    date: '2026-07-01',
  },
  {
    id: 'FL-005', vehicleId: 'VH-007', driverId: 'DR-005', tripId: 'TR-1002',
    fuelStation: 'EV Charging Station, Mumbai', fuelType: 'Electric',
    liters: 80, pricePerLiter: 8.5, totalCost: 680, odometer: 22000,
    date: '2026-07-11', notes: 'kWh units used: 80',
  },
];

// ── Expenses ──────────────────────────────────────────────────────────────────
export const initialExpenses: Expense[] = [
  {
    id: 'EX-001', vehicleId: 'VH-001', driverId: 'DR-001', tripId: 'TR-1003',
    category: 'Toll', amount: 1250, description: 'NH44 Delhi-Agra Tolls',
    date: '2026-07-08', createdAt: '2026-07-08T14:00:00Z',
  },
  {
    id: 'EX-002', vehicleId: 'VH-003',
    category: 'Maintenance', amount: 4500, description: 'Engine Repair - MN-001',
    date: '2026-07-08', createdAt: '2026-07-08T09:00:00Z',
  },
  {
    id: 'EX-003', vehicleId: 'VH-006', tripId: 'TR-1004',
    category: 'Toll', amount: 980, description: 'NH65 Hyderabad-Vijayawada Tolls',
    date: '2026-07-05', createdAt: '2026-07-05T12:00:00Z',
  },
  {
    id: 'EX-004', driverId: 'DR-001',
    category: 'Driver Salary', amount: 35000, description: 'July 2026 Salary - Ravi Kumar',
    date: '2026-07-01', createdAt: '2026-07-01T10:00:00Z',
  },
  {
    id: 'EX-005', vehicleId: 'VH-002',
    category: 'Insurance', amount: 8500, description: 'Quarterly insurance premium VH-002',
    date: '2026-07-01', createdAt: '2026-07-01T11:00:00Z',
  },
  {
    id: 'EX-006', vehicleId: 'VH-001', tripId: 'TR-1003',
    category: 'Parking', amount: 300, description: 'Overnight parking at Agra depot',
    date: '2026-07-08', createdAt: '2026-07-08T20:00:00Z',
  },
];

// ── Geofences ─────────────────────────────────────────────────────────────────
export const initialGeofences: Geofence[] = [
  {
    id: 'GF-001', name: 'Mumbai Depot Zone',
    description: 'Main depot area in Mumbai - 5km radius',
    type: 'circular', center: { lat: 19.0760, lng: 72.8777 }, radius: 5000,
    color: '#0F766E', active: true, alertOnEnter: true, alertOnExit: true,
    createdAt: '2026-07-01T00:00:00Z',
  },
  {
    id: 'GF-002', name: 'Chennai Port Area',
    description: 'Chennai Port restricted zone',
    type: 'circular', center: { lat: 13.0827, lng: 80.2707 }, radius: 3000,
    color: '#EF4444', active: true, alertOnEnter: true, alertOnExit: false,
    createdAt: '2026-07-05T00:00:00Z',
  },
  {
    id: 'GF-003', name: 'Delhi Hub Perimeter',
    description: 'Delhi distribution hub - 8km radius',
    type: 'circular', center: { lat: 28.6139, lng: 77.2090 }, radius: 8000,
    color: '#F59E0B', active: true, alertOnEnter: false, alertOnExit: true,
    createdAt: '2026-07-10T00:00:00Z',
  },
];

// ── Vehicle Positions ─────────────────────────────────────────────────────────
export const initialVehiclePositions: VehiclePosition[] = [
  { vehicleId: 'VH-001', latitude: 28.6139, longitude: 77.2090, speed: 65, heading: 45, timestamp: '2026-07-12T10:30:00Z', status: 'On Trip' },
  { vehicleId: 'VH-002', latitude: 13.0827, longitude: 80.2707, speed: 55, heading: 90, timestamp: '2026-07-12T10:28:00Z', status: 'On Trip' },
  { vehicleId: 'VH-004', latitude: 19.0760, longitude: 72.8777, speed: 0, heading: 180, timestamp: '2026-07-12T10:25:00Z', status: 'Available' },
  { vehicleId: 'VH-006', latitude: 17.3850, longitude: 78.4867, speed: 70, heading: 270, timestamp: '2026-07-12T10:29:00Z', status: 'On Trip' },
  { vehicleId: 'VH-007', latitude: 19.0760, longitude: 72.8777, speed: 0, heading: 0, timestamp: '2026-07-12T10:20:00Z', status: 'Available' },
  { vehicleId: 'VH-008', latitude: 22.5726, longitude: 88.3639, speed: 60, heading: 135, timestamp: '2026-07-12T10:27:00Z', status: 'On Trip' },
];

// ── Tracking Alerts ───────────────────────────────────────────────────────────
export const initialTrackingAlerts: TrackingAlert[] = [
  {
    id: 'TA-001', type: 'geofence_enter', vehicleId: 'VH-001',
    message: 'Thunder-01 entered Mumbai Depot Zone',
    severity: 'Info', location: { lat: 19.0760, lng: 72.8777 },
    timestamp: '2026-07-12T09:15:00Z', resolved: false,
  },
  {
    id: 'TA-002', type: 'speeding', vehicleId: 'VH-006',
    message: 'Maverick-06 exceeded speed limit (95 km/h in 80 km/h zone)',
    severity: 'Warning', location: { lat: 17.3850, lng: 78.4867 },
    timestamp: '2026-07-12T10:05:00Z', resolved: false,
  },
  {
    id: 'TA-003', type: 'route_deviation', vehicleId: 'VH-008',
    message: 'Atlas-08 deviated 2.3km from planned route',
    severity: 'Warning', location: { lat: 22.5726, lng: 88.3639 },
    timestamp: '2026-07-12T10:20:00Z', resolved: false,
  },
];

// ── Alerts ────────────────────────────────────────────────────────────────────
export const initialAlerts: Alert[] = [
  {
    id: 'AL-001', severity: 'Critical', title: 'License Expired',
    message: 'Driver Arun Singh (DR-003) license expired on 2024-03-10. Immediate action required.',
    category: 'License', driverId: 'DR-003', resolved: false, createdAt: '2026-07-12T08:00:00Z',
  },
  {
    id: 'AL-002', severity: 'Warning', title: 'License Expiring Soon',
    message: 'Driver Sanjay Reddy (DR-005) license expires on 2026-07-25 (13 days remaining).',
    category: 'License', driverId: 'DR-005', resolved: false, createdAt: '2026-07-12T08:00:00Z',
  },
  {
    id: 'AL-003', severity: 'Warning', title: 'Insurance Expiry',
    message: 'Vehicle Falcon-05 (VH-005) insurance expired on 2025-11-05.',
    category: 'Insurance', vehicleId: 'VH-005', resolved: false, createdAt: '2026-07-12T08:00:00Z',
  },
  {
    id: 'AL-004', severity: 'Info', title: 'Maintenance Scheduled',
    message: 'Atlas-08 (VH-008) tyre replacement scheduled for 2026-07-20.',
    category: 'Maintenance', vehicleId: 'VH-008', resolved: false, createdAt: '2026-07-12T08:00:00Z',
  },
  {
    id: 'AL-005', severity: 'Critical', title: 'Vehicle In Shop',
    message: 'Titan-03 (VH-003) is in shop for Engine Repair. Expected completion in 3 days.',
    category: 'Vehicle', vehicleId: 'VH-003', resolved: false, createdAt: '2026-07-08T09:00:00Z',
  },
];

// Deterministic enterprise-scale demo data for local development and hackathon demos.
// The hand-authored records above stay first; these generated records ensure every
// dashboard, chart, report, filter, and workflow has realistic domain volume.
const regions = ['North', 'South', 'East', 'West', 'Central'];
const routePairs = [
  ['Chennai Port', 'Bangalore Warehouse'],
  ['Mumbai Depot', 'Pune Factory'],
  ['Delhi Hub', 'Jaipur Distribution'],
  ['Hyderabad Hub', 'Vijayawada Port'],
  ['Ahmedabad Plant', 'Surat Terminal'],
  ['Kolkata Dock', 'Bhubaneswar Hub'],
  ['Kochi Terminal', 'Coimbatore DC'],
  ['Nagpur Cross Dock', 'Indore Hub'],
  ['Lucknow Depot', 'Kanpur Retail Park'],
  ['Noida Fulfilment', 'Gurugram Warehouse'],
];
const cargo = ['Electronics', 'FMCG', 'Textiles', 'Auto Parts', 'Medical Supplies', 'Cold Chain Cargo', 'Industrial Tools', 'Furniture', 'Packaging Material', 'Solar Panels'];
const maintenanceTypes: MaintenanceLog['type'][] = ['Oil Change', 'Brake Service', 'Tyre Replacement', 'Engine Repair', 'Battery', 'Inspection'];
const vehicleTemplates = [
  ['Van-01', 'Transit', 'Ford', 'Van', 1200, 'Diesel'],
  ['Van-02', 'Sprinter', 'Mercedes-Benz', 'Van', 1500, 'Diesel'],
  ['Truck-01', 'Prima 5530', 'Tata Motors', 'Truck', 18000, 'Diesel'],
  ['Truck-02', 'Pro 6042', 'Eicher', 'Truck', 22000, 'Diesel'],
  ['Mini Truck', 'Dost+', 'Ashok Leyland', 'Truck', 1800, 'Diesel'],
  ['Electric Van', 'E-Transit', 'Ford', 'Van', 900, 'Electric'],
  ['Pickup', 'Hilux', 'Toyota', 'SUV', 1000, 'Diesel'],
  ['Cargo Truck', 'FH16', 'Volvo', 'Truck', 30000, 'Diesel'],
  ['Metro Van', 'Traveller', 'Force', 'Van', 1100, 'CNG'],
  ['Hybrid Courier', 'Urbania', 'Force', 'Van', 950, 'Hybrid'],
  ['Long Haul-01', 'Cascadia', 'Freightliner', 'Truck', 28000, 'Diesel'],
  ['Long Haul-02', 'Actros', 'Mercedes-Benz', 'Truck', 26000, 'Diesel'],
];
const driverNames = [
  'Amit Verma', 'Neha Iyer', 'Karan Malhotra', 'Fatima Khan', 'Vikram Rao', 'Lakshmi Menon',
  'Imran Shaikh', 'Pooja Das', 'Harish Balan', 'Nisha Kapoor', 'Manoj Pillai', 'Ananya Sen',
  'Suresh Yadav', 'Kavita Joshi',
];

if (!initialUsers.some(u => u.role === 'driver')) {
  initialUsers.push({ id: 'U-06', name: 'Driver Demo', email: 'driver@transitops.com', role: 'driver', avatar: '' });
}

for (let i = initialVehicles.length; i < 20; i++) {
  const t = vehicleTemplates[i % vehicleTemplates.length];
  const status: Vehicle['status'] = i % 13 === 0 ? 'In Shop' : i % 17 === 0 ? 'Retired' : 'Available';
  const fuelType = t[5] as Vehicle['fuelType'];
  initialVehicles.push({
    id: `VH-${String(i + 1).padStart(3, '0')}`,
    registrationNumber: `${['TN', 'MH', 'DL', 'KA', 'GJ'][i % 5]}-${String(i + 11).padStart(2, '0')}-${String.fromCharCode(65 + i)}${String.fromCharCode(66 + i)}-${1000 + i * 137}`,
    name: t[0] as string,
    model: t[1] as string,
    manufacturer: t[2] as string,
    type: t[3] as Vehicle['type'],
    loadCapacity: t[4] as number,
    odometer: 18000 + i * 9300,
    acquisitionCost: 32000 + i * 5200,
    purchaseDate: `${2020 + (i % 5)}-${String((i % 12) + 1).padStart(2, '0')}-15`,
    insuranceExpiry: `2027-${String((i % 12) + 1).padStart(2, '0')}-20`,
    status,
    region: regions[i % regions.length],
    mileage: fuelType === 'Electric' ? 5.8 : 7.5 + (i % 5) * 0.7,
    fuelType,
    healthScore: Math.max(45, 96 - i * 2 + (i % 4) * 3),
    maintenanceHistory: ['Inspection', i % 2 ? 'Oil Change' : 'Brake Service'],
    fuelHistory: [fuelType === 'Electric' ? 'Monthly charging cycle' : 'Monthly diesel refill'],
  });
}

const baseDriverCount = initialDrivers.length;
for (let i = baseDriverCount; i < 20; i++) {
  initialDrivers.push({
    id: `DR-${String(i + 1).padStart(3, '0')}`,
    name: driverNames[i - baseDriverCount] || `Driver ${i + 1}`,
    photo: `https://api.dicebear.com/8.x/initials/svg?seed=TransitOps-Driver-${i + 1}`,
    licenseNumber: `DLX${String(20260000 + i * 791)}`,
    licenseCategory: i % 3 === 0 ? 'CDL-A' : i % 3 === 1 ? 'CDL-B' : 'CDL-C',
    licenseExpiry: i % 11 === 0 ? '2026-07-18' : `${2027 + (i % 3)}-${String((i % 12) + 1).padStart(2, '0')}-28`,
    phone: `+91-9${String(100000000 + i * 73921).slice(0, 9)}`,
    emergencyContact: `+91-8${String(100000000 + i * 56317).slice(0, 9)}`,
    joiningDate: `${2018 + (i % 7)}-${String((i % 12) + 1).padStart(2, '0')}-10`,
    experienceYears: 2 + (i % 12),
    bloodGroup: ['O+', 'A+', 'B+', 'AB+', 'O-'][i % 5],
    safetyScore: Math.min(99, 72 + (i * 7) % 28),
    status: i % 10 === 0 ? 'Off Duty' : 'Available',
    fatigueIndex: 8 + (i * 9) % 60,
  });
}

for (let i = initialTrips.length; i < 100; i++) {
  const [source, destination] = routePairs[i % routePairs.length];
  const status = (['Completed', 'Completed', 'Completed', 'Pending', 'Draft', 'Cancelled'] as Trip['status'][])[i % 6];
  const vehicle = initialVehicles[i % initialVehicles.length];
  const driver = initialDrivers[i % initialDrivers.length];
  const created = new Date(2026, i % 7, 1 + (i % 27), 8 + (i % 8), 0, 0);
  const distance = 90 + (i % 14) * 38;
  const fuelConsumed = vehicle.fuelType === 'Electric' ? Math.round(distance / 4.8) : Math.round(distance / (5.8 + (i % 4)));
  initialTrips.push({
    id: `TR-${2000 + i}`,
    source,
    destination,
    vehicleId: vehicle.id,
    driverId: driver.id,
    cargoDescription: cargo[i % cargo.length],
    cargoWeight: Math.min(vehicle.loadCapacity - 50, 500 + (i % 20) * 900),
    plannedDistance: distance,
    estimatedDuration: Math.round((distance / 58) * 10) / 10,
    revenue: 1800 + distance * 18 + (i % 5) * 450,
    status,
    priority: (['Low', 'Medium', 'High', 'Urgent'] as Trip['priority'][])[i % 4],
    createdAt: created.toISOString(),
    dispatchedAt: status === 'Completed' || status === 'Dispatched' ? new Date(created.getTime() + 3600000).toISOString() : undefined,
    completedAt: status === 'Completed' ? new Date(created.getTime() + 8 * 3600000).toISOString() : undefined,
    cancelledAt: status === 'Cancelled' ? new Date(created.getTime() + 2 * 3600000).toISOString() : undefined,
    finalOdometer: status === 'Completed' ? vehicle.odometer + distance : undefined,
    fuelConsumed: status === 'Completed' ? fuelConsumed : undefined,
    estimatedFuelCost: fuelConsumed * (vehicle.fuelType === 'Electric' ? 8.5 : 95),
    estimatedCO2: vehicle.fuelType === 'Electric' ? Math.round(fuelConsumed * 0.4) : Math.round(fuelConsumed * 2.68),
  });
}

for (let month = 0; month < 6; month++) {
  initialVehicles.slice(0, 20).forEach((v, idx) => {
    const d = `2026-${String(month + 2).padStart(2, '0')}-${String((idx % 24) + 1).padStart(2, '0')}`;
    const liters = v.fuelType === 'Electric' ? 65 + (idx % 5) * 9 : 42 + (idx % 8) * 13;
    initialFuelLogs.push({
      id: `FL-G${month}-${idx}`,
      vehicleId: v.id,
      driverId: initialDrivers[idx % initialDrivers.length].id,
      fuelStation: v.fuelType === 'Electric' ? 'TransitOps EV Charging Bay' : ['IOCL Highway Pump', 'HP Fleet Station', 'BPCL Logistics Pump'][idx % 3],
      fuelType: v.fuelType,
      liters,
      pricePerLiter: v.fuelType === 'Electric' ? 8.5 : 93 + (idx % 5),
      totalCost: liters * (v.fuelType === 'Electric' ? 8.5 : 93 + (idx % 5)),
      odometer: v.odometer - (6 - month) * 1200 + idx * 10,
      date: d,
      notes: v.fuelType === 'Electric' ? 'kWh charging equivalent' : 'Monthly route fuel record',
    });
  });
}

for (let i = initialMaintenanceLogs.length; i < 45; i++) {
  const vehicle = initialVehicles[i % initialVehicles.length];
  const status = (['Completed', 'Completed', 'Scheduled', 'In Progress'] as MaintenanceLog['status'][])[i % 4];
  initialMaintenanceLogs.push({
    id: `MN-${String(i + 1).padStart(3, '0')}`,
    vehicleId: vehicle.id,
    type: maintenanceTypes[i % maintenanceTypes.length],
    description: `${maintenanceTypes[i % maintenanceTypes.length]} for ${vehicle.name} based on odometer and readiness checks`,
    status,
    scheduledDate: `2026-${String((i % 7) + 1).padStart(2, '0')}-${String((i % 24) + 1).padStart(2, '0')}`,
    completedDate: status === 'Completed' ? `2026-${String((i % 7) + 1).padStart(2, '0')}-${String((i % 24) + 2).padStart(2, '0')}` : undefined,
    cost: 240 + (i % 9) * 430,
    mechanic: ['Fleet Center Bay 1', 'Fleet Center Bay 2', 'Ram Auto Works', 'Volvo Service Centre'][i % 4],
    odometerAtService: vehicle.odometer - (i % 5) * 1100,
    notes: i % 5 === 0 ? 'Priority engine flagged higher service urgency.' : 'Routine maintenance workflow.',
    createdAt: new Date(2026, i % 7, (i % 24) + 1, 9, 0, 0).toISOString(),
  });
}

const expenseCategories: Expense['category'][] = ['Fuel', 'Maintenance', 'Parking', 'Insurance', 'Permit', 'Repair', 'Toll', 'Cleaning'];
for (let i = initialExpenses.length; i < 90; i++) {
  const category = expenseCategories[i % expenseCategories.length];
  initialExpenses.push({
    id: `EX-${String(i + 1).padStart(3, '0')}`,
    vehicleId: initialVehicles[i % initialVehicles.length].id,
    driverId: initialDrivers[i % initialDrivers.length].id,
    tripId: initialTrips[i % initialTrips.length].id,
    category,
    amount: 180 + (i % 12) * 375 + (category === 'Insurance' ? 5200 : 0),
    description: `${category} expense for ${initialVehicles[i % initialVehicles.length].name}`,
    date: `2026-${String((i % 7) + 1).padStart(2, '0')}-${String((i % 25) + 1).padStart(2, '0')}`,
    createdAt: new Date(2026, i % 7, (i % 25) + 1, 12, 0, 0).toISOString(),
  });
}

initialAlerts.push(
  { id: 'AL-006', severity: 'Warning', title: 'High Fuel Consumption Detected', message: 'Truck-02 used 14% more fuel than its route baseline this week.', category: 'Vehicle', vehicleId: 'VH-010', resolved: false, createdAt: '2026-07-12T09:10:00Z' },
  { id: 'AL-007', severity: 'Info', title: 'Vehicle Returned From Trip', message: 'Van-01 returned to South depot and is available for dispatch.', category: 'Trip', vehicleId: 'VH-009', resolved: false, createdAt: '2026-07-12T09:35:00Z' },
  { id: 'AL-008', severity: 'Critical', title: 'Service Interval Exceeded', message: 'Cargo Truck exceeded the recommended inspection interval by 1,200 km.', category: 'Maintenance', vehicleId: 'VH-016', resolved: false, createdAt: '2026-07-12T10:05:00Z' },
  { id: 'AL-009', severity: 'Warning', title: 'Expense Above Monthly Average', message: 'Parking expenses are 18% above the six-month monthly average.', category: 'System', resolved: false, createdAt: '2026-07-12T10:30:00Z' },
);

// Add demo tracking data
if (!initialGeofences.some(g => g.id === 'GF-001')) {
  initialGeofences.push(
    { id: 'GF-004', name: 'Bangalore Warehouse Zone', description: 'Primary distribution center', type: 'circular', center: { lat: 12.9716, lng: 77.5946 }, radius: 4000, color: '#8B5CF6', active: true, alertOnEnter: true, alertOnExit: true, createdAt: '2026-07-08T00:00:00Z' },
    { id: 'GF-005', name: 'Kolkata Dock Area', description: 'Port operational zone', type: 'circular', center: { lat: 22.5726, lng: 88.3639 }, radius: 3500, color: '#06B6D4', active: true, alertOnEnter: true, alertOnExit: false, createdAt: '2026-07-09T00:00:00Z' },
  );
}
