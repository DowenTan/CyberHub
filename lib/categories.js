// Category tree shown in Price Settings and Service Analytics.
// Used as the offline/demo fallback; when the API is live the tree comes from the appliance_categories table.
export const DEFAULT_TAXONOMY = [
  {
    group: 'Major Appliances (White Goods)',
    categories: [
      'Refrigeration & Freezing',
      'Laundry Equipment',
      'Cooking Equipment',
      'Dishwashers & Ventilation',
      'Heating and Cooling',
    ],
  },
  {
    group: 'Small Appliances (Countertop & Portable)',
    categories: ['Kitchen & Food Prep', 'Fans & Climate Aids', 'Garment Care & Cleaning'],
  },
  {
    group: 'Consumer Electronics (Brown Goods)',
    categories: ['Televisions', 'Home Theater Systems & Audio Receivers', 'DVD & Media Players'],
  },
];

// rows: [{ name, group }] from /api/admin/pricing/categories (already ordered by sort_order)
export const buildTaxonomy = (rows) => {
  const groups = [];
  rows.forEach((row) => {
    const name = row.group || 'Other';
    let g = groups.find((x) => x.group === name);
    if (!g) {
      g = { group: name, categories: [] };
      groups.push(g);
    }
    g.categories.push(row.name);
  });
  return groups.length ? groups : DEFAULT_TAXONOMY;
};

/**
 * Resolves an appliance name, part, or order issue into its category group and subcategory.
 */
export const resolveApplianceCategory = (item) => {
  if (!item) return { group: 'Major Appliances (White Goods)', category: 'Refrigeration & Freezing' };

  if (typeof item === 'object') {
    if (item.category) {
      for (const grp of DEFAULT_TAXONOMY) {
        if (grp.categories.includes(item.category)) {
          return { group: grp.group, category: item.category };
        }
      }
    }
    const combined = `${item.category || ''} ${item.appliance || ''} ${item.specialty || ''} ${item.name || ''} ${item.issue || ''}`.toLowerCase();
    return resolveApplianceCategory(combined);
  }

  const s = String(item).toLowerCase();
  if (/fridge|refrigerat|freezer|chiller|ice/i.test(s)) {
    return { group: 'Major Appliances (White Goods)', category: 'Refrigeration & Freezing' };
  }
  if (/wash|washer|laundry|dryer|drum|pump|oe error/i.test(s)) {
    return { group: 'Major Appliances (White Goods)', category: 'Laundry Equipment' };
  }
  if (/oven|cook|hob|stove|induction|range|microwave|burner|gas hob/i.test(s)) {
    return { group: 'Major Appliances (White Goods)', category: 'Cooking Equipment' };
  }
  if (/dish|dishwasher|ventilat|hood|e24|siphon/i.test(s)) {
    return { group: 'Major Appliances (White Goods)', category: 'Dishwashers & Ventilation' };
  }
  if (/ac|air\s*cond|hvac|compressor|cooling|heating|louver|thermistor|gas|r410a/i.test(s)) {
    return { group: 'Major Appliances (White Goods)', category: 'Heating and Cooling' };
  }
  if (/tv|television|oled|audio|speaker|theater|receiver|display/i.test(s)) {
    return { group: 'Consumer Electronics (Brown Goods)', category: 'Televisions' };
  }
  if (/fan|purifier|climate/i.test(s)) {
    return { group: 'Small Appliances (Countertop & Portable)', category: 'Fans & Climate Aids' };
  }
  if (/kitchen|blender|coffee|espresso|toaster|mixer/i.test(s)) {
    return { group: 'Small Appliances (Countertop & Portable)', category: 'Kitchen & Food Prep' };
  }
  if (/iron|vacuum|clean|garment/i.test(s)) {
    return { group: 'Small Appliances (Countertop & Portable)', category: 'Garment Care & Cleaning' };
  }

  return { group: 'Major Appliances (White Goods)', category: 'Refrigeration & Freezing' };
};
