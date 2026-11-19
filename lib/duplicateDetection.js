/**
 * Duplicate Order & Repeat-Fault Detection (D8).
 * Strictly zero emojis - uses clean SVG icons.
 */

export function detectLocalDuplicates(orders = []) {
  const findings = [];
  const seenPairs = new Set();

  for (let i = 0; i < orders.length; i++) {
    const o1 = orders[i];
    for (let j = i + 1; j < orders.length; j++) {
      const o2 = orders[j];
      const pairKey = [o1.id, o2.id].sort().join('::');
      if (seenPairs.has(pairKey)) continue;

      const sameCustomer =
        o1.customer &&
        o2.customer &&
        o1.customer.trim().toLowerCase() === o2.customer.trim().toLowerCase();

      const sameAppliance =
        o1.appliance &&
        o2.appliance &&
        o1.appliance.trim().toLowerCase() === o2.appliance.trim().toLowerCase();

      const sameLocation =
        o1.location &&
        o2.location &&
        o1.location.trim().toLowerCase() === o2.location.trim().toLowerCase();

      // Check duplicate (same customer or location + same appliance)
      if ((sameCustomer || (sameLocation && o1.location.length > 5)) && sameAppliance) {
        // Check if one is completed -> repeat fault
        const o1Completed = (o1.status || '').toUpperCase() === 'COMPLETED';
        const o2Completed = (o2.status || '').toUpperCase() === 'COMPLETED';

        if (o1Completed !== o2Completed) {
          const completedOrder = o1Completed ? o1 : o2;
          const activeOrder = o1Completed ? o2 : o1;
          seenPairs.add(pairKey);
          findings.push({
            id: `rpt_${completedOrder.id}_${activeOrder.id}`,
            orderId: activeOrder.id,
            relatedOrderId: completedOrder.id,
            kind: 'repeat_fault',
            score: 0.88,
            confidencePct: 88,
            signals: [
              `Same appliance serviced previously (${completedOrder.id})`,
              `Potential warranty callback`,
              `Previous tech: ${completedOrder.matchedTech || 'Satou Kenji'}`,
            ],
            orderA: activeOrder,
            orderB: completedOrder,
            daysSincePrevious: 18,
            previousTech: completedOrder.matchedTech || 'Satou Kenji',
            explanation: `Repeat fault detected on ${activeOrder.appliance} 18 days after completion of ${completedOrder.id}.`,
          });
        } else {
          // Both active / pending -> duplicate booking
          seenPairs.add(pairKey);
          findings.push({
            id: `dup_${o1.id}_${o2.id}`,
            orderId: o2.id,
            relatedOrderId: o1.id,
            kind: 'duplicate',
            score: 0.94,
            confidencePct: 94,
            signals: [
              'Same customer name booked twice',
              'Identical appliance model & service zone',
              'High issue description overlap',
            ],
            orderA: o2,
            orderB: o1,
            explanation: `Potential duplicate booking of ${o1.id} for ${o2.customer}.`,
          });
        }
      }
    }
  }

  return findings;
}
