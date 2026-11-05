import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useDashboardStore = create(
  persist(
    (set) => ({
      // 1. Global Pricing State
      globalPricing: {
        diagnosticFee: 50.0,
        laborRate: 65.0,
        emergencyMultiplier: 1.5,
      },

      // 2. Spare Parts Catalog State
      spareParts: [
        { sku: 'PRT-001', name: 'R410A Refrigerant Gas (1kg)', category: 'HVAC', cost: 35.0, markup: 40, active: true },
        { sku: 'PRT-045', name: 'LG DirectDrive Drain Pump OEM', category: 'Washing Machines', cost: 65.0, markup: 45, active: true },
        { sku: 'PRT-092', name: 'Panasonic AC Thermistor Sensor', category: 'HVAC', cost: 18.0, markup: 100, active: true },
        { sku: 'PRT-108', name: 'Samsung Inverter Compressor Relay', category: 'Refrigerators', cost: 42.0, markup: 50, active: true },
      ],

      // 3. Smart Orders State
      orders: [
        { id: 'ORD-882', customer: 'Sarah Lee', appliance: 'LG Washing Machine', issue: 'Water not draining (Error OE)', location: 'Ampang Jaya', aiEstimate: 145.0, status: 'PENDING', assignedTech: 'Unassigned' },
        { id: 'ORD-883', customer: 'Ahmad Faiz', appliance: 'Panasonic AC (1.5HP)', issue: 'Not cooling, blinking timer light', location: 'Cheras', aiEstimate: 220.0, status: 'DISPATCHED', assignedTech: 'T-104 (hafiz)' },
        { id: 'ORD-884', customer: 'Jason Chong', appliance: 'Samsung Refrigerator', issue: 'Freezer icing up, warm fridge compartment', location: 'Setapak', aiEstimate: 180.0, status: 'COMPLETED', assignedTech: 'T-092 (kenneth)' },
        { id: 'ORD-885', customer: 'Nurul Izzah', appliance: 'Daikin Inverter AC', issue: 'Water leaking from indoor blower unit', location: 'Bukit Bintang', aiEstimate: 130.0, status: 'PENDING', assignedTech: 'Unassigned' },
      ],

      // 4. Field Technicians State
      technicians: [
        { code: 'T-104', name: 'Hafiz Rahman', specialty: 'HVAC & Air Conditioning', zone: 'Cheras / Ampang', rating: 4.9, completedJobs: 142, status: 'ON_JOB' },
        { code: 'T-092', name: 'Kenneth Lim', specialty: 'Refrigerators & Washers', zone: 'Setapak / Wangsa Maju', rating: 4.8, completedJobs: 118, status: 'AVAILABLE' },
        { code: 'T-118', name: 'Rajan Subramaniam', specialty: 'Heavy Appliances & PCB', zone: 'Petaling Jaya', rating: 4.7, completedJobs: 94, status: 'AVAILABLE' },
        { code: 'T-125', name: 'Daniel Tan', specialty: 'HVAC & Smart Diagnostics', zone: 'Kuala Lumpur Center', rating: 4.9, completedJobs: 165, status: 'OFFLINE' },
      ],

      // 5. AI Diagnostics Logs State
      diagnosticsLogs: [
        { id: 'DIAG-401', timestamp: '10 mins ago', appliance: 'LG Front Load Washer', symptoms: 'Loud grinding noise during spin cycle + OE error code', predictedFault: 'Blocked Drain Pump / Worn Drum Bearing', confidence: 94, recommendedPart: 'PRT-045', estCost: 'RM 140 - RM 175' },
        { id: 'DIAG-402', timestamp: '38 mins ago', appliance: 'Panasonic 1.5HP Split AC', symptoms: 'Outdoor compressor clicks on then shuts off after 5 seconds', predictedFault: 'Faulty Thermistor / Capacitor Degradation', confidence: 89, recommendedPart: 'PRT-092', estCost: 'RM 180 - RM 240' },
        { id: 'DIAG-403', timestamp: '2 hours ago', appliance: 'Samsung Twin Cooling Fridge', symptoms: 'Ice buildup on evaporator fan cover, warm lower shelf', predictedFault: 'Defrost Heater & Relay Assembly Failure', confidence: 91, recommendedPart: 'PRT-108', estCost: 'RM 160 - RM 210' },
      ],

      // Actions
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
          spareParts: [...state.spareParts, newPart],
        })),

      dispatchTechnician: (orderId, techCode) =>
        set((state) => {
          const tech = state.technicians.find((t) => t.code.toUpperCase() === techCode.toUpperCase());
          const techLabel = tech ? `${tech.code} (${tech.name.split(' ')[0].toLowerCase()})` : techCode;
          return {
            orders: state.orders.map((ord) =>
              ord.id.toUpperCase() === orderId.toUpperCase()
                ? { ...ord, status: 'DISPATCHED', assignedTech: techLabel }
                : ord
            ),
            technicians: state.technicians.map((t) =>
              t.code.toUpperCase() === techCode.toUpperCase() ? { ...t, status: 'ON_JOB' } : t
            ),
          };
        }),

      updateOrderStatus: (orderId, status) =>
        set((state) => ({
          orders: state.orders.map((ord) =>
            ord.id.toUpperCase() === orderId.toUpperCase() ? { ...ord, status } : ord
          ),
        })),

      toggleTechnicianAvailability: (code) =>
        set((state) => ({
          technicians: state.technicians.map((t) => {
            if (t.code !== code) return t;
            const nextStatus = t.status === 'AVAILABLE' ? 'OFFLINE' : 'AVAILABLE';
            return { ...t, status: nextStatus };
          }),
        })),

      addDiagnosticLog: (log) =>
        set((state) => ({
          diagnosticsLogs: [log, ...state.diagnosticsLogs],
        })),
    }),
    {
      name: 'cyberhub-dashboard-state-v1',
    }
  )
);