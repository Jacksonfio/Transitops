import React, { useState, useEffect, useMemo, useRef, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin, Truck, AlertTriangle, Shield, Navigation, Gauge, Clock, Fuel,
  Plus, Edit2, Trash2, X, ZoomIn, ZoomOut, Search, Maximize2, Minimize2,
  Layers, Radio, Eye, EyeOff, Route, Phone, User, ChevronRight, Activity,
  Map as MapIcon, Satellite, ArrowUpRight, Timer, Zap, ThermometerSun
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, CircleMarker, Popup, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../context';
import { Geofence, VehiclePosition, Vehicle } from '../types';

// City coordinates for simulation routing
const cityCoords: Record<string, { lat: number; lng: number }> = {
  'Chennai Port': { lat: 13.0827, lng: 80.2707 },
  'Bangalore Warehouse': { lat: 12.9716, lng: 77.5946 },
  'Mumbai Depot': { lat: 19.0760, lng: 72.8777 },
  'Pune Factory': { lat: 18.5204, lng: 73.8567 },
  'Delhi Hub': { lat: 28.6139, lng: 77.2090 },
  'Jaipur Distribution': { lat: 26.8467, lng: 75.7836 },
  'Hyderabad Hub': { lat: 17.3850, lng: 78.4867 },
  'Vijayawada Port': { lat: 16.5062, lng: 80.6480 },
  'Ahmedabad Plant': { lat: 23.0225, lng: 72.5714 },
  'Surat Terminal': { lat: 21.1702, lng: 72.8311 },
  'Kolkata Dock': { lat: 22.5726, lng: 88.3639 },
  'Bhubaneswar Hub': { lat: 20.2961, lng: 85.8245 },
};

// Fix default marker icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const statusColors: Record<string, string> = {
  'Available': '#00C853', 'On Trip': '#FF6B00', 'In Shop': '#FFB300', 'Retired': '#808080',
};

// Map tile layer options
const mapLayers = {
  dark: {
    name: 'Dark', icon: '🌙',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  },
  street: {
    name: 'Street', icon: '🗺️',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  satellite: {
    name: 'Satellite', icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
  },
  topo: {
    name: 'Terrain', icon: '⛰️',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
  },
};

function createVehicleIcon(status: string, isSelected: boolean, speed: number): L.DivIcon {
  const color = statusColors[status] || '#6B7280';
  const size = isSelected ? 22 : 14;
  const isSpeeding = speed > 80;
  const glow = isSpeeding ? `box-shadow: 0 0 12px ${color}, 0 0 24px ${color}40;` : `box-shadow: 0 2px 8px rgba(0,0,0,0.4);`;
  const border = isSelected ? 4 : 3;
  return L.divIcon({
    className: 'vehicle-marker',
    html: `<div style="position:relative">
      ${isSpeeding ? `<div style="position:absolute;inset:-6px;background:${color};opacity:0.2;border-radius:50%;animation:pulse-ring 1.5s ease-out infinite"></div>` : ''}
      <div style="width:${size}px;height:${size}px;background:${color};border:${border}px solid white;border-radius:50%;${glow}transition:all 0.2s"></div>
    </div>`,
    iconSize: [size + 10, size + 10],
    iconAnchor: [(size + 10) / 2, (size + 10) / 2],
  });
}

function createPulseIcon(status: string, speed: number): L.DivIcon {
  const color = statusColors[status] || '#6B7280';
  const isSpeeding = speed > 80;
  return L.divIcon({
    className: 'vehicle-marker-pulse',
    html: `<div style="position:relative">
      <div style="position:absolute;top:-14px;left:-14px;width:28px;height:28px;background:${color};opacity:0.25;border-radius:50%;animation:pulse-ring ${isSpeeding ? '1' : '2'}s ease-out infinite"></div>
      ${isSpeeding ? `<div style="position:absolute;top:-20px;left:-20px;width:40px;height:40px;background:${color};opacity:0.1;border-radius:50%;animation:pulse-ring 1.5s ease-out infinite 0.5s"></div>` : ''}
      <div style="width:16px;height:16px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 10px rgba(0,0,0,0.5)"></div>
    </div>`,
    iconSize: [28, 28], iconAnchor: [14, 14],
  });
}

// Safe map context to handle initial render race condition
const MapReadyContext = createContext(false);

function MapReadyGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useMapEvents({
    load: () => setReady(true),
  });
  useEffect(() => { const t = setTimeout(() => setReady(true), 100); return () => clearTimeout(t); }, []);
  return <MapReadyContext.Provider value={ready}>{ready ? children : null}</MapReadyContext.Provider>;
}

function MapEventHandler({ onClick }: { onClick: (latlng: L.LatLng) => void }) {
  useMapEvents({ click(e) { onClick(e.latlng); } });
  return null;
}

