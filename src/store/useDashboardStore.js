import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useDashboardStore = create(
  persist(
    (set) => ({
      userProfile: {
        username: 'Tan Kia Yu',
        role: 'Lead Dispatch Supervisor',
        email: 'tan.kiayu@cyberhub.my',
        avatarUrl:
          'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkfWqPyP7NACihrv0Co-eBcCSwXtcfzBBbrijdzccchojCUZ7t_M_oJrA&s=10',
        avatarFrame: 'neon-orange',
        password: 'admin123',
      },

      globalPricing: {
        diagnosticFee: 50.0,
        laborRate: 65.0,
        emergencyMultiplier: 1.5,
      },

      spareParts: [
        { sku: 'PRT-001', time: '2026-05-01 09:00', name: 'R410A Refrigerant Gas (1kg)', category: 'HVAC', cost: 35.0, markup: 40, active: true },
        { sku: 'PRT-045', time: '2026-05-02 11:30', name: 'LG DirectDrive Drain Pump OEM', category: 'Washing Machines', cost: 65.0, markup: 45, active: true },
        { sku: 'PRT-092', time: '2026-05-03 14:15', name: 'Panasonic AC Thermistor Sensor', category: 'HVAC', cost: 18.0, markup: 100, active: true },
        { sku: 'PRT-108', time: '2026-05-04 16:40', name: 'Samsung Inverter Compressor Relay', category: 'Refrigerators', cost: 42.0, markup: 50, active: true },
        { sku: 'PRT-115', time: '2026-05-05 10:20', name: 'Daikin Stepper Louver Motor', category: 'HVAC', cost: 28.0, markup: 60, active: true },
      ],

      orders: [
        { id: 'ORD-882', time: '2026-05-10 09:15', customer: 'Sarah Lee', appliance: 'LG Washing Machine', issue: 'Water not draining (Error OE)', location: 'Ampang Jaya', aiEstimate: 145.0, status: 'PENDING', assignedTech: 'Unassigned' },
        { id: 'ORD-883', time: '2026-05-10 10:30', customer: 'Ahmad Faiz', appliance: 'Panasonic AC (1.5HP)', issue: 'Not cooling, blinking timer light', location: 'Cheras', aiEstimate: 220.0, status: 'DISPATCHED', assignedTech: 'T-104 (hafiz)' },
        { id: 'ORD-884', time: '2026-05-10 11:45', customer: 'Jason Chong', appliance: 'Samsung Refrigerator', issue: 'Freezer icing up, warm fridge', location: 'Setapak', aiEstimate: 180.0, status: 'COMPLETED', assignedTech: 'T-092 (kenneth)' },
        { id: 'ORD-885', time: '2026-05-10 13:20', customer: 'Nurul Izzah', appliance: 'Daikin Inverter AC', issue: 'Water leaking from indoor blower', location: 'Bukit Bintang', aiEstimate: 130.0, status: 'PENDING', assignedTech: 'Unassigned' },
        { id: 'ORD-886', time: '2026-05-10 15:05', customer: 'Kelvin Tan', appliance: 'Hitachi Side-by-Side Fridge', issue: 'Compressor humming loudly', location: 'Petaling Jaya', aiEstimate: 260.0, status: 'PENDING', assignedTech: 'Unassigned' },
      ],

      technicians: [
        { code: 'T-104', time: '2026-05-10 08:00', name: 'Hafiz Rahman', specialty: 'HVAC & Air Conditioning', zone: 'Cheras / Ampang', rating: 4.9, completedJobs: 142, status: 'ON_JOB' },
        { code: 'T-092', time: '2026-05-10 08:30', name: 'Kenneth Lim', specialty: 'Refrigerators & Washers', zone: 'Setapak / Wangsa Maju', rating: 4.8, completedJobs: 118, status: 'AVAILABLE' },
        { code: 'T-118', time: '2026-05-10 09:00', name: 'Rajan Subramaniam', specialty: 'Heavy Appliances & PCB', zone: 'Petaling Jaya', rating: 4.7, completedJobs: 94, status: 'AVAILABLE' },
        { code: 'T-125', time: '2026-05-10 09:15', name: 'Daniel Tan', specialty: 'HVAC & Smart Diagnostics', zone: 'Kuala Lumpur Center', rating: 4.9, completedJobs: 165, status: 'OFFLINE' },
      ],

      diagnosticsLogs: [
        { id: 'DIAG-401', time: '2026-05-10 14:50', appliance: 'LG Front Load Washer', symptoms: 'Loud grinding noise during spin cycle + OE error', predictedFault: 'Blocked Drain Pump / Worn Bearing', confidence: 94, recommendedPart: 'PRT-045', estCost: 155 },
        { id: 'DIAG-402', time: '2026-05-10 14:20', appliance: 'Panasonic 1.5HP Split AC', symptoms: 'Outdoor compressor clicks off after 5 seconds', predictedFault: 'Faulty Thermistor / Capacitor', confidence: 89, recommendedPart: 'PRT-092', estCost: 210 },
        { id: 'DIAG-403', time: '2026-05-10 12:30', appliance: 'Samsung Twin Cooling Fridge', symptoms: 'Ice buildup on evaporator fan cover', predictedFault: 'Defrost Heater & Relay Failure', confidence: 91, recommendedPart: 'PRT-108', estCost: 185 },
        { id: 'DIAG-404', time: '2026-05-10 10:15', appliance: 'Daikin 2.0HP Inverter AC', symptoms: 'Louvers stuck midway + blinking green LED', predictedFault: 'Stepper Louver Motor Jam', confidence: 96, recommendedPart: 'PRT-115', estCost: 140 },
        { id: 'DIAG-405', time: '2026-05-10 09:05', appliance: 'Bosch Series 6 Dishwasher', symptoms: 'E24 drainage fault code on display', predictedFault: 'Siphon Filter & Drain Hose Blockage', confidence: 92, recommendedPart: 'PRT-045', estCost: 160 },
      ],

      updateUserProfile: (updates) =>
        set((state) => ({ userProfile: { ...state.userProfile, ...updates } })),

      updateGlobalPricing: (newRates) =>
        set((state) => ({ globalPricing: { ...state.globalPricing, ...newRates } })),

      updateSparePart: (sku, updates) =>
        set((state) => ({
          spareParts: state.spareParts.map((part) =>
            part.sku.toUpperCase() === sku.toUpperCase() ? { ...part, ...updates } : part
          ),
        })),

      addSparePart: (newPart) =>
        set((state) => ({ spareParts: [newPart, ...state.spareParts] })),

      addOrder: (newOrder) =>
        set((state) => ({ orders: [newOrder, ...state.orders] })),

      addTechnician: (newTech) =>
        set((state) => ({ technicians: [newTech, ...state.technicians] })),

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

      addDiagnosticLog: (log) =>
        set((state) => ({ diagnosticsLogs: [log, ...state.diagnosticsLogs] })),
    }),
    {
      name: 'cyberhub-dashboard-state-v3',
      onRehydrateStorage: () => (state) => {
        if (state && (!state.userProfile?.username || state.userProfile.username === 'Admin_KiaYu')) {
          state.userProfile = {
            ...state.userProfile,
            username: 'Tan Kia Yu',
            role: 'Lead Dispatch Supervisor',
            email: 'tan.kiayu@cyberhub.my',
            avatarUrl:
              'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkfWqPyP7NACihrv0Co-eBcCSwXtcfzBBbrijdzccchojCUZ7t_M_oJrA&s=10',
          };
        }
      },
    }
  )
);