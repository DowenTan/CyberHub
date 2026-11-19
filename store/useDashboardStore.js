import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  getGlobalPricing,
  updateGlobalPricing as apiUpdateGlobalPricing,
  getSpareParts,
  createSparePart as apiCreateSparePart,
  updateSparePart as apiUpdateSparePart,
  deleteSparePart as apiDeleteSparePart,
  getTechnicians,
  createTechnician as apiCreateTechnician,
  updateTechnician as apiUpdateTechnician,
  deleteTechnician as apiDeleteTechnician,
  getOrders,
  createOrder as apiCreateOrder,
  updateOrder as apiUpdateOrder,
  deleteOrder as apiDeleteOrder,
  assignDispatch,
  listAdminUsers,
  updateAdminUser,
  listCustomers,
  createCustomer as apiCreateCustomer,
  updateCustomer as apiUpdateCustomer,
  listAuditLogs,
  undoAuditLogAction,
  recordAuditEvent,
} from '../lib/api';
import { useAuthStore } from './useAuthStore';
import {
  INITIAL_GLOBAL_PRICING,
  INITIAL_ORDERS,
  INITIAL_TECHNICIANS,
  INITIAL_SPARE_PARTS,
  INITIAL_CUSTOMERS,
  INITIAL_ADMINS,
  INITIAL_AUDIT_LOGS,
  generateGoogleStrongPassword,
} from './initialDbData';