function MapZoomControlsInner() {
  const map = useMap();
  return (
    <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1">
      <button onClick={() => map.zoomIn()} className="p-2 rounded-lg bg-[#1A1A1A]/90 hover:bg-[#2A2A2A] border border-[#2A2A2A] transition shadow-lg backdrop-blur-sm">
        <ZoomIn className="w-4 h-4 text-[#B0B0B0]" />
      </button>
      <button onClick={() => map.zoomOut()} className="p-2 rounded-lg bg-[#1A1A1A]/90 hover:bg-[#2A2A2A] border border-[#2A2A2A] transition shadow-lg backdrop-blur-sm">
        <ZoomOut className="w-4 h-4 text-[#B0B0B0]" />
      </button>
    </div>
  );
}

function MapZoomControls() {
  const ready = useContext(MapReadyContext);
  if (!ready) return null;
  return <MapZoomControlsInner />;
}

function FitBoundsOnLoad({ positions }: { positions: VehiclePosition[] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (!fitted.current && positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
      fitted.current = true;
    }
  }, [map, positions]);
  return null;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function interpolate(from: number, to: number, t: number): number { return from + (to - from) * t; }

function formatETA(distanceKm: number, speedKmh: number): string {
  if (speedKmh <= 0 || distanceKm <= 0) return '—';
  const hours = distanceKm / speedKmh;
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

// Trail point type
interface TrailPoint { lat: number; lng: number; ts: number; }

export default function FleetTracking() {
  const {
    vehicles, drivers, trips, geofences, trackingAlerts,
    addGeofence, updateGeofence, deleteGeofence, resolveTrackingAlert, isLoading
  } = useApp();

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAlerts, setShowAlerts] = useState(true);
  const [simulating, setSimulating] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastMapClick, setLastMapClick] = useState<{ lat: number; lng: number } | null>(null);
  const [activeLayer, setActiveLayer] = useState<keyof typeof mapLayers>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTrails, setShowTrails] = useState(true);
  const [showGeofencesOnMap, setShowGeofencesOnMap] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [selectedVehicle2, setSelectedVehicle2] = useState<Vehicle | null>(null);
  const [speedUnit, setSpeedUnit] = useState<'kmh' | 'mph'>('kmh');

  // Trail history per vehicle
  const trailsRef = useRef<Record<string, TrailPoint[]>>({});

  // Per-vehicle movement state
  const moveStateRef = useRef<Record<string, {
    destLat: number; destLng: number; srcLat: number; srcLng: number; progress: number; speed: number;
  }>>({});

  const getVehicleDestination = useCallback((vehicleId: string, vStatus: string) => {
    if (vStatus !== 'On Trip') return null;
    const trip = trips.find(t => t.vehicleId === vehicleId && t.status === 'Dispatched');
    if (!trip) return null;
    const dest = cityCoords[trip.destination];
    const src = cityCoords[trip.source];
    if (!dest || !src) return null;
    return { src, dest, trip };
  }, [trips]);

  // Initialize positions
  const [positions, setPositions] = useState<VehiclePosition[]>(() => {
    const initial: VehiclePosition[] = [];
    const indiaBounds = { latMin: 8, latMax: 35, lngMin: 68, lngMax: 97 };
    vehicles.forEach((v, idx) => {
      const status = v.status;
      if (status === 'Available' || status === 'On Trip') {
        let lat: number, lng: number;
        const route = getVehicleDestination(v.id, status);
        if (route) {
          lat = route.src.lat; lng = route.src.lng;
          moveStateRef.current[v.id] = {
            destLat: route.dest.lat, destLng: route.dest.lng,
            srcLat: route.src.lat, srcLng: route.src.lng, progress: 0, speed: 40 + Math.random() * 40,
          };
        } else {
          lat = indiaBounds.latMin + (idx * 1.7) % (indiaBounds.latMax - indiaBounds.latMin);
          lng = indiaBounds.lngMin + (idx * 2.3) % (indiaBounds.lngMax - indiaBounds.lngMin);
        }
        initial.push({
          vehicleId: v.id, latitude: lat, longitude: lng,
          speed: status === 'On Trip' ? 40 + Math.random() * 40 : 0,
          heading: Math.random() * 360, timestamp: new Date().toISOString(), status,
        });
      }
    });
    return initial;
  });

  // Simulation tick every 2.5 seconds
  useEffect(() => {
    if (!simulating) return;
    const interval = setInterval(() => {
      setPositions(prev => prev.map(p => {
        const v = vehicles.find(x => x.id === p.vehicleId);
        if (!v) return p;
        // Record trail
        if (!trailsRef.current[p.vehicleId]) trailsRef.current[p.vehicleId] = [];
        const trail = trailsRef.current[p.vehicleId];
        trail.push({ lat: p.latitude, lng: p.longitude, ts: Date.now() });
        if (trail.length > 30) trail.shift(); // keep last 30 points

        if (v.status === 'On Trip') {
          const state = moveStateRef.current[p.vehicleId];
          if (state) {
            const step = 0.02 + (state.speed / 3000);
            const newProgress = Math.min(state.progress + step, 1);
            moveStateRef.current[p.vehicleId] = { ...state, progress: newProgress };
            const lat = interpolate(state.srcLat, state.destLat, newProgress);
            const lng = interpolate(state.srcLng, state.destLng, newProgress);
            const heading = Math.atan2(state.destLng - state.srcLng, state.destLat - state.srcLat) * 180 / Math.PI;
            if (newProgress >= 1) {
              const cities = Object.values(cityCoords);
              const next = cities[Math.floor(Math.random() * cities.length)];
              moveStateRef.current[p.vehicleId] = {
                srcLat: lat, srcLng: lng, destLat: next.lat, destLng: next.lng,
                progress: 0, speed: 30 + Math.random() * 50,
              };
              return { ...p, latitude: lat, longitude: lng, speed: state.speed, heading, timestamp: new Date().toISOString(), status: 'On Trip' };
            }
            return { ...p, latitude: lat, longitude: lng, speed: state.speed, heading, timestamp: new Date().toISOString(), status: 'On Trip' };
          }
        }
        if (v.status === 'Available') {
          const drift = 0.01;
          return {
            ...p,
            latitude: p.latitude + (Math.random() - 0.5) * drift,
            longitude: p.longitude + (Math.random() - 0.5) * drift,
            speed: Math.max(0, p.speed + (Math.random() - 0.5) * 2),
            heading: (p.heading + (Math.random() - 0.5) * 10 + 360) % 360,
            timestamp: new Date().toISOString(), status: 'Available',
          };
        }
        return p;
      }));
    }, 2500);
    return () => clearInterval(interval);
  }, [simulating, vehicles]);

  const getVehiclePosition = (vehicleId: string) => positions.find(p => p.vehicleId === vehicleId);

  const filteredVehicles = useMemo(() => {
    let result = vehicles;
    if (filterStatus !== 'all') result = result.filter(v => v.status === filterStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v => v.name.toLowerCase().includes(q) || v.registrationNumber.toLowerCase().includes(q));
    }
    return result;
  }, [vehicles, filterStatus, searchQuery]);

  const getVehicleWithDetails = (v: Vehicle) => {
    const position = getVehiclePosition(v.id);
    const driver = drivers.find(d => d.id === v.currentDriverId);
    const activeTrip = trips.find(t => t.vehicleId === v.id && t.status === 'Dispatched');
    return { ...v, position, driver, activeTrip };
  };

  // ETA calculation for a vehicle
  const getVehicleETA = (v: Vehicle) => {
    const pos = getVehiclePosition(v.id);
    const trip = trips.find(t => t.vehicleId === v.id && t.status === 'Dispatched');
    if (!pos || !trip) return null;
    const dest = cityCoords[trip.destination];
    if (!dest) return null;
    const dist = haversineDistance(pos.latitude, pos.longitude, dest.lat, dest.lng);
    const speed = pos.speed > 0 ? pos.speed : 45;
    return { distance: dist, eta: formatETA(dist, speed), speed, destCity: trip.destination };
  };

  // Distance between two selected vehicles
  const vehicleDistance = useMemo(() => {
    if (!selectedVehicle || !selectedVehicle2) return null;
    const p1 = getVehiclePosition(selectedVehicle.id);
    const p2 = getVehiclePosition(selectedVehicle2.id);
    if (!p1 || !p2) return null;
    return haversineDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
  }, [selectedVehicle, selectedVehicle2, positions]);

  // Idle time tracker
  const getIdleTime = (v: Vehicle) => {
    const pos = getVehiclePosition(v.id);
    if (!pos || pos.speed > 2) return null;
    const elapsed = (Date.now() - new Date(pos.timestamp).getTime()) / 60000;
    if (elapsed < 5) return null;
    return `${Math.round(elapsed)}m idle`;
  };

  // Geofence form state
  const [geofenceForm, setGeofenceForm] = useState({
    name: '', description: '', type: 'circular' as 'circular' | 'polygon',
    center: { lat: 20.5937, lng: 78.9629 }, radius: 5000,
    color: '#FF6B00', active: true, alertOnEnter: true, alertOnExit: true, vehicleIds: [] as string[],
  });

  const resetGeofenceForm = () => {
    setGeofenceForm({
      name: '', description: '', type: 'circular',
      center: { lat: 20.5937, lng: 78.9629 }, radius: 5000,
      color: '#FF6B00', active: true, alertOnEnter: true, alertOnExit: true, vehicleIds: [],
    });
    setEditingGeofence(null);
  };

  const handleCreateGeofence = async () => {
    if (!geofenceForm.name.trim()) return;
    await addGeofence({ ...geofenceForm });
    setShowGeofenceModal(false);
    resetGeofenceForm();
  };

  const handleUpdateGeofence = async () => {
    if (!editingGeofence || !geofenceForm.name.trim()) return;
    await updateGeofence(editingGeofence.id, geofenceForm);
    setShowGeofenceModal(false);
    resetGeofenceForm();
  };

  const handleEditGeofence = (g: Geofence) => {
    setEditingGeofence(g);
    setGeofenceForm({
      name: g.name, description: g.description || '', type: g.type,
      center: g.center || { lat: 20.5937, lng: 78.9629 }, radius: g.radius || 5000,
      color: g.color, active: g.active, alertOnEnter: g.alertOnEnter, alertOnExit: g.alertOnExit,
      vehicleIds: g.vehicleIds || [],
    });
    setShowGeofenceModal(true);
  };

  const handleDeleteGeofence = async (id: string) => {
    if (confirm('Delete this geofence?')) await deleteGeofence(id);
  };

  const convertSpeed = (kmh: number) => speedUnit === 'mph' ? (kmh * 0.621371).toFixed(0) : kmh.toFixed(0);
  const speedLabel = speedUnit === 'mph' ? 'mph' : 'km/h';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#2D3A32] rounded animate-pulse" />
        <div className="bg-[#1C2526] rounded-2xl border border-[#2D3A32] h-[600px] animate-pulse" />
      </div>
    );
  }

  const onTripCount = positions.filter(p => p.status === 'On Trip').length;
  const idleCount = positions.filter(p => p.status === 'Available').length;
  const speedingCount = positions.filter(p => p.speed > 80).length;
  const currentLayer = mapLayers[activeLayer];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Navigation className="w-6 h-6 text-[#FF6B00]" /> Fleet Tracking & Geofencing
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Real-time simulation · {onTripCount} en route · {idleCount} idle · {speedingCount} speeding · {geofences.length} geofences
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <button onClick={() => setSimulating(s => !s)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
              simulating ? 'bg-[#00C853]/20 text-[#00C853] border-[#00C853]/40 animate-pulse' : 'bg-[#1A1A1A] text-[#808080] border-[#2A2A2A] hover:border-[#00C853]/30'
            }`}>
            <span className={`w-2 h-2 rounded-full ${simulating ? 'bg-[#00C853]' : 'bg-[#808080]'}`} />
            {simulating ? 'LIVE' : 'PAUSED'}
          </button>
          <button onClick={() => setSpeedUnit(u => u === 'kmh' ? 'mph' : 'kmh')}
            className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border bg-[#1A1A1A] text-[#B0B0B0] border-[#2A2A2A] hover:border-[#FF6B00]/30 transition">
            <Gauge className="w-3 h-3" /> {speedUnit === 'kmh' ? 'km/h' : 'mph'}
          </button>
          <button onClick={() => {
            const center = lastMapClick || { lat: 20.5937, lng: 78.9629 };
            setGeofenceForm(p => ({ ...p, center }));
            setShowGeofenceModal(true);
          }} className="btn-primary">
            <Plus className="w-4 h-4" /> New Geofence
          </button>
        </div>
      </div>

      {/* Fleet Status Bar */}
      <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] overflow-hidden">
        <div className="flex h-2">
          {onTripCount > 0 && <div className="bg-[#FF6B00] transition-all" style={{ width: `${(onTripCount / positions.length) * 100}%` }} />}
          {idleCount > 0 && <div className="bg-[#00C853] transition-all" style={{ width: `${(idleCount / positions.length) * 100}%` }} />}
          {positions.filter(p => p.status === 'In Shop').length > 0 &&
            <div className="bg-[#FFB300] transition-all" style={{ width: `${(positions.filter(p => p.status === 'In Shop').length / positions.length) * 100}%` }} />}
        </div>
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FF6B00]" />{onTripCount} On Trip</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#00C853]" />{idleCount} Available</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FFB300]" />{positions.filter(p => p.status === 'In Shop').length} In Shop</span>
            {speedingCount > 0 && <span className="flex items-center gap-1.5 text-[#FF3D00]"><Zap className="w-3 h-3" />{speedingCount} Speeding</span>}
          </div>
          <div className="flex items-center gap-2 text-xs text-[#808080]">
            <button onClick={() => setShowTrails(s => !s)} className={`flex items-center gap-1 px-2 py-1 rounded-lg transition ${showTrails ? 'text-[#FF6B00] bg-[#FF6B00]/10' : 'hover:text-white'}`}>
              {showTrails ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} Trails
            </button>
            <button onClick={() => setShowRoutes(s => !s)} className={`flex items-center gap-1 px-2 py-1 rounded-lg transition ${showRoutes ? 'text-[#FF6B00] bg-[#FF6B00]/10' : 'hover:text-white'}`}>
              {showRoutes ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} Routes
            </button>
            <button onClick={() => setShowGeofencesOnMap(s => !s)} className={`flex items-center gap-1 px-2 py-1 rounded-lg transition ${showGeofencesOnMap ? 'text-[#FF6B00] bg-[#FF6B00]/10' : 'hover:text-white'}`}>
              {showGeofencesOnMap ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} Geofences
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Map */}
        <div className={`lg:col-span-2 bg-[#1A1A1A] rounded-2xl shadow-sm border border-[#2A2A2A] overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
          {/* Map Controls */}
          <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#808080]" />
                <input type="text" placeholder="Search vehicle..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="form-select text-xs py-1.5 px-8 pl-8 w-48" />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-select text-xs py-1.5 px-3 w-auto">
                <option value="all">All Status</option>
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="In Shop">In Shop</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              {/* Layer Switcher */}
              <div className="flex items-center bg-[#0A0A0A] rounded-lg border border-[#2A2A2A] overflow-hidden">
                {(Object.entries(mapLayers) as [string, typeof mapLayers.dark][]).map(([key, layer]) => (
                  <button key={key} onClick={() => setActiveLayer(key as keyof typeof mapLayers)}
                    className={`px-2.5 py-1.5 text-xs transition ${activeLayer === key ? 'bg-[#FF6B00]/20 text-[#FF6B00]' : 'text-[#808080] hover:text-white'}`}
                    title={layer.name}>
                    {layer.icon}
                  </button>
                ))}
              </div>
              <button onClick={() => setIsFullscreen(f => !f)}
                className="p-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] hover:border-[#FF6B00]/30 transition">
                {isFullscreen ? <Minimize2 className="w-4 h-4 text-[#B0B0B0]" /> : <Maximize2 className="w-4 h-4 text-[#B0B0B0]" />}
              </button>
            </div>
          </div>

          {/* Leaflet Map */}
          <div className="relative" style={{ height: isFullscreen ? 'calc(100vh - 60px)' : '520px' }}>
            <MapContainer center={[20.5937, 78.9629]} zoom={5} className="w-full h-full"
              style={{ background: '#0A0A0A' }} zoomControl={false}>
              <TileLayer key={activeLayer} attribution={currentLayer.attribution} url={currentLayer.url} />
              <MapReadyGate>
              <MapEventHandler onClick={(latlng) => { setLastMapClick({ lat: latlng.lat, lng: latlng.lng }); setSelectedVehicle(null); setSelectedVehicle2(null); }} />
              <FitBoundsOnLoad positions={positions} />

              {/* Geofences */}
              {showGeofencesOnMap && geofences.filter(g => g.active).map(g => {
                if (g.type === 'circular' && g.center && g.radius) {
                  return (
                    <Circle key={g.id} center={[g.center.lat, g.center.lng]} radius={g.radius}
                      pathOptions={{ color: g.color, fillColor: g.color, fillOpacity: 0.08, weight: 2, opacity: 0.5, dashArray: '5,5' }} />
                  );
                }
                return null;
              })}

              {/* Trip route lines */}
              {showRoutes && trips.filter(t => t.status === 'Dispatched').map(t => {
                const src = cityCoords[t.source]; const dest = cityCoords[t.destination];
                if (!src || !dest) return null;
                return (
                  <Polyline key={t.id} positions={[[src.lat, src.lng], [dest.lat, dest.lng]]}
                    pathOptions={{ color: '#FF6B00', weight: 2, opacity: 0.25, dashArray: '8,6' }} />
                );
              })}

              {/* Vehicle trails */}
              {showTrails && filteredVehicles.map(v => {
                const trail = trailsRef.current[v.id];
                if (!trail || trail.length < 2) return null;
                const color = v.status === 'On Trip' ? '#FF6B00' : '#00C853';
                return (
                  <Polyline key={`trail-${v.id}`} positions={trail.map(t => [t.lat, t.lng])}
                    pathOptions={{ color, weight: 1.5, opacity: 0.35, dashArray: '3,4' }} />
                );
              })}

              {/* Trip progress markers */}
              {trips.filter(t => t.status === 'Dispatched').map(t => {
                const vehicle = vehicles.find(v => v.id === t.vehicleId);
                const pos = vehicle ? getVehiclePosition(t.vehicleId) : null;
                const src = cityCoords[t.source]; const dest = cityCoords[t.destination];
                if (!src || !dest || !pos) return null;
                const totalDist = haversineDistance(src.lat, src.lng, dest.lat, dest.lng);
                const traveledDist = haversineDistance(src.lat, src.lng, pos.latitude, pos.longitude);
                const progress = Math.max(0, Math.min(1, totalDist > 0 ? traveledDist / totalDist : 0));
                const progLat = interpolate(src.lat, dest.lat, progress);
                const progLng = interpolate(src.lng, dest.lng, progress);
                return (
                  <CircleMarker key={`prog-${t.id}`} center={[progLat, progLng]} radius={7}
                    pathOptions={{ color: '#FF6B00', fillColor: '#FF6B00', fillOpacity: 0.9, weight: 2, opacity: 1 }}>
                    <Tooltip direction="top" offset={[0, -8]}>
                      <span className="text-xs font-semibold">{vehicle?.name || t.vehicleId} · {Math.round(progress * 100)}%</span>
                    </Tooltip>
                  </CircleMarker>
                );
              })}

              {/* Vehicle markers */}
              {filteredVehicles.map(v => {
                const pos = getVehiclePosition(v.id);
                if (!pos) return null;
                const isSelected = selectedVehicle?.id === v.id;
                return (
                  <Marker key={v.id} position={[pos.latitude, pos.longitude]}
                    icon={v.status === 'On Trip' ? createPulseIcon(v.status, pos.speed) : createVehicleIcon(v.status, isSelected, pos.speed)}
                    eventHandlers={{ click: () => { setSelectedVehicle(v); setSelectedVehicle2(null); } }}>
                    <Popup>
                      <div className="vehicle-popup" style={{ minWidth: 180 }}>
                        <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: 2, color: '#1A1A1A' }}>{v.name}</p>
                        <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>{v.registrationNumber} · {v.type}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: statusColors[v.status] || '#6B7280' }} />
                          <span style={{ fontSize: '11px', fontWeight: 600, color: statusColors[v.status] || '#6B7280' }}>{v.status}</span>
                        </div>
                        <p style={{ fontSize: '11px', color: '#666', margin: '4px 0 0' }}>
                          Speed: <b style={{ color: pos.speed > 80 ? '#FF3D00' : '#333' }}>{convertSpeed(pos.speed)} {speedLabel}</b>
                        </p>
                        {v.status === 'On Trip' && (() => {
                          const eta = getVehicleETA(v);
                          return eta ? <p style={{ fontSize: '11px', color: '#666', margin: '2px 0 0' }}>ETA: <b style={{ color: '#FF6B00' }}>{eta.eta}</b> ({eta.distance.toFixed(0)}km to {eta.destCity})</p> : null;
                        })()}
                        {(() => {
                          const driver = drivers.find(d => d.id === v.currentDriverId);
                          return driver ? <p style={{ fontSize: '10px', color: '#888', margin: '4px 0 0' }}>Driver: {driver.name}</p> : null;
                        })()}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Distance line between two selected vehicles */}
              {selectedVehicle && selectedVehicle2 && (() => {
                const p1 = getVehiclePosition(selectedVehicle.id);
                const p2 = getVehiclePosition(selectedVehicle2.id);
                if (!p1 || !p2) return null;
                return (
                  <Polyline positions={[[p1.latitude, p1.longitude], [p2.latitude, p2.longitude]]}
                    pathOptions={{ color: '#FFB800', weight: 2, opacity: 0.7, dashArray: '4,6' }} />
                );
              })()}

              <MapZoomControls />
              </MapReadyGate>
            </MapContainer>

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-[#1A1A1A]/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-[#2A2A2A]">
              <p className="text-xs font-semibold text-white mb-2">Legend</p>
              <div className="space-y-1.5">
                {Object.entries(statusColors).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                    <span className="text-xs text-[#B0B0B0]">{status}</span>
                  </div>
                ))}
                {speedingCount > 0 && (
                  <div className="flex items-center gap-2 mt-1 pt-1 border-t border-[#2A2A2A]">
                    <Zap className="w-3 h-3 text-[#FF3D00]" />
                    <span className="text-xs text-[#FF3D00]">Speeding (&gt;80 km/h)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Vehicle List overlay */}
            <div className="absolute top-3 right-3 z-[1000] max-h-60 overflow-y-auto">
              <div className="bg-[#1A1A1A]/90 backdrop-blur-sm rounded-xl border border-[#2A2A2A] shadow-lg p-2 space-y-1 w-56">
                <p className="text-xs font-semibold text-[#B0B0B0] px-1 mb-1">Vehicles ({filteredVehicles.length})</p>
                {filteredVehicles.slice(0, 12).map(v => {
                  const pos = getVehiclePosition(v.id);
                  if (!pos) return null;
                  const isSelected = selectedVehicle?.id === v.id;
                  const isCompare = selectedVehicle2?.id === v.id;
                  return (
                    <button key={v.id} onClick={() => {
                      if (selectedVehicle && selectedVehicle.id !== v.id && !selectedVehicle2) setSelectedVehicle2(v);
                      else { setSelectedVehicle(v); setSelectedVehicle2(null); }
                    }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition text-xs ${
                        isSelected ? 'bg-[#FF6B00]/20 border border-[#FF6B00]/40' : isCompare ? 'bg-[#FFB800]/15 border border-[#FFB800]/30' : 'hover:bg-[#2A2A2A] border border-transparent'
                      }`}>
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: statusColors[v.status] || '#6B7280' }} />
                      <span className="text-white font-medium truncate flex-1">{v.name}</span>
                      <span className={`shrink-0 ${pos.speed > 80 ? 'text-[#FF3D00]' : 'text-[#808080]'}`}>{convertSpeed(pos.speed)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Selected Vehicle Details */}
          {selectedVehicle && (() => {
            const details = getVehicleWithDetails(selectedVehicle);
            const eta = getVehicleETA(selectedVehicle);
            const idle = getIdleTime(selectedVehicle);
            return (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#1A1A1A] rounded-2xl p-5 shadow-sm border border-[#2A2A2A]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#FF6B00]" /> Vehicle Details
                  </h3>
                  <button onClick={() => { setSelectedVehicle(null); setSelectedVehicle2(null); }} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{details.name}</p>
                      <p className="text-xs text-[#808080]">{details.registrationNumber} · {details.type}</p>
                    </div>
                    <span className={`badge badge-${details.status.toLowerCase().replace(' ', '-')}`}>{details.status}</span>
                  </div>

                  {details.driver && (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A]">
                      <div className="w-8 h-8 rounded-full bg-[#FF6B00]/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-[#FF6B00]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-white">{details.driver.name}</p>
                        <p className="text-[10px] text-[#808080]">{details.driver.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-[#808080]">Safety</p>
                        <p className="text-xs font-bold text-[#00C853]">{details.driver.safetyScore}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {details.position && (
                      <>
                        <div className="p-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A]">
                          <p className="text-[10px] text-[#808080] uppercase">Speed</p>
                          <p className={`text-sm font-bold ${details.position.speed > 80 ? 'text-[#FF3D00]' : 'text-white'}`}>
                            {convertSpeed(details.position.speed)} {speedLabel}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A]">
                          <p className="text-[10px] text-[#808080] uppercase">Heading</p>
                          <p className="text-sm font-bold text-white">{Math.round(details.position.heading)}°</p>
                        </div>
                      </>
                    )}
                    {eta && (
                      <>
                        <div className="p-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A]">
                          <p className="text-[10px] text-[#808080] uppercase">ETA</p>
                          <p className="text-sm font-bold text-[#FF6B00]">{eta.eta}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A]">
                          <p className="text-[10px] text-[#808080] uppercase">Distance Left</p>
                          <p className="text-sm font-bold text-white">{eta.distance.toFixed(0)} km</p>
                        </div>
                      </>
                    )}
                  </div>

                  {idle && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FFB300]/10 border border-[#FFB300]/30">
                      <Timer className="w-4 h-4 text-[#FFB300]" />
                      <span className="text-xs text-[#FFB300] font-medium">{idle}</span>
                    </div>
                  )}

                  {details.activeTrip && (
                    <div className="p-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A]">
                      <p className="text-[10px] text-[#808080] uppercase mb-1">Current Trip</p>
                      <div className="flex items-center gap-1 text-xs text-white">
                        <span>{details.activeTrip.source}</span>
                        <ArrowUpRight className="w-3 h-3 text-[#FF6B00]" />
                        <span>{details.activeTrip.destination}</span>
                      </div>
                      <p className="text-[10px] text-[#808080] mt-1">{details.activeTrip.cargoDescription} · {details.activeTrip.cargoWeight}kg</p>
                    </div>
                  )}

                  {details.position && (
                    <div className="p-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A]">
                      <p className="text-[10px] text-[#808080] uppercase mb-1">Coordinates</p>
                      <p className="text-xs text-white font-mono">{details.position.latitude.toFixed(4)}, {details.position.longitude.toFixed(4)}</p>
                    </div>
                  )}

                  {/* Compare with second vehicle */}
                  {selectedVehicle2 && vehicleDistance !== null && (
                    <div className="p-3 rounded-lg bg-[#FFB800]/10 border border-[#FFB800]/30">
                      <p className="text-[10px] text-[#FFB800] uppercase font-semibold mb-1">Distance to {selectedVehicle2.name}</p>
                      <p className="text-lg font-bold text-[#FFB800]">{vehicleDistance.toFixed(1)} km</p>
                      <button onClick={() => setSelectedVehicle2(null)} className="text-[10px] text-[#808080] hover:text-white mt-1">Clear comparison</button>
                    </div>
                  )}
                  {!selectedVehicle2 && (
                    <p className="text-[10px] text-[#808080] italic">Click another vehicle on the map to compare distance</p>
                  )}
                </div>
              </motion.div>
            );
          })()}

          {/* Active Trips Monitor */}
          <div className="bg-[#1A1A1A] rounded-2xl p-5 shadow-sm border border-[#2A2A2A]">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
              <Route className="w-4 h-4 text-[#FF6B00]" /> Active Trips
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {trips.filter(t => t.status === 'Dispatched').length === 0 ? (
                <p className="text-xs text-[#808080] text-center py-3">No active trips</p>
              ) : trips.filter(t => t.status === 'Dispatched').map(t => {
                const v = vehicles.find(x => x.id === t.vehicleId);
                const pos = v ? getVehiclePosition(v.id) : null;
                const src = cityCoords[t.source]; const dest = cityCoords[t.destination];
                if (!pos || !src || !dest) return null;
                const totalDist = haversineDistance(src.lat, src.lng, dest.lat, dest.lng);
                const traveled = haversineDistance(src.lat, src.lng, pos.latitude, pos.longitude);
                const progress = Math.max(0, Math.min(100, totalDist > 0 ? (traveled / totalDist) * 100 : 0));
                const eta = formatETA(totalDist - traveled, pos.speed > 0 ? pos.speed : 45);
                return (
                  <div key={t.id} className="p-2.5 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] hover:border-[#FF6B00]/30 transition cursor-pointer"
                    onClick={() => { if (v) setSelectedVehicle(v); }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white">{v?.name}</span>
                      <span className="text-[10px] text-[#FF6B00] font-mono">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-[#808080] mb-1.5">
                      <span className="truncate">{t.source}</span>
                      <ChevronRight className="w-3 h-3 shrink-0" />
                      <span className="truncate">{t.destination}</span>
                    </div>
                    <div className="h-1 bg-[#2A2A2A] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-[#808080]">ETA: {eta}</span>
                      <span className={`text-[10px] ${pos.speed > 80 ? 'text-[#FF3D00]' : 'text-[#808080]'}`}>{convertSpeed(pos.speed)} {speedLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Geofences List */}
          <div className="bg-[#1A1A1A] rounded-2xl p-5 shadow-sm border border-[#2A2A2A]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0F766E]" /> Geofences ({geofences.length})
              </h3>
              <button onClick={() => { resetGeofenceForm(); const center = lastMapClick || { lat: 20.5937, lng: 78.9629 }; setGeofenceForm(p => ({ ...p, center })); setShowGeofenceModal(true); }}
                className="text-[#FF6B00] hover:text-[#FF8C00]"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {geofences.length === 0 ? (
                <p className="text-xs text-[#808080] text-center py-3">No geofences created</p>
              ) : geofences.map(g => (
                <div key={g.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-[#2A2A2A]/50 transition">
                  <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ background: g.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{g.name}</p>
                    <p className="text-[10px] text-[#808080]">{g.type === 'circular' ? `${(g.radius! / 1000).toFixed(1)}km radius` : 'Polygon'}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => handleEditGeofence(g)} className="p-1 hover:bg-[#2A2A2A] rounded"><Edit2 className="w-3 h-3 text-[#B0B0B0]" /></button>
                    <button onClick={() => handleDeleteGeofence(g.id)} className="p-1 hover:bg-[#FF3D00]/20 rounded"><Trash2 className="w-3 h-3 text-[#FF3D00]" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking Alerts */}
          {showAlerts && (
            <div className="bg-[#1A1A1A] rounded-2xl p-5 shadow-sm border border-[#2A2A2A]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#FFB300]" /> Alerts
                </h3>
                <span className="text-xs text-[#B0B0B0]">{trackingAlerts.filter(a => !a.resolved).length} active</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {trackingAlerts.length === 0 ? (
                  <p className="text-xs text-[#808080] text-center py-3">No tracking alerts</p>
                ) : trackingAlerts.slice(0, 10).map(alert => (
                  <div key={alert.id} className={`p-2 rounded-lg border ${alert.resolved ? 'bg-[#2A2A2A]/30 opacity-60' : 'bg-[#FF6B00]/10 border-[#FF6B00]/30'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-white">{alert.message}</p>
                        <p className="text-[10px] text-[#B0B0B0] mt-0.5">{new Date(alert.timestamp).toLocaleString()}</p>
                      </div>
                      {!alert.resolved && (
                        <button onClick={() => resolveTrackingAlert(alert.id)} className="text-xs text-[#00C853] hover:text-[#00C853] shrink-0">Resolve</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Geofence Modal */}
      <AnimatePresence>
        {showGeofenceModal && (
          <div className="modal-overlay" onClick={() => { setShowGeofenceModal(false); resetGeofenceForm(); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="modal-content w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">{editingGeofence ? 'Edit Geofence' : 'Create Geofence'}</h3>
                <button onClick={() => { setShowGeofenceModal(false); resetGeofenceForm(); }} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Name *</label>
                  <input value={geofenceForm.name} onChange={e => setGeofenceForm(p => ({ ...p, name: e.target.value }))} className="form-input" placeholder="e.g., Mumbai Depot Zone" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
                  <textarea value={geofenceForm.description} onChange={e => setGeofenceForm(p => ({ ...p, description: e.target.value }))} className="form-input" rows={2} placeholder="Optional description" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Type</label>
                  <select value={geofenceForm.type} onChange={e => setGeofenceForm(p => ({ ...p, type: e.target.value as 'circular' | 'polygon' }))} className="form-select">
                    <option value="circular">Circular</option>
                    <option value="polygon">Polygon</option>
                  </select>
                </div>
                {geofenceForm.type === 'circular' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Radius (meters)</label>
                    <input type="number" value={geofenceForm.radius} onChange={e => setGeofenceForm(p => ({ ...p, radius: Number(e.target.value) }))} className="form-input" min={100} step={100} />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Color</label>
                  <div className="flex gap-2">
                    {['#FF6B00', '#FF3D00', '#FFB300', '#FF8C00', '#00C853', '#FFB800'].map(color => (
                      <button key={color} onClick={() => setGeofenceForm(p => ({ ...p, color }))}
                        className={`w-8 h-8 rounded-lg border-2 ${geofenceForm.color === color ? 'border-white' : 'border-transparent'}`}
                        style={{ background: color }} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={geofenceForm.alertOnEnter} onChange={e => setGeofenceForm(p => ({ ...p, alertOnEnter: e.target.checked }))} className="rounded" />
                    <span className="text-xs text-slate-400">Alert on Enter</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={geofenceForm.alertOnExit} onChange={e => setGeofenceForm(p => ({ ...p, alertOnExit: e.target.checked }))} className="rounded" />
                    <span className="text-xs text-slate-400">Alert on Exit</span>
                  </label>
                </div>
                <div className="flex gap-3 pt-4 border-t border-[#2A2A2A]">
                  <button onClick={() => { setShowGeofenceModal(false); resetGeofenceForm(); }} className="btn-outline flex-1">Cancel</button>
                  <button onClick={editingGeofence ? handleUpdateGeofence : handleCreateGeofence} className="btn-primary flex-1">
                    {editingGeofence ? 'Update' : 'Create'}
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
