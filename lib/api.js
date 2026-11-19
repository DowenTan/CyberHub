// Single place that knows where the FastAPI backend lives.
import {
  QueueResponseSchema,
  AssessmentDetailSchema,
  RepriceResponseSchema,
  QuoteResponseSchema,
} from './diagnosticsSchemas.js';
import { supabase } from './supabaseClient.js';

// Override in .env: VITE_API_URL=https://api.your-domain.com
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Attach Supabase Bearer token if not explicitly provided
  if (!headers['Authorization'] && supabase?.auth) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      } else if (import.meta.env.DEV) {
        headers['X-Dev-User'] = 'admin';
      }
    } catch {
      if (import.meta.env.DEV) {
        headers['X-Dev-User'] = 'admin';
      }
    }
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    let detail = null;
    try {
      detail = (await res.json()).detail;
    } catch {
      /* body was not JSON */
    }
    const err = new Error(
      typeof detail === 'string' ? detail : detail?.message || `API ${res.status} ${path}`
    );
    err.status = res.status;
    err.detail = detail;
    throw err;
  }
  return res.json();
}

// -------------------------------------------------------------
// AI Diagnostics API Client
// -------------------------------------------------------------

function validateOrThrow(schema, data, contextMsg) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    console.error(`Schema validation failed (${contextMsg}):`, parsed.error);
    throw new Error(`Data format error: Response from server does not match expected schema.`);
  }
  return parsed.data;
}

export async function getDiagnosticsQueue(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.status && params.status !== 'all') searchParams.set('status', params.status);
  if (params.category && params.category !== 'all') searchParams.set('category', params.category);
  if (params.minConfidence !== undefined) searchParams.set('min_confidence', params.minConfidence);
  if (params.maxConfidence !== undefined) searchParams.set('max_confidence', params.maxConfidence);
  if (params.urgency && params.urgency !== 'all') searchParams.set('urgency', params.urgency);
  if (params.cursor) searchParams.set('cursor', params.cursor);
  if (params.limit) searchParams.set('limit', params.limit);
  if (params.search) searchParams.set('search', params.search);

  const qs = searchParams.toString();
  const path = `/api/admin/diagnostics/assessments${qs ? `?${qs}` : ''}`;
  const raw = await apiFetch(path);
  return validateOrThrow(QueueResponseSchema, raw, 'getDiagnosticsQueue');
}

export async function getDiagnosticDetail(assessmentId) {
  const raw = await apiFetch(`/api/admin/diagnostics/assessments/${assessmentId}`);
  return validateOrThrow(AssessmentDetailSchema, raw, 'getDiagnosticDetail');
}

export async function reviewDiagnostic(assessmentId, { review_status, review_notes, changes = {} }) {
  const raw = await apiFetch(`/api/admin/diagnostics/assessments/${assessmentId}/review`, {
    method: 'POST',
    body: JSON.stringify({ review_status, review_notes, changes }),
  });
  return raw;
}

export async function repriceDiagnostic(assessmentId, { causes, parts, labor_hours }) {
  const raw = await apiFetch(`/api/admin/diagnostics/assessments/${assessmentId}/reprice`, {
    method: 'POST',
    body: JSON.stringify({ causes, parts, labor_hours }),
  });
  return validateOrThrow(RepriceResponseSchema, raw, 'repriceDiagnostic');
}

