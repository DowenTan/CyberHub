import React, { useState, useMemo } from 'react';
import { evaluateTechnicianClient } from '../lib/technicianAppraisal.js';

/**
 * Technician Performance & AI Appraisal Report Modal.
 * 
 * Features:
 * - Fleet KPI scorecard (First-Time Fix Rate, Completed Jobs, SLA Compliance, Rework, CSAT)
 * - AI Work Ethics & Conduct Profile (Punctuality, Safety/SOP, Communication, Peer Mentoring)
 * - Evaluation of Achievements and Logged Mistakes / Incidents
 * - AI Review & Career Trajectory Recommendation (Promotion / Merit Retention / Upskilling / Demotion Review)
 * - Printable PDF view & Audit Export
 * 
 * Strict Zero Emojis - Pure SVG icons only.
 */

export default function TechnicianAppraisalModal({
  isOpen,
  onClose,
  technician,
  fleet = [],
}) {
  const [selectedTechId, setSelectedTechId] = useState(() => technician?.id || fleet[0]?.id || 1);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'kpis' | 'ethics' | 'achievements' | 'ai_review'

  // Update selectedTechId when technician prop changes
  React.useEffect(() => {
    if (technician?.id) {
      setSelectedTechId(technician.id);
    }
  }, [technician]);

  const activeTech = useMemo(() => {
    return fleet.find((t) => t.id === selectedTechId) || technician || fleet[0];
  }, [fleet, selectedTechId, technician]);

  const appraisal = useMemo(() => {
    return evaluateTechnicianClient(activeTech);
  }, [activeTech]);

  if (!isOpen || !appraisal) return null;

  const { kpis, workEthics, achievements, mistakes, aiReview } = appraisal;

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appraisal, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `technician_ai_appraisal_${appraisal.technicianCode}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  return (
    <div
      className="ch-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
          maxWidth: '960px',
          background: '#040d21',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '12px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(56, 189, 248, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(255, 115, 0, 0.15)',
                border: '1px solid #ff7300',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff7300',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <polyline points="17 11 19 13 23 9" />
              </svg>
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 700 }}>
                  Technician AI Performance Appraisal & Work Ethics Report
                </h3>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: `${aiReview.recommendationColor}20`,
                    border: `1px solid ${aiReview.recommendationColor}`,
                    color: aiReview.recommendationColor,
                    fontWeight: 700,
                  }}
                >
                  {aiReview.recommendationCode.replace(/_/g, ' ')}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                Governed by CIDB standards & CyberHub Autonomous Fleet Evaluation Engine
              </p>
            </div>
          </div>

          {/* Action buttons & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {fleet.length > 1 && (
              <select
                value={activeTech.id}
                onChange={(e) => setSelectedTechId(Number(e.target.value))}
                style={{
                  background: 'rgba(5, 19, 64, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#38bdf8',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {fleet.map((t) => (
                  <option key={t.id} value={t.id} style={{ background: '#040d21', color: '#fff' }}>
                    {t.code} - {t.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handleExportJson}
              style={{
                fontSize: '11.5px',
                padding: '5px 10px',
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export JSON
            </button>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                fontSize: '11.5px',
                padding: '5px 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print Report (PDF)
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Technician Bio Bar */}
        <div
          style={{
            padding: '12px 22px',
            background: 'rgba(0, 0, 0, 0.35)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={appraisal.avatar}
              alt={appraisal.technicianName}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                border: `2px solid ${aiReview.recommendationColor}`,
                objectFit: 'cover',
                background: '#0a192f',
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '14px', color: '#fff' }}>{appraisal.technicianName}</strong>
                <span style={{ fontSize: '11px', color: '#ff7300', fontWeight: 600 }}>{appraisal.technicianCode}</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '3px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#9ca3af',
                  }}
                >
                  Tenure: {appraisal.tenureMonths} Months
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                Specialty: <span style={{ color: '#e2e8f0' }}>{appraisal.specialty}</span> · Zone: <span style={{ color: '#e2e8f0' }}>{appraisal.zone}</span>
              </p>
            </div>
          </div>

          {/* Quick Nav Tabs */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { id: 'summary', label: 'Overview' },
              { id: 'ethics', label: 'AI Work Ethics' },
              { id: 'achievements', label: 'Evaluation & Mistakes' },
              { id: 'ai_review', label: 'Promotion & Upskilling' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    fontSize: '11.5px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    color: isActive ? '#38bdf8' : '#9ca3af',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Report Content */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', background: '#020718', flex: 1 }}>
          {/* =========================================================================
              SECTION 1: 6-KPI SCORECARD (Always visible or in Summary)
             ========================================================================= */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Fleet Performance KPI Scorecard
              </span>
              <span style={{ fontSize: '10px', color: '#38bdf8' }}>Verified Telemetry Sync</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              <div style={{ background: 'rgba(5, 19, 64, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '10px' }}>
                <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>First-Time Fix</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: kpis.firstTimeFixRatePct >= 88 ? '#2ed573' : '#ff7300', marginTop: '2px' }}>
                  {kpis.firstTimeFixRatePct}%
                </div>
                <span style={{ fontSize: '9.5px', color: '#64748b' }}>Benchmark: &gt;85%</span>
              </div>

              <div style={{ background: 'rgba(5, 19, 64, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '10px' }}>
                <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>Completed Jobs</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                  {kpis.completedJobs}
                </div>
                <span style={{ fontSize: '9.5px', color: '#64748b' }}>Dispatches closed</span>
              </div>

              <div style={{ background: 'rgba(5, 19, 64, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '10px' }}>
                <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>Customer Rating</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffa502', marginTop: '2px' }}>
                  {kpis.customerRating.toFixed(1)} <span style={{ fontSize: '11px', color: '#9ca3af' }}>/ 5.0</span>
                </div>
                <span style={{ fontSize: '9.5px', color: '#64748b' }}>CSAT Average</span>
              </div>

              <div style={{ background: 'rgba(5, 19, 64, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '10px' }}>
                <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>SLA Compliance</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#2ed573', marginTop: '2px' }}>
                  {kpis.slaComplianceRatePct}%
                </div>
                <span style={{ fontSize: '9.5px', color: '#64748b' }}>Target: &gt;90%</span>
              </div>

              <div style={{ background: 'rgba(5, 19, 64, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '10px' }}>
                <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>Warranty Rework</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: kpis.warrantyReworkRatePct <= 5 ? '#2ed573' : '#ff4757', marginTop: '2px' }}>
                  {kpis.warrantyReworkRatePct}%
                </div>
                <span style={{ fontSize: '9.5px', color: '#64748b' }}>Callback ceiling &lt;6%</span>
              </div>

              <div style={{ background: 'rgba(5, 19, 64, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '10px' }}>
                <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>Margin Contribution</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
                  RM {kpis.marginContributionMyr.toLocaleString('en-MY')}
                </div>
                <span style={{ fontSize: '9.5px', color: '#64748b' }}>Gross margin value</span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              SECTION 2: AI WORK ETHICS & CONDUCT PROFILE
             ========================================================================= */}
          {(activeTab === 'summary' || activeTab === 'ethics') && (
            <div style={{ marginBottom: '22px', background: 'rgba(5, 19, 64, 0.3)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <strong style={{ fontSize: '13px', color: '#fff' }}>AI Work Ethics & Professional Conduct Profile</strong>
                </div>
                <span
                  style={{
                    fontSize: '10.5px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: workEthics.overallRating === 'Exceptional' ? 'rgba(46, 213, 115, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                    border: workEthics.overallRating === 'Exceptional' ? '1px solid #2ed573' : '1px solid #38bdf8',
                    color: workEthics.overallRating === 'Exceptional' ? '#2ed573' : '#38bdf8',
                    fontWeight: 700,
                  }}
                >
                  Conduct: {workEthics.overallRating}
                </span>
              </div>

              {/* Ethics Dimensions Pills */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>Punctuality & Schedule Discipline</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>{workEthics.punctualityScorePct}% On-Time</div>
                </div>
                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>CIDB Safety & SOP Adherence</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#2ed573', marginTop: '2px' }}>{workEthics.safetyAndSopCompliancePct}% Verified</div>
                </div>
                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>Dispatch & Radio Communication</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>{workEthics.dispatchCommunicationRating}</div>
                </div>
                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>Tooling & Service Van Care</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', marginTop: '2px' }}>{workEthics.toolAndFleetCareRating}</div>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5', color: '#cbd5e1', background: 'rgba(0, 0, 0, 0.3)', padding: '10px 12px', borderRadius: '6px', borderLeft: '3px solid #38bdf8' }}>
                {workEthics.summary}
              </p>
            </div>
          )}

          {/* =========================================================================
              SECTION 3: EVALUATION - ACHIEVEMENTS AND MISTAKES / INCIDENTS
             ========================================================================= */}
          {(activeTab === 'summary' || activeTab === 'achievements') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '14px', marginBottom: '22px' }}>
              {/* Key Achievements */}
              <div style={{ background: 'rgba(5, 19, 64, 0.3)', border: '1px solid rgba(46, 213, 115, 0.2)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2ed573" strokeWidth="2">
                    <circle cx="12" cy="8" r="7" />
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                  </svg>
                  <strong style={{ fontSize: '12.5px', color: '#2ed573', textTransform: 'uppercase' }}>
                    Key Achievements & Milestones ({achievements.length})
                  </strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {achievements.map((ach) => (
                    <div
                      key={ach.id}
                      style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        borderLeft: '3px solid #2ed573',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{ach.title}</span>
                        <span style={{ fontSize: '10px', color: '#9ca3af' }}>{ach.date}</span>
                      </div>
                      <p style={{ margin: '4px 0 2px', fontSize: '11px', color: '#cbd5e1' }}>{ach.description}</p>
                      <div style={{ fontSize: '10.5px', color: '#2ed573', marginTop: '2px', fontWeight: 600 }}>
                        Impact: {ach.impact}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logged Mistakes & Incident Areas */}
              <div style={{ background: 'rgba(5, 19, 64, 0.3)', border: '1px solid rgba(255, 71, 87, 0.2)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ff4757" strokeWidth="2">
                    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <strong style={{ fontSize: '12.5px', color: '#ff4757', textTransform: 'uppercase' }}>
                    Logged Incidents & Mistakes ({mistakes.length})
                  </strong>
                </div>

                {mistakes.length === 0 ? (
                  <div style={{ padding: '14px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '6px', fontSize: '11.5px', color: '#9ca3af', textAlign: 'center' }}>
                    Clean Record: Zero logged procedural or technical mistakes.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {mistakes.map((mis) => (
                      <div
                        key={mis.id}
                        style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          borderRadius: '6px',
                          padding: '10px 12px',
                          borderLeft: mis.severity === 'Critical' ? '3px solid #ff4757' : '3px solid #ff7300',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{mis.title}</span>
                          <span
                            style={{
                              fontSize: '9.5px',
                              padding: '1px 6px',
                              borderRadius: '3px',
                              background: mis.resolutionStatus === 'Resolved' ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255, 115, 0, 0.15)',
                              color: mis.resolutionStatus === 'Resolved' ? '#2ed573' : '#ff7300',
                              fontWeight: 700,
                            }}
                          >
                            {mis.resolutionStatus || 'Logged'}
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 2px', fontSize: '11px', color: '#cbd5e1' }}>{mis.description}</p>
                        <div style={{ fontSize: '10.5px', color: '#ff7300', marginTop: '2px' }}>
                          Operational Impact: {mis.impact}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 4: AI REVIEW & CAREER TRAJECTORY RECOMMENDATION
             ========================================================================= */}
          {(activeTab === 'summary' || activeTab === 'ai_review') && (
            <div
              style={{
                background: 'rgba(4, 13, 33, 0.7)',
                border: `1.5px solid ${aiReview.recommendationColor}`,
                borderRadius: '10px',
                padding: '16px 18px',
                boxShadow: `0 4px 20px ${aiReview.recommendationColor}15`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: `${aiReview.recommendationColor}25`,
                      color: aiReview.recommendationColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </span>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      AI Career Progression Decision & Trajectory
                    </span>
                    <h4 style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: 700 }}>
                      {aiReview.recommendationTitle}
                    </h4>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>AI Decision Confidence:</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: aiReview.recommendationColor }}>
                    {(aiReview.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '12px', lineHeight: '1.55', color: '#e2e8f0', margin: '0 0 14px', background: 'rgba(0, 0, 0, 0.35)', padding: '12px', borderRadius: '6px', borderLeft: `3px solid ${aiReview.recommendationColor}` }}>
                {aiReview.reasoning}
              </p>

              {/* Recommended Training & Competency Modules */}
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Targeted Training & Upskilling Syllabus
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px', marginTop: '6px' }}>
                  {aiReview.recommendedTrainingModules.map((mod, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#fff' }}>{mod.name}</div>
                        <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                          Provider: {mod.provider} · {mod.hours} Training Hours
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '9.5px',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          background: mod.status === 'Mandatory' ? 'rgba(255, 71, 87, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                          color: mod.status === 'Mandatory' ? '#ff4757' : '#38bdf8',
                          fontWeight: 700,
                        }}
                      >
                        {mod.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supervisor Sign-Off & Action Note */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  borderRadius: '6px',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                }}
              >
                <div>
                  <span style={{ fontSize: '10px', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Supervisor Next Action:
                  </span>
                  <div style={{ fontSize: '11.5px', color: '#e2e8f0', marginTop: '1px' }}>
                    {aiReview.supervisorActionRequired}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => alert(`Supervisor sign-off acknowledged for ${appraisal.technicianName} (${appraisal.technicianCode}). Trajectory recommendation submitted to HR.`)}
                  style={{
                    background: aiReview.recommendationColor,
                    color: '#000',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 14px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Confirm & Sign-Off
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
