import express from "express";
import path from "path";
import net from "net";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

import {
  initialVehicles, initialDrivers, initialTrips,
  initialMaintenanceLogs, initialFuelLogs, initialExpenses,
  initialAlerts, initialUsers, initialGeofences, initialVehiclePositions, initialTrackingAlerts
} from "./src/data";

import {
  Vehicle, Driver, Trip, MaintenanceLog,
  FuelLog, Expense, Alert, User, Geofence, VehiclePosition, TrackingAlert
} from "./src/types";

// ── In-memory stores ─────────────────────────────────────────────────────────
let vehicles: Vehicle[] = JSON.parse(JSON.stringify(initialVehicles));
let drivers: Driver[] = JSON.parse(JSON.stringify(initialDrivers));
let trips: Trip[] = JSON.parse(JSON.stringify(initialTrips));
let maintenanceLogs: MaintenanceLog[] = JSON.parse(JSON.stringify(initialMaintenanceLogs));
let fuelLogs: FuelLog[] = JSON.parse(JSON.stringify(initialFuelLogs));
let expenses: Expense[] = JSON.parse(JSON.stringify(initialExpenses));
let alerts: Alert[] = JSON.parse(JSON.stringify(initialAlerts));
const users: User[] = JSON.parse(JSON.stringify(initialUsers));
// Tracking
let geofences: Geofence[] = JSON.parse(JSON.stringify(initialGeofences));
let vehiclePositions: VehiclePosition[] = JSON.parse(JSON.stringify(initialVehiclePositions));
let trackingAlerts: TrackingAlert[] = JSON.parse(JSON.stringify(initialTrackingAlerts));

// ── ID generators ─────────────────────────────────────────────────────────────
const genId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

function isPortAvailableOnHost(port: number, host: string): Promise<boolean> {
  return new Promise(resolve => {
    const tester = net
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () => {
        tester.close(() => resolve(true));
      })
      .listen(port, host);
  });
}

async function isPortAvailable(port: number) {
  const checks = await Promise.all([
    isPortAvailableOnHost(port, "0.0.0.0"),
    isPortAvailableOnHost(port, "::"),
  ]);
  return checks.every(Boolean);
}

async function findAvailablePort(preferredPort: number) {
  let port = preferredPort;
  while (!(await isPortAvailable(port))) port += 1;
  return port;
}

// ── Gemini AI ─────────────────────────────────────────────────────────────────
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    try { aiClient = new GoogleGenAI({ apiKey: key }); } catch (_) { }
  }
  return aiClient;
}

// ── Auto-alert generator ──────────────────────────────────────────────────────
function generateAutoAlerts() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  drivers.forEach(d => {
    const expiry = new Date(d.licenseExpiry);
    const daysLeft = Math.floor((expiry.getTime() - now.getTime()) / 86400000);
    const existing = alerts.find(a => a.driverId === d.id && a.category === 'License' && !a.resolved);

    if (!existing) {
      if (daysLeft < 0) {
        alerts.unshift({ id: genId('AL'), severity: 'Critical', title: 'License Expired', category: 'License', driverId: d.id, resolved: false, createdAt: now.toISOString(), message: `Driver ${d.name} license expired ${Math.abs(daysLeft)} days ago.` });
      } else if (daysLeft <= 30) {
        alerts.unshift({ id: genId('AL'), severity: daysLeft <= 7 ? 'Critical' : 'Warning', title: 'License Expiring Soon', category: 'License', driverId: d.id, resolved: false, createdAt: now.toISOString(), message: `Driver ${d.name} license expires in ${daysLeft} days (${d.licenseExpiry}).` });
      }
    }
  });

  vehicles.forEach(v => {
    const insExpiry = new Date(v.insuranceExpiry);
    const insLeft = Math.floor((insExpiry.getTime() - now.getTime()) / 86400000);
    const existing = alerts.find(a => a.vehicleId === v.id && a.category === 'Insurance' && !a.resolved);

    if (!existing && insLeft <= 30) {
      alerts.unshift({ id: genId('AL'), severity: insLeft < 0 ? 'Critical' : 'Warning', title: 'Insurance Expiring', category: 'Insurance', vehicleId: v.id, resolved: false, createdAt: now.toISOString(), message: `Vehicle ${v.name} (${v.registrationNumber}) insurance ${insLeft < 0 ? `expired ${Math.abs(insLeft)} days ago` : `expires in ${insLeft} days`}.` });
    }
  });
}

