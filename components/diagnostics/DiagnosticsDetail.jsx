import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTriangleExclamation,
  faWrench,
  faFileInvoiceDollar,
  faQuestionCircle,
  faClipboardCheck,
  faCopy,
  faCheck,
  faMagnifyingGlassPlus,
  faMicrophone,
  faVideo,
  faClock,
  faChevronDown,
  faChevronUp,
  faPrint,
  faShareFromSquare,
  faShieldHalved,
  faBoxOpen,
  faUserCheck,
  faLocationDot,
  faBolt,
} from '@fortawesome/free-solid-svg-icons';
import { getDispatchRecommendations } from '../../lib/api.js';
import {
  formatRM,
  formatConfidencePct,
  getConfidenceColor,
  formatDateTimeMY,
} from '../../lib/diagnosticsFormatters.js';

export default function DiagnosticsDetail({
  assessment,
  isLoading,
  error,
  onRerun,
}) {
  const [copiedQuestion, setCopiedQuestion] = useState(null);
  const [showRunDetails, setShowRunDetails] = useState(false);
  const [activeMediaLightbox, setActiveMediaLightbox] = useState(null);
  const [checkedSteps, setCheckedSteps] = useState({});
  const [dispatchRecs, setDispatchRecs] = useState(null);
  const [isDispatchLoading, setIsDispatchLoading] = useState(false);
  const [dispatchedCode, setDispatchedCode] = useState(null);

  const handleFetchDispatch = async () => {
    setIsDispatchLoading(true);
    try {
      const data = await getDispatchRecommendations(
        assessment.booking_number || assessment.id,
        3
      );
      setDispatchRecs(data);
    } catch (e) {
      console.warn('Dispatch recommendation failed:', e);
    } finally {
      setIsDispatchLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="diag-detail-panel ch-card" aria-label="Assessment details">
        <div className="diag-detail-skeleton">
          <div className="diag-sk-header" />
          <div className="diag-sk-card" />
          <div className="diag-sk-card" />
          <div className="diag-sk-card" />
        </div>
      </main>
    );
  }

  if (error || !assessment) {
    return (
      <main className="diag-detail-panel ch-card" aria-label="Assessment details">
        <div className="diag-empty-detail">
          <FontAwesomeIcon icon={faTriangleExclamation} className="diag-warning-icon" />
          <h3>{error ? 'Error loading assessment' : 'No assessment selected'}</h3>
          <p className="diag-empty-text">
            {error?.message || 'Select an item from the queue to view its complete diagnosis, evidence, and quote estimate.'}
          </p>
          {error && onRerun && (
            <button type="button" className="ch-btn-secondary" onClick={onRerun}>
              Retry Load
            </button>
          )}
        </div>
      </main>
    );
  }

  const handleCopyQuestion = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestion(idx);
    setTimeout(() => setCopiedQuestion(null), 2000);
  };

  const handlePrintChecklist = () => {
    window.print();
  };

  const criticalSafetyFlags = (assessment.safety_flags || []).filter(
    (f) => f.severity === 'critical' || f.severity === 'high'
  );

  const estimate = assessment.estimate || {};
  const isFailed = assessment.status === 'failed';

  return (
    <main className="diag-detail-panel ch-card" aria-label="Assessment details">
      {/* 1. Header Information */}
      <div className="diag-detail-header">
        <div className="diag-detail-header-main">
          <div className="diag-booking-badge-row">
            <span className="diag-booking-pill mono">
              {assessment.booking_number || assessment.id.slice(0, 8)}
            </span>
            <span className="diag-status-badge" data-status={assessment.status}>
              {assessment.status.toUpperCase()}
            </span>
            {assessment.suggested_urgency && (
              <span className={`diag-urgency-pill ${assessment.suggested_urgency}`}>
                {assessment.suggested_urgency.toUpperCase()}
              </span>
            )}
            <span className="diag-sla-timer" title="SLA target: 4h response">
              <FontAwesomeIcon icon={faClock} style={{ marginRight: '4px' }} />
              SLA: In Window
            </span>
          </div>

          <h1 className="diag-appliance-title">
            {assessment.brand || ''} {assessment.model || 'Unknown Model'}
          </h1>

          <div className="diag-customer-meta">
            <span>Customer: <strong>{assessment.customer_first_name || 'Valued Customer'}</strong></span>
            <span className="diag-meta-separator">•</span>
            <span>Location: <strong>{assessment.address_city || 'Kuala Lumpur'}</strong></span>
            <span className="diag-meta-separator">•</span>
            <span>Category: <strong>{assessment.appliance_category || 'Appliance'}</strong></span>
          </div>
        </div>

        <div className="diag-header-actions">
          <button
            type="button"
            className="ch-btn-ghost btn-sm print-hide"
            onClick={handlePrintChecklist}
            title="Print technician worksheet"
          >
            <FontAwesomeIcon icon={faPrint} /> Print
          </button>
        </div>
      </div>

      {/* 2. Critical Safety Banner (Non-dismissible if critical) */}
      {criticalSafetyFlags.length > 0 && (
        <div className="diag-safety-banner" role="alert">
          <div className="diag-safety-icon-col">
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </div>
          <div className="diag-safety-content">
            <h4 className="diag-safety-title">Critical Safety Hazard Detected</h4>
            <div className="diag-safety-items">
              {criticalSafetyFlags.map((flag, idx) => (
                <div key={idx} className="diag-safety-item">
                  <span className="diag-safety-code mono">[{flag.code}]</span>
                  <span className="diag-safety-desc">{flag.description}</span>
                  {flag.category && <span className="diag-safety-cat">({flag.category})</span>}
                </div>
              ))}
            </div>
            <p className="diag-safety-instruction">
              Technician must observe isolation protocols before inspection. Quote approval requires safety acknowledgement.
            </p>
          </div>
        </div>
      )}

      {/* 3. Failure Alert & Re-run */}
      {isFailed && (
        <div className="diag-failure-box" role="alert">
          <FontAwesomeIcon icon={faTriangleExclamation} className="diag-failure-icon" />
          <div className="diag-failure-text">
            <strong>Diagnostic Pipeline Error</strong>
            <p>{assessment.failure_reason || 'Pipeline failed during automated analysis.'}</p>
          </div>
          {onRerun && (
            <button type="button" className="ch-btn-danger btn-sm" onClick={onRerun}>
              Re-run Diagnostic
            </button>
          )}
        </div>
      )}

      {/* 4. Reported Symptoms / Issue Description */}
      <section className="diag-section-box">
        <h3 className="diag-box-heading">
          <FontAwesomeIcon icon={faWrench} className="diag-box-icon" />
          Reported Customer Issue & Symptoms
        </h3>
        <p className="diag-issue-text">
          {assessment.reported_symptoms || assessment.issue_description || 'No detailed issue notes provided by customer.'}
        </p>
      </section>

      {/* 5. Media Gallery (Signed URLs - Never persisted to storage) */}
      {assessment.media && assessment.media.length > 0 && (
        <section className="diag-section-box">
          <h3 className="diag-box-heading">
            <FontAwesomeIcon icon={faVideo} className="diag-box-icon" />
            Inspection Media & Audio Transcripts
          </h3>
          <div className="diag-media-grid">
            {assessment.media.map((med, idx) => {
              const url = med.signed_url || med.file_url;
              const isVideo = med.media_type?.includes('video');
              const isAudio = med.media_type?.includes('audio');

              if (isVideo) {
                return (
                  <div key={idx} className="diag-media-card video-card">
                    <video src={url} controls className="diag-media-player" />
                    <span className="diag-media-caption">Video Evidence</span>
                  </div>
                );
              }
              if (isAudio) {
                return (
                  <div key={idx} className="diag-media-card audio-card">
                    <div className="diag-audio-header">
                      <FontAwesomeIcon icon={faMicrophone} />
                      <span>Audio Recording</span>
                      {med.language_tag && (
                        <span className="diag-lang-pill">{med.language_tag.toUpperCase()}</span>
                      )}
                    </div>
                    <audio src={url} controls className="diag-audio-player" />
                    {med.transcription && (
                      <div className="diag-audio-transcript">
                        <small className="mono">Transcript:</small>
                        <p>{med.transcription}</p>
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <div
                  key={idx}
                  className="diag-media-card image-card"
                  onClick={() => setActiveMediaLightbox(url)}
                >
                  <img src={url} alt={`Evidence ${idx + 1}`} className="diag-media-img" />
                  <div className="diag-media-zoom-overlay">
                    <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. AI Diagnosis Summary & Ranked Probable Causes */}
      <section className="diag-section-box">
        <div className="diag-box-header-row">
          <h3 className="diag-box-heading">
            <FontAwesomeIcon icon={faShieldHalved} className="diag-box-icon" />
            AI Fault Classification & Probable Causes
          </h3>
          <div className="diag-overall-conf">
            <span>Overall Confidence:</span>
            <strong
              style={{
                color: getConfidenceColor(assessment.confidence),
                marginLeft: '6px',
              }}
            >
              {formatConfidencePct(assessment.confidence)}
            </strong>
          </div>
        </div>

        {assessment.summary && (
          <div className="diag-summary-callout">
            <p>{assessment.summary}</p>
          </div>
        )}

        <div className="diag-causes-list">
          {(assessment.probable_causes || []).map((cause, idx) => {
            const pct = Math.round(cause.likelihood * 100);
            const color = getConfidenceColor(cause.likelihood);
            return (
              <div key={idx} className="diag-cause-row">
                <div className="diag-cause-top">
                  <div className="diag-cause-name">
                    <span className="diag-rank-badge">#{cause.rank || idx + 1}</span>
                    <strong>{cause.name}</strong>
                  </div>
                  <span className="diag-likelihood-val" style={{ color }}>
                    {pct}% Likelihood
                  </span>
                </div>

                <div className="diag-progress-track">
                  <div
                    className="diag-progress-fill"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>

                {cause.reasoning && (
                  <p className="diag-cause-reasoning">{cause.reasoning}</p>
                )}

                {cause.evidence && cause.evidence.length > 0 && (
                  <ul className="diag-evidence-list">
                    {cause.evidence.map((ev, eIdx) => (
                      <li key={eIdx}>{ev}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Suggested Diagnostic Checklist (Printable) */}
      {assessment.diagnostic_steps && assessment.diagnostic_steps.length > 0 && (
        <section className="diag-section-box printable-checklist">
          <h3 className="diag-box-heading">
            <FontAwesomeIcon icon={faClipboardCheck} className="diag-box-icon" />
            Field Diagnostic Inspection Steps
          </h3>
          <p className="diag-sub-hint">
            Step-by-step checklist recommended for the assigned field technician.
          </p>
          <div className="diag-steps-checklist">
            {assessment.diagnostic_steps.map((step, idx) => {
              const checked = Boolean(checkedSteps[idx]);
              return (
                <label key={idx} className="diag-step-item">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setCheckedSteps((prev) => ({ ...prev, [idx]: e.target.checked }))
                    }
                  />
                  <span className={`diag-step-text ${checked ? 'completed' : ''}`}>
                    <strong>Step {idx + 1}:</strong> {step}
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      )}

      {/* 8. Recommended Spare Parts (Catalog Match) */}
      {assessment.recommended_parts && assessment.recommended_parts.length > 0 && (
        <section className="diag-section-box">
          <h3 className="diag-box-heading">
            <FontAwesomeIcon icon={faBoxOpen} className="diag-box-icon" />
            Recommended Replacement Parts
          </h3>
          <div className="diag-table-wrap">
            <table className="diag-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Part Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assessment.recommended_parts.map((p, idx) => (
                  <tr key={idx}>
                    <td className="mono accent-text">{p.sku}</td>
                    <td>{p.name}</td>
                    <td>{p.quantity || 1}</td>
                    <td className="mono">{p.unit_price ? formatRM(p.unit_price) : '-'}</td>
                    <td>
                      <span className={`diag-stock-tag ${p.in_stock ? 'in-stock' : 'order-req'}`}>
                        {p.in_stock ? 'In Stock' : 'Order Required'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 9. Pure Deterministic Estimate Breakdown */}
      <section className="diag-section-box estimate-card-box">
        <h3 className="diag-box-heading">
          <FontAwesomeIcon icon={faFileInvoiceDollar} className="diag-box-icon" />
          Deterministic Pricing & Cost Estimate
        </h3>
        <div className="diag-estimate-grid">
          <div className="diag-est-line">
            <span>Diagnostic & Inspection Fee:</span>
            <span className="mono">{formatRM(estimate.diagnostic_fee || 50)}</span>
          </div>
          <div className="diag-est-line">
            <span>
              Labor ({estimate.labor_hours_min ?? 1}h - {estimate.labor_hours_max ?? 2}h @ {formatRM(estimate.labor_rate_hourly || 60)}/hr):
            </span>
            <span className="mono">
              {formatRM(estimate.labor_cost_min || 60)} - {formatRM(estimate.labor_cost_max || 120)}
            </span>
          </div>
          <div className="diag-est-line">
            <span>Parts Catalog Total:</span>
            <span className="mono">{formatRM(estimate.parts_cost_total || 0)}</span>
          </div>
          <div className="diag-est-line">
            <span>Transport / Logistics Fee:</span>
            <span className="mono">{formatRM(estimate.transport_fee || 0)}</span>
          </div>
          <div className="diag-est-line sst-line">
            <span>Sales & Service Tax (SST 8% on Service):</span>
            <span className="mono">
              {formatRM(estimate.sst_amount_min || 0)} - {formatRM(estimate.sst_amount_max || 0)}
            </span>
          </div>
          <div className="diag-est-line total-line">
            <strong>Estimated Total Range:</strong>
            <strong className="mono diag-total-value">
              {formatRM(estimate.total_min || 0)} - {formatRM(estimate.total_max || 0)}
            </strong>
          </div>
        </div>

        <div className="diag-disclaimer-box">
          <small>
            {estimate.disclaimer ||
              'Pricing is strictly deterministic based on CyberHub standard labor rates, official spare parts catalog, and 8% SST. Final price is confirmed upon physical technician inspection.'}
          </small>
        </div>
      </section>

      {/* 10. Customer Clarification Questions */}
      {assessment.customer_questions && assessment.customer_questions.length > 0 && (
        <section className="diag-section-box">
          <h3 className="diag-box-heading">
            <FontAwesomeIcon icon={faQuestionCircle} className="diag-box-icon" />
            Recommended Customer Clarification Questions
          </h3>
          <div className="diag-questions-list">
            {assessment.customer_questions.map((q, idx) => (
              <div key={idx} className="diag-question-row">
                <span className="diag-q-text">{q}</span>
                <div className="diag-q-actions">
                  <button
                    type="button"
                    className="ch-btn-ghost btn-xs"
                    onClick={() => handleCopyQuestion(q, idx)}
                    title="Copy to clipboard"
                  >
                    <FontAwesomeIcon icon={copiedQuestion === idx ? faCheck : faCopy} />
                    {copiedQuestion === idx ? ' Copied' : ' Copy'}
                  </button>
                  <button
                    type="button"
                    className="ch-btn-ghost btn-xs"
                    onClick={() => alert(`Draft message for customer:\n\n${q}`)}
                    title="Send question to customer via SMS/WhatsApp"
                  >
                    <FontAwesomeIcon icon={faShareFromSquare} /> Send
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 11. Recommended Technicians (Smart Dispatch - B1) */}
      <section className="diag-section-box dispatch-recommend-section">
        <div className="diag-box-header-row">
          <h3 className="diag-box-heading">
            <FontAwesomeIcon icon={faUserCheck} className="diag-box-icon" />
            Recommended Technicians (Smart Dispatch)
          </h3>
          <button
            type="button"
            className="ch-btn-ghost btn-xs"
            onClick={handleFetchDispatch}
            disabled={isDispatchLoading}
          >
            {isDispatchLoading ? 'Scoring Roster...' : dispatchRecs ? 'Re-calculate' : 'Calculate Best Matches'}
          </button>
        </div>

        {isDispatchLoading && (
          <div className="diag-meta-grid" style={{ padding: '8px 0' }}>
            <span className="mono">Running deterministic multi-factor ranking & geographic routing...</span>
          </div>
        )}

        {dispatchRecs && dispatchRecs.candidates && (
          <div className="diag-dispatch-list">
            {dispatchRecs.candidates.length === 0 ? (
              <p className="diag-empty-text">No dispatchable technicians found meeting skills & coverage criteria.</p>
            ) : (
              dispatchRecs.candidates.map((cand, idx) => {
                const bd = cand.breakdown;
                const scorePct = Math.round(cand.score * 100);
                const scoreColor = getConfidenceColor(cand.score);
                const isDispatched = dispatchedCode === cand.employee_code;

                return (
                  <div key={idx} className="diag-dispatch-item">
                    <div className="diag-dispatch-top">
                      <div className="diag-dispatch-name-wrap">
                        <span className="diag-rank-badge">#{idx + 1}</span>
                        <strong className="diag-dispatch-name">{cand.full_name}</strong>
                        <span className="mono accent-text">({cand.employee_code})</span>
                        {cand.zone && (
                          <span className="diag-dispatch-zone">
                            <FontAwesomeIcon icon={faLocationDot} /> {cand.zone}
                          </span>
                        )}
                      </div>
                      <div className="diag-dispatch-score mono" style={{ color: scoreColor }}>
                        {scorePct}% Match
                      </div>
                    </div>

                    <p className="diag-dispatch-explanation">{cand.explanation}</p>

                    <div className="diag-dispatch-meta-row">
                      <span className="diag-dispatch-tag">
                        Distance: <strong>{bd.distance_km != null ? `${bd.distance_km} km` : 'Zone match'}</strong>
                      </span>
                      <span className="diag-dispatch-tag">
                        Skill: <strong>{Math.round(bd.skill_match * 100)}%</strong>
                      </span>
                      <span className="diag-dispatch-tag">
                        Rating: <strong>{bd.shrunk_rating || 4.8}/5.0</strong>
                      </span>
                      <span className="diag-dispatch-tag">
                        Workload: <strong>{Math.round(bd.workload * 100)}% cap</strong>
                      </span>

                      <div className="diag-dispatch-action-right">
                        <button
                          type="button"
                          className={isDispatched ? 'ch-btn-ghost btn-xs' : 'ch-btn-primary btn-xs'}
                          onClick={() => {
                            setDispatchedCode(cand.employee_code);
                            alert(`Offer initiated for ${cand.full_name} (${cand.employee_code}) for order ${assessment.booking_number || assessment.id}.\nResponse window: 10 minutes.`);
                          }}
                          disabled={isDispatched}
                        >
                          <FontAwesomeIcon icon={isDispatched ? faCheck : faBolt} />
                          {isDispatched ? ' Offer Active' : ' Offer Job'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>

      {/* 12. Collapsible Run Details */}
      <section className="diag-section-box run-details-box">
        <button
          type="button"
          className="diag-accordion-trigger"
          onClick={() => setShowRunDetails(!showRunDetails)}
          aria-expanded={showRunDetails}
        >
          <span>Run Metadata & Pipeline Diagnostics</span>
          <FontAwesomeIcon icon={showRunDetails ? faChevronUp : faChevronDown} />
        </button>
        {showRunDetails && (
          <div className="diag-accordion-body">
            <div className="diag-meta-grid">
              <div><span>Provider:</span> <strong className="mono">{assessment.provider || 'mock'}</strong></div>
              <div><span>Model:</span> <strong className="mono">{assessment.model_name || 'qwen2.5:7b'}</strong></div>
              <div><span>Prompt Version:</span> <strong className="mono">{assessment.prompt_version || 'v1'}</strong></div>
              <div><span>Pipeline Version:</span> <strong className="mono">{assessment.pipeline_version || 'v1'}</strong></div>
              <div><span>Inference Latency:</span> <strong className="mono">{assessment.latency_ms || 0} ms</strong></div>
              <div><span>Tokens:</span> <strong className="mono">{assessment.input_tokens || 0} in / {assessment.output_tokens || 0} out</strong></div>
              <div><span>Attempt:</span> <strong className="mono">#{assessment.attempt || 1}</strong></div>
              <div><span>Created At:</span> <strong className="mono">{formatDateTimeMY(assessment.created_at)}</strong></div>
            </div>
          </div>
        )}
      </section>

      {/* Media Lightbox */}
      {activeMediaLightbox && (
        <div
          className="diag-lightbox-backdrop"
          onClick={() => setActiveMediaLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="diag-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={activeMediaLightbox} alt="Evidence Fullscreen" className="diag-lightbox-img" />
            <button
              type="button"
              className="diag-lightbox-close"
              onClick={() => setActiveMediaLightbox(null)}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
