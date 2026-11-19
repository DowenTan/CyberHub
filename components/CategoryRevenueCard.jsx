import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api.js';
import { DEFAULT_TAXONOMY } from '../lib/categories.js';

// Shown only when the backend is offline, so the page is never empty.
const groupOf = (name) => DEFAULT_TAXONOMY.find((g) => g.categories.includes(name))?.group ?? 'Other';
const DEMO = [
  ['Televisions & Home Entertainment', 36, 5377, 4.4], ['Laundry Equipment', 44, 4788, 4.4],
  ['Dishwashers & Ventilation', 41, 4117, 4.4], ['Cooking Equipment', 44, 3886, 4.3],
  ['Garment Care & Cleaning', 36, 3871, 4.5], ['Refrigeration & Freezing', 44, 3863, 4.3],
  ['Heating and Cooling', 37, 3399, 4.4], ['Kitchen & Food Prep', 36, 2339, 4.7],
  ['Fans & Climate Aids', 36, 2143, 4.5],
].map(([category, jobs, revenue, avg_rating]) => ({
  category, category_group: groupOf(category), jobs, completed_jobs: Math.round(jobs * 0.6),
  revenue, avg_ticket: Math.round(revenue / (jobs * 0.6)), avg_rating,
}));

const SORTS = { revenue: 'Revenue', jobs: 'Jobs', avg_rating: 'Rating' };

const CategoryRevenueCard = () => {
  const [rows, setRows] = useState(DEMO);
  const [live, setLive] = useState(false);
  const [sortKey, setSortKey] = useState('revenue');
  const [group, setGroup] = useState('All');

  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/admin/analytics/categories')
      .then((data) => {
        if (cancelled || !data.length) return;
        setRows(data);
        setLive(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(() => [...new Set(rows.map((r) => r.category_group || 'Other'))], [rows]);
  const sorted = useMemo(
    () =>
      rows
        .filter((r) => group === 'All' || (r.category_group || 'Other') === group)
        .sort((a, b) => Number(b[sortKey]) - Number(a[sortKey])),
    [rows, sortKey, group]
  );
  const max = Math.max(1, ...sorted.map((r) => Number(r[sortKey])));
  const totalRevenue = sorted.reduce((s, r) => s + Number(r.revenue), 0);

  return (
    <div className="ch-card" style={{ marginTop: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0 }}>Performance by Appliance Category</h3>
          <span className="mono" style={{ fontSize: '11px', color: live ? '#2ed573' : '#9ca3af' }}>
            {live ? '● Live (Supabase)' : '○ Demo data (backend offline)'}
          </span>
        </div>
        <div className="pill-group">
          {Object.entries(SORTS).map(([key, label]) => (
            <button key={key} className={`filter-pill ${sortKey === key ? 'active' : ''}`} onClick={() => setSortKey(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="pill-group" style={{ marginBottom: '14px' }}>
        <button className={`filter-pill ${group === 'All' ? 'active' : ''}`} onClick={() => setGroup('All')}>
          All groups
        </button>
        {groups.map((g) => (
          <button key={g} className={`filter-pill ${group === g ? 'active' : ''}`} onClick={() => setGroup(g)}>
            {g}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '9px' }}>
        {sorted.map((r) => (
          <div key={r.category} style={{ display: 'grid', gridTemplateColumns: '170px 1fr 190px', gap: '12px', alignItems: 'center', fontSize: '13px' }}>
            <span>{r.category}</span>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', height: '14px', overflow: 'hidden' }}>
              <div style={{ width: `${(Number(r[sortKey]) / max) * 100}%`, height: '100%', background: 'linear-gradient(90deg, rgba(255,115,0,0.9), rgba(255,115,0,0.35))' }} />
            </div>
            <span className="mono" style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'right' }}>
              RM {Number(r.revenue).toLocaleString('en-MY', { maximumFractionDigits: 0 })} · {r.jobs} jobs · ★ {Number(r.avg_rating).toFixed(1)}
            </span>
          </div>
        ))}
      </div>
      <p className="mono" style={{ fontSize: '11px', color: '#9ca3af', margin: '12px 0 0' }}>
        {sorted.length} categories · RM {totalRevenue.toLocaleString('en-MY', { maximumFractionDigits: 0 })} paid revenue
      </p>
    </div>
  );
};

export default CategoryRevenueCard;
