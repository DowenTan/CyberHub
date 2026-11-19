/**
 * SLA Risk Prediction & Queue Prioritisation (D2 - Smart Orders).
 * Deterministic client fallback and scoring helpers.
 */

import { apiFetch } from './api.js';

const SLA_TARGETS = {
  CRITICAL: { offerMin: 15, completeHours: 4.0 },
  URGENT: { offerMin: 60, completeHours: 24.0 },
  NORMAL: { offerMin: 240, completeHours: 72.0 },
  LOW: { offerMin: 480, completeHours: 120.0 },
};

export function calculateOrderSlaRisk(order, technicians = []) {
  if (!order) return { risk: 0, band: 'low', reasons: [], suggestedAction: 'none' };

  const status = String(order.status || 'PENDING').toUpperCase();
  const urgency = String(order.urgency || 'NORMAL').toUpperCase();
  const policy = SLA_TARGETS[urgency] || SLA_TARGETS.NORMAL;

  if (status === 'COMPLETED' || status === 'CANCELLED') {
    return {
      orderId: order.id,
      risk: 0.0,
      band: 'low',
      reasons: ['Job concluded successfully.'],
      suggestedAction: 'none',
    };
  }

  let elapsedMinutes = 35.0;
  if (order.created_at) {
    try {
      const dt = new Date(order.created_at);
      elapsedMinutes = Math.max(0, (Date.now() - dt.getTime()) / 60000);
    } catch {
      // fallback
    }
  } else if (order.dateCategory === 'Yesterday') {
    elapsedMinutes = 1440.0;
  } else if (order.dateCategory === '2 Days Ago') {
    elapsedMinutes = 2880.0;
  }

  const offerElapsedPct = elapsedMinutes / policy.offerMin;
  const reasons = [];
  let baseRisk = Math.min(1.0, offerElapsedPct * 0.7);

  if (urgency === 'CRITICAL') {
    baseRisk += 0.25;
    reasons.push(`Critical urgency with ${policy.offerMin}m SLA window.`);
  } else if (urgency === 'URGENT') {
    baseRisk += 0.15;
    reasons.push(`Urgent repair with ${policy.offerMin}m SLA window.`);
  }

  const matchingTechs = (technicians || []).filter(
    (t) => String(t.status || '').toUpperCase() === 'AVAILABLE' || String(t.status || '').toUpperCase() === 'ONLINE'
  );

  if (status === 'PENDING') {
    baseRisk += 0.15;
    reasons.push(`Order unassigned (${Math.round(elapsedMinutes)}m elapsed).`);
    if (matchingTechs.length === 0) {
      baseRisk += 0.2;
      reasons.push('No active certified technicians available in zone.');
    }
  } else if (status === 'OFFERED') {
    baseRisk += 0.05;
    reasons.push('Offer pending customer confirmation.');
  }

  const finalRisk = Math.round(Math.min(1.5, baseRisk) * 100) / 100;

  let band = 'low';
  let suggestedAction = 'none';

  if (elapsedMinutes > policy.offerMin && status === 'PENDING') {
    band = 'breached';
    suggestedAction = 'escalate';
    reasons.unshift(`SLA Breached: ${Math.round(elapsedMinutes)}m elapsed vs ${policy.offerMin}m target.`);
  } else if (finalRisk >= 0.7) {
    band = 'high';
    suggestedAction = 'assign_now';
  } else if (finalRisk >= 0.35) {
    band = 'medium';
    suggestedAction = status === 'PENDING' ? 'assign_now' : 'none';
  } else {
    band = 'low';
    suggestedAction = 'none';
  }

  return {
    orderId: order.id,
    risk: finalRisk,
    band,
    reasons: reasons.slice(0, 3),
    suggestedAction,
  };
}

export async function fetchBatchSlaRisk(orders, technicians = []) {
  try {
    return await apiFetch('/api/ai/sla-risk', {
      method: 'POST',
      body: JSON.stringify({ orders, technicians }),
    });
  } catch (err) {
    return orders.map((o) => calculateOrderSlaRisk(o, technicians));
  }
}

export async function submitOrderRiskFeedback(orderId, verdict, comment = null) {
  try {
    return await apiFetch(`/api/admin/orders/${orderId}/risk-feedback`, {
      method: 'POST',
      body: JSON.stringify({ verdict, comment }),
    });
  } catch {
    return { status: 'recorded_locally' };
  }
}
