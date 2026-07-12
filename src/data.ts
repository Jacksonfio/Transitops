import {
  Vehicle, Driver, Trip, MaintenanceLog,
  FuelLog, Expense, Alert, User
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
