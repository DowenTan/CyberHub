/**
 * Table Catalogue builder for D3: "Ask the table" Natural Language Filters.
 * Builds metadata description of table columns without sending any row data or PII.
 */

export function buildTableCatalogue(columns = [], tableId = 'table') {
  const activeCols = typeof columns === 'function' ? columns('standard') : columns;

  return activeCols
    .filter((c) => c && c.key && c.key !== 'action' && c.key !== 'actions' && c.filterable !== false)
    .map((c) => {
      let inferredType = c.type;
      if (!inferredType) {
        if (c.sortType === 'alphabetical') inferredType = 'text';
        else if (c.sortType === 'numeric') inferredType = 'number';
        else if (/price|cost|estimate|fee|revenue|rate/i.test(c.key)) inferredType = 'money';
        else if (/date|time|created/i.test(c.key)) inferredType = 'date';
        else if (/status|urgency|priority|category/i.test(c.key)) inferredType = 'enum';
        else inferredType = 'text';
      }

      return {
        key: c.key,
        label: c.label || c.key,
        type: inferredType,
        enumValues: c.enumValues || (
          c.key === 'urgency' ? ['NORMAL', 'URGENT', 'CRITICAL', 'LOW'] :
          c.key === 'status' ? ['PENDING', 'OFFERED', 'DISPATCHED', 'IN_TRANSIT', 'ON_JOB', 'COMPLETED', 'CANCELLED', 'AVAILABLE', 'OFFLINE'] :
          c.key === 'partsStock' ? ['Van Stocked', 'Order Required', 'Regional Hub'] :
          undefined
        ),
        synonyms: c.synonyms || [],
        filterable: true,
      };
    });
}

/**
 * Deterministic client-side fallback query parser (used if backend is offline or unreachable).
 */