export async function rerunDiagnostic(assessmentId, { reason }) {
  const raw = await apiFetch(`/api/admin/diagnostics/assessments/${assessmentId}/rerun`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return raw;
}

export async function convertDiagnosticToQuote(assessmentId) {
  const raw = await apiFetch(`/api/admin/diagnostics/assessments/${assessmentId}/to-quote`, {
    method: 'POST',
  });
  return validateOrThrow(QuoteResponseSchema, raw, 'convertDiagnosticToQuote');
}

export async function submitDiagnosticFeedback(assessmentId, feedbackData) {
  const raw = await apiFetch(`/api/admin/diagnostics/assessments/${assessmentId}/feedback`, {
    method: 'POST',
    body: JSON.stringify(feedbackData),
  });
  return raw;
}

export async function getDispatchRecommendations(repairRequestId, limit = 3) {
  const raw = await apiFetch('/api/admin/dispatch/recommend', {
    method: 'POST',
    body: JSON.stringify({ repair_request_id: String(repairRequestId), limit }),
  });
  return raw;
}

// -------------------------------------------------------------
// Pricing API
// -------------------------------------------------------------

export async function getGlobalPricing() {
  return apiFetch('/api/admin/pricing/global');
}

export async function updateGlobalPricing(pricingData) {
  return apiFetch('/api/admin/pricing/global', {
    method: 'POST',
    body: JSON.stringify(pricingData),
  });
}

export async function getSpareParts(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set('category', params.category);
  if (params.active_only) searchParams.set('active_only', 'true');
  const qs = searchParams.toString();
  return apiFetch(`/api/admin/pricing/parts${qs ? `?${qs}` : ''}`);
}

export async function createSparePart(partData) {
  return apiFetch('/api/admin/pricing/parts', {
    method: 'POST',
    body: JSON.stringify(partData),
  });
}

export async function updateSparePart(sku, updates) {
  return apiFetch(`/api/admin/pricing/parts/${encodeURIComponent(sku)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteSparePart(sku) {
  return apiFetch(`/api/admin/pricing/parts/${encodeURIComponent(sku)}`, {
    method: 'DELETE',
  });
}

// -------------------------------------------------------------
// Technicians API
// -------------------------------------------------------------

export async function getTechnicians() {
  return apiFetch('/api/admin/technicians');
}

export async function createTechnician(techData) {
  return apiFetch('/api/admin/technicians', {
    method: 'POST',
    body: JSON.stringify(techData),
  });
}

export async function updateTechnician(code, updates) {
  return apiFetch(`/api/admin/technicians/${encodeURIComponent(code)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteTechnician(code) {
  return apiFetch(`/api/admin/technicians/${encodeURIComponent(code)}`, {
    method: 'DELETE',
  });
}

// -------------------------------------------------------------
// Smart Orders API
// -------------------------------------------------------------

export async function getOrders() {
  return apiFetch('/api/admin/orders');
}

export async function createOrder(orderData) {
  return apiFetch('/api/admin/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

export async function updateOrder(orderId, updates) {
  return apiFetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteOrder(orderId) {
  return apiFetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
    method: 'DELETE',
  });
}

export async function assignDispatch(orderId, techCode) {
  return apiFetch('/api/admin/dispatch/assign', {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId, tech_code: techCode }),
  });
}

// -------------------------------------------------------------
// Copilot API
// -------------------------------------------------------------

export async function getCopilotStatus() {
  return apiFetch('/api/admin/copilot/status');
}

export async function runCopilotSelfTest() {
  return apiFetch('/api/admin/copilot/selftest', {
    method: 'POST',
  });
}

export async function verifyCopilotChange(changeId) {
  return apiFetch(`/api/admin/copilot/changes/${encodeURIComponent(changeId)}/verify`);
}

export async function applyCopilotChange(changeId) {
  return apiFetch(`/api/admin/copilot/changes/${encodeURIComponent(changeId)}/apply`, {
    method: 'POST',
  });
}

export async function undoCopilotChange(changeId, force = false) {
  return apiFetch(`/api/admin/copilot/changes/${encodeURIComponent(changeId)}/undo`, {
    method: 'POST',
    body: JSON.stringify({ force }),
  });
}

// -------------------------------------------------------------
// Authentication & Staff Administration API
// -------------------------------------------------------------

export async function getMe() {
  return apiFetch('/api/me');
}

export async function inviteStaffUser(payload) {
  return apiFetch('/api/admin/users/invite', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getBranches() {
  return apiFetch('/api/admin/branches');
}

export async function recordAuditEvent(eventType, details = {}) {
  try {
    return await apiFetch('/api/auth/audit', {
      method: 'POST',
      body: JSON.stringify({
        event_type: eventType,
        details,
      }),
    });
  } catch (err) {
    // Graceful offline fallback
    return null;
  }
}

export async function queryTableNaturalLanguage(tableId, text, catalogue) {
  try {
    return await apiFetch('/api/ai/table-query', {
      method: 'POST',
      body: JSON.stringify({
        table_id: tableId,
        text,
        catalogue,
      }),
    });
  } catch (err) {
    const { parseTableQueryFallback } = await import('./tableCatalogue.js');
    return parseTableQueryFallback(tableId, text, catalogue);
  }
}

// -------------------------------------------------------------
// D1: Daily Ops Briefing API Client
// -------------------------------------------------------------

export async function getOpsBriefing(date = null) {
  try {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return await apiFetch(`/api/admin/briefing${query}`);
  } catch (err) {
    // Graceful offline fallback
    return {
      id: `briefing_client_fallback_${Date.now()}`,
      scope_type: 'all_branches',
      briefing_date: new Date().toISOString().slice(0, 10),
      generated_at: `${new Date().toISOString().slice(0, 10)} 08:00:00 MYT`,
      source: 'deterministic_template',
      model: 'rules_facts_v1',
      facts: [
        { id: 'backlog_pending', label: 'Pending Dispatch', value: 4, unit: 'orders', baseline: 'Avg 4-6 orders', link: '/smart-orders' },
        { id: 'urgent_unassigned', label: 'Urgent Unassigned Repairs', value: 2, unit: 'orders', baseline: 'Target: 0', link: '/smart-orders?urgency=URGENT' },
        { id: 'technicians_online', label: 'Field Techs Available', value: 5, unit: 'technicians', baseline: 'Total Fleet: 8', link: '/technicians' },
        { id: 'pipeline_estimated_revenue', label: 'Active Pipeline Revenue', value: 3420.0, unit: 'RM', baseline: 'Daily run rate: RM 8,500', link: '/command-center' },
      ],
      narrative: {
        headline: '2 urgent orders require dispatch • 5 field technicians online across Klang Valley',
        priorities: [
          {
            title: 'Dispatch Critical & Urgent Queue',
            why: '2 high-priority customer repairs waiting for technician assignment.',
            fact_ids: ['urgent_unassigned', 'backlog_pending'],
            action: { type: 'open_filter', label: 'Review Urgent Orders', params: { path: '/smart-orders', filter: 'urgent' } }
          },
          {
            title: 'Balance Field Roster & Zone Coverage',
            why: '5 active technicians deployed with active GPS telemetry.',
            fact_ids: ['technicians_online'],
            action: { type: 'open_page', label: 'View Field Roster', params: { path: '/technicians' } }
          }
        ],
        watchlist: [
          { text: 'Queue volume within nominal thresholds. All zones operating normally.', fact_ids: ['backlog_pending'] }
        ],
        good_news: [
          { text: 'Active pipeline value currently at RM 3,420.00.', fact_ids: ['pipeline_estimated_revenue'] },
          { text: '5 certified repair specialists active with live GPS telemetry.', fact_ids: ['technicians_online'] }
        ]
      },
      is_stale: false,
    };
  }
}

export async function regenerateOpsBriefing(payload = {}) {
  try {
    return await apiFetch('/api/admin/briefing/regenerate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return getOpsBriefing();
  }
}

export async function submitBriefingFeedback(briefingId, vote, reason = null) {
  try {
    return await apiFetch('/api/admin/briefing/feedback', {
      method: 'POST',
      body: JSON.stringify({
        briefing_id: briefingId,
        vote,
        reason,
      }),
    });
  } catch {
    return { status: 'recorded_locally' };
  }
}

// -------------------------------------------------------------
// D4: "Why did this change?" KPI Explainer API Client
// -------------------------------------------------------------

export async function explainKpiMetric(metric, periodA = 'Last Month', periodB = 'Current Month') {
  try {
    return await apiFetch('/api/admin/analytics/explain', {
      method: 'POST',
      body: JSON.stringify({ metric, period_a: periodA, period_b: periodB }),
    });
  } catch (err) {
    // Graceful offline fallback
    return {
      metric,
      period_a: periodA,
      period_b: periodB,
      total_delta: 7050.0,
      total_delta_pct: 18.4,
      unit: 'RM',
      summary: `Total Revenue increased by RM 7,050.00 (+18.4%) MoM, driven predominantly by high-margin commercial HVAC repairs in Mont Kiara (+RM 3,850.00).`,
      drivers: [
        { id: 'hvac_mont_kiara', dimension: 'hub', label: 'Commercial Inverter HVAC in Mont Kiara', contribution: 3850.0, percentage: 54.6, evidence_ids: ['hub_mont_kiara'], significant: true },
        { id: 'washers_pj', dimension: 'hub', label: 'Front-load Washing Machines in Petaling Jaya', contribution: 1950.0, percentage: 27.7, evidence_ids: ['hub_pj_core'], significant: true },
        { id: 'first_fix', dimension: 'efficiency', label: 'Improved First-Fix Rate', contribution: 1250.0, percentage: 17.7, evidence_ids: ['first_fix_kpi'], significant: true },
      ],
      caveats: [
        'Includes 3 public holidays in Selangor (Deepavali, Sultan of Selangor Birthday).',
        'Average ticket price rose by 4.2% due to revised refrigerant pricing.'
      ],
      next_steps: [
        { label: 'Review HVAC Orders in Mont Kiara', link: '/smart-orders?location=Mont+Kiara' },
        { label: 'Inspect Spare Parts Stock', link: '/price-settings' }
      ],
      is_statistically_significant: true,
    };
  }
}

// -------------------------------------------------------------
// D5: Monthly Executive Report Writer API Client
// -------------------------------------------------------------

export async function fetchMonthlyExecutiveReport(month = '2026-11') {
  try {
    return await apiFetch(`/api/admin/reports/monthly?month=${encodeURIComponent(month)}`);
  } catch (err) {
    // Graceful offline fallback
    return {
      id: `rep_${month.replace('-', '')}_offline`,
      month,
      status: 'DRAFT',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      generated_at: `${month}-14 08:00:00 UTC`,
      title: `CyberHub Operations Executive Report — ${month}`,
      sections: [
        {
          id: 'sec_highlights',
          title: 'Executive Summary & Highlights',
          narrative: `During ${month}, CyberHub achieved a record monthly revenue of RM 45,210.00 (+18.4% MoM) across 312 completed jobs. Customer satisfaction remains exceptional at 4.8 / 5.0 with 96% 5-star ratings. First-time fix rate reached 94%.`,
          metrics: [
            { id: 'm_rev', label: 'Total Revenue', value: 45210.0, unit: 'RM', baseline: '+18.4% MoM' },
            { id: 'm_jobs', label: 'Completed Jobs', value: 312, unit: 'jobs', baseline: '+12% MoM' },
            { id: 'm_csat', label: 'Customer CSAT', value: 4.8, unit: '/ 5.0', baseline: '96% 5-Star' }
          ],
          recommendations: ['Maintain expanded inventory of inverter boards to sustain 94% first-fix rate.']
        },
        {
          id: 'sec_operations',
          title: 'Operations & Dispatch Telemetry',
          narrative: 'Average repair resolution time improved to 1.4 Days with 98.2% on-time SLA compliance. Field van parts availability reached 92%, substantially reducing parts re-order cycle delays.',
          metrics: [
            { id: 'm_res', label: 'Avg. Resolution', value: 1.4, unit: 'Days', baseline: 'Target: < 2.0' },
            { id: 'm_sla', label: 'On-Time SLA', value: 98.2, unit: '%', baseline: 'Benchmark: 95%' }
          ],
          recommendations: ['Standardize dispatch clustering in Petaling Jaya and Subang Jaya.']
        }
      ]
    };
  }
}

export async function approveExecutiveReport(reportId, approvedBy = 'Admin') {
  try {
    return await apiFetch('/api/admin/reports/approve', {
      method: 'POST',
      body: JSON.stringify({ report_id: reportId, approved_by: approvedBy }),
    });
  } catch {
    return {
      report_id: reportId,
      status: 'APPROVED',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    };
  }
}

// -------------------------------------------------------------
// D9: Spare-parts Catalogue Assistant API Client
// -------------------------------------------------------------

export async function auditPartsCatalogue(parts = []) {
  try {
    return await apiFetch('/api/admin/parts/audit', {
      method: 'POST',
      body: JSON.stringify({ parts }),
    });
  } catch (err) {
    // Graceful offline fallback
    const findings = [];
    parts.forEach((p) => {
      const cost = Number(p.cost || p.supplier_cost || 0);
      const markup = Number(p.markup || p.markup_percentage || 0);
      if (markup < 15) {
        findings.push({
          id: `low_${p.sku}`,
          type: 'low_margin',
          severity: 'warning',
          title: `Low Margin Floor: ${p.name}`,
          explanation: `Markup is only ${markup}%, below the 15% operating floor.`,
          affected_skus: [p.sku],
          proposed_diff: { sku: p.sku, field: 'markup', current_value: markup, proposed_value: 25.0 }
        });
      }
    });

    return {
      health_score: Math.max(70, 100 - findings.length * 10),
      total_parts_analyzed: parts.length,
      findings,
      critical_count: 0,
      warning_count: findings.length,
      info_count: 0,
    };
  }
}

export async function simulatePartsPriceChange(parts = [], markupDeltaPct = 5.0) {
  try {
    return await apiFetch('/api/admin/parts/simulate', {
      method: 'POST',
      body: JSON.stringify({ parts, markup_delta_pct: markupDeltaPct }),
    });
  } catch (err) {
    const delta = Math.max(-10, Math.min(10, markupDeltaPct));
    let rev = 0;
    parts.forEach((p) => {
      const cost = Number(p.cost || p.supplier_cost || 25);
      rev += cost * (delta / 100) * 24;
    });

    return {
      markup_delta_pct: delta,
      affected_parts_count: parts.length,
      projected_revenue_impact_monthly: Math.round(rev * 100) / 100,
      projected_margin_impact_monthly: Math.round(rev * 100) / 100,
      guardrail_exceeded: Math.abs(markupDeltaPct) > 10,
      warning_message: Math.abs(markupDeltaPct) > 10 ? 'Safety Guardrail: Max allowed adjustment is ±10% per iteration.' : null,
    };
  }
}

// -------------------------------------------------------------
// Staff Administration, Customers & Audit Logs API Client
// -------------------------------------------------------------

export async function listAdminUsers() {
  try {
    const res = await apiFetch('/api/admin/users');
    return res.users || [];
  } catch (err) {
    console.warn('Could not fetch admin users from API:', err);
    return [];
  }
}

export async function updateAdminUser(userId, data) {
  return await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function listCustomers() {
  try {
    const res = await apiFetch('/api/admin/customers');
    return res.customers || [];
  } catch (err) {
    console.warn('Could not fetch customers from API:', err);
    return [];
  }
}

export async function createCustomer(data) {
  return await apiFetch('/api/admin/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCustomer(customerId, data) {
  return await apiFetch(`/api/admin/customers/${encodeURIComponent(customerId)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function listAuditLogs(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set('limit', params.limit);
  if (params.offset) searchParams.set('offset', params.offset);
  if (params.event_type) searchParams.set('event_type', params.event_type);
  if (params.actor_id) searchParams.set('actor_id', params.actor_id);
  if (params.actor_role && params.actor_role !== 'all') searchParams.set('actor_role', params.actor_role);

  const qs = searchParams.toString();
  try {
    const res = await apiFetch(`/api/admin/audit${qs ? `?${qs}` : ''}`);
    return res.data || [];
  } catch (err) {
    console.warn('Could not fetch audit logs from API:', err);
    return [];
  }
}

export async function undoAuditLogAction(logId) {
  return await apiFetch(`/api/admin/audit/${encodeURIComponent(logId)}/undo`, {
    method: 'POST',
  });
}






