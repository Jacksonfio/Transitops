import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Truck, Users, Navigation, Wrench, TrendingUp, TrendingDown,
  AlertTriangle, Activity, DollarSign, Fuel, Zap, Target,
  RefreshCw, Filter, Bell, CheckCircle, XCircle, Clock,
  ChevronUp, ChevronDown, BarChart3, Gauge
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { useApp } from '../context';
import { CardSkeleton, ChartSkeleton } from './SkeletonLoader';

const CHART_COLORS = ['#FF6B00', '#FF3D00', '#FFB300', '#00C853', '#FF8C00', '#E55F00'];

function KpiCard({
  label, value, sub, icon: Icon, color, trend, trendVal
}: {
  label: string; value: string | number; sub?: string;
  icon: any; color: string; trend?: 'up' | 'down'; trendVal?: string;
}) {
  const borderColors = {
    orange: 'border-[#FF6B00]/30',
    red: 'border-[#FF3D00]/30',
    amber: 'border-[#FFB300]/30',
    green: 'border-[#00C853]/30',
    purple: 'border-purple-500/30',
    blue: 'border-blue-500/30',
    cyan: 'border-cyan-500/30'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#1A1A1A] dark:bg-[#0A0A0A] rounded-2xl p-5 shadow-sm border ${borderColors[color as keyof typeof borderColors] || 'border-[#2A2A2A]'} hover:border-opacity-60 transition-all`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{label}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>}
            {trendVal && trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend === 'up' ? 'text-[#00C853]' : 'text-[#FF3D00]'}`}>
              {trend === 'up' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {trendVal}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color === 'orange' ? 'bg-[#FF6B00]/10' :
            color === 'red' ? 'bg-[#FF3D00]/10' :
              color === 'amber' ? 'bg-[#FFB300]/10' :
                color === 'green' ? 'bg-[#00C853]/10' :
                  color === 'purple' ? 'bg-purple-500/10' : 'bg-[#FF8C00]/10'
          }`}>
          <Icon className={`w-5 h-5 ${color === 'orange' ? 'text-[#FF6B00]' :
              color === 'red' ? 'text-[#FF3D00]' :
                color === 'amber' ? 'text-[#FFB300]' :
                  color === 'green' ? 'text-[#00C853]' :
                    color === 'purple' ? 'text-purple-500' : 'text-[#FF8C00]'
            }`} />
        </div>
      </div>
    </motion.div>
  );
}

// Generate chart data from real data
function buildTripChartData(trips: any[]) {
  const days: Record<string, number> = {};
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  last7.forEach(d => days[d] = 0);
  trips.forEach(t => {
    const d = (t.completedAt || t.createdAt || '').split('T')[0];
    if (d in days) days[d]++;
  });
  return last7.map(d => ({
    name: new Date(d).toLocaleDateString('en-US', { weekday: 'short' }),
    trips: days[d],
  }));
}

function buildVehicleStatusData(vehicles: any[]) {
  const counts = vehicles.reduce((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function buildCostData(fuelLogs: any[], maintenanceLogs: any[]) {
  const months: Record<string, { name: string; fuel: number; maintenance: number }> = {};
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('en-US', { month: 'short' }) };
  });
  last6.forEach(({ key, label }) => months[key] = { name: label, fuel: 0, maintenance: 0 });

  fuelLogs.forEach(f => {
    const k = f.date?.slice(0, 7);
    if (k && months[k]) months[k].fuel += f.totalCost;
  });
  maintenanceLogs.filter(m => m.status === 'Completed').forEach(m => {
    const k = (m.completedDate || m.scheduledDate)?.slice(0, 7);
    if (k && months[k]) months[k].maintenance += m.cost;
  });

  return Object.values(months);
}