export function parseTableQueryFallback(tableId, text, catalogue = []) {
  if (!text || !text.trim()) {
    return {
      table_id: tableId,
      interpretation: 'No filter entered',
      filters: [],
      ambiguities: [],
    };
  }

  const query = text.trim().slice(0, 300);
  const words = query.toLowerCase();
  const filters = [];
  const parts = [];

  // Urgency & Priority
  const urgencyCol = catalogue.find((c) => c.key.toLowerCase() === 'urgency');
  if (urgencyCol) {
    if (/emergency|critical|kecemasan|kritikal|紧急/i.test(words)) {
      filters.push({ column: urgencyCol.key, op: 'in', value: 'CRITICAL' });
      parts.push(`${urgencyCol.label} is CRITICAL`);
    } else if (/urgent|pantas|segera|加急/i.test(words)) {
      filters.push({ column: urgencyCol.key, op: 'in', value: 'URGENT' });
      parts.push(`${urgencyCol.label} is URGENT`);
    } else if (/normal|biasa/i.test(words)) {
      filters.push({ column: urgencyCol.key, op: 'in', value: 'NORMAL' });
      parts.push(`${urgencyCol.label} is NORMAL`);
    } else if (/low|rendah/i.test(words)) {
      filters.push({ column: urgencyCol.key, op: 'in', value: 'LOW' });
      parts.push(`${urgencyCol.label} is LOW`);
    }
  }

  // Status
  const statusCol = catalogue.find((c) => c.key.toLowerCase() === 'status');
  if (statusCol) {
    if (/pending|tertunggak|menunggu|待处理/i.test(words)) {
      filters.push({ column: statusCol.key, op: 'in', value: 'PENDING' });
      parts.push(`${statusCol.label} is PENDING`);
    } else if (/dispatched|dihantar/i.test(words)) {
      filters.push({ column: statusCol.key, op: 'in', value: 'DISPATCHED' });
      parts.push(`${statusCol.label} is DISPATCHED`);
    } else if (/in transit|dalam perjalanan|运输中/i.test(words)) {
      filters.push({ column: statusCol.key, op: 'in', value: 'IN_TRANSIT' });
      parts.push(`${statusCol.label} is IN TRANSIT`);
    } else if (/completed|selesai|已完成/i.test(words)) {
      filters.push({ column: statusCol.key, op: 'in', value: 'COMPLETED' });
      parts.push(`${statusCol.label} is COMPLETED`);
    } else if (/available|tersedia|空闲/i.test(words)) {
      filters.push({ column: statusCol.key, op: 'in', value: 'AVAILABLE' });
      parts.push(`${statusCol.label} is AVAILABLE`);
    } else if (/offline|tidak aktif|离线/i.test(words)) {
      filters.push({ column: statusCol.key, op: 'in', value: 'OFFLINE' });
      parts.push(`${statusCol.label} is OFFLINE`);
    }
  }

  // Location / Zone
  const locCol = catalogue.find((c) => /location|zone|address/i.test(c.key));
  if (locCol) {
    const locations = [
      'Cheras', 'Bangsar', 'Mont Kiara', 'Petaling Jaya', 'Subang Jaya',
      'Shah Alam', 'Klang', 'Penang', 'Johor', 'Cyberjaya', 'Putrajaya', 'Klang Valley'
    ];
    for (const loc of locations) {
      if (new RegExp(`\\b${loc.toLowerCase()}\\b`).test(words)) {
        filters.push({ column: locCol.key, op: 'contains', value: loc });
        parts.push(`${locCol.label} contains '${loc}'`);
        break;
      }
    }
  }

  // Appliance / Category
  const appCol = catalogue.find((c) => /appliance|category/i.test(c.key));
  if (appCol) {
    const appDict = [
      { canonical: 'Refrigerator', patterns: ['refrigerator', 'fridge', 'peti sejuk', 'peti ais', '冰箱', '雪柜'] },
      { canonical: 'Washing Machine', patterns: ['washing machine', 'washer', 'mesin basuh', '洗衣机'] },
      { canonical: 'Air Conditioner', patterns: ['air conditioner', 'aircon', 'air-con', 'ac', 'hawa dingin', 'penyaman udara', '冷气', '空调'] },
      { canonical: 'Dishwasher', patterns: ['dishwasher', 'mesin basuh pinggan', '洗碗机'] },
      { canonical: 'Microwave', patterns: ['microwave', 'ketuhar gelombang mikro', '微波炉'] },
      { canonical: 'Oven', patterns: ['oven', 'ketuhar', '烤箱'] },
    ];
    for (const item of appDict) {
      if (item.patterns.some((p) => words.includes(p.toLowerCase()))) {
        filters.push({ column: appCol.key, op: 'contains', value: item.canonical });
        parts.push(`${appCol.label} contains '${item.canonical}'`);
        break;
      }
    }
  }

  // Relative Date
  const dateCol = catalogue.find((c) => c.type === 'date');
  if (dateCol) {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    if (/today|hari ini|今天/i.test(words)) {
      filters.push({ column: dateCol.key, op: 'on', value: todayStr });
      parts.push(`${dateCol.label} is Today (${todayStr})`);
    } else if (/yesterday|semalam|昨天/i.test(words)) {
      const yDate = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
      filters.push({ column: dateCol.key, op: 'on', value: yDate });
      parts.push(`${dateCol.label} is Yesterday (${yDate})`);
    } else if (/last week|minggu lepas|上周/i.test(words)) {
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
      filters.push({ column: dateCol.key, op: 'between', value: `${weekAgo},${todayStr}` });
      parts.push(`${dateCol.label} in past 7 days`);
    }
  }

  // If nothing matched specific columns, fallback to text search on the first text column
  if (filters.length === 0) {
    const firstTextCol = catalogue.find((c) => c.type === 'text') || catalogue[0];
    if (firstTextCol) {
      filters.push({ column: firstTextCol.key, op: 'contains', value: query });
      parts.push(`Text matches '${query}'`);
    }
  }

  return {
    table_id: tableId,
    interpretation: parts.join(' • ') || `Filtered by '${query}'`,
    filters: filters.slice(0, 8),
    ambiguities: [],
  };
}