const createAuditEntry = (action, target, details, revertData = null) => {
  let actorName = 'Super Admin';
  let actorEmail = 'admin@cyberhub.com';
  let actorRole = 'super_admin';
  let actorId = 'usr-current';

  try {
    const authState = useAuthStore?.getState ? useAuthStore.getState() : null;
    if (authState) {
      const profile = authState.profile;
      const user = authState.user;
      if (profile?.full_name || user?.user_metadata?.full_name) {
        actorName = profile?.full_name || user?.user_metadata?.full_name;
      } else if (profile?.email || user?.email) {
        actorName = profile?.email || user?.email;
      }
      if (profile?.email || user?.email) {
        actorEmail = profile?.email || user?.email;
      }
      if (profile?.roles?.[0]) {
        actorRole = profile?.roles[0];
      }
      if (user?.id || profile?.id) {
        actorId = user?.id || profile?.id;
      }
    }
  } catch {
    // defaults
  }

  const now = new Date();
  const timeStr = now.toISOString().slice(0, 19).replace('T', ' ');
  const id = `LOG-${Date.now().toString().slice(-6)}`;

  return {
    id,
    time: timeStr,
    actorName,
    actorEmail,
    actorRole,
    actorId,
    action,
    actionLabel: action.replace(/\./g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    target: String(target || 'System Record'),
    details: typeof details === 'string' ? details : JSON.stringify(details),
    status: 'applied',
    reversible: Boolean(revertData),
    revertData,
    revertedAt: null,
    revertedBy: null,
    isCurrentUser: true,
  };
};

const normalizeCerts = (rawCertifications, rawCerts) => {
  let certString = '';
  if (typeof rawCertifications === 'string' && rawCertifications.trim()) {
    certString = rawCertifications.trim();
  } else if (Array.isArray(rawCertifications) && rawCertifications.length > 0) {
    certString = rawCertifications
      .map((c) => (typeof c === 'string' ? c : c.title || c.name || ''))
      .filter(Boolean)
      .join(', ');
  } else if (typeof rawCerts === 'string' && rawCerts.trim()) {
    certString = rawCerts.trim();
  }

  const certArray = certString
    ? certString
        .split(/[,•|]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((title) => ({
          title,
          status: 'verified',
          issuer: 'CyberHub Academy',
        }))
    : [];

  return { certs: certString, certifications: certArray };
};

export const useDashboardStore = create(
  persist(
    (set, get) => ({
      userProfile: {
        username: 'Super Admin',
        role: 'Superadmin',
        email: 'admin@cyberhub.my',
        avatarUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        avatarFrame: 'neon-orange',
        password: 'Admin@CyberHub2026!',
      },

      globalPricing: INITIAL_GLOBAL_PRICING,
      spareParts: INITIAL_SPARE_PARTS,
      orders: INITIAL_ORDERS,
      technicians: INITIAL_TECHNICIANS,
      customers: [],
      admins: INITIAL_ADMINS,
      auditLogs: [],

      selectedRecord: null,
      setSelectedRecord: (record) => set({ selectedRecord: record }),
      clearSelectedRecord: () => set({ selectedRecord: null }),

      diagnosticsLogs: [
        { id: 'DIAG-401', time: '2026-05-10 14:50', appliance: 'LG Front Load Washer', symptoms: 'Loud grinding noise during spin cycle + OE error', predictedFault: 'Blocked Drain Pump / Worn Bearing', confidence: 94, recommendedPart: 'PRT-045', estCost: 155 },
        { id: 'DIAG-402', time: '2026-05-10 14:20', appliance: 'Panasonic 1.5HP Split AC', symptoms: 'Outdoor compressor clicks off after 5 seconds', predictedFault: 'Faulty Thermistor / Capacitor', confidence: 89, recommendedPart: 'PRT-092', estCost: 210 },
        { id: 'DIAG-403', time: '2026-05-10 12:30', appliance: 'Samsung Twin Cooling Fridge', symptoms: 'Ice buildup on evaporator fan cover', predictedFault: 'Defrost Heater & Relay Failure', confidence: 91, recommendedPart: 'PRT-108', estCost: 185 },
        { id: 'DIAG-404', time: '2026-05-10 10:15', appliance: 'Daikin 2.0HP Inverter AC', symptoms: 'Louvers stuck midway + blinking green LED', predictedFault: 'Stepper Louver Motor Jam', confidence: 96, recommendedPart: 'PRT-115', estCost: 140 },
        { id: 'DIAG-405', time: '2026-05-10 09:05', appliance: 'Bosch Series 6 Dishwasher', symptoms: 'E24 drainage fault code on display', predictedFault: 'Siphon Filter & Drain Hose Blockage', confidence: 92, recommendedPart: 'PRT-045', estCost: 160 },
      ],

      // Safe API fetcher that retrieves data through typed FastAPI backend endpoints
      fetchSupabaseData: async () => {
        try {
          // 1. Fetch Global Pricing Settings
          let globalSet = null;
          try {
            globalSet = await getGlobalPricing();
          } catch {
            /* ignore API error */
          }
          if (globalSet) {
            set((state) => ({
              globalPricing: {
                diagnosticFee: Number(globalSet.diagnostic_fee ?? state.globalPricing.diagnosticFee),
                laborRate: Number(globalSet.standard_labor_rate ?? state.globalPricing.laborRate),
                emergencyMultiplier: Number(globalSet.emergency_multiplier ?? state.globalPricing.emergencyMultiplier),
              },
            }));
          }

          // 2. Fetch Spare Parts Catalog
          let parts = null;
          try {
            parts = await getSpareParts();
          } catch {
            /* ignore API error */
          }
          if (parts && parts.length > 0) {
            set({
              spareParts: parts.map((p) => {
                const cost = Number(p.supplier_cost ?? p.cost ?? 0);
                const markup = Number(p.markup_percentage ?? p.markup ?? 0);
                return {
                  sku: p.sku || p.part_sku || 'PRT-000',
                  name: p.name || p.part_name || 'Component',
                  category: p.category || 'General',
                  cost,
                  markup,
                  finalPrice: Number(p.final_price ?? (cost * (1 + markup / 100))),
                  active: p.is_active ?? p.active ?? true,
                  time: (p.created_at || p.time || '').slice(0, 16).replace('T', ' ') || '2026-05-01 09:00',
                };
              }),
            });
          }

          // 3. Fetch Repair Requests (Orders)
          let reqs = null;
          try {
            reqs = await getOrders();
          } catch {
            /* ignore API error */
          }

          if (reqs && reqs.length > 0) {
            const FALLBACK_TECHS = [
              { name: 'Sarah Izzah', code: 'T-001', zone: 'Kuala Lumpur (Cheras / Ampang / Bukit Bintang)' },
              { name: 'Jason Rahman', code: 'T-002', zone: 'Selangor (Petaling Jaya / Subang Jaya / Sunway)' },
              { name: 'Nurul Hakim', code: 'T-003', zone: 'Selangor (Shah Alam / Klang / Kota Kemuning)' },
              { name: 'Kelvin Kaur', code: 'T-004', zone: 'Penang (Georgetown / Bayan Lepas / Butterworth)' },
              { name: 'Farah Hassan', code: 'T-005', zone: 'Johor (Johor Bahru / Iskandar Puteri / Skudai)' },
              { name: 'Hafiz Aziz', code: 'T-006', zone: 'Selangor (Cyberjaya / Putrajaya / Puchong)' },
              { name: 'Satou Kenji', code: 'T-007', zone: 'Kuala Lumpur (Bangsar / Mont Kiara / Damansara)' },
            ];

            set({
              orders: reqs.map((r, idx) => {
                const applianceStr = r.appliance || (r.appliances
                  ? `${r.appliances.brand || ''} ${r.appliances.model || r.appliances.category || 'Appliance'}`.trim()
                  : (r.appliance_name || 'Home Appliance'));
                const bookingCode = r.id && String(r.id).startsWith('ORD-')
                  ? r.id
                  : (r.booking_number
                    ? (r.booking_number.startsWith('CH-') ? `ORD-${r.booking_number.slice(3, 9).toUpperCase()}` : r.booking_number)
                    : `ORD-${String(r.id || '').slice(0, 4).toUpperCase()}`);

                const urgencyVal = (r.urgency || 'NORMAL').toUpperCase();
                const priorityVal = r.priority || (urgencyVal === 'CRITICAL' ? 'Critical' : urgencyVal === 'URGENT' ? 'High' : 'Normal');
                const partsStockVal = r.partsStock || r.parts_stock || (urgencyVal === 'LOW' ? 'Order Required' : 'Van Stocked');

                const fb = FALLBACK_TECHS[idx % FALLBACK_TECHS.length];
                const rawMatched = r.matchedTech || r.matched_tech || '';
                const rawAssigned = r.assignedTech || r.assigned_tech_code || '';
                const validMatched = rawMatched && !rawMatched.toLowerCase().includes('auto-dispatched');
                const validAssigned = rawAssigned && !rawAssigned.toLowerCase().includes('auto-dispatched');

                const matchedTechVal = validMatched ? rawMatched : (validAssigned ? rawAssigned : fb.name);
                const matchedTechCodeVal = r.matchedTechCode || r.matched_tech_code || fb.code;
                const matchedTechZoneVal = r.matchedTechZone || r.matched_tech_zone || r.location || fb.zone;
                const assignedTechVal = validAssigned ? rawAssigned : matchedTechVal;

                const dateStr = r.created_at || r.time || '';
                let dateCat = 'Today';
                if (dateStr) {
                  const d = new Date(dateStr);
                  const now = new Date();
                  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
                  if (diffDays === 0) dateCat = 'Today';
                  else if (diffDays === 1) dateCat = 'Yesterday';
                  else if (diffDays <= 7) dateCat = 'This Week';
                  else dateCat = 'Earlier';
                }

                return {
                  id: bookingCode,
                  raw_id: r.id || r.raw_id,
                  customer: r.customer || r.profiles?.full_name || r.customer_name || 'Walk-In Customer',
                  appliance: applianceStr || 'Home Appliance',
                  issue: r.issue || r.issue_title || r.issue_description || 'Service Request',
                  location: r.location || r.city_zone || 'Klang Valley',
                  urgency: urgencyVal,
                  priority: priorityVal,
                  partsStock: partsStockVal,
                  matchedTech: matchedTechVal,
                  matchedTechCode: matchedTechCodeVal,
                  matchedTechZone: matchedTechZoneVal,
                  dateCategory: dateCat,
                  aiEstimate: Number(r.aiEstimate ?? r.ai_estimate ?? 165.0),
                  status: (r.status || 'PENDING').toUpperCase(),
                  assignedTech: assignedTechVal,
                  time: (r.created_at || r.time || '').slice(0, 16).replace('T', ' ') || '2026-11-08 15:00',
                };
              }),
            });
          }

          // 4. Fetch Technicians Roster
          let techs = null;
          try {
            techs = await getTechnicians();
          } catch {
            /* ignore API error */
          }

          if (techs && techs.length > 0) {
            const MALAYSIAN_NAMES = [
              'Mohd Faris bin Azman', 'Chong Wei Ming', 'Kavitha Rajan',
              'Ahmad Syakir bin Rosli', 'Lucas Tan Kai Wen', 'Nur Aishah binti Ismail',
              'Daniel Lee Zhi Hao', 'Siti Sarah binti Yusof', 'Vikram Nair'
            ];

            set((state) => ({
              technicians: techs.map((t) => {
                const techId = t.id;
                const techCode = t.employee_code || t.code || (techId ? `T-${techId}` : 'T-000');
                const existing = state.technicians?.find((ex) => (ex.code || '').toUpperCase() === techCode.toUpperCase());
                let name = (t.full_name || t.name || '').trim();
                if (!name || name === techCode || name.startsWith('T-') || name.startsWith('TECH-') || /^\d+$/.test(name) || name.toLowerCase().includes('technician (')) {
                  const digits = String(techCode).replace(/\D/g, '') || String(techId || '0');
                  name = MALAYSIAN_NAMES[parseInt(digits, 10) % MALAYSIAN_NAMES.length];
                }
                const rawPhone = t.phone_number || t.phoneNumber || existing?.phoneNumber || '+60123456789';
                const phone = String(rawPhone).replace(/\s+/g, '');
                const zone = t.zone || existing?.zone || 'Klang Valley';
                let certsNormalized = 'EPA Universal 608 Certified';
                const rawC = t.certifications || t.certs;
                if (Array.isArray(rawC)) {
                  const list = rawC.map(c => (typeof c === 'object' ? (c.title || c.name || '') : String(c))).filter(Boolean);
                  if (list.length) certsNormalized = list.join(', ');
                } else if (typeof rawC === 'string' && rawC.trim()) {
                  certsNormalized = rawC.trim();
                } else if (t.bio && t.bio.includes('Primary Certifications:')) {
                  certsNormalized = t.bio.replace('Primary Certifications:', '').trim();
                }

                const { certs: safeCerts, certifications: safeCertArray } = normalizeCerts(t.certifications, certsNormalized);

                // Preserve manually typed password and Tech ID email
                const password = t.password || existing?.password || generateGoogleStrongPassword();
                const email = (t.email || existing?.email || `${techCode.toLowerCase()}@cyberhub.com`).toLowerCase();

                return {
                  id: techId,
                  code: techCode,
                  time: (t.created_at || t.time || '').slice(0, 16).replace('T', ' ') || '2026-05-01 08:30',
                  name,
                  email,
                  password,
                  specialty: t.specialty || existing?.specialty || 'HVAC Specialist',
                  zone,
                  phoneNumber: phone,
                  customerComment: t.customerComment || t.customer_comment || 'Arrived on time and resolved the fault efficiently. Highly recommended!',
                  customerCommentAuthor: t.customerCommentAuthor || t.customer_comment_author || 'Verified Customer',
                  customerCommentRating: Number(t.customerCommentRating ?? t.customer_comment_rating ?? 5.0),
                  rating: Number(t.average_rating ?? t.rating ?? 4.8),
                  completedJobs: Number(t.completed_jobs ?? t.completedJobs ?? 0),
                  status: (t.availability_status || t.status || 'AVAILABLE').toUpperCase(),
                  avatar: t.avatar_url || t.avatar || '/logo1.png',
                  avatar_url: t.avatar_url || t.avatar || '/logo1.png',
                  certs: safeCerts,
                  certifications: safeCertArray,
                };
              }),
            }));
          }

          // 5. Fetch Customers (strictly from Database)
          try {
            const custs = await listCustomers();
            set({
              customers: Array.isArray(custs)
                ? custs.map((c) => ({
                    id: c.id,
                    name: c.full_name || c.name || 'Valued Customer',
                    email: c.email || '',
                    password: c.password || generateGoogleStrongPassword(),
                    phone: c.phone || '+60 12-345 6789',
                    city: c.city || 'Klang Valley',
                    address: c.address || 'Klang Valley, Malaysia',
                    totalOrders: Number(c.total_orders ?? c.totalOrders ?? 0),
                    totalSpend: Number(c.total_spend ?? c.totalSpend ?? 0),
                    segment: c.value_segment || c.segment || 'STANDARD',
                    riskEvaluation: c.risk_evaluation || c.riskEvaluation || 'LOW_RISK_LEGITIMATE',
                    status: c.account_status || c.status || 'active',
                    lastActive: c.last_active || c.lastActive || 'Recently',
                    createdAt: c.created_at || c.createdAt || '2026-01-01',
                  }))
                : [],
            });
          } catch {
            set({ customers: [] });
          }

          // 6. Fetch Admin Users (strictly from Database)
          try {
            const adminsList = await listAdminUsers();
            if (Array.isArray(adminsList) && adminsList.length > 0) {
              const mapped = adminsList.map((a) => {
                const adminName = a.full_name || a.name || 'Staff User';
                const defaultEmail = `${adminName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '')}@cyberhub.com`;
                return {
                  id: a.id,
                  name: adminName,
                  email: (a.email && a.email.endsWith('@cyberhub.com')) ? a.email : (a.email || defaultEmail),
                  password: a.password || generateGoogleStrongPassword(),
                  role: a.role || 'admin',
                  branchId: a.branch_id || a.branchId,
                  branchName: a.branch_name || a.branchName || 'Kuala Lumpur Central HQ',
                  status: a.account_status || a.status || 'active',
                  mfa: (a.mfa_enabled || a.role === 'super_admin') ? 'AAL2 (Enforced)' : 'AAL1 (Standard)',
                  mfaEnabled: Boolean(a.mfa_enabled || a.role === 'super_admin' || a.mfaEnabled),
                  lastLogin: (a.last_login_at || a.lastLogin || '').slice(0, 16).replace('T', ' ') || '2026-11-19 10:00',
                  createdAt: (a.created_at || a.createdAt || '').slice(0, 10) || '2026-11-01',
                };
              });

              // Check if currently authenticated session is a staff/superadmin and ensure included
              try {
                const authState = useAuthStore?.getState ? useAuthStore.getState() : null;
                const p = authState?.profile;
                const u = authState?.user;
                if (p && (p.is_super_admin || p.is_staff || p.roles?.includes('super_admin') || p.roles?.includes('admin'))) {
                  const uid = p.id || u?.id;
                  const myEmail = p.email || u?.email;
                  const already = mapped.some((x) => x.id === uid || (myEmail && x.email?.toLowerCase() === myEmail.toLowerCase()));
                  if (!already) {
                    mapped.unshift({
                      id: uid || 'usr-current',
                      name: p.full_name || u?.user_metadata?.full_name || 'Super Admin',
                      email: myEmail || 'admin@cyberhub.com',
                      password: generateGoogleStrongPassword(),
                      role: p.roles?.[0] || (p.is_super_admin ? 'super_admin' : 'admin'),
                      branchId: '00000000-0000-0000-0000-000000000101',
                      branchName: 'Kuala Lumpur Central HQ',
                      status: 'active',
                      mfa: 'AAL2 (Enforced)',
                      mfaEnabled: true,
                      lastLogin: new Date().toISOString().slice(0, 16).replace('T', ' '),
                      createdAt: '2026-11-01',
                    });
                  }
                }
              } catch {
                // ignore
              }

              set({ admins: mapped });
            }
          } catch (err) {
            console.warn('Could not sync admin users from DB:', err);
          }

          // 7. Fetch Audit Logs (strictly from Database)
          try {
            const logs = await listAuditLogs({ limit: 50 });
            set({
              auditLogs: Array.isArray(logs)
                ? logs.map((l) => ({
                    id: l.id,
                    time: (l.created_at || l.time || '').slice(0, 19).replace('T', ' '),
                    action: l.event_type || l.action || 'action',
                    actionLabel: (l.event_type || l.action || '').replace(/[._]/g, ' ').toUpperCase(),
                    actorName: l.actor_name || l.actorName || (l.actor_role === 'super_admin' ? 'Super Admin' : 'Admin'),
                    actorRole: l.actor_role || l.actorRole || 'admin',
                    target: l.target || 'System',
                    details: l.description || l.details ? (typeof l.details === 'object' ? JSON.stringify(l.details) : String(l.details)) : 'Action executed',
                    status: l.status || 'applied',
                    reversible: l.reversible !== undefined ? l.reversible : true,
                    revertData: l.details || l.revertData || null,
                    revertedAt: l.reverted_at || l.revertedAt || null,
                    revertedBy: l.reverted_by || l.revertedBy || null,
                  }))
                : [],
            });
          } catch {
            set({ auditLogs: [] });
          }
        } catch (err) {
          console.warn('Dashboard data fetch sync notice:', err);
        }
      },

      updateUserProfile: (updates) =>
        set((state) => ({ userProfile: { ...state.userProfile, ...updates } })),

      updateGlobalPricing: async (newRates) => {
        const prev = get().globalPricing || {};
        const log = createAuditEntry(
          'global_settings.pricing_update',
          'Global Pricing Matrix',
          `Updated pricing rates: ${Object.entries(newRates).map(([k, v]) => `${k}=${v}`).join(', ')}`,
          { type: 'globalPricing', key: newRates.diagnosticFee !== undefined ? 'diagnosticFee' : 'laborRate', previousValue: prev.diagnosticFee }
        );
        set((state) => ({
          globalPricing: { ...state.globalPricing, ...newRates },
          auditLogs: [log, ...(state.auditLogs || [])],
        }));
        try {
          const payload = {};
          if (newRates.diagnosticFee !== undefined) payload.diagnostic_fee = Number(newRates.diagnosticFee);
          if (newRates.laborRate !== undefined) payload.standard_labor_rate = Number(newRates.laborRate);
          if (newRates.emergencyMultiplier !== undefined) payload.emergency_multiplier = Number(newRates.emergencyMultiplier);
          if (Object.keys(payload).length > 0) {
            await apiUpdateGlobalPricing(payload);
            recordAuditEvent('global_settings.pricing_update', { target: log.target, details: log.details });
            await get().fetchSupabaseData();
          }
        } catch (e) {
          console.warn('API global pricing update notice:', e);
        }
      },

      updateSparePart: async (sku, updates) => {
        const existing = (get().spareParts || []).find((p) => p.sku.toUpperCase() === sku.toUpperCase());
        const log = createAuditEntry(
          'spare_parts.markup_update',
          `${existing?.name || sku} (${sku})`,
          `Updated spare part pricing/details (${Object.keys(updates).join(', ')})`,
          existing ? { type: 'sparePart', sku, previousMarkup: existing.markup } : null
        );
        set((state) => ({
          spareParts: state.spareParts.map((part) => {
            if (part.sku.toUpperCase() === sku.toUpperCase()) {
              const updated = { ...part, ...updates };
              const cost = updated.cost !== undefined ? Number(updated.cost) : (updated.supplier_cost !== undefined ? Number(updated.supplier_cost) : 0);
              const markup = updated.markup !== undefined ? Number(updated.markup) : (updated.markup_percentage !== undefined ? Number(updated.markup_percentage) : 0);
              updated.cost = cost;
              updated.supplier_cost = cost;
              updated.markup = markup;
              updated.markup_percentage = markup;
              updated.finalPrice = cost * (1 + markup / 100);
              updated.final_price = updated.finalPrice;
              return updated;
            }
            return part;
          }),
          auditLogs: [log, ...(state.auditLogs || [])],
        }));
        try {
          const payload = {};
          if (updates.name !== undefined) payload.name = updates.name;
          if (updates.category !== undefined) payload.category = updates.category;
          if (updates.cost !== undefined) payload.supplier_cost = Number(updates.cost);
          if (updates.markup !== undefined) payload.markup_percentage = Number(updates.markup);
          if (updates.active !== undefined) payload.is_active = updates.active;
          await apiUpdateSparePart(sku, payload);
          recordAuditEvent('spare_parts.markup_update', { target: log.target, details: log.details });
          await get().fetchSupabaseData();
        } catch (e) {
          console.warn('API spare part update notice:', e);
        }
      },

      addSparePart: async (newPart) => {
        const cost = Number(newPart.cost || 0);
        const markup = Number(newPart.markup || 0);
        const finalPrice = cost * (1 + markup / 100);
        const prepared = { ...newPart, cost, markup, finalPrice };
        const log = createAuditEntry(
          'spare_parts.create',
          `${prepared.name} (${prepared.sku})`,
          `Added new spare part ${prepared.name} (Cost: RM ${cost}, Markup: ${markup}%, Price: RM ${finalPrice.toFixed(2)})`,
          { type: 'sparePartCreate', sku: prepared.sku }
        );
        set((state) => ({
          spareParts: [prepared, ...state.spareParts],
          auditLogs: [log, ...(state.auditLogs || [])],
        }));
        try {
          const payload = {
            sku: prepared.sku,
            name: prepared.name,
            category: prepared.category || 'General',
            supplier_cost: cost,
            markup_percentage: markup,
            is_active: prepared.active ?? true,
          };
          await apiCreateSparePart(payload);
          recordAuditEvent('spare_parts.create', { target: log.target, details: log.details });
          await get().fetchSupabaseData();
        } catch (e) {
          console.warn('API insert spare part notice:', e);
        }
      },

      setSpareParts: (spareParts) => set({ spareParts }),
      setTechnicians: (newTechnicians) =>
        set((state) => ({
          technicians: (newTechnicians || []).map((t) => {
            const code = t.code || t.employee_code;
            const existing = state.technicians?.find(
              (ex) => (ex.code || '').toUpperCase() === (code || '').toUpperCase()
            );
            const { certs: safeCerts, certifications: safeCertArray } = normalizeCerts(
              t.certifications || existing?.certifications,
              t.certs || existing?.certs
            );
            return {
              ...t,
              code: code || t.code,
              password: t.password || existing?.password || generateGoogleStrongPassword(),
              email: (t.email || existing?.email || `${(code || 't-000').toLowerCase()}@cyberhub.com`).toLowerCase(),
              phoneNumber: String(t.phoneNumber || t.phone_number || existing?.phoneNumber || '+60123456789').replace(/\s+/g, ''),
              certs: safeCerts || 'EPA Universal 608 Certified',
              certifications: safeCertArray,
            };
          }),
        })),

      addOrder: async (newOrder) => {
        const orderId = newOrder.id || `ORD-${Date.now().toString().slice(-4)}`;
        const prepared = { ...newOrder, id: orderId };
        const log = createAuditEntry(
          'order.create',
          `Order ${orderId}`,
          `Created repair booking for ${prepared.appliance || 'Appliance'} (${prepared.issue || 'Service'})`,
          { type: 'orderCreate', orderId }
        );
        set((state) => ({
          orders: [prepared, ...state.orders],
          auditLogs: [log, ...(state.auditLogs || [])],
        }));
        try {
          const payload = {
            booking_number: orderId,
            appliance: prepared.appliance || 'Diagnostic Request',
            issue: prepared.issue || 'Service Order',
            urgency: (prepared.urgency || 'NORMAL').toUpperCase(),
            status: (prepared.status || 'PENDING').toUpperCase(),
          };
          await apiCreateOrder(payload);
          recordAuditEvent('order.create', { target: log.target, details: log.details });
          await get().fetchSupabaseData();
        } catch (e) {
          console.warn('API insert order notice:', e);
        }
      },

      addTechnician: async (newTech) => {
        const defaultAvatar = '/logo1.png';
        const techCode = (newTech.code || `T-${String((get().technicians?.length || 8) + 1).padStart(3, '0')}`).trim().toUpperCase();
        const techEmail = (newTech.email?.trim() || `${techCode.toLowerCase()}@cyberhub.com`).toLowerCase();
        const techPassword = newTech.password?.trim() || generateGoogleStrongPassword();
        const techPhone = String(newTech.phoneNumber || newTech.phone_number || '+60123456789').replace(/\s+/g, '');
        const { certs: safeCerts, certifications: safeCertArray } = normalizeCerts(newTech.certifications, newTech.certs);
        const prepared = {
          ...newTech,
          code: techCode,
          email: techEmail,
          password: techPassword,
          phoneNumber: techPhone,
          avatar: newTech.avatar || defaultAvatar,
          certs: safeCerts || 'EPA Universal 608 Certified',
          certifications: safeCertArray,
        };
        const log = createAuditEntry(
          'technician.create',
          `${prepared.name} (${techCode})`,
          `Registered technician ${prepared.name} (${techCode}) in ${prepared.zone || 'Klang Valley'}`,
          { type: 'technicianCreate', techCode }
        );
        set((state) => ({
          technicians: [prepared, ...state.technicians],
          auditLogs: [log, ...(state.auditLogs || [])],
        }));
        try {
          const payload = {
            code: techCode,
            name: prepared.name || `Technician ${techCode}`,
            specialty: prepared.specialty || 'HVAC Specialist',
            zone: prepared.zone || 'Klang Valley',
            phoneNumber: techPhone,
            customerComment: prepared.customerComment || prepared.customer_comment || '',
            customerCommentAuthor: prepared.customerCommentAuthor || 'Verified Customer',
            customerCommentRating: Number(prepared.customerCommentRating || 5.0),
            certs: prepared.certs || 'EPA Universal 608 Certified',
            avatar: prepared.avatar || defaultAvatar,
            rating: Number(prepared.rating || 5.0),
            completedJobs: Number(prepared.completedJobs || 0),
            status: (prepared.status || 'AVAILABLE').toUpperCase(),
          };
          await apiCreateTechnician(payload);
          recordAuditEvent('technician.create', { target: log.target, details: log.details });
          await get().fetchSupabaseData();
        } catch (e) {
          console.warn('API insert technician notice:', e);
        }
      },

      dispatchTechnician: async (orderId, techCode) => {
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
        });
        try {
          await assignDispatch(orderId, techCode);
          await get().fetchSupabaseData();
        } catch (e) {
          console.warn('API dispatch technician notice:', e);
        }
      },

      addDiagnosticLog: async (log) => {
        // Deprecated: AI assessments are managed via FastAPI backend /api/admin/diagnostics
        set((state) => ({ diagnosticsLogs: [log, ...state.diagnosticsLogs] }));
      },

      deleteOrder: async (id) => {
        const existing = (get().orders || []).find((o) => o.id === id);
        const log = createAuditEntry(
          'order.delete',
          `Order ${id}`,
          `Cancelled / deleted repair order ${id}`,
          existing ? { type: 'orderDelete', previousData: { ...existing } } : null
        );
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== id),
          auditLogs: [log, ...(state.auditLogs || [])],
        }));
        try {
          await apiDeleteOrder(id);
          recordAuditEvent('order.delete', { target: log.target, details: log.details });
          await get().fetchSupabaseData();
        } catch (e) {
          console.warn('API delete order notice:', e);
        }
      },

      updateOrder: async (id, updates) => {
        const existing = (get().orders || []).find((o) => o.id === id);
        const log = createAuditEntry(
          'order.update',
          `Order ${id}`,
          `Updated order details: ${Object.keys(updates).join(', ')}`,
          existing ? { type: 'orderUpdate', orderId: id, previousData: { ...existing } } : null
        );
        set((state) => ({
          orders: state.orders.map((o) => (o.id === id ? { ...o, ...updates } : o)),
          auditLogs: [log, ...(state.auditLogs || [])],
        }));
        try {
          const payload = {};
          if (updates.issue) payload.issue = updates.issue;
          if (updates.status) payload.status = updates.status.toUpperCase();
          if (updates.urgency) payload.urgency = updates.urgency.toUpperCase();
          if (Object.keys(payload).length > 0) {
            await apiUpdateOrder(id, payload);
          }
          recordAuditEvent('order.update', { target: log.target, details: log.details });
          await get().fetchSupabaseData();
        } catch (e) {
          console.warn('API update order notice:', e);
        }
      },

      deleteTechnician: async (code) => {
        const existing = (get().technicians || []).find((t) => t.code === code);
        const log = createAuditEntry(
          'technician.delete',
          `${existing?.name || code} (${code})`,
          `Removed technician ${existing?.name || code} from roster`,
          existing ? { type: 'technicianDelete', previousData: { ...existing } } : null
        );
        set((state) => ({
          technicians: state.technicians.filter((t) => t.code !== code),
          auditLogs: [log, ...(state.auditLogs || [])],
        }));
        try {
          await apiDeleteTechnician(code);
          recordAuditEvent('technician.delete', { target: log.target, details: log.details });
          await get().fetchSupabaseData();
        } catch (e) {
          console.warn('API delete technician notice:', e);
        }
      },

      updateTechnician: async (code, updates) => {
        const existing = (get().technicians || []).find((t) => t.code === code);
        const cleanUpdates = { ...updates };
        if (cleanUpdates.phoneNumber || cleanUpdates.phone_number) {
          const rawP = cleanUpdates.phoneNumber || cleanUpdates.phone_number;
          cleanUpdates.phoneNumber = String(rawP).replace(/\s+/g, '');
        }
        if (cleanUpdates.certifications !== undefined || cleanUpdates.certs !== undefined) {
          const { certs: safeCerts, certifications: safeCertArray } = normalizeCerts(
            cleanUpdates.certifications,
            cleanUpdates.certs
          );
          cleanUpdates.certs = safeCerts;
          cleanUpdates.certifications = safeCertArray;
        }
        const log = createAuditEntry(
          'technician.update',
          `${cleanUpdates.name || existing?.name || code} (${code})`,
          `Updated technician details: ${Object.keys(cleanUpdates).join(', ')}`,
          existing ? { type: 'technicianUpdate', techCode: code, previousData: { ...existing } } : null
        );
        set((state) => ({
          technicians: state.technicians.map((t) => (t.code === code ? { ...t, ...cleanUpdates } : t)),
          auditLogs: [log, ...(state.auditLogs || [])],
        }));
        try {
          const payload = {};
          if (cleanUpdates.name) payload.name = cleanUpdates.name;
          if (cleanUpdates.specialty) payload.specialty = cleanUpdates.specialty;
          if (cleanUpdates.zone) payload.zone = cleanUpdates.zone;
          if (cleanUpdates.phoneNumber) payload.phoneNumber = cleanUpdates.phoneNumber;
          if (cleanUpdates.password) payload.password = cleanUpdates.password;
          if (cleanUpdates.email) payload.email = cleanUpdates.email;
          if (cleanUpdates.customerComment || cleanUpdates.customer_comment) payload.customerComment = cleanUpdates.customerComment || cleanUpdates.customer_comment;
          if (cleanUpdates.customerCommentAuthor || cleanUpdates.customer_comment_author) payload.customerCommentAuthor = cleanUpdates.customerCommentAuthor || cleanUpdates.customer_comment_author;
          if (cleanUpdates.customerCommentRating || cleanUpdates.customer_comment_rating) payload.customerCommentRating = Number(cleanUpdates.customerCommentRating || cleanUpdates.customer_comment_rating);
          if (cleanUpdates.certs) payload.certs = cleanUpdates.certs;
          if (cleanUpdates.avatar) payload.avatar = cleanUpdates.avatar;
          if (cleanUpdates.rating !== undefined) payload.rating = cleanUpdates.rating;
          if (cleanUpdates.completedJobs !== undefined) payload.completedJobs = cleanUpdates.completedJobs;
          if (cleanUpdates.status) payload.status = cleanUpdates.status.toUpperCase();
          if (Object.keys(payload).length > 0) {
            await apiUpdateTechnician(code, payload);
          }
          recordAuditEvent('technician.update', { target: log.target, details: log.details });
          await get().fetchSupabaseData();
        } catch (e) {
          console.warn('API update technician notice:', e);
        }
      },

      deleteSparePart: async (sku) => {
        const existing = (get().spareParts || []).find((p) => p.sku === sku);
        const log = createAuditEntry(
          'spare_parts.delete',
          `${existing?.name || sku} (${sku})`,
          `Deleted catalog spare part ${existing?.name || sku}`,
          existing ? { type: 'sparePartDelete', previousData: { ...existing } } : null
        );
        set((state) => ({
          spareParts: state.spareParts.filter((p) => p.sku !== sku),
          auditLogs: [log, ...(state.auditLogs || [])],
        }));
        try {
          await apiDeleteSparePart(sku);
          recordAuditEvent('spare_parts.delete', { target: log.target, details: log.details });
          await get().fetchSupabaseData();
        } catch (e) {
          console.warn('API delete spare part notice:', e);
        }
      },

      deleteDiagnosticLog: async (id) => {
        // Deprecated: AI assessments are managed via FastAPI backend /api/admin/diagnostics
        set((state) => ({ diagnosticsLogs: state.diagnosticsLogs.filter((d) => d.id !== id) }));
      },

      updateDiagnosticLog: async (id, updates) => {
        // Deprecated: AI assessments are managed via FastAPI backend /api/admin/diagnostics
        set((state) => ({
          diagnosticsLogs: state.diagnosticsLogs.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        }));
      },

      // Customers Management Actions
      addCustomer: async (customer) => {
        const newRecord = {
          id: customer.id || `CUST-${1000 + (get().customers?.length || 0) + 1}`,
          name: customer.name || customer.full_name || 'Valued Customer',
          email: customer.email || '',
          password: customer.password || generateGoogleStrongPassword(),
          phone: customer.phone || '+60 12-345 6789',
          city: customer.city || 'Klang Valley',
          address: customer.address || 'Klang Valley, Malaysia',
          totalOrders: Number(customer.totalOrders || 0),
          totalSpend: Number(customer.totalSpend || 0.0),
          segment: customer.segment || 'STANDARD',
          riskEvaluation: customer.riskEvaluation || 'LOW_RISK_LEGITIMATE',
          status: customer.status || 'active',
          lastActive: 'Just now',
          createdAt: new Date().toISOString().slice(0, 10),
        };
        const log = createAuditEntry(
          'customer.create',
          `${newRecord.name} (${newRecord.id})`,
          `Created customer profile for ${newRecord.name} (${newRecord.email || newRecord.phone})`,
          { type: 'customerCreate', customerId: newRecord.id }
        );
        set((state) => ({
          customers: [newRecord, ...(state.customers || [])],
          auditLogs: [log, ...(state.auditLogs || [])],
        }));
        try {
          await apiCreateCustomer({
            full_name: newRecord.name,
            email: newRecord.email,
            phone: newRecord.phone,
            city: newRecord.city,
            address: newRecord.address,
            account_status: newRecord.status,
          });
          recordAuditEvent('customer.create', { target: log.target, details: log.details });
        } catch (e) {
          console.warn('API create customer notice:', e);
        }
      },

      updateCustomer: async (id, updates) => {
        const existing = (get().customers || []).find((c) => c.id === id);
        const log = createAuditEntry(
          'customer.update',
          `${updates.name || existing?.name || id} (${id})`,
          `Updated customer details: ${Object.keys(updates).join(', ')}`,
          existing ? { type: 'customerUpdate', customerId: id, previousData: { ...existing } } : null
        );
        set((state) => ({
          customers: (state.customers || []).map((c) =>
            c.id === id ? { ...c, ...updates, password: updates.password || c.password } : c
          ),
          auditLogs: [log, ...(state.auditLogs || [])],
        }));
        try {
          await apiUpdateCustomer(id, {
            full_name: updates.name,
            email: updates.email,
            phone: updates.phone,
            city: updates.city,
            address: updates.address,
            account_status: updates.status,
            risk_evaluation: updates.riskEvaluation,
          });
          recordAuditEvent('customer.update', { target: log.target, details: log.details });
        } catch (e) {
          console.warn('API update customer notice:', e);
        }
      },

      deleteCustomer: (id) => {
        const existing = (get().customers || []).find((c) => c.id === id);
        const log = createAuditEntry(
          'customer.delete',
          `${existing?.name || id} (${id})`,
          `Deleted customer record ${existing?.name || id}`,
          existing ? { type: 'customerDelete', previousData: { ...existing } } : null
        );
        set((state) => ({
          customers: (state.customers || []).filter((c) => c.id !== id),
          auditLogs: [log, ...(state.auditLogs || [])],
        }));
        try {
          recordAuditEvent('customer.delete', { target: log.target, details: log.details });
        } catch (e) {
          console.warn('API delete customer notice:', e);
        }
      },

      // Admins Management Actions
      addAdmin: async (admin) => {
        const state = get();
        const existing = (state.admins || []).find(
          (a) =>
            (admin.email && a.email?.toLowerCase() === admin.email.toLowerCase()) ||
            (admin.id && a.id === admin.id) ||
            (admin.name && a.name?.toLowerCase() === admin.name.toLowerCase())
        );
        if (existing) {
          console.warn('Admin already exists, preventing duplicate creation:', admin.email || admin.name);
          return existing;
        }

        const adminName = (admin.name || admin.full_name || 'Staff User').trim();
        const cleanEmail =
          admin.email ||
          `${adminName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '')}@cyberhub.com`;

        const newAdmin = {
          id: admin.id || `usr-admin-${Date.now().toString().slice(-4)}`,
          name: adminName,
          email: cleanEmail,
          password: admin.password || generateGoogleStrongPassword(),
          role: admin.role || 'admin',
          branchId: admin.branchId || null,
          branchName: admin.branchName || 'Central Branch',
          status: admin.status || 'active',
          mfa: admin.mfa || 'AAL1 (Standard)',
          mfaEnabled: Boolean(admin.mfaEnabled),
          lastLogin: 'Never',
          createdAt: new Date().toISOString().slice(0, 10),
        };
        const log = createAuditEntry(
          'admin.create',
          `${newAdmin.name} (${newAdmin.id})`,
          `Invited staff user ${newAdmin.name} (${newAdmin.email}) with role ${newAdmin.role}`,
          { type: 'adminCreate', adminId: newAdmin.id }
        );
        set((s) => ({
          admins: [newAdmin, ...(s.admins || [])],
          auditLogs: [log, ...(s.auditLogs || [])],
        }));
        try {
          recordAuditEvent('admin.create', { target: log.target, details: log.details });
        } catch (e) {
          console.warn('API record admin audit notice:', e);
        }
        return newAdmin;
      },

      updateAdmin: async (id, updates) => {
        const existing = (get().admins || []).find((a) => a.id === id);
        const log = createAuditEntry(
          'admin.update',
          `${updates.name || existing?.name || id} (${id})`,
          `Updated staff credentials for ${updates.name || existing?.name || id} (${Object.keys(updates).join(', ')})`,
          existing ? { type: 'adminUpdate', adminId: id, previousData: { ...existing } } : null
        );
        set((state) => ({
          admins: (state.admins || []).map((a) =>
            a.id === id ? { ...a, ...updates, password: updates.password || a.password } : a
          ),
          auditLogs: [log, ...(state.auditLogs || [])],
        }));
        try {
          await updateAdminUser(id, {
            role: updates.role,
            branch_id: updates.branchId,
            account_status: updates.status,
          });
          recordAuditEvent('admin.update', { target: log.target, details: log.details });
        } catch (e) {
          console.warn('API update admin notice:', e);
        }
      },

      deleteAdmin: (id) => {
        const existing = (get().admins || []).find((a) => a.id === id);
        const log = createAuditEntry(
          'admin.delete',
          `${existing?.name || id} (${id})`,
          `Deleted staff account ${existing?.name || id}`,
          existing ? { type: 'adminDelete', previousData: { ...existing } } : null
        );
        set((state) => ({
          admins: (state.admins || []).filter((a) => a.id !== id),
          auditLogs: [log, ...(state.auditLogs || [])],
        }));
        try {
          recordAuditEvent('admin.delete', { target: log.target, details: log.details });
        } catch (e) {
          console.warn('API delete admin notice:', e);
        }
      },

      addAuditLog: (entry) => {
        const formatted = {
          ...entry,
          id: entry.id || `LOG-${Date.now().toString().slice(-6)}`,
          time: entry.time || new Date().toISOString().slice(0, 19).replace('T', ' '),
          status: entry.status || 'applied',
          isCurrentUser: entry.isCurrentUser ?? true,
        };
        set((s) => ({ auditLogs: [formatted, ...(s.auditLogs || [])] }));
      },

      // Audit Logs & One-Click Undo Action
      undoLogAction: async (logId) => {
        const state = get();
        const targetLog = (state.auditLogs || []).find((l) => l.id === logId);
        if (!targetLog || !targetLog.reversible || targetLog.status === 'reverted') return false;

        // 1. Perform revert on associated domain store
        const revert = targetLog.revertData;
        if (revert) {
          if (revert.type === 'globalPricing' && revert.key) {
            set((s) => ({
              globalPricing: { ...s.globalPricing, [revert.key]: revert.previousValue },
            }));
          } else if (revert.type === 'sparePart' && revert.sku) {
            set((s) => ({
              spareParts: s.spareParts.map((p) =>
                p.sku === revert.sku
                  ? { ...p, markup: revert.previousMarkup, finalPrice: Number(p.cost * (1 + revert.previousMarkup / 100)) }
                  : p
              ),
            }));
          } else if (revert.type === 'sparePartCreate' && revert.sku) {
            set((s) => ({ spareParts: (s.spareParts || []).filter((p) => p.sku !== revert.sku) }));
          } else if (revert.type === 'sparePartDelete' && revert.previousData) {
            set((s) => ({ spareParts: [revert.previousData, ...(s.spareParts || [])] }));
          } else if (revert.type === 'orderStatus' && revert.orderId) {
            set((s) => ({
              orders: s.orders.map((o) => (o.id === revert.orderId ? { ...o, status: revert.previousStatus } : o)),
            }));
          } else if (revert.type === 'orderCreate' && revert.orderId) {
            set((s) => ({ orders: (s.orders || []).filter((o) => o.id !== revert.orderId) }));
          } else if (revert.type === 'orderUpdate' && revert.orderId && revert.previousData) {
            set((s) => ({ orders: (s.orders || []).map((o) => (o.id === revert.orderId ? { ...revert.previousData } : o)) }));
          } else if (revert.type === 'orderDelete' && revert.previousData) {
            set((s) => ({ orders: [revert.previousData, ...(s.orders || [])] }));
          } else if (revert.type === 'orderDispatch' && revert.orderId) {
            set((s) => ({
              orders: s.orders.map((o) =>
                o.id === revert.orderId
                  ? { ...o, assignedTech: revert.previousTech || 'Unassigned', matchedTech: revert.previousTech || 'Unassigned' }
                  : o
              ),
            }));
          } else if (revert.type === 'adminRole' && revert.adminId) {
            set((s) => ({
              admins: (s.admins || []).map((a) => (a.id === revert.adminId ? { ...a, role: revert.previousRole } : a)),
            }));
          } else if (revert.type === 'adminCreate' && revert.adminId) {
            set((s) => ({ admins: (s.admins || []).filter((a) => a.id !== revert.adminId) }));
          } else if (revert.type === 'adminUpdate' && revert.adminId && revert.previousData) {
            set((s) => ({ admins: (s.admins || []).map((a) => (a.id === revert.adminId ? { ...revert.previousData } : a)) }));
          } else if (revert.type === 'adminDelete' && revert.previousData) {
            set((s) => ({ admins: [revert.previousData, ...(s.admins || [])] }));
          } else if (revert.type === 'customerStatus' && revert.customerId) {
            set((s) => ({
              customers: (s.customers || []).map((c) =>
                c.id === revert.customerId ? { ...c, status: revert.previousStatus, segment: revert.previousSegment || c.segment } : c
              ),
            }));
          } else if (revert.type === 'customerCreate' && revert.customerId) {
            set((s) => ({ customers: (s.customers || []).filter((c) => c.id !== revert.customerId) }));
          } else if (revert.type === 'customerUpdate' && revert.customerId && revert.previousData) {
            set((s) => ({ customers: (s.customers || []).map((c) => (c.id === revert.customerId ? { ...revert.previousData } : c)) }));
          } else if (revert.type === 'customerDelete' && revert.previousData) {
            set((s) => ({ customers: [revert.previousData, ...(s.customers || [])] }));
          } else if (revert.type === 'technicianCreate' && revert.techCode) {
            set((s) => ({ technicians: (s.technicians || []).filter((t) => t.code !== revert.techCode) }));
          } else if (revert.type === 'technicianUpdate' && revert.techCode && revert.previousData) {
            set((s) => ({ technicians: (s.technicians || []).map((t) => (t.code === revert.techCode ? { ...revert.previousData } : t)) }));
          } else if (revert.type === 'technicianDelete' && revert.previousData) {
            set((s) => ({ technicians: [revert.previousData, ...(s.technicians || [])] }));
          }
        }

        // 2. Mark the log reverted
        let reverterName = state.userProfile?.username || 'Super Admin';
        let reverterEmail = 'admin@cyberhub.com';
        let reverterRole = 'super_admin';
        let reverterId = 'usr-current';

        try {
          const authState = useAuthStore?.getState ? useAuthStore.getState() : null;
          if (authState) {
            const profile = authState.profile;
            const user = authState.user;
            if (profile?.full_name || user?.user_metadata?.full_name) {
              reverterName = profile?.full_name || user?.user_metadata?.full_name;
            } else if (profile?.email || user?.email) {
              reverterName = profile?.email || user?.email;
            }
            if (profile?.email || user?.email) {
              reverterEmail = profile?.email || user?.email;
            }
            if (profile?.roles?.[0]) {
              reverterRole = profile?.roles[0];
            }
            if (user?.id || profile?.id) {
              reverterId = user?.id || profile?.id;
            }
          }
        } catch {
          // ignore
        }

        const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const undoneLog = {
          ...targetLog,
          status: 'reverted',
          revertedAt: nowStr,
          revertedBy: reverterName,
          revertedByRole: reverterRole,
          revertedByEmail: reverterEmail,
          revertedById: reverterId,
        };

        // 3. Insert compensating log
        const compensatingLog = {
          id: `LOG-UNDO-${Date.now().toString().slice(-6)}`,
          time: nowStr,
          action: `${targetLog.action || 'action'}.revert`,
          actionLabel: 'Reverted Action',
          actorName: reverterName,
          actorRole: reverterRole,
          actorEmail: reverterEmail,
          actorId: reverterId,
          target: targetLog.target || 'System Record',
          details: `Undid [${targetLog.id}] (${targetLog.action || 'action'}): reverted by ${reverterName} (${reverterRole}) - restored previous state`,
          status: 'applied',
          reversible: false,
          revertData: null,
          revertedAt: null,
          revertedBy: null,
          isCurrentUser: true,
        };

        set((s) => ({
          auditLogs: [compensatingLog, ...s.auditLogs.map((l) => (l.id === logId ? undoneLog : l))],
        }));

        // 4. Send undo to backend asynchronously
        try {
          await undoAuditLogAction(logId);
        } catch (err) {
          console.warn('Backend undo audit log notice:', err);
        }
        return true;
      },
    }),
    {
      name: 'cyberhub-dashboard-state-v16',
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.userProfile?.username || state.userProfile.username === 'Admin_KiaYu' || state.userProfile.username === 'Tan Kia Yu') {
            state.userProfile = {
              ...state.userProfile,
              username: 'Super Admin',
              role: 'Superadmin',
              email: 'admin@cyberhub.my',
              avatarFrame: state.userProfile?.avatarFrame || 'neon-orange',
            };
          }
          if (!state.orders || state.orders.length < 10 || state.orders.some((o) => o.id === 'ORD-882')) {
            state.orders = INITIAL_ORDERS;
          }
          if (!state.technicians || state.technicians.length < 100) {
            state.technicians = INITIAL_TECHNICIANS;
          }
          if (!state.spareParts || state.spareParts.length < 10 || state.spareParts.some((p) => p.cost === undefined)) {
            state.spareParts = INITIAL_SPARE_PARTS;
          }
          if (!state.globalPricing) {
            state.globalPricing = INITIAL_GLOBAL_PRICING;
          }
          if (!state.customers) {
            state.customers = [];
          }
          if (!state.admins || state.admins.length === 0 || state.admins.some((a) => a.id === 'usr-admin-1')) {
            state.admins = INITIAL_ADMINS;
          }
          if (!state.auditLogs) {
            state.auditLogs = [];
          }
        }
      },
    }
  )
);