export default function Dashboard() {
  const { kpis, vehicles, drivers, trips, alerts, fuelLogs, maintenanceLogs, resolveAlert, fetchData, isLoading } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await fetchData();
    setTimeout(() => setRefreshing(false), 800);
  };

  const tripChartData = buildTripChartData(trips);
  const vehicleStatusData = buildVehicleStatusData(vehicles);
  const costChartData = buildCostData(fuelLogs, maintenanceLogs);

  const unresolved = alerts.filter(a => !a.resolved);
  const criticalAlerts = unresolved.filter(a => a.severity === 'Critical');
  const warningAlerts = unresolved.filter(a => a.severity === 'Warning');

  const recentTrips = trips.slice(0, 5);
  const vehiclesByHealth = [...vehicles].sort((a, b) => (b.healthScore || 0) - (a.healthScore || 0));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-56 bg-[#D7E3DB] dark:bg-[#2D3A32] rounded animate-pulse" />
            <div className="h-4 w-40 bg-[#D7E3DB] dark:bg-[#2D3A32] rounded mt-2 animate-pulse" />
          </div>
        </div>
        <CardSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Operations Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Real-time fleet overview · Last updated {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${kpis.fleetReadinessScore >= 80
              ? 'bg-[#00C853]/10 text-[#00C853] border border-[#00C853]/30'
              : kpis.fleetReadinessScore >= 60
                ? 'bg-[#FFB300]/10 text-[#FFB300] border border-[#FFB300]/30'
                : 'bg-[#FF3D00]/10 text-[#FF3D00] border border-[#FF3D00]/30'
            }`}>
            <Gauge className="w-3.5 h-3.5" />
            Fleet Readiness: {kpis.fleetReadinessScore || 0}%
          </div>
          <button
            onClick={refresh}
            className={`btn-outline ${refreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Critical alerts banner */}
      {criticalAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#FF3D00]/10 border border-[#FF3D00]/30 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-[#FF3D00]" />
            <h3 className="font-semibold text-[#FF3D00] text-sm">
              {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''} Require Attention
            </h3>
          </div>
          <div className="space-y-2">
            {criticalAlerts.slice(0, 3).map(a => (
              <div key={a.id} className="flex items-center justify-between gap-3 bg-[#1A1A1A] dark:bg-[#0A0A0A] rounded-xl px-4 py-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-[#FF3D00] mt-1.5 shrink-0 animate-pulse" />
                  <div>
                    <p className="text-xs font-semibold text-[#FF3D00]">{a.title}</p>
                    <p className="text-xs text-[#B0B0B0] truncate">{a.message}</p>
                  </div>
                </div>
                <button
                  onClick={() => resolveAlert(a.id)}
                  className="text-xs text-[#B0B0B0] hover:text-[#00C853] transition shrink-0 flex items-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Resolve
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <KpiCard label="Total Vehicles" value={kpis.totalVehicles || 0} icon={Truck} color="orange" sub={`${kpis.availableVehicles || 0} Available`} />
        <KpiCard label="Vehicles On Trip" value={kpis.vehiclesOnTrip || 0} icon={Navigation} color="red" sub={`${kpis.vehiclesInShop || 0} In Shop`} />
        <KpiCard label="Drivers Available" value={kpis.availableDrivers || 0} icon={Users} color="amber" sub={`${kpis.driversOnTrip || 0} On Trip`} />
        <KpiCard label="Active Trips" value={kpis.activeTrips || 0} icon={Activity} color="green" sub={`${kpis.pendingTrips || 0} Pending`} />
        <KpiCard label="Fleet Utilization" value={`${kpis.fleetUtilization || 0}%`} icon={Gauge} color="purple" sub="Active/Available ratio" />
        <KpiCard label="Total Revenue" value={`$${((kpis.totalRevenue || 0) / 1000).toFixed(1)}K`} icon={DollarSign} color="green" sub="Completed trips" trend="up" trendVal="+12% this month" />
        <KpiCard label="Fuel Cost" value={`$${((kpis.totalFuelCost || 0) / 1000).toFixed(1)}K`} icon={Fuel} color="red" sub="All vehicles" />
        <KpiCard label="Maintenance Cost" value={`$${((kpis.totalMaintenanceCost || 0) / 1000).toFixed(1)}K`} icon={Wrench} color="amber" sub="Completed work" />
        <KpiCard label="Net Profit" value={`$${((kpis.profit || 0) / 1000).toFixed(1)}K`} icon={TrendingUp} color={kpis.profit >= 0 ? 'green' : 'red'} sub="Revenue - Costs" />
        <KpiCard label="Fleet ROI" value={`${kpis.fleetROI || 0}%`} icon={Target} color="purple" sub="Vs. acquisition cost" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trips per day */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1C2526] rounded-2xl p-6 shadow-sm border border-[#E2EAE7] dark:border-[#2D3A32]">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#0F766E]" /> Trips (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={tripChartData}>
              <defs>
                <linearGradient id="tripGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="trips" stroke="#FF6B00" strokeWidth={2} fill="url(#tripGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle Status Pie */}
        <div className="bg-[#1A1A1A] dark:bg-[#0A0A0A] rounded-2xl p-6 shadow-sm border border-[#2A2A2A]">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#FF6B00]" /> Vehicle Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={vehicleStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {vehicleStatusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', fontSize: '12px', color: '#FFFFFF' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {vehicleStatusData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-[#B0B0B0]">{d.name}</span>
                </div>
                <span className="font-semibold text-white">{d.value as number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost trend + bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost trend */}
        <div className="lg:col-span-2 bg-[#1A1A1A] dark:bg-[#0A0A0A] rounded-2xl p-6 shadow-sm border border-[#2A2A2A]">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#FF6B00]" /> Operational Costs (6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={costChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#B0B0B0' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#B0B0B0' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', fontSize: '12px', color: '#FFFFFF' }} formatter={(v: any) => [`$${v.toLocaleString()}`, '']} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#B0B0B0' }} />
              <Bar dataKey="fuel" fill="#FF6B00" radius={[4, 4, 0, 0]} name="Fuel" />
              <Bar dataKey="maintenance" fill="#00C853" radius={[4, 4, 0, 0]} name="Maintenance" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fleet Health Scores */}
        <div className="bg-[#1A1A1A] dark:bg-[#0A0A0A] rounded-2xl p-6 shadow-sm border border-[#2A2A2A]">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#FF6B00]" /> Fleet Health Scores
          </h3>
          <div className="space-y-3">
            {vehiclesByHealth.slice(0, 6).map(v => (
              <div key={v.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{v.name}</span>
                  <span className={`text-xs font-bold ${(v.healthScore || 0) >= 80 ? 'text-[#00C853]' :
                      (v.healthScore || 0) >= 60 ? 'text-[#FF6B00]' : 'text-[#FF3D00]'
                    }`}>{v.healthScore || 0}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${v.healthScore || 0}%`,
                      background: (v.healthScore || 0) >= 80 ? '#00C853' : (v.healthScore || 0) >= 60 ? '#FF6B00' : '#FF3D00',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent trips + recent alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trips */}
        <div className="bg-white dark:bg-[#1C2526] rounded-2xl shadow-sm border border-[#E2EAE7] dark:border-[#2D3A32] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2EAE7] dark:border-[#2D3A32] flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#FF6B00]" /> Recent Trips
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {recentTrips.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-8">No trips found</p>
            )}
            {recentTrips.map(t => {
              const vehicle = vehicles.find(v => v.id === t.vehicleId);
              const driver = drivers.find(d => d.id === t.driverId);
              return (
                <div key={t.id} className="px-6 py-3.5 hover:bg-[#F8FAF8] dark:hover:bg-slate-700 transition">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono font-bold text-slate-400">{t.id}</span>
                        <span className={`badge badge-${t.status.toLowerCase().replace(' ', '-')}`}>{t.status}</span>
                        <span className={`badge priority-${t.priority.toLowerCase()}`}>{t.priority}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                        {t.source} → {t.destination}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {vehicle?.name} · {driver?.name} · {t.cargoWeight.toLocaleString()} kg
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">${t.revenue.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">{t.plannedDistance} km</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white dark:bg-[#1C2526] rounded-2xl shadow-sm border border-[#E2EAE7] dark:border-[#2D3A32] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2EAE7] dark:border-[#2D3A32] flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#FF6B00]" /> Alerts & Notifications
            </h3>
            <span className="text-xs font-medium text-slate-500">{unresolved.length} unread</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-80 overflow-y-auto">
            {unresolved.length === 0 && (
              <div className="px-6 py-8 text-center">
                <CheckCircle className="w-8 h-8 text-[#00C853] mx-auto mb-2" />
                <p className="text-[#B0B0B0] text-sm">All clear! No active alerts.</p>
              </div>
            )}
            {unresolved.map(a => (
              <div key={a.id} className="px-6 py-3.5 hover:bg-[#F8FAF8] dark:hover:bg-slate-700 transition">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.severity === 'Critical' ? 'bg-[#FF3D00] animate-pulse' :
                      a.severity === 'Warning' ? 'bg-[#FFB300]' : 'bg-[#FF6B00]'
                    }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{a.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{a.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                    <button
                    onClick={() => resolveAlert(a.id)}
                    className="text-[#808080] hover:text-[#00C853] transition shrink-0"
                    title="Resolve"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
