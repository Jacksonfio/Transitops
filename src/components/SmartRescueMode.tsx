import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Truck, User, AlertTriangle, CheckCircle, Clock, DollarSign,
  Shield, Fuel, Wrench, Phone, Mail, RefreshCw, Zap,
  ArrowRight, X, Check, AlertCircle, Info
} from 'lucide-react';
import { useApp } from '../context';

type ProblemType = 'vehicle_breakdown' | 'driver_unavailable' | 'cargo_overload' | 'maintenance_conflict' | 'license_expired';

interface RecoveryAction {
  id: string;
  type: string;
  description: string;
  icon: any;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  details?: string;
}

interface RecoveryPlan {
  id: string;
  problemType: ProblemType;
  problemDescription: string;
  affectedTripId?: string;
  vehicleId?: string;
  driverId?: string;
  actions: RecoveryAction[];
  estimatedRevenueSaved: number;
  estimatedTimeDelay: number;
  createdAt: Date;
}

export default function SmartRescueMode() {
  const { vehicles, drivers, trips, resolveAlert, updateTrip, addNotification } = useApp();
  const [isActive, setIsActive] = useState(false);
  const [currentProblem, setCurrentProblem] = useState<any>(null);
  const [recoveryPlan, setRecoveryPlan] = useState<RecoveryPlan | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);

  // Simulate problem detection
  const detectProblem = (type: ProblemType) => {
    let problem = null;

    switch (type) {
      case 'vehicle_breakdown':
        const vehicleWithIssue = vehicles.find(v => v.status === 'On Trip');
        if (vehicleWithIssue) {
          problem = {
            type: 'vehicle_breakdown',
            description: `Vehicle breakdown detected: ${vehicleWithIssue.name}`,
            vehicle: vehicleWithIssue,
            trip: trips.find(t => t.vehicleId === vehicleWithIssue.id && t.status === 'Dispatched')
          };
        }
        break;

      case 'driver_unavailable':
        const driverWithIssue = drivers.find(d => d.status === 'On Trip');
        if (driverWithIssue) {
          problem = {
            type: 'driver_unavailable',
            description: `Driver unavailable: ${driverWithIssue.name}`,
            driver: driverWithIssue,
            trip: trips.find(t => t.driverId === driverWithIssue.id && t.status === 'Dispatched')
          };
        }
        break;

      case 'cargo_overload':
        const overloadedTrip = trips.find(t => t.status === 'Draft' && t.cargoWeight > 1000);
        if (overloadedTrip) {
          const vehicle = vehicles.find(v => v.id === overloadedTrip.vehicleId);
          problem = {
            type: 'cargo_overload',
            description: `Cargo overload: ${overloadedTrip.cargoWeight}kg exceeds vehicle capacity`,
            trip: overloadedTrip,
            vehicle,
            cargoWeight: overloadedTrip.cargoWeight,
            vehicleCapacity: vehicle?.loadCapacity || 1000
          };
        }
        break;

      case 'maintenance_conflict':
        const maintenanceTrip = trips.find(t => t.status === 'Dispatched');
        if (maintenanceTrip) {
          const vehicle = vehicles.find(v => v.id === maintenanceTrip.vehicleId);
          problem = {
            type: 'maintenance_conflict',
            description: `Vehicle entered maintenance: ${vehicle?.name}`,
            trip: maintenanceTrip,
            vehicle
          };
        }
        break;

      case 'license_expired':
        const driverWithExpiredLicense = drivers.find(d => d.licenseExpiry && new Date(d.licenseExpiry) < new Date());
        if (driverWithExpiredLicense) {
          problem = {
            type: 'license_expired',
            description: `License expired: ${driverWithExpiredLicense.name}`,
            driver: driverWithExpiredLicense,
            trip: trips.find(t => t.driverId === driverWithExpiredLicense.id && t.status === 'Dispatched')
          };
        }
        break;
    }

    setCurrentProblem(problem);
    if (problem) {
      generateRecoveryPlan(problem);
    }
    return problem;
  };

  // Generate recovery plan based on problem type
  const generateRecoveryPlan = (problem: any): RecoveryPlan => {
    const actions: RecoveryAction[] = [];
    let estimatedRevenueSaved = 0;
    let estimatedTimeDelay = 0;

    switch (problem.type) {
      case 'vehicle_breakdown':
        const replacementVehicle = vehicles.find(v =>
          v.id !== problem.vehicle.id &&
          v.status === 'Available' &&
          v.loadCapacity >= (problem.trip?.cargoWeight || 0)
        );

        if (replacementVehicle) {
          actions.push({
            id: '1',
            type: 'vehicle_reassignment',
            description: `Assign replacement vehicle: ${replacementVehicle.name}`,
            icon: Truck,
            status: 'pending',
            details: `Capacity: ${replacementVehicle.loadCapacity}kg, Status: ${replacementVehicle.healthScore}% health`
          });
          estimatedRevenueSaved = problem.trip?.revenue || 0;
          estimatedTimeDelay = 30;
        }

        actions.push({
          id: '2',
          type: 'driver_notification',
          description: 'Notify driver of vehicle change',
          icon: Phone,
          status: 'pending',
          details: 'Send SMS and app notification'
        });

        actions.push({
          id: '3',
          type: 'dashboard_update',
          description: 'Update dashboard and trip status',
          icon: RefreshCw,
          status: 'pending'
        });

        break;

      case 'driver_unavailable':
        const replacementDriver = drivers.find(d =>
          d.id !== problem.driver.id &&
          d.status === 'Available' &&
          d.licenseExpiry && new Date(d.licenseExpiry) > new Date()
        );

        if (replacementDriver) {
          actions.push({
            id: '1',
            type: 'driver_reassignment',
            description: `Assign replacement driver: ${replacementDriver.name}`,
            icon: User,
            status: 'pending',
            details: `Safety Score: ${replacementDriver.safetyScore}, License: Valid`
          });
          estimatedRevenueSaved = problem.trip?.revenue || 0;
          estimatedTimeDelay = 15;
        }

        actions.push({
          id: '2',
          type: 'customer_notification',
          description: 'Notify customer of driver change',
          icon: Mail,
          status: 'pending'
        });

        break;

      case 'cargo_overload':
        const vehicle1 = vehicles.find(v => v.status === 'Available' && v.loadCapacity >= 500);
        const vehicle2 = vehicles.find(v => v.status === 'Available' && v.loadCapacity >= 350 && v.id !== vehicle1?.id);

        if (vehicle1 && vehicle2) {
          actions.push({
            id: '1',
            type: 'cargo_split',
            description: 'Split cargo into two trips',
            icon: Truck,
            status: 'pending',
            details: `Trip A: 500kg → ${vehicle1.name}, Trip B: 350kg → ${vehicle2.name}`
          });

          actions.push({
            id: '2',
            type: 'create_trip_a',
            description: 'Create Trip A (500kg)',
            icon: CheckCircle,
            status: 'pending'
          });

          actions.push({
            id: '3',
            type: 'create_trip_b',
            description: 'Create Trip B (350kg)',
            icon: CheckCircle,
            status: 'pending'
          });

          estimatedRevenueSaved = (problem.trip?.revenue || 0) * 1.2; // Extra revenue from split
          estimatedTimeDelay = 45;
        }

        break;

      case 'maintenance_conflict':
        const altVehicle = vehicles.find(v =>
          v.id !== problem.vehicle.id &&
          v.status === 'Available' &&
          v.loadCapacity >= (problem.trip?.cargoWeight || 0)
        );

        if (altVehicle) {
          actions.push({
            id: '1',
            type: 'vehicle_reassignment',
            description: `Reassign to: ${altVehicle.name}`,
            icon: Truck,
            status: 'pending',
            details: `Cancel original assignment, assign new vehicle`
          });
          estimatedRevenueSaved = problem.trip?.revenue || 0;
          estimatedTimeDelay = 20;
        }

        actions.push({
          id: '2',
          type: 'reschedule_maintenance',
          description: 'Reschedule maintenance to next window',
          icon: Wrench,
          status: 'pending'
        });

        actions.push({
          id: '3',
          type: 'notify_all',
          description: 'Notify driver and customer',
          icon: Mail,
          status: 'pending'
        });

        break;

      case 'license_expired':
        const altDriver = drivers.find(d =>
          d.id !== problem.driver.id &&
          d.status === 'Available' &&
          d.licenseExpiry &&
          new Date(d.licenseExpiry) > new Date()
        );

        if (altDriver) {
          actions.push({
            id: '1',
            type: 'driver_reassignment',
            description: `Assign licensed driver: ${altDriver.name}`,
            icon: User,
            status: 'pending',
            details: `License valid until: ${new Date(altDriver.licenseExpiry).toLocaleDateString()}`
          });
          estimatedRevenueSaved = problem.trip?.revenue || 0;
          estimatedTimeDelay = 10;
        }

        break;
    }

    const plan: RecoveryPlan = {
      id: `recovery-${Date.now()}`,
      problemType: problem.type,
      problemDescription: problem.description,
      affectedTripId: problem.trip?.id,
      vehicleId: problem.vehicle?.id,
      driverId: problem.driver?.id,
      actions,
      estimatedRevenueSaved,
      estimatedTimeDelay,
      createdAt: new Date()
    };

    setRecoveryPlan(plan);
    return plan;
  };

  // Execute recovery plan
  const executeRecoveryPlan = async () => {
    if (!recoveryPlan) return;

    setIsExecuting(true);
    setExecutionProgress(0);

    // Simulate execution with progress
    for (let i = 0; i < recoveryPlan.actions.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setExecutionProgress(((i + 1) / recoveryPlan.actions.length) * 100);

      // Update action status
      setRecoveryPlan(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          actions: prev.actions.map((action, idx) =>
            idx === i ? { ...action, status: 'completed' as const } : action
          )
        };
      });
    }

    // Apply changes
    if (recoveryPlan.affectedTripId && recoveryPlan.problemType !== 'cargo_overload') {
      updateTrip(recoveryPlan.affectedTripId, {
        status: 'Dispatched',
      });
    }

    // Add notification
    addNotification({
      title: 'Smart Rescue Executed',
      message: `Recovery plan completed. Revenue saved: $${recoveryPlan.estimatedRevenueSaved.toLocaleString()}`,
      severity: 'Info',
      category: 'System',
      resolved: false,
    });

    setIsExecuting(false);
    setTimeout(() => {
      setIsActive(false);
      setCurrentProblem(null);
      setRecoveryPlan(null);
      setExecutionProgress(0);
    }, 2000);
  };

  const getProblemIcon = (type: ProblemType) => {
    switch (type) {
      case 'vehicle_breakdown': return <Truck className="w-6 h-6" />;
      case 'driver_unavailable': return <User className="w-6 h-6" />;
      case 'cargo_overload': return <AlertTriangle className="w-6 h-6" />;
      case 'maintenance_conflict': return <Wrench className="w-6 h-6" />;
      case 'license_expired': return <Shield className="w-6 h-6" />;
    }
  };

  const getProblemColor = (type: ProblemType) => {
    switch (type) {
      case 'vehicle_breakdown': return 'text-[#FF3D00]';
      case 'driver_unavailable': return 'text-[#FFB300]';
      case 'cargo_overload': return 'text-[#FF6B00]';
      case 'maintenance_conflict': return 'text-purple-400';
      case 'license_expired': return 'text-red-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Smart Rescue Mode Toggle */}
      <div className="bg-[#1A1A1A] dark:bg-[#0A0A0A] rounded-2xl p-6 border border-[#2A2A2A]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#FF6B00]/10">
              <Zap className="w-6 h-6 text-[#FF6B00]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Smart Rescue Mode</h3>
              <p className="text-sm text-[#B0B0B0]">AI-powered automatic problem recovery system</p>
            </div>
          </div>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
              isActive
                ? 'bg-[#00C853] text-white hover:bg-[#00C853]/80'
                : 'bg-[#FF6B00] text-black hover:bg-[#FF8C00]'
            }`}
          >
            {isActive ? 'Active' : 'Activate'}
          </button>
        </div>

        {/* Demo Scenarios */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 pt-6 border-t border-[#2A2A2A]"
          >
            <p className="text-xs font-semibold text-[#B0B0B0] uppercase tracking-wider mb-3">
              Demo Scenarios
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <button
                onClick={() => detectProblem('vehicle_breakdown')}
                className="p-3 rounded-xl bg-[#FF3D00]/10 border border-[#FF3D00]/30 hover:border-[#FF3D00]/60 transition-all text-left"
              >
                <Truck className="w-5 h-5 text-[#FF3D00] mb-2" />
                <p className="text-xs font-semibold text-white">Vehicle Breakdown</p>
              </button>
              <button
                onClick={() => detectProblem('driver_unavailable')}
                className="p-3 rounded-xl bg-[#FFB300]/10 border border-[#FFB300]/30 hover:border-[#FFB300]/60 transition-all text-left"
              >
                <User className="w-5 h-5 text-[#FFB300] mb-2" />
                <p className="text-xs font-semibold text-white">Driver Unavailable</p>
              </button>
              <button
                onClick={() => detectProblem('cargo_overload')}
                className="p-3 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/30 hover:border-[#FF6B00]/60 transition-all text-left"
              >
                <AlertTriangle className="w-5 h-5 text-[#FF6B00] mb-2" />
                <p className="text-xs font-semibold text-white">Cargo Overload</p>
              </button>
              <button
                onClick={() => detectProblem('maintenance_conflict')}
                className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:border-purple-500/60 transition-all text-left"
              >
                <Wrench className="w-5 h-5 text-purple-400 mb-2" />
                <p className="text-xs font-semibold text-white">Maintenance Conflict</p>
              </button>
              <button
                onClick={() => detectProblem('license_expired')}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 hover:border-red-500/60 transition-all text-left"
              >
                <Shield className="w-5 h-5 text-red-400 mb-2" />
                <p className="text-xs font-semibold text-white">License Expired</p>
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Problem Detection & Recovery Panel */}
      <AnimatePresence>
        {currentProblem && recoveryPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#1A1A1A] dark:bg-[#0A0A0A] rounded-2xl border border-[#FF3D00]/30 overflow-hidden"
          >
            {/* Problem Header */}
            <div className="bg-[#FF3D00]/10 px-6 py-4 border-b border-[#FF3D00]/30">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-[#FF3D00]/20 ${getProblemColor(currentProblem.type)}`}>
                  {getProblemIcon(currentProblem.type)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">Problem Detected</h3>
                  <p className="text-sm text-[#B0B0B0]">{currentProblem.description}</p>
                </div>
                <button
                  onClick={() => {
                    setCurrentProblem(null);
                    setRecoveryPlan(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[#B0B0B0]" />
                </button>
              </div>
            </div>

            {/* Recovery Plan */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-[#FF6B00]" />
                <h4 className="text-base font-bold text-white">AI Recovery Plan</h4>
              </div>

              {/* Impact Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-[#00C853]/10 border border-[#00C853]/30 rounded-xl p-4">
                  <DollarSign className="w-5 h-5 text-[#00C853] mb-2" />
                  <p className="text-xs text-[#B0B0B0] mb-1">Revenue Saved</p>
                  <p className="text-lg font-bold text-[#00C853]">
                    ${recoveryPlan.estimatedRevenueSaved.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#FF6B00]/10 border border-[#FF6B00]/30 rounded-xl p-4">
                  <Clock className="w-5 h-5 text-[#FF6B00] mb-2" />
                  <p className="text-xs text-[#B0B0B0] mb-1">Time Delay</p>
                  <p className="text-lg font-bold text-[#FF6B00]">
                    {recoveryPlan.estimatedTimeDelay} min
                  </p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                  <CheckCircle className="w-5 h-5 text-purple-400 mb-2" />
                  <p className="text-xs text-[#B0B0B0] mb-1">Actions Required</p>
                  <p className="text-lg font-bold text-purple-400">
                    {recoveryPlan.actions.length}
                  </p>
                </div>
              </div>

              {/* Recovery Actions */}
              <div className="space-y-3 mb-6">
                {recoveryPlan.actions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-start gap-4 p-4 rounded-xl border ${
                        action.status === 'completed'
                          ? 'bg-[#00C853]/10 border-[#00C853]/30'
                          : action.status === 'in_progress'
                          ? 'bg-[#FF6B00]/10 border-[#FF6B00]/30'
                          : 'bg-[#1A1A1A] border-[#2A2A2A]'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        action.status === 'completed'
                          ? 'bg-[#00C853]/20'
                          : action.status === 'in_progress'
                          ? 'bg-[#FF6B00]/20'
                          : 'bg-[#2A2A2A]'
                      }`}>
                        {action.status === 'completed' ? (
                          <Check className="w-5 h-5 text-[#00C853]" />
                        ) : action.status === 'in_progress' ? (
                          <RefreshCw className="w-5 h-5 text-[#FF6B00] animate-spin" />
                        ) : (
                          <Icon className="w-5 h-5 text-[#B0B0B0]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white mb-1">
                          {action.description}
                        </p>
                        {action.details && (
                          <p className="text-xs text-[#B0B0B0]">{action.details}</p>
                        )}
                      </div>
                      {action.status === 'completed' && (
                        <CheckCircle className="w-5 h-5 text-[#00C853]" />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Execution Progress */}
              {isExecuting && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#B0B0B0]">Executing Recovery Plan...</span>
                    <span className="text-xs font-bold text-[#FF6B00]">{Math.round(executionProgress)}%</span>
                  </div>
                  <div className="w-full bg-[#2A2A2A] rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FF8C00]"
                      initial={{ width: 0 }}
                      animate={{ width: `${executionProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!isExecuting && (
                <div className="flex gap-3">
                  <button
                    onClick={executeRecoveryPlan}
                    className="flex-1 bg-gradient-to-r from-[#FF6B00] to-[#E55F00] hover:from-[#FF8C00] hover:to-[#FF6B00] text-black rounded-xl py-3 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/20"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve Recovery
                  </button>
                  <button
                    onClick={() => {
                      setCurrentProblem(null);
                      setRecoveryPlan(null);
                    }}
                    className="px-6 py-3 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white rounded-xl font-semibold text-sm transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {isExecuting && executionProgress === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#00C853]/10 border border-[#00C853]/30 rounded-2xl p-6 text-center"
          >
            <CheckCircle className="w-12 h-12 text-[#00C853] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Recovery Successful!</h3>
            <p className="text-sm text-[#B0B0B0]">
              All operations restored. Revenue saved: ${recoveryPlan?.estimatedRevenueSaved.toLocaleString()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}