import React, { useState, useMemo } from 'react';

/**
 * Workforce & Skills-Gap Planner Component (D11).
 * 4-week coverage heat map, certificate risk analysis, ethical cross-skilling recommendations.
 * Zero emojis - pure SVG icons only.
 */
export default function WorkforceSkillsPlanner({
  technicians = [],
  onClose,
}) {
  const [selectedBranch, setSelectedBranch] = useState('Klang Valley');
  const [activeScenario, setActiveScenario] = useState('baseline');

  // Core categories
  const categories = [
    'Air Conditioner',
    'Refrigerator',
    'Washing Machine',
    'Television',
    'Kitchen Hob / Microwave',
  ];

  // Dynamic heat map calculation based on scenario
  const categoryGaps = useMemo(() => {
    return categories.map((cat, idx) => {
      let qualifiedCount = technicians.filter((t) =>
        t.skills?.some((s) => s.toLowerCase().includes(cat.toLowerCase()) || cat.toLowerCase().includes(s.toLowerCase()))
      ).length;

      if (qualifiedCount === 0) qualifiedCount = 2; // fallback seed

      // Apply scenario effects
      if (activeScenario === 'lead_departs' && cat === 'Air Conditioner') {
        qualifiedCount = Math.max(1, qualifiedCount - 1);
      } else if (activeScenario === 'hire_fridge' && cat === 'Refrigerator') {
        qualifiedCount += 1;
      }

      const weeks = [1, 2, 3, 4].map((w) => {
        const demand = 25 + idx * 5;
        const capacity = qualifiedCount * 14;
        const ratio = Math.round((capacity / demand) * 100) / 100;
        const status = ratio < 0.7 ? 'critical' : ratio < 0.9 ? 'risk' : 'healthy';
        return { week: `W${w}`, demand, capacity, ratio, status };
      });

      const avgRatio = weeks.reduce((acc, curr) => acc + curr.ratio, 0) / 4;
      const riskLevel = avgRatio < 0.75 ? 'high' : avgRatio < 0.92 ? 'medium' : 'low';

      return {
        category: cat,
        qualifiedCount,
        weeks,
        riskLevel,
      };
    });
  }, [technicians, activeScenario]);

  // Expiring Certificates
  const expiringCerts = [
    {
      code: 'T-002',
      name: 'Ahmad Razif',
      cert: 'CIDB High-Voltage Appliance Cert',
      category: 'Air Conditioner',
      days: 26,
      impact: 'Expiry reduces Klang Valley AC weekly capacity by 20%.',
    },
    {
      code: 'T-004',
      name: 'Tan Wei Ming',
      cert: 'Inverter PCB Diagnostics Level 2',
      category: 'Refrigerator',
      days: 52,
      impact: 'Reduces inverter compressor diagnostic turnaround by 1.5 days.',
    },
  ];

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Category,Branch,QualifiedSpecialists,W1,W2,W3,W4,Risk\n' +
      categoryGaps
        .map(
          (g) =>
            `"${g.category}","${selectedBranch}",${g.qualifiedCount},${g.weeks[0].ratio},${g.weeks[1].ratio},${g.weeks[2].ratio},${g.weeks[3].ratio},"${g.riskLevel}"`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `workforce_plan_${selectedBranch.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="workforce-skills-planner"
      style={{
        background: '#040d21',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '14px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 600 }}>
              Workforce & Skills-Gap Planner
            </h3>
            <p style={{ margin: 0, fontSize: '11.5px', color: '#9ca3af' }}>
              4-week capacity coverage matrix and proactive cross-skilling recommendations
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            className="ch-input"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            style={{ fontSize: '12px', padding: '5px 10px', height: '32px' }}
          >
            <option value="Klang Valley">Klang Valley Branch</option>
            <option value="Petaling Jaya">Petaling Jaya Branch</option>
            <option value="Penang">Penang Metro Hub</option>
          </select>

          <select
            className="ch-input"
            value={activeScenario}
            onChange={(e) => setActiveScenario(e.target.value)}
            style={{ fontSize: '12px', padding: '5px 10px', height: '32px' }}
          >
            <option value="baseline">Baseline Capacity</option>
            <option value="lead_departs">What-if: Lead Tech Departs</option>
            <option value="hire_fridge">What-if: Hire +1 Refrigerator Tech</option>
          </select>

          <button
            type="button"
            className="ch-btn ch-btn-ghost"
            onClick={handleExportCsv}
            style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Heat Map & Gaps Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>
        {/* Coverage Heat Map */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '8px',
            padding: '12px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '10px' }}>
            Category Coverage Ratio Matrix (Supply / Forecast Demand)
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#9ca3af', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '8px' }}>Category</th>
                <th style={{ padding: '8px' }}>Specialists</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>W1</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>W2</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>W3</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>W4</th>
              </tr>
            </thead>
            <tbody>
              {categoryGaps.map((row) => (
                <tr key={row.category} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 8px', color: '#fff', fontWeight: 600 }}>{row.category}</td>
                  <td style={{ padding: '10px 8px', color: '#cbd5e1' }}>{row.qualifiedCount} certified</td>
                  {row.weeks.map((w) => {
                    const bg =
                      w.status === 'healthy'
                        ? 'rgba(46, 213, 115, 0.15)'
                        : w.status === 'risk'
                        ? 'rgba(234, 179, 8, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)';
                    const color =
                      w.status === 'healthy' ? '#2ed573' : w.status === 'risk' ? '#eab308' : '#ef4444';

                    return (
                      <td key={w.week} style={{ padding: '8px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: bg,
                            color: color,
                            fontWeight: 700,
                            fontSize: '11px',
                          }}
                        >
                          {w.ratio.toFixed(2)}x
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Certificate Risks & Recommendations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Certificate Expiry Panel */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '8px',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>
              Expiring Certifications ({expiringCerts.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {expiringCerts.map((c) => (
                <div key={c.code} style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                    <strong style={{ color: '#fff' }}>{c.name} ({c.code})</strong>
                    <span style={{ color: '#eab308', fontWeight: 600 }}>Expires in {c.days} days</span>
                  </div>
                  <div style={{ color: '#ff7300', fontSize: '11px', marginTop: '2px' }}>{c.cert}</div>
                  <div style={{ color: '#9ca3af', fontSize: '10px', marginTop: '2px' }}>{c.impact}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Training Actions */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '8px',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>
              Strategic Cross-Skilling Action
            </div>
            <div style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '10px' }}>
              Cross-skill Priya Nair in <strong style={{ color: '#ff7300' }}>Air Conditioner</strong> diagnostics to offset upcoming seasonal surge in Klang Valley.
            </div>
            <button
              type="button"
              className="ch-btn ch-btn-primary"
              style={{
                width: '100%',
                fontSize: '11.5px',
                padding: '7px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: '#38bdf8',
                color: '#000',
                fontWeight: 700,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              Enrol in CIDB Certification Program
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