// ── Helper: validate & create business rule errors ───────────────────────────
function validateTrip(tripData: Omit<Trip, 'id' | 'createdAt'>): string | null {
  const vehicle = vehicles.find(v => v.id === tripData.vehicleId);
  const driver = drivers.find(d => d.id === tripData.driverId);

  if (!vehicle) return 'Vehicle not found';
  if (!driver) return 'Driver not found';

  // Vehicle rules
  if (vehicle.status === 'Retired') return `Vehicle ${vehicle.name} is Retired and cannot be assigned to trips.`;
  if (vehicle.status === 'In Shop') return `Vehicle ${vehicle.name} is In Shop for maintenance and cannot be dispatched.`;
  if (vehicle.status === 'On Trip') return `Vehicle ${vehicle.name} is already On Trip.`;

  // Driver rules
  if (driver.status === 'Suspended') return `Driver ${driver.name} is Suspended and cannot be assigned.`;
  if (driver.status === 'On Trip') return `Driver ${driver.name} is already On Trip.`;

  // License expiry
  const licExp = new Date(driver.licenseExpiry);
  if (licExp < new Date()) return `Driver ${driver.name} has an expired license (${driver.licenseExpiry}). Cannot dispatch.`;

  // Cargo weight
  if (tripData.cargoWeight > vehicle.loadCapacity) {
    return `Cargo weight (${tripData.cargoWeight} kg) exceeds vehicle capacity (${vehicle.loadCapacity} kg).`;
  }

  // Already has active trip
  const existingVehicleTrip = trips.find(t => t.vehicleId === tripData.vehicleId && t.status === 'Dispatched');
  if (existingVehicleTrip) return `Vehicle ${vehicle.name} already has an active dispatched trip.`;

  const existingDriverTrip = trips.find(t => t.driverId === tripData.driverId && t.status === 'Dispatched');
  if (existingDriverTrip) return `Driver ${driver.name} already has an active dispatched trip.`;

  return null;
}

