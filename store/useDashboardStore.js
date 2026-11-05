import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useDashboardStore = create(
  persist(
    (set) => ({
      // User Profile & Avatar Frame State
      userProfile: {
        username: 'Admin_KiaYu',
        role: 'System Administrator',
        email: 'admin@cyberhub.my',
        avatarUrl: '/image/MainLogo.png',
        avatarFrame: 'neon-orange',
        password: 'admin123',
      },

      // Global Pricing State
      globalPricing: {
        diagnosticFee: 50.0,
        laborRate: 65.0,
        emergencyMultiplier: 1.5,
      },

      // Spare Parts Catalog State
      spareParts: [
        { sku: 'PRT-001', name: 'R410A Refrigerant Gas (1kg)', category: 'HVAC', cost: 35.0, markup: 40, active: true, createdAt: '2026-05-01 09:00', actionLabel: 'Locked (Auto-Sync)' },
        { sku: 'PRT-045', name: 'LG DirectDrive Drain Pump OEM', category: 'Washing Machines', cost: 65.0, markup: 45, active: true, createdAt: '2026-05-02 11:20', actionLabel: 'Locked (Auto-Sync)' },
        { sku: 'PRT-092', name: 'Panasonic AC Thermistor Sensor', category: 'HVAC', cost: 18.0, markup: 100, active: true, createdAt: '2026-05-03 14:15', actionLabel: 'Locked (Auto-Sync)' },
        { sku: 'PRT-108', name: 'Samsung Inverter Compressor Relay', category: 'Refrigerators', cost: 42.0, markup: 50, active: true, createdAt: '2026-05-04 16:40', actionLabel: 'Locked (Auto-Sync)' },
        { sku: 'PRT-115', name: 'Daikin Stepper Louver Motor', category: 'HVAC', cost: 28.0, markup: 60, active: true, createdAt: '2026-05-05 10:05', actionLabel: 'Locked (Auto-Sync)' },
        { sku: 'PRT-124', name: 'Electrolux Door Interlock Switch', category: 'Washing Machines', cost: 32.0, markup: 55, active: true, createdAt: '2026-05-06 08:30', actionLabel: 'Locked (Auto-Sync)' },
      ],

      // Smart Orders State
      orders: [
        { id: 'ORD-882', customer: 'Sarah Lee', appliance: 'LG Washing Machine', issue: 'Water not draining (Error OE)', location: 'Ampang Jaya', aiEstimate: 145.0, status: 'PENDING', assignedTech: 'Unassigned', createdAt: '2026-05-06 08:15', actionLabel: 'Awaiting Auto-Dispatch' },
        { id: 'ORD-883', customer: 'Ahmad Faiz', appliance: 'Panasonic AC (1.5HP)', issue: 'Not cooling, blinking timer light', location: 'Cheras', aiEstimate: 220.0, status: 'DISPATCHED', assignedTech: 'T-104 (Hafiz)', createdAt: '2026-05-06 09:30', actionLabel: 'Tech En Route' },
        { id: 'ORD-884', customer: 'Jason Chong', appliance: 'Samsung Refrigerator', issue: 'Freezer icing up, warm fridge compartment', location: 'Setapak', aiEstimate: 180.0, status: 'COMPLETED', assignedTech: 'T-092 (Kenneth)', createdAt: '2026-05-05 15:45', actionLabel: 'Verified & Closed' },
        { id: 'ORD-885', customer: 'Nurul Izzah', appliance: 'Daikin Inverter AC', issue: 'Water leaking from indoor blower unit', location: 'Bukit Bintang', aiEstimate: 130.0, status: 'PENDING', assignedTech: 'Unassigned', createdAt: '2026-05-06 10:10', actionLabel: 'Awaiting Auto-Dispatch' },
        { id: 'ORD-886', customer: 'Kelvin Tan', appliance: 'Hitachi Side-by-Side Fridge', issue: 'Compressor humming loudly, warm interior', location: 'Petaling Jaya', aiEstimate: 260.0, status: 'PENDING', assignedTech: 'Unassigned', createdAt: '2026-05-06 11:05', actionLabel: 'Awaiting Auto-Dispatch' },
        { id: 'ORD-887', customer: 'Farah Nadia', appliance: 'Electrolux Front Load Washer', issue: 'Door locked after spin cycle', location: 'Wangsa Maju', aiEstimate: 125.0, status: 'DISPATCHED', assignedTech: 'T-118 (Rajan)', createdAt: '2026-05-06 12:20', actionLabel: 'Tech En Route' },
      ],

      // Field Technicians State
      technicians: [
        { code: 'T-104', name: 'Hafiz Rahman', specialty: 'HVAC & Air Conditioning', zone: 'Cheras / Ampang', rating: 4.9, completedJobs: 142, status: 'ON_JOB', createdAt: '2026-01-12 09:00', actionLabel: 'GPS Telemetry Active' },
        { code: 'T-092', name: 'Kenneth Lim', specialty: 'Refrigerators & Washers', zone: 'Setapak / Wangsa Maju', rating: 4.8, completedJobs: 118, status: 'AVAILABLE', createdAt: '2026-02-04 10:30', actionLabel: 'Standby Ready' },
        { code: 'T-118', name: 'Rajan Subramaniam', specialty: 'Heavy Appliances & PCB', zone: 'Petaling Jaya', rating: 4.7, completedJobs: 94, status: 'AVAILABLE', createdAt: '2026-02-19 14:15', actionLabel: 'Standby Ready' },
        { code: 'T-125', name: 'Daniel Tan', specialty: 'HVAC & Smart Diagnostics', zone: 'Kuala Lumpur Center', rating: 4.9, completedJobs: 165, status: 'OFFLINE', createdAt: '2026-03-08 08:45', actionLabel: 'Shift Ended' },
        { code: 'T-131', name: 'Amirul Hakim', specialty: 'Inverter AC & Gas Refill', zone: 'Subang / PJ', rating: 4.6, completedJobs: 81, status: 'AVAILABLE', createdAt: '2026-04-01 11:10', actionLabel: 'Standby Ready' },
      ],

      // AI Diagnostics Logs State
      diagnosticsLogs: [
        { id: 'DIAG-401', createdAt: '2026-05-06 12:40', appliance: 'LG Front Load Washer', symptoms: 'Loud grinding noise during spin cycle + OE error code', predictedFault: 'Blocked Drain Pump / Worn Drum Bearing', confidence: 94, recommendedPart: 'PRT-045', estCost: 155, actionLabel: 'Auto-Logged' },
        { id: 'DIAG-402', createdAt: '2026-05-06 11:55', appliance: 'Panasonic 1.5HP Split AC', symptoms: 'Outdoor compressor clicks on then shuts off after 5 seconds', predictedFault: 'Faulty Thermistor / Capacitor Degradation', confidence: 89, recommendedPart: 'PRT-092', estCost: 210, actionLabel: 'Auto-Logged' },
        { id: 'DIAG-403', createdAt: '2026-05-06 10:15', appliance: 'Samsung Twin Cooling Fridge', symptoms: 'Ice buildup on evaporator fan cover, warm lower shelf', predictedFault: 'Defrost Heater & Relay Assembly Failure', confidence: 91, recommendedPart: 'PRT-108', estCost: 185, actionLabel: 'Auto-Logged' },
        { id: 'DIAG-404', createdAt: '2026-05-06 09:05', appliance: 'Daikin 2.0HP Inverter AC', symptoms: 'Louvers stuck midway + blinking green LED', predictedFault: 'Stepper Louver Motor Jam', confidence: 96, recommendedPart: 'PRT-115', estCost: 140, actionLabel: 'Auto-Logged' },
        { id: 'DIAG-405', createdAt: '2026-05-05 18:20', appliance: 'Bosch Serie 6 Washer', symptoms: 'E18 error code, drum full of water', predictedFault: 'Drain Pump Impeller Blockage', confidence: 92, recommendedPart: 'PRT-045', estCost: 150, actionLabel: 'Auto-Logged' },
      ],

      // Store Mutation Actions
      updateUserProfile: (updates) =>
        set((state) => ({
          userProfile: { ...state.userProfile, ...updates },
        })),

      updateGlobalPricing: (newRates) =>
        set((state) => ({
          globalPricing: { ...state.globalPricing, ...newRates },
        })),

      updateSparePart: (sku, updates) =>
        set((state) => ({
          spareParts: state.spareParts.map((part) =>
            part.sku.toUpperCase() === sku.toUpperCase() ? { ...part, ...updates } : part
          ),
        })),

      addSparePart: (newPart) =>
        set((state) => ({
          spareParts: [newPart, ...state.spareParts],
        })),

      addOrder: (newOrder) =>
        set((state) => ({
          orders: [newOrder, ...state.orders],
        })),

      addTechnician: (newTech) =>
        set((state) => ({
          technicians: [newTech, ...state.technicians],
        })),

      addDiagnosticLog: (log) =>
        set((state) => ({
          diagnosticsLogs: [log, ...state.diagnosticsLogs],
        })),

      dispatchTechnician: (orderId, techCode) =>
        set((state) => {
          const tech = state.technicians.find((t) => t.code.toUpperCase() === techCode.toUpperCase());
          const techLabel = tech ? `${tech.code} (${tech.name.split(' ')[0]})` : techCode;
          return {
            orders: state.orders.map((ord) =>
              ord.id.toUpperCase() === orderId.toUpperCase()
                ? { ...ord, status: 'DISPATCHED', assignedTech: techLabel, actionLabel: 'Dispatched via AI' }
                : ord
            ),
            technicians: state.technicians.map((t) =>
              t.code.toUpperCase() === techCode.toUpperCase() ? { ...t, status: 'ON_JOB' } : t
            ),
          };
        }),
    }),
    {
      name: 'cyberhub-dashboard-state-v3',
    }
  )
);