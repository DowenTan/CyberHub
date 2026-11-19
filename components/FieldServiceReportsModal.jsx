import React, { useState } from 'react';

/**
 * Field Service & Engineering Reports Modal.
 * Generates and formats official industry-standard appliance service reports:
 * 1. Service Call / Field Service Report (FSR)
 * 2. Appliance Inspection & Diagnostic Report
 * 3. Preventive Maintenance Report
 * 4. Quotation and Cost Breakdown Report
 * 5. Invoice and Billing Report
 * 6. Customer Satisfaction & Feedback Report
 * 
 * Strict Zero Emojis - Pure SVG icons only.
 */

const REPORT_TABS = [
  { id: 'fsr', label: 'Field Service Report (FSR)' },
  { id: 'diagnostic', label: 'Inspection & Diagnostics' },
  { id: 'maintenance', label: 'Preventive Maintenance' },
  { id: 'quotation', label: 'Quotation & Cost Breakdown' },
  { id: 'invoice', label: 'Invoice & Billing Receipt' },
  { id: 'feedback', label: 'Customer CSAT & Feedback' },
];

export default function FieldServiceReportsModal({
  isOpen,
  onClose,
  initialReportType = 'fsr',
  orderData = null,
}) {
  const [activeTab, setActiveTab] = useState(initialReportType);

  if (!isOpen) return null;

  // Fallback realistic order data if not provided
  const order = orderData || {
    id: 'ORD-501',
    customer: 'Tan Kia Yu',
    phone: '+6012-3456789',
    location: 'Bandar Utama, Petaling Jaya, Selangor',
    appliance: 'Samsung Inverter Refrigerator (520L)',
    modelNumber: 'RT53K6271BS/SL',
    serialNumber: 'SN-SAMS-98234-KL',
    issue: 'Freezer compartment not chilling; loud humming sound from compressor',
    cost: 'RM 380.00',
    techName: 'Satou Kenji',
    techCode: 'T-001',
    techCert: 'CIDB Level 3 Lead Specialist',
    status: 'COMPLETED',
    date: '2026-11-14',
    completionTime: '14:30 MYT',
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="ch-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="ch-modal-card"
        style={{
          width: '100%',
          maxWidth: '920px',
          background: '#040d21',
          border: '1px solid rgba(255, 115, 0, 0.4)',
          borderRadius: '12px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 115, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 115, 0, 0.15)',
                border: '1px solid rgba(255, 115, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff7300',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 600 }}>
                CyberHub Official Field Service Reports
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>
                Job Order <strong style={{ color: '#fff' }}>#{order.id}</strong> · Client: {order.customer}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="ch-btn ch-btn-ghost"
              onClick={handlePrint}
              style={{
                fontSize: '11.5px',
                padding: '5px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Strip */}
        <div
          style={{
            display: 'flex',
            overflowX: 'auto',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '4px 16px 0',
            gap: '6px',
          }}
        >
          {REPORT_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 12px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: isActive ? '#ff7300' : '#9ca3af',
                  background: isActive ? 'rgba(255, 115, 0, 0.12)' : 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #ff7300' : '2px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  borderRadius: '4px 4px 0 0',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Report Document Content (Scrollable) */}
        <div style={{ padding: '20px', overflowY: 'auto', background: '#020718' }}>
          {/* =========================================================================
              REPORT 1: Field Service Report (FSR)
             ========================================================================= */}
          {activeTab === 'fsr' && (
            <div className="printable-report" style={{ background: '#051133', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #ff7300', paddingBottom: '14px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>FIELD SERVICE REPORT (FSR)</div>
                  <div style={{ fontSize: '11px', color: '#ff7300', marginTop: '2px' }}>CYBERHUB ONSITE ENGINEERING & REPAIRS</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11.5px', color: '#cbd5e1' }}>
                  <div>Report No: <strong style={{ color: '#fff' }}>FSR-{order.id}</strong></div>
                  <div>Service Date: <strong style={{ color: '#fff' }}>{order.date}</strong></div>
                  <div>Hub: <span style={{ color: '#38bdf8' }}>Petaling Jaya Central</span></div>
                </div>
              </div>

              {/* Customer & Appliance Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700 }}>Client & Location</div>
                  <div style={{ fontWeight: 600, color: '#fff', marginTop: '2px' }}>{order.customer}</div>
                  <div style={{ color: '#cbd5e1', fontSize: '11.5px' }}>{order.location}</div>
                  <div style={{ color: '#38bdf8', fontSize: '11px' }}>Contact: {order.phone}</div>
                </div>
                <div style={{ fontSize: '12px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700 }}>Appliance Telemetry</div>
                  <div style={{ fontWeight: 600, color: '#ff7300', marginTop: '2px' }}>{order.appliance}</div>
                  <div style={{ color: '#cbd5e1', fontSize: '11.5px' }}>Model: {order.modelNumber || 'RT53K6271BS/SL'}</div>
                  <div style={{ color: '#cbd5e1', fontSize: '11px' }}>Serial: {order.serialNumber || 'SN-SAMS-98234-KL'}</div>
                </div>
              </div>

              {/* Physical Inspection & Diagnostics */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700, marginBottom: '6px' }}>
                  Physical Inspection Findings & System Checks
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', color: '#cbd5e1' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.04)', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '6px 8px' }}>Test Parameter</th>
                      <th style={{ padding: '6px 8px' }}>Nominal Rating</th>
                      <th style={{ padding: '6px 8px' }}>Measured Result</th>
                      <th style={{ padding: '6px 8px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '6px 8px' }}>Mains Voltage & Grounding</td>
                      <td style={{ padding: '6px 8px' }}>240V AC ± 5%</td>
                      <td style={{ padding: '6px 8px' }}>238.4V AC, 0.4Ω Ground</td>
                      <td style={{ padding: '6px 8px', color: '#2ed573' }}>PASS</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '6px 8px' }}>Inverter Compressor Winding</td>
                      <td style={{ padding: '6px 8px' }}>12.5Ω – 14.0Ω</td>
                      <td style={{ padding: '6px 8px' }}>13.2Ω (Balanced)</td>
                      <td style={{ padding: '6px 8px', color: '#2ed573' }}>PASS</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '6px 8px' }}>Defrost Thermal Fuse Continuity</td>
                      <td style={{ padding: '6px 8px' }}>Closed (0Ω)</td>
                      <td style={{ padding: '6px 8px', color: '#ef4444' }}>Open Circuit (Blown)</td>
                      <td style={{ padding: '6px 8px', color: '#ef4444', fontWeight: 700 }}>FAIL (FAULT)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Work Performed & Replaced Parts */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700, marginBottom: '6px' }}>
                  Work Performed & Replaced Components
                </div>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '6px', fontSize: '11.5px', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '8px' }}>
                  De-iced evaporator coil cavity; replaced blown thermal fuse with certified OEM ceramic replacement; verified fan motor rotation and controller defrost cycle actuation.
                </div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '11.5px' }}>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    Replaced Part: <strong style={{ color: '#fff' }}>Thermal Fuse 73°C OEM</strong> (SKU: FUSE-SAMS-73C)
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    Warranty Term: <strong style={{ color: '#2ed573' }}>90 Days Onsite Warranty</strong>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                  <div>Lead Field Specialist: <strong style={{ color: '#fff' }}>{order.techName} ({order.techCode})</strong></div>
                  <div style={{ marginTop: '2px' }}>Certification: {order.techCert}</div>
                  <div style={{ marginTop: '6px', color: '#2ed573', fontWeight: 600 }}>Digitally Verified & Signed (GPS Verified)</div>
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'right' }}>
                  <div>Customer Acceptance: <strong style={{ color: '#fff' }}>{order.customer}</strong></div>
                  <div style={{ marginTop: '2px' }}>Satisfaction Sign-off: Work completed satisfactorily</div>
                  <div style={{ marginTop: '6px', color: '#38bdf8' }}>Timestamp: {order.date} {order.completionTime}</div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              REPORT 2: Appliance Inspection & Diagnostic Report
             ========================================================================= */}
          {activeTab === 'diagnostic' && (
            <div className="printable-report" style={{ background: '#051133', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #38bdf8', paddingBottom: '14px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>APPLIANCE INSPECTION & DIAGNOSTIC REPORT</div>
                  <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '2px' }}>PRE-REPAIR ROOT CAUSE & ECONOMIC VIABILITY ASSESSMENT</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11.5px', color: '#cbd5e1' }}>
                  <div>Diag ID: <strong style={{ color: '#fff' }}>DIAG-{order.id}</strong></div>
                  <div>Inspection Date: <strong style={{ color: '#fff' }}>{order.date}</strong></div>
                </div>
              </div>

              {/* Pinpointed Faults */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700, marginBottom: '8px' }}>
                  Pinpointed Component Faults
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 12px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700 }}>PRIMARY FAILURE</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginTop: '2px' }}>Open Thermal Cutoff Fuse</div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>
                      Defrost circuit thermal fuse blown due to momentary surge; prevented heating element from cycling off frost accumulation.
                    </div>
                  </div>
                  <div style={{ background: 'rgba(46, 213, 115, 0.1)', border: '1px solid rgba(46, 213, 115, 0.3)', padding: '10px 12px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', color: '#2ed573', fontWeight: 700 }}>COMPRESSOR INTEGRITY</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginTop: '2px' }}>Inverter Compressor Healthy</div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>
                      Digital inverter board and brushless motor tested within manufacturer operating current (1.1A draw).
                    </div>
                  </div>
                </div>
              </div>

              {/* Economic Viability Analysis (Repair vs. Replace Rule) */}
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 700, marginBottom: '6px' }}>
                  Economic Viability Assessment (50% Cost-Benefit Rule)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '11.5px', marginBottom: '10px' }}>
                  <div>
                    <div style={{ color: '#9ca3af' }}>Current Appliance Age</div>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>3.2 Years</div>
                  </div>
                  <div>
                    <div style={{ color: '#9ca3af' }}>Replacement Retail Value</div>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>RM 2,890.00</div>
                  </div>
                  <div>
                    <div style={{ color: '#9ca3af' }}>Estimated Repair Cost</div>
                    <div style={{ color: '#2ed573', fontWeight: 600, fontSize: '13px' }}>RM 380.00 (13.1%)</div>
                  </div>
                  <div>
                    <div style={{ color: '#9ca3af' }}>Viability Recommendation</div>
                    <div style={{ color: '#2ed573', fontWeight: 700, fontSize: '13px' }}>RECOMMEND REPAIR</div>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', lineHeight: 1.4 }}>
                  Conclusion: Total repair expenditure represents 13.1% of replacement value (well below the 50% replacement threshold). The unit possesses an estimated remaining operating lifespan of 5+ years.
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              REPORT 3: Preventive Maintenance Report
             ========================================================================= */}
          {activeTab === 'maintenance' && (
            <div className="printable-report" style={{ background: '#051133', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #2ed573', paddingBottom: '14px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>PREVENTIVE MAINTENANCE & HEALTH CHECK REPORT</div>
                  <div style={{ fontSize: '11px', color: '#2ed573', marginTop: '2px' }}>ROUTINE SYSTEM CHECKUP & LIFESPAN OPTIMIZATION</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11.5px', color: '#cbd5e1' }}>
                  <div>Maintenance ID: <strong style={{ color: '#fff' }}>PM-{order.id}</strong></div>
                  <div>Scheduled Cycle: <span style={{ color: '#2ed573' }}>Quarterly Checkup</span></div>
                </div>
              </div>

              {/* Maintenance Checklist & Observations */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700, marginBottom: '6px' }}>
                  Routine Checkup Actions Completed
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                    <span style={{ color: '#fff' }}>Condenser Coil Dust Cleansing & Airflow Clearance</span>
                    <span style={{ color: '#2ed573', fontWeight: 600 }}>100% Cleared (Thermal heat dissipation restored)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                    <span style={{ color: '#fff' }}>Door Gasket Magnetic Seal & Air Leakage Check</span>
                    <span style={{ color: '#2ed573', fontWeight: 600 }}>Tight Seal (0 mm air gap detected)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                    <span style={{ color: '#fff' }}>Drainage Pan & Evaporator Tube Flush</span>
                    <span style={{ color: '#2ed573', fontWeight: 600 }}>Flushed & Sanitized (Zero biofilm blockage)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                    <span style={{ color: '#fff' }}>Compressor Mount Bushing Vibration Absorption</span>
                    <span style={{ color: '#eab308', fontWeight: 600 }}>Minor Wear (Recommended replacement in 12 months)</span>
                  </div>
                </div>
              </div>

              {/* Next Scheduled Date */}
              <div style={{ background: 'rgba(46, 213, 115, 0.08)', border: '1px solid rgba(46, 213, 115, 0.3)', padding: '12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#2ed573', fontWeight: 700 }}>NEXT PREVENTIVE SERVICE DUE</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginTop: '2px' }}>14 May 2027 (6 Months Interval)</div>
                </div>
                <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                  Auto-notification configured via SMS / WhatsApp reminder.
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              REPORT 4: Quotation and Cost Breakdown Report
             ========================================================================= */}
          {activeTab === 'quotation' && (
            <div className="printable-report" style={{ background: '#051133', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eab308', paddingBottom: '14px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>QUOTATION & ITEMIZED COST BREAKDOWN</div>
                  <div style={{ fontSize: '11px', color: '#eab308', marginTop: '2px' }}>ESTIMATED PARTS, LABOR, AND SERVICE CHARGES</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11.5px', color: '#cbd5e1' }}>
                  <div>Quote Ref: <strong style={{ color: '#fff' }}>QTN-{order.id}</strong></div>
                  <div>Valid Until: <strong style={{ color: '#fff' }}>30 Days from Issue</strong></div>
                </div>
              </div>

              {/* Itemized Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#cbd5e1', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '8px' }}>Item Description</th>
                    <th style={{ padding: '8px' }}>SKU / Part Serial</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Total (MYR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px', color: '#fff' }}>Certified OEM Defrost Thermal Fuse Assembly</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>SKU-FUSE-SAMS-73C</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>1</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>RM 140.00</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#fff' }}>RM 140.00</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px', color: '#fff' }}>Senior Technical Diagnostics & Coil De-icing Labor</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>LABOR-DIAG-LVL2</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>1.5 hrs</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>RM 120.00/hr</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#fff' }}>RM 180.00</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px', color: '#fff' }}>Klang Valley Onsite Transport & Logistics Fee</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>FEE-DISPATCH-KV</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>1</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>RM 60.00</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#fff' }}>RM 60.00</td>
                  </tr>
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                <div style={{ width: '280px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#9ca3af' }}>
                    <span>Subtotal:</span>
                    <span>RM 380.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#9ca3af' }}>
                    <span>SST (8%):</span>
                    <span>RM 0.00 (Exempt)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.1)', fontWeight: 700, fontSize: '15px', color: '#ff7300' }}>
                    <span>Total Estimated:</span>
                    <span>RM 380.00</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              REPORT 5: Invoice and Billing Report
             ========================================================================= */}
          {activeTab === 'invoice' && (
            <div className="printable-report" style={{ background: '#051133', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #2ed573', paddingBottom: '14px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>TAX INVOICE & OFFICIAL RECEIPT</div>
                  <div style={{ fontSize: '11px', color: '#2ed573', marginTop: '2px' }}>CYBERHUB APPLIANCE REPAIRS SDN BHD (SSM: 202401019921)</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11.5px', color: '#cbd5e1' }}>
                  <div>Invoice No: <strong style={{ color: '#fff' }}>INV-{order.id}</strong></div>
                  <div>Status: <span style={{ color: '#2ed573', fontWeight: 700 }}>PAID & SETTLED</span></div>
                </div>
              </div>

              {/* Payment Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '12px' }}>
                <div>
                  <div style={{ color: '#9ca3af', fontSize: '10px', textTransform: 'uppercase' }}>Payment Method</div>
                  <div style={{ color: '#fff', fontWeight: 600, marginTop: '2px' }}>DuitNow QR / Instant FPX</div>
                </div>
                <div>
                  <div style={{ color: '#9ca3af', fontSize: '10px', textTransform: 'uppercase' }}>Transaction Reference</div>
                  <div style={{ color: '#38bdf8', fontFamily: 'monospace', marginTop: '2px' }}>TXN-9021-8841-KL</div>
                </div>
                <div>
                  <div style={{ color: '#9ca3af', fontSize: '10px', textTransform: 'uppercase' }}>Amount Settled</div>
                  <div style={{ color: '#2ed573', fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>RM 380.00</div>
                </div>
              </div>

              {/* Warranty Certificate Proof */}
              <div style={{ background: 'rgba(46, 213, 115, 0.08)', border: '1px solid rgba(46, 213, 115, 0.3)', padding: '12px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#2ed573', fontWeight: 700, textTransform: 'uppercase' }}>
                  Official 90-Day Service & Parts Warranty Certificate
                </div>
                <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginTop: '4px', lineHeight: 1.4 }}>
                  This document certifies that replaced components and repair labor on <strong style={{ color: '#fff' }}>{order.appliance}</strong> are guaranteed against defects for 90 days (Expires: 12 February 2027). Free callback dispatch covered.
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              REPORT 6: Customer Satisfaction & Feedback Report
             ========================================================================= */}
          {activeTab === 'feedback' && (
            <div className="printable-report" style={{ background: '#051133', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #a855f7', paddingBottom: '14px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>CUSTOMER SATISFACTION & FEEDBACK AUDIT</div>
                  <div style={{ fontSize: '11px', color: '#a855f7', marginTop: '2px' }}>POST-SERVICE QUALITY AUDIT & CSAT RATING</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11.5px', color: '#cbd5e1' }}>
                  <div>Survey Ref: <strong style={{ color: '#fff' }}>CSAT-{order.id}</strong></div>
                  <div>Status: <span style={{ color: '#2ed573', fontWeight: 700 }}>5/5 EXCELLENT</span></div>
                </div>
              </div>

              {/* Rating Dimensions */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>Repair Quality</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#ff7300', marginTop: '4px' }}>5.0 ★</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>Professionalism</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#2ed573', marginTop: '4px' }}>5.0 ★</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>Arrival Punctuality</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>4.8 ★</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>NPS Recommendation</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#a855f7', marginTop: '4px' }}>10/10</div>
                </div>
              </div>

              {/* Customer Verbatim Feedback */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700, marginBottom: '4px' }}>
                  Verified Client Comment
                </div>
                <blockquote style={{ margin: 0, fontSize: '12.5px', color: '#f8fafc', fontStyle: 'italic', lineHeight: 1.5 }}>
                  "Satou Kenji arrived right on time with the van fully equipped with replacement parts. He explained the thermal fuse failure clearly and fixed the fridge in under an hour. Excellent service!"
                </blockquote>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
