import React from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { BarChart3, TrendingUp, Truck, Users, Fuel, DollarSign, Download, Target, Leaf } from 'lucide-react';
import { useApp } from '../context';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

function SectionCard({ title, icon: Icon, color, children }: { title: string; icon: any; color: string; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Icon className={`w-4 h-4 ${color}`} /> {title}
            </h3>
            {children}
        </div>
    );
}

function downloadCSV(data: any[], filename: string) {
    const headers = Object.keys(data[0] || {});
    const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

export default function AnalyticsReports() {
    const { vehicles, drivers, trips, fuelLogs, expenses, maintenanceLogs, kpis } = useApp();

    // Vehicle ROI data
    const vehicleROI = vehicles.map(v => {
        const vRevenue = trips.filter(t => t.vehicleId === v.id && t.status === 'Completed').reduce((s, t) => s + t.revenue, 0);
        const vMaint = maintenanceLogs.filter(m => m.vehicleId === v.id && m.status === 'Completed').reduce((s, m) => s + m.cost, 0);
        const vFuel = fuelLogs.filter(f => f.vehicleId === v.id).reduce((s, f) => s + f.totalCost, 0);
        const roi = v.acquisitionCost > 0 ? parseFloat(((vRevenue - vMaint - vFuel) / v.acquisitionCost * 100).toFixed(1)) : 0;
        return { name: v.name, roi, revenue: vRevenue, fuel: vFuel, maintenance: vMaint, trips: trips.filter(t => t.vehicleId === v.id).length };
    }).sort((a, b) => b.roi - a.roi);

    // Fuel efficiency per trip
    const fuelEfficiency = trips.filter(t => t.status === 'Completed' && t.fuelConsumed && t.fuelConsumed > 0).map(t => ({
        name: t.id,
        route: `${t.source.split(' ')[0]}→${t.destination.split(' ')[0]}`,
        efficiency: parseFloat((t.plannedDistance / t.fuelConsumed!).toFixed(2)),
        distance: t.plannedDistance,
        fuel: t.fuelConsumed,
    }));

    // Driver performance
    const driverPerf = drivers.map(d => {
        const dTrips = trips.filter(t => t.driverId === d.id && t.status === 'Completed');
        const totalDist = dTrips.reduce((s, t) => s + t.plannedDistance, 0);
        return { name: d.name.split(' ')[0], trips: dTrips.length, distance: totalDist, safety: d.safetyScore };
    }).filter(d => d.trips > 0).sort((a, b) => b.safety - a.safety);

    // Monthly revenue
    const monthlyRevenue = (() => {
        const data: Record<string, { month: string; revenue: number; cost: number; profit: number }> = {};
        const last6 = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) };
        });
        last6.forEach(({ key, label }) => data[key] = { month: label, revenue: 0, cost: 0, profit: 0 });
        trips.filter(t => t.status === 'Completed' && t.completedAt).forEach(t => {
            const k = t.completedAt!.slice(0, 7);
            if (data[k]) data[k].revenue += t.revenue;
        });
        fuelLogs.forEach(f => { const k = f.date.slice(0, 7); if (data[k]) data[k].cost += f.totalCost; });
        maintenanceLogs.filter(m => m.status === 'Completed' && m.completedDate).forEach(m => {
            const k = m.completedDate!.slice(0, 7); if (data[k]) data[k].cost += m.cost;
        });
        Object.values(data).forEach(d => d.profit = d.revenue - d.cost);
        return Object.values(data);
    })();

    // Carbon emissions
    const totalCO2 = trips.filter(t => t.status === 'Completed' && t.fuelConsumed).reduce((s, t) => s + (t.fuelConsumed! * 2.68), 0);
    const co2ByVehicle = vehicles.map(v => {
        const vFuel = trips.filter(t => t.vehicleId === v.id && t.status === 'Completed' && t.fuelConsumed).reduce((s, t) => s + t.fuelConsumed!, 0);
        return { name: v.name, co2: parseFloat((vFuel * 2.68).toFixed(1)) };
    }).filter(v => v.co2 > 0);

    const handleExport = (type: string) => {
        if (type === 'vehicles') downloadCSV(vehicleROI, 'vehicle_roi_report.csv');
        if (type === 'trips') downloadCSV(trips.map(t => ({ id: t.id, source: t.source, destination: t.destination, status: t.status, revenue: t.revenue, cargoWeight: t.cargoWeight, fuelConsumed: t.fuelConsumed || 0 })), 'trips_report.csv');
        if (type === 'drivers') downloadCSV(drivers.map(d => ({ id: d.id, name: d.name, status: d.status, safetyScore: d.safetyScore, licenseExpiry: d.licenseExpiry })), 'drivers_report.csv');
        if (type === 'fuel') downloadCSV(fuelLogs, 'fuel_report.csv');
        if (type === 'expenses') downloadCSV(expenses, 'expenses_report.csv');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics & Reports</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Data-driven fleet performance insights</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {[['vehicles', 'Vehicles'], ['trips', 'Trips'], ['drivers', 'Drivers'], ['fuel', 'Fuel'], ['expenses', 'Expenses']].map(([k, l]) => (
                        <button key={k} onClick={() => handleExport(k)} className="btn-outline text-xs px-3 py-1.5">
                            <Download className="w-3 h-3" /> {l} CSV
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: 'Total Revenue', value: `$${(kpis.totalRevenue / 1000).toFixed(1)}K`, color: 'text-emerald-600' },
                    { label: 'Total Fuel Cost', value: `$${(kpis.totalFuelCost / 1000).toFixed(1)}K`, color: 'text-amber-600' },
                    { label: 'Maintenance', value: `$${(kpis.totalMaintenanceCost / 1000).toFixed(1)}K`, color: 'text-red-500' },
                    { label: 'Net Profit', value: `$${(kpis.profit / 1000).toFixed(1)}K`, color: kpis.profit >= 0 ? 'text-emerald-600' : 'text-red-500' },
                    { label: 'Fleet ROI', value: `${kpis.fleetROI}%`, color: 'text-blue-600' },
                ].map(k => (
                    <div key={k.label} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{k.label}</p>
                        <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                    </div>
                ))}
            </div>

            {/* Revenue vs Cost trend */}
            <SectionCard title="Revenue vs Operational Cost (6 Months)" icon={TrendingUp} color="text-emerald-600">
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={monthlyRevenue}>
                        <defs>
                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                        <Tooltip contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '12px' }} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
                        <Area type="monotone" dataKey="cost" stroke="#EF4444" strokeWidth={2} fill="url(#costGrad)" name="Cost" />
                        <Line type="monotone" dataKey="profit" stroke="#2563EB" strokeWidth={2} dot={false} name="Profit" strokeDasharray="4 2" />
                    </AreaChart>
                </ResponsiveContainer>
            </SectionCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Vehicle ROI */}
                <SectionCard title="Vehicle ROI (%)" icon={Target} color="text-blue-600">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={vehicleROI} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={70} />
                            <Tooltip contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '12px' }} formatter={(v: any) => [`${v}%`, 'ROI']} />
                            <Bar dataKey="roi" fill="#2563EB" radius={[0, 6, 6, 0]}>
                                {vehicleROI.map((entry, i) => <Cell key={i} fill={entry.roi >= 0 ? '#10B981' : '#EF4444'} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </SectionCard>

                {/* Driver Performance */}
                <SectionCard title="Driver Performance (Safety Score)" icon={Users} color="text-purple-600">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={driverPerf}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '12px' }} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="safety" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="Safety Score" />
                            <Bar dataKey="trips" fill="#06B6D4" radius={[6, 6, 0, 0]} name="Completed Trips" />
                        </BarChart>
                    </ResponsiveContainer>
                </SectionCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fuel Efficiency */}
                <SectionCard title="Fuel Efficiency by Trip (km/L)" icon={Fuel} color="text-amber-600">
                    {fuelEfficiency.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-8">No completed trips with fuel data yet.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={fuelEfficiency}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                <XAxis dataKey="route" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '12px' }} formatter={(v: any) => [`${v} km/L`, 'Efficiency']} />
                                <Bar dataKey="efficiency" fill="#F59E0B" radius={[6, 6, 0, 0]}>
                                    {fuelEfficiency.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </SectionCard>

                {/* Carbon Emissions */}
                <SectionCard title={`Carbon Emissions (Total: ${totalCO2.toFixed(0)} kg CO₂)`} icon={Leaf} color="text-emerald-600">
                    {co2ByVehicle.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-8">No emission data available yet.</p>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={160}>
                                <PieChart>
                                    <Pie data={co2ByVehicle} cx="50%" cy="50%" outerRadius={65} paddingAngle={3} dataKey="co2">
                                        {co2ByVehicle.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '12px' }} formatter={(v: any) => [`${v} kg CO₂`, '']} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="grid grid-cols-2 gap-1.5 mt-2">
                                {co2ByVehicle.map((d, i) => (
                                    <div key={d.name} className="flex items-center gap-2 text-xs">
                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                        <span className="text-slate-600 dark:text-slate-400 truncate">{d.name}</span>
                                        <span className="font-bold text-slate-900 dark:text-white ml-auto">{d.co2}kg</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </SectionCard>
            </div>

            {/* Detailed Vehicle Metrics Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-600" /> Vehicle Financial Summary
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Vehicle</th>
                                <th>Trips</th>
                                <th>Revenue</th>
                                <th>Fuel Cost</th>
                                <th>Maintenance</th>
                                <th>Net Profit</th>
                                <th>ROI</th>
                                <th>Health</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehicleROI.map(v => (
                                <tr key={v.name}>
                                    <td className="font-semibold text-slate-900 dark:text-white">{v.name}</td>
                                    <td>{v.trips}</td>
                                    <td className="text-emerald-600 font-medium">${v.revenue.toLocaleString()}</td>
                                    <td className="text-amber-600">${v.fuel.toLocaleString()}</td>
                                    <td className="text-red-500">${v.maintenance.toLocaleString()}</td>
                                    <td className={`font-bold ${v.revenue - v.fuel - v.maintenance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                        ${(v.revenue - v.fuel - v.maintenance).toLocaleString()}
                                    </td>
                                    <td>
                                        <span className={`font-bold ${v.roi >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{v.roi}%</span>
                                    </td>
                                    <td>
                                        {(() => {
                                            const vh = vehicles.find(x => x.name === v.name);
                                            return <span className={`font-bold ${(vh?.healthScore || 0) >= 80 ? 'text-emerald-600' : (vh?.healthScore || 0) >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{vh?.healthScore || 0}%</span>;
                                        })()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