// ── Server ────────────────────────────────────────────────────────────────────
async function startServer() {
  const app = express();
  const requestedPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const PORT = await findAvailablePort(requestedPort);
  const HMR_PORT = await findAvailablePort(process.env.HMR_PORT ? parseInt(process.env.HMR_PORT, 10) : 24678);

  app.use(express.json({ limit: '10mb' }));

  // Run auto-alerts on start
  generateAutoAlerts();

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'User not found' });

    // allow demo password or real password
    if (password !== 'TransitOps@2026' && password !== user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ user, token: 'jwt-mock-token-' + user.id });
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, role } = req.body;
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const user: User = {
      id: genId('U'),
      name,
      email,
      role: role || 'driver',
      password
    };
    users.push(user);
    res.json({ user, token: 'jwt-mock-token-' + user.id });
  });

  // ── Main data endpoint ─────────────────────────────────────────────────────
  app.get('/api/fleet-data', (req, res) => {
    generateAutoAlerts();
    res.json({ vehicles, drivers, trips, maintenanceLogs, fuelLogs, expenses, alerts, geofences, vehiclePositions, trackingAlerts });
  });

  // ── Vehicles ───────────────────────────────────────────────────────────────
  app.get('/api/vehicles', (_, res) => res.json(vehicles));

  app.post('/api/vehicles', (req, res) => {
    const data = req.body as Omit<Vehicle, 'id'>;

    // Unique registration number
    const duplicate = vehicles.find(v => v.registrationNumber === data.registrationNumber);
    if (duplicate) return res.status(400).json({ error: `Registration number ${data.registrationNumber} already exists.` });

    const vehicle: Vehicle = { ...data, id: genId('VH'), status: data.status || 'Available' };
    vehicles.push(vehicle);
    res.json({ ok: true, vehicle });
  });

  app.patch('/api/vehicles/:id', (req, res) => {
    const idx = vehicles.findIndex(v => v.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Vehicle not found' });

    // Check duplicate reg number if changing
    if (req.body.registrationNumber) {
      const dup = vehicles.find(v => v.registrationNumber === req.body.registrationNumber && v.id !== req.params.id);
      if (dup) return res.status(400).json({ error: 'Registration number already in use.' });
    }

    vehicles[idx] = { ...vehicles[idx], ...req.body };
    res.json({ ok: true, vehicle: vehicles[idx] });
  });

  app.delete('/api/vehicles/:id', (req, res) => {
    const vehicle = vehicles.find(v => v.id === req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (vehicle.status === 'On Trip') return res.status(400).json({ error: 'Cannot delete a vehicle that is On Trip' });
    vehicles = vehicles.filter(v => v.id !== req.params.id);
    res.json({ ok: true });
  });

  // ── Drivers ────────────────────────────────────────────────────────────────
  app.get('/api/drivers', (_, res) => res.json(drivers));

  app.post('/api/drivers', (req, res) => {
    const data = req.body as Omit<Driver, 'id'>;
    const dup = drivers.find(d => d.licenseNumber === data.licenseNumber);
    if (dup) return res.status(400).json({ error: `License number ${data.licenseNumber} already exists.` });

    const driver: Driver = { ...data, id: genId('DR'), status: data.status || 'Available' };
    drivers.push(driver);
    res.json({ ok: true, driver });
  });

  app.patch('/api/drivers/:id', (req, res) => {
    const idx = drivers.findIndex(d => d.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Driver not found' });
    drivers[idx] = { ...drivers[idx], ...req.body };
    res.json({ ok: true, driver: drivers[idx] });
  });

  app.delete('/api/drivers/:id', (req, res) => {
    const driver = drivers.find(d => d.id === req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    if (driver.status === 'On Trip') return res.status(400).json({ error: 'Cannot delete a driver that is On Trip' });
    drivers = drivers.filter(d => d.id !== req.params.id);
    res.json({ ok: true });
  });

  // ── Trips ──────────────────────────────────────────────────────────────────
  app.get('/api/trips', (_, res) => res.json(trips));

  app.post('/api/trips', (req, res) => {
    const data = req.body as Omit<Trip, 'id' | 'createdAt'>;

    // Only validate if status is Dispatched
    if (data.status === 'Dispatched') {
      const err = validateTrip(data);
      if (err) return res.status(400).json({ error: err });
    }

    const trip: Trip = {
      ...data,
      id: genId('TR'),
      createdAt: new Date().toISOString(),
      ...(data.status === 'Dispatched' ? { dispatchedAt: new Date().toISOString() } : {}),
    };

    trips.unshift(trip);

    if (data.status === 'Dispatched') {
      // Update vehicle
      const vIdx = vehicles.findIndex(v => v.id === data.vehicleId);
      if (vIdx >= 0) { vehicles[vIdx].status = 'On Trip'; vehicles[vIdx].currentDriverId = data.driverId; }

      // Update driver
      const dIdx = drivers.findIndex(d => d.id === data.driverId);
      if (dIdx >= 0) { drivers[dIdx].status = 'On Trip'; drivers[dIdx].currentVehicleId = data.vehicleId; }

      // Alert
      const vehicle = vehicles.find(v => v.id === data.vehicleId);
      const driver = drivers.find(d => d.id === data.driverId);
      alerts.unshift({ id: genId('AL'), severity: 'Info', title: 'Trip Dispatched', category: 'Trip', vehicleId: data.vehicleId, resolved: false, createdAt: new Date().toISOString(), message: `Trip ${trip.id}: ${data.source} → ${data.destination}. Vehicle: ${vehicle?.name}, Driver: ${driver?.name}.` });
    }

    res.json({ ok: true, trip });
  });

  app.patch('/api/trips/:id/status', (req, res) => {
    const { status, finalOdometer, fuelConsumed } = req.body;
    const idx = trips.findIndex(t => t.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Trip not found' });

    const trip = trips[idx];

    // Validate dispatch
    if (status === 'Dispatched') {
      const err = validateTrip(trip as any);
      if (err) return res.status(400).json({ error: err });
    }

    trips[idx] = {
      ...trip, status,
      ...(status === 'Dispatched' ? { dispatchedAt: new Date().toISOString() } : {}),
      ...(status === 'Completed' ? { completedAt: new Date().toISOString(), finalOdometer, fuelConsumed } : {}),
      ...(status === 'Cancelled' ? { cancelledAt: new Date().toISOString() } : {}),
    };

    const vIdx = vehicles.findIndex(v => v.id === trip.vehicleId);
    const dIdx = drivers.findIndex(d => d.id === trip.driverId);

    if (status === 'Dispatched') {
      if (vIdx >= 0) { vehicles[vIdx].status = 'On Trip'; vehicles[vIdx].currentDriverId = trip.driverId; }
      if (dIdx >= 0) { drivers[dIdx].status = 'On Trip'; drivers[dIdx].currentVehicleId = trip.vehicleId; }
    }

    if (status === 'Completed' || status === 'Cancelled') {
      // Restore vehicle & driver to Available
      if (vIdx >= 0) {
        vehicles[vIdx].status = 'Available';
        vehicles[vIdx].currentDriverId = null;
        if (finalOdometer) vehicles[vIdx].odometer = finalOdometer;
      }
      if (dIdx >= 0) { drivers[dIdx].status = 'Available'; drivers[dIdx].currentVehicleId = null; }
    }

    res.json({ ok: true, trip: trips[idx] });
  });

  // ── Maintenance ────────────────────────────────────────────────────────────
  app.get('/api/maintenance', (_, res) => res.json(maintenanceLogs));

  app.post('/api/maintenance', (req, res) => {
    const data = req.body as Omit<MaintenanceLog, 'id' | 'createdAt'>;
    const log: MaintenanceLog = { ...data, id: genId('MN'), createdAt: new Date().toISOString() };
    maintenanceLogs.unshift(log);

    // Auto-set vehicle to In Shop
    if (data.status === 'Scheduled' || data.status === 'In Progress') {
      const vIdx = vehicles.findIndex(v => v.id === data.vehicleId);
      if (vIdx >= 0) {
        if (vehicles[vIdx].status === 'On Trip') {
          return res.status(400).json({ error: 'Cannot create maintenance for a vehicle that is On Trip.' });
        }
        vehicles[vIdx].status = 'In Shop';
      }
    }

    res.json({ ok: true, log });
  });

  app.patch('/api/maintenance/:id/status', (req, res) => {
    const { status } = req.body;
    const idx = maintenanceLogs.findIndex(m => m.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Maintenance log not found' });

    maintenanceLogs[idx] = {
      ...maintenanceLogs[idx], status,
      ...(status === 'Completed' ? { completedDate: new Date().toISOString().split('T')[0] } : {}),
    };

    // On completion: restore vehicle to Available (unless Retired)
    if (status === 'Completed') {
      const vIdx = vehicles.findIndex(v => v.id === maintenanceLogs[idx].vehicleId);
      if (vIdx >= 0 && vehicles[vIdx].status !== 'Retired') {
        vehicles[vIdx].status = 'Available';
      }
    }

    res.json({ ok: true, log: maintenanceLogs[idx] });
  });

  // ── Fuel Logs ──────────────────────────────────────────────────────────────
  app.get('/api/fuel', (_, res) => res.json(fuelLogs));

  app.post('/api/fuel', (req, res) => {
    const data = req.body as Omit<FuelLog, 'id'>;
    const log: FuelLog = { ...data, id: genId('FL') };
    fuelLogs.unshift(log);

    // Update vehicle odometer
    const vIdx = vehicles.findIndex(v => v.id === data.vehicleId);
    if (vIdx >= 0 && data.odometer > vehicles[vIdx].odometer) {
      vehicles[vIdx].odometer = data.odometer;
    }

    res.json({ ok: true, log });
  });

  // ── Expenses ───────────────────────────────────────────────────────────────
  app.get('/api/expenses', (_, res) => res.json(expenses));

  app.post('/api/expenses', (req, res) => {
    const data = req.body as Omit<Expense, 'id' | 'createdAt'>;
    const exp: Expense = { ...data, id: genId('EX'), createdAt: new Date().toISOString() };
    expenses.unshift(exp);
    res.json({ ok: true, expense: exp });
  });

  // ── Alerts ─────────────────────────────────────────────────────────────────
  app.get('/api/alerts', (_, res) => res.json(alerts));

  app.patch('/api/alerts/:id/resolve', (req, res) => {
    const idx = alerts.findIndex(a => a.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Alert not found' });
    alerts[idx].resolved = true;
    res.json({ ok: true });
  });

  // ── Geofences ────────────────────────────────────────────────────────────────
  app.get('/api/geofences', (_, res) => res.json(geofences));

  app.post('/api/geofences', (req, res) => {
    const data = req.body as Omit<Geofence, 'id' | 'createdAt'>;
    const geofence: Geofence = { ...data, id: genId('GF'), createdAt: new Date().toISOString() };
    geofences.push(geofence);
    res.json({ ok: true, geofence });
  });

  app.patch('/api/geofences/:id', (req, res) => {
    const idx = geofences.findIndex(g => g.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Geofence not found' });
    geofences[idx] = { ...geofences[idx], ...req.body };
    res.json({ ok: true, geofence: geofences[idx] });
  });

  app.delete('/api/geofences/:id', (req, res) => {
    const idx = geofences.findIndex(g => g.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Geofence not found' });
    geofences.splice(idx, 1);
    res.json({ ok: true });
  });

  // ── Vehicle Positions ────────────────────────────────────────────────────────
  app.get('/api/vehicle-positions', (_, res) => res.json(vehiclePositions));

  app.post('/api/vehicle-positions', (req, res) => {
    const data = req.body as Omit<VehiclePosition, 'timestamp'>;
    const position: VehiclePosition = { ...data, timestamp: new Date().toISOString() };
    const idx = vehiclePositions.findIndex(p => p.vehicleId === data.vehicleId);
    if (idx >= 0) {
      vehiclePositions[idx] = position;
    } else {
      vehiclePositions.push(position);
    }
    res.json({ ok: true, position });
  });

  // ── Tracking Alerts ─────────────────────────────────────────────────────────
  app.get('/api/tracking-alerts', (_, res) => res.json(trackingAlerts));

  app.patch('/api/tracking-alerts/:id/resolve', (req, res) => {
    const idx = trackingAlerts.findIndex(a => a.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Tracking alert not found' });
    trackingAlerts[idx].resolved = true;
    res.json({ ok: true });
  });

  // ── AI Copilot ─────────────────────────────────────────────────────────────
  app.post('/api/ai/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    // Build fleet context
    const vSummary = vehicles.map(v =>
      `${v.name} (${v.registrationNumber}): ${v.type}, ${v.status}, Capacity: ${v.loadCapacity}kg, Odometer: ${v.odometer}km, HealthScore: ${v.healthScore || 'N/A'}`
    ).join('\n');

    const dSummary = drivers.map(d =>
      `${d.name} (${d.id}): ${d.licenseCategory}, License expires ${d.licenseExpiry}, Status: ${d.status}, SafetyScore: ${d.safetyScore}, Fatigue: ${d.fatigueIndex || 0}%`
    ).join('\n');

    const tSummary = trips.slice(0, 10).map(t =>
      `Trip ${t.id}: ${t.source}→${t.destination}, Cargo: ${t.cargoDescription} (${t.cargoWeight}kg), Status: ${t.status}, Revenue: $${t.revenue}`
    ).join('\n');

    const totalFuelCost = fuelLogs.reduce((s, f) => s + f.totalCost, 0);
    const totalMaintCost = maintenanceLogs.filter(m => m.status === 'Completed').reduce((s, m) => s + m.cost, 0);
    const totalRevenue = trips.filter(t => t.status === 'Completed').reduce((s, t) => s + t.revenue, 0);

    const systemPrompt = `You are the TransitOps AI Operations Copilot, an expert fleet operations assistant.

FLEET SNAPSHOT:
Vehicles: ${vehicles.length} total (${vehicles.filter(v => v.status === 'Available').length} Available, ${vehicles.filter(v => v.status === 'On Trip').length} On Trip, ${vehicles.filter(v => v.status === 'In Shop').length} In Shop, ${vehicles.filter(v => v.status === 'Retired').length} Retired)
Drivers: ${drivers.length} total (${drivers.filter(d => d.status === 'Available').length} Available, ${drivers.filter(d => d.status === 'On Trip').length} On Trip, ${drivers.filter(d => d.status === 'Suspended').length} Suspended)
Total Revenue: $${totalRevenue.toLocaleString()}
Total Fuel Cost: $${totalFuelCost.toLocaleString()}
Total Maintenance Cost: $${totalMaintCost.toLocaleString()}

VEHICLES:
${vSummary}

DRIVERS:
${dSummary}

RECENT TRIPS:
${tSummary}

You answer fleet operations questions concisely with data-driven insights. Use markdown for formatting. Be professional and action-oriented.`;

    const ai = getAI();
    if (!ai) {
      // Mock mode
      const q = message.toLowerCase();
      let reply = '**TransitOps AI Copilot (Demo Mode)**\n\n';

      if (q.includes('cost') && (q.includes('maintain') || q.includes('expensive'))) {
        const costByVehicle = vehicles.map(v => ({
          v,
          cost: maintenanceLogs.filter(m => m.vehicleId === v.id && m.status === 'Completed').reduce((s, m) => s + m.cost, 0)
        })).sort((a, b) => b.cost - a.cost);
        reply += `**Highest Maintenance Cost Vehicles:**\n${costByVehicle.slice(0, 3).map((x, i) => `${i + 1}. **${x.v.name}** — $${x.cost.toLocaleString()}`).join('\n')}`;
      } else if (q.includes('expir') && q.includes('license')) {
        const expiring = drivers.filter(d => {
          const days = Math.floor((new Date(d.licenseExpiry).getTime() - Date.now()) / 86400000);
          return days <= 90;
        });
        reply += `**Drivers with Expiring Licenses (next 90 days):**\n${expiring.map(d => {
          const days = Math.floor((new Date(d.licenseExpiry).getTime() - Date.now()) / 86400000);
          return `- **${d.name}**: expires ${d.licenseExpiry} (${days < 0 ? `${Math.abs(days)} days EXPIRED` : `${days} days left`})`;
        }).join('\n') || 'No expiring licenses found.'}`;
      } else if (q.includes('recommend') || (q.includes('vehicle') && q.includes('deliver'))) {
        const match = message.match(/(\d+)\s*kg/i);
        const weight = match ? parseInt(match[1]) : 1000;
        const suitable = vehicles.filter(v => v.status === 'Available' && v.loadCapacity >= weight)
          .sort((a, b) => b.healthScore! - a.healthScore!);
        reply += `**Recommended Vehicles for ${weight}kg delivery:**\n${suitable.slice(0, 3).map((v, i) => `${i + 1}. **${v.name}** (${v.registrationNumber}) — Capacity: ${v.loadCapacity}kg, Health: ${v.healthScore}/100`).join('\n') || 'No suitable available vehicles.'}`;
      } else if (q.includes('roi')) {
        const roiData = vehicles.map(v => {
          const vRevenue = trips.filter(t => t.vehicleId === v.id && t.status === 'Completed').reduce((s, t) => s + t.revenue, 0);
          const vMaint = maintenanceLogs.filter(m => m.vehicleId === v.id && m.status === 'Completed').reduce((s, m) => s + m.cost, 0);
          const vFuel = fuelLogs.filter(f => f.vehicleId === v.id).reduce((s, f) => s + f.totalCost, 0);
          const roi = v.acquisitionCost > 0 ? ((vRevenue - vMaint - vFuel) / v.acquisitionCost * 100).toFixed(1) : '0';
          return { v, roi: parseFloat(roi) };
        }).sort((a, b) => b.roi - a.roi);
        reply += `**Vehicle ROI Rankings:**\n${roiData.slice(0, 5).map((x, i) => `${i + 1}. **${x.v.name}** — ROI: **${x.roi}%**`).join('\n')}`;
      } else if (q.includes('utiliz')) {
        const util = vehicles.filter(v => v.status !== 'Retired').map(v => ({
          v, trips: trips.filter(t => t.vehicleId === v.id && t.status === 'Completed').length
        })).sort((a, b) => b.trips - a.trips);
        reply += `**Fleet Utilization (Completed Trips):**\n${util.map((x, i) => `${i + 1}. **${x.v.name}**: ${x.trips} trips completed, Status: ${x.v.status}`).join('\n')}`;
      } else if (q.includes('fuel') && q.includes('effici')) {
        const effData = trips.filter(t => t.status === 'Completed' && t.fuelConsumed && t.fuelConsumed > 0).map(t => ({
          t, eff: t.finalOdometer ? (t.plannedDistance / t.fuelConsumed!).toFixed(2) : '0'
        }));
        reply += `**Fuel Efficiency by Trip:**\n${effData.slice(0, 5).map((x, i) => `${i + 1}. Trip **${x.t.id}** (${x.t.source}→${x.t.destination}): **${x.eff} km/L**`).join('\n') || 'No completed trips with fuel data found.'}`;
      } else {
        reply += `I have access to live data for **${vehicles.length} vehicles**, **${drivers.length} drivers**, and **${trips.length} trips**.\n\n**Try asking:**\n- "Which vehicle costs the most to maintain?"\n- "Show drivers with licenses expiring this month"\n- "Recommend a vehicle for a 5000 kg delivery"\n- "Which vehicle has the best ROI?"\n- "Show fleet utilization"\n- "Which trips had the worst fuel efficiency?"`;
      }

      return res.json({ text: reply });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nUser: ${message}` }] }],
      });
      res.json({ text: response.text || 'No response.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── AI Dispatch Optimizer ──────────────────────────────────────────────────
  app.post('/api/ai/optimize-dispatch', (req, res) => {
    const { cargoWeight, source, destination } = req.body;

    const eligibleVehicles = vehicles.filter(v =>
      v.status === 'Available' && v.loadCapacity >= cargoWeight
    ).sort((a, b) => {
      const aScore = (a.healthScore || 50) - (a.odometer / 10000);
      const bScore = (b.healthScore || 50) - (b.odometer / 10000);
      return bScore - aScore;
    });

    const eligibleDrivers = drivers.filter(d => {
      if (d.status !== 'Available') return false;
      const exp = new Date(d.licenseExpiry);
      return exp > new Date();
    }).sort((a, b) => b.safetyScore - a.safetyScore);

    res.json({
      recommendedVehicle: eligibleVehicles[0] || null,
      recommendedDriver: eligibleDrivers[0] || null,
      alternativeVehicles: eligibleVehicles.slice(1, 3),
      alternativeDrivers: eligibleDrivers.slice(1, 3),
      reasoning: `Best vehicle selected based on health score and mileage. Best driver selected based on safety score and license validity.`,
    });
  });

  // ── Frontend serving ───────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { port: HMR_PORT },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    const moved = PORT !== requestedPort ? ` (requested ${requestedPort} was busy)` : '';
    console.log(`
╔══════════════════════════════════════════╗
║     TransitOps Server — Port ${PORT}${moved.padEnd(7, ' ')}║
║     http://localhost:${PORT}               ║
║     Demo: admin@transitops.com            ║
║     Pass: TransitOps@2026                 ║
╚══════════════════════════════════════════╝
    `);
  });
}

startServer().catch(err => {
  console.error('Failed to start TransitOps server:', err);
  process.exit(1);
});
