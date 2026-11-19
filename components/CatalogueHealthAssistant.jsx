import { useState, useEffect } from 'react';
import { auditPartsCatalogue, simulatePartsPriceChange } from '../lib/api.js';

export default function CatalogueHealthAssistant({ parts = [], isOpen, onClose, onApplyDiff }) {
  const [activeTab, setActiveTab] = useState('health'); // 'health' | 'simulator' | 'import'
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditData, setAuditData] = useState(null);

  // Simulator State
  const [markupDelta, setMarkupDelta] = useState(5.0);
  const [simulationResult, setSimulationResult] = useState(null);

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [importPreview, setImportPreview] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    async function load() {
      setLoadingAudit(true);
      try {
        const res = await auditPartsCatalogue(parts);
        if (mounted) setAuditData(res);
      } catch (err) {
        console.error('Failed to audit catalogue:', err);
      } finally {
        if (mounted) setLoadingAudit(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [isOpen, parts]);

  useEffect(() => {
    if (activeTab !== 'simulator') return;
    let mounted = true;
    async function sim() {
      try {
        const res = await simulatePartsPriceChange(parts, markupDelta);
        if (mounted) setSimulationResult(res);
      } catch (err) {
        console.error('Failed to simulate price adjustment:', err);
      }
    }
    sim();
    return () => {
      mounted = false;
    };
  }, [activeTab, markupDelta, parts]);

  const handleParseCsv = () => {
    if (!csvText.trim()) return;
    const lines = csvText.trim().split('\n');
    const items = [];
    for (let i = 1; i < lines.length; i++) {
      const partsArr = lines[i].split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
      if (partsArr.length >= 3) {
        const [sku, name, costStr, cat] = partsArr;
        const cost = parseFloat(costStr) || 20.0;
        const existing = parts.find((p) => p.sku === sku);
        const jumpPct = existing ? Math.round(((cost - existing.cost) / existing.cost) * 100) : 0;
        items.push({
          sku,
          name,
          cost,
          category: cat || 'Heating and Cooling',
          status: existing ? (jumpPct !== 0 ? 'PRICE_CHANGE' : 'UNCHANGED') : 'NEW',
          costJump: jumpPct,
        });
      }
    }
    setImportPreview(items);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '850px',
          maxWidth: '96vw',
          maxHeight: '90vh',
          background: '#030c2c',
          border: '1.5px solid rgba(255, 115, 0, 0.45)',
          borderRadius: '12px',
          boxShadow: '0 15px 45px rgba(0, 0, 0, 0.9)',
          overflowY: 'auto',
          padding: '24px 28px',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(255, 115, 0, 0.15)', color: '#ff7300', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#f8fafc', fontWeight: 700 }}>
                Spare-Parts Catalogue Assistant
              </h2>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Catalogue health audit · Price change simulator · CSV import helper
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
          <button
            type="button"
            className={`filter-pill ${activeTab === 'health' ? 'active' : ''}`}
            onClick={() => setActiveTab('health')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            Health Audit
          </button>
          <button
            type="button"
            className={`filter-pill ${activeTab === 'simulator' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulator')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Price Simulator
          </button>
          <button
            type="button"
            className={`filter-pill ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            CSV Importer
          </button>
        </div>

        {/* Tab 1: Health Audit */}
        {activeTab === 'health' && (
          <div>
            {loadingAudit ? (
              <div style={{ color: '#ff7300', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', margin: '40px 0' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin">
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                </svg>
                Auditing catalogue for duplicates, negative margins, and format issues...
              </div>
            ) : auditData ? (
              <>
                {/* Score Banner */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(5, 19, 64, 0.65)', border: '1px solid rgba(255, 115, 0, 0.3)', borderRadius: '8px', padding: '12px 16px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Catalogue Health Score</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: auditData.health_score >= 80 ? '#2ed573' : '#ffa502', marginTop: '2px' }}>
                      {auditData.health_score} / 100
                    </div>
                  </div>
                  <div style={{ background: 'rgba(5, 19, 64, 0.65)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '12px 16px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Critical Issues</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#f87171', marginTop: '2px' }}>
                      {auditData.critical_count}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(5, 19, 64, 0.65)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '12px 16px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Warnings & Margin Alerts</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#fbbf24', marginTop: '2px' }}>
                      {auditData.warning_count}
                    </div>
                  </div>
                </div>

                {/* Findings List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {auditData.findings.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#2ed573', padding: '30px', background: 'rgba(46, 213, 115, 0.08)', borderRadius: '8px' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <div>Catalogue is in excellent health! Zero anomalies or margin outliers detected.</div>
                    </div>
                  ) : (
                    auditData.findings.map((f) => (
                      <div
                        key={f.id}
                        style={{
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: `1px solid ${f.severity === 'critical' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.3)'}`,
                          borderRadius: '8px',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: f.severity === 'critical' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                color: f.severity === 'critical' ? '#f87171' : '#fbbf24',
                              }}
                            >
                              {f.severity}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>{f.title}</span>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#94a3b8' }}>
                            {f.explanation}
                          </p>
                          {f.proposed_diff && (
                            <div style={{ marginTop: '6px', fontSize: '11px', color: '#38bdf8' }}>
                              Proposed Fix: {f.proposed_diff.field} → <strong style={{ color: '#fff' }}>{f.proposed_diff.proposed_value}</strong>
                            </div>
                          )}
                        </div>

                        {f.proposed_diff && onApplyDiff && (
                          <button
                            type="button"
                            className="btn-small primary"
                            onClick={() => onApplyDiff(f.proposed_diff)}
                            style={{
                              background: '#ff7300',
                              color: '#051340',
                              fontWeight: 700,
                              fontSize: '11px',
                              padding: '5px 12px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Apply Fix
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Tab 2: Price-Change Simulator */}
        {activeTab === 'simulator' && (
          <div>
            <div style={{ background: 'rgba(5, 19, 64, 0.5)', padding: '16px 20px', borderRadius: '8px', border: '1px solid rgba(255, 115, 0, 0.3)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                  Simulated Markup Adjustment: <strong style={{ color: '#ff7300' }}>{markupDelta >= 0 ? `+${markupDelta}%` : `${markupDelta}%`}</strong>
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Guardrail: Max ±10% per iteration
                </span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={markupDelta}
                onChange={(e) => setMarkupDelta(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', accentColor: '#ff7300', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#94a3b8', marginTop: '4px' }}>
                <span>-10%</span>
                <span>0% (Current)</span>
                <span>+10%</span>
              </div>
            </div>

            {simulationResult && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '14px 18px' }}>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>Monthly Revenue Impact</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: simulationResult.projected_revenue_impact_monthly >= 0 ? '#2ed573' : '#f87171', marginTop: '4px' }}>
                    {simulationResult.projected_revenue_impact_monthly >= 0
                      ? `+RM ${simulationResult.projected_revenue_impact_monthly.toFixed(2)}`
                      : `-RM ${Math.abs(simulationResult.projected_revenue_impact_monthly).toFixed(2)}`}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                    Based on 12-month run rate
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '14px 18px' }}>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>Gross Margin Shift</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: simulationResult.projected_margin_impact_monthly >= 0 ? '#38bdf8' : '#fbbf24', marginTop: '4px' }}>
                    {simulationResult.projected_margin_impact_monthly >= 0
                      ? `+RM ${simulationResult.projected_margin_impact_monthly.toFixed(2)}`
                      : `-RM ${Math.abs(simulationResult.projected_margin_impact_monthly).toFixed(2)}`}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                    Across {simulationResult.affected_parts_count} catalogue SKUs
                  </div>
                </div>
              </div>
            )}

            <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', background: 'rgba(255, 255, 255, 0.04)', padding: '10px 14px', borderRadius: '6px' }}>
              Note: Model assumes steady repair job demand volume. Outliers below the 15% floor are automatically preserved.
            </div>
          </div>
        )}

        {/* Tab 3: CSV Import Assistant */}
        {activeTab === 'import' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                Paste Supplier Price List (CSV):
              </label>
              <textarea
                className="ch-input"
                rows="5"
                placeholder="SKU,Part Name,Supplier Cost,Category&#10;SP-S01,Samsung Drain Pump,45.00,Washing Machines&#10;LG-C02,LG Dual Inverter Board,185.00,Heating and Cooling"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '11.5px', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                className="btn-small primary"
                onClick={handleParseCsv}
                style={{ marginTop: '8px', background: '#ff7300', color: '#051340', fontWeight: 700, fontSize: '11.5px' }}
              >
                Validate & Preview Diff
              </button>
            </div>

            {importPreview && (
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#ff7300' }}>
                  Diff Preview ({importPreview.length} Parsed Items):
                </h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                    <thead>
                      <tr style={{ background: '#051340', color: '#94a3b8', textAlign: 'left' }}>
                        <th style={{ padding: '6px 10px' }}>SKU</th>
                        <th style={{ padding: '6px 10px' }}>Part Name</th>
                        <th style={{ padding: '6px 10px' }}>Cost</th>
                        <th style={{ padding: '6px 10px' }}>Diff Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '6px 10px', color: '#ff7300', fontFamily: 'monospace' }}>{item.sku}</td>
                          <td style={{ padding: '6px 10px', color: '#f8fafc' }}>{item.name}</td>
                          <td style={{ padding: '6px 10px' }}>RM {item.cost.toFixed(2)}</td>
                          <td style={{ padding: '6px 10px' }}>
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                background: item.status === 'NEW' ? 'rgba(46, 213, 115, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                                color: item.status === 'NEW' ? '#2ed573' : '#38bdf8',
                              }}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
