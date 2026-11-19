import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faTimesCircle,
  faPenToSquare,
  faRotateRight,
  faFileInvoice,
  faUserGear,
  faThumbsUp,
  faThumbsDown,
  faClockRotateLeft,
  faTriangleExclamation,
  faFloppyDisk,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { formatRM } from '../../lib/diagnosticsFormatters.js';

export default function DiagnosticsActions({
  assessment,
  onApprove,
  onReject,
  onRerun,
  onReprice,
  onCreateQuote,
  onFeedback,
  isReviewLoading,
  isQuoteLoading,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRerunModal, setShowRerunModal] = useState(false);
  const [rerunReason, setRerunReason] = useState('');
  const [feedbackVerdict, setFeedbackVerdict] = useState(null);
  const [actualCause, setActualCause] = useState('');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);

  // Edit state initialized from current assessment
  const [editedHours, setEditedHours] = useState(
    assessment?.estimate?.labor_hours_max || 1.5
  );
  const [editedParts] = useState(
    assessment?.recommended_parts || []
  );
  const [repricePreview, setRepricePreview] = useState(null);
  const [isRepricing, setIsRepricing] = useState(false);

  if (!assessment) {
    return (
      <aside className="diag-actions-panel ch-card" aria-label="Review actions">
        <p className="diag-empty-text">Select an assessment to review.</p>
      </aside>
    );
  }

  const hasCriticalSafety = (assessment.safety_flags || []).some(
    (f) => f.severity === 'critical' || f.severity === 'high'
  );
  const canCreateQuote =
    assessment.review_status === 'approved' &&
    (!hasCriticalSafety || safetyAcknowledged);

  // Trigger live reprice on edit change
  const handleHoursChange = async (newHours) => {
    const val = Math.max(0.5, parseFloat(newHours) || 0.5);
    setEditedHours(val);
    if (onReprice) {
      setIsRepricing(true);
      try {
        const res = await onReprice({
          id: assessment.id,
          causes: assessment.probable_causes || [],
          parts: editedParts,
          labor_hours: val,
        });
        setRepricePreview(res.estimate);
      } catch (e) {
        console.warn('Live reprice failed:', e);
      } finally {
        setIsRepricing(false);
      }
    }
  };

  const handleSaveEdit = () => {
    onApprove({
      id: assessment.id,
      review_status: 'edited',
      review_notes: `Manual edit: labor hours adjusted to ${editedHours}h`,
      changes: {
        labor_hours: editedHours,
        parts: editedParts,
        estimate: repricePreview || assessment.estimate,
      },
    });
    setIsEditing(false);
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) return;
    onReject({
      id: assessment.id,
      review_status: 'rejected',
      review_notes: rejectReason,
    });
    setShowRejectModal(false);
    setRejectReason('');
  };

  const handleConfirmRerun = () => {
    if (!rerunReason.trim()) return;
    onRerun({
      id: assessment.id,
      reason: rerunReason,
    });
    setShowRerunModal(false);
    setRerunReason('');
  };

  const handleSendFeedback = (verdict) => {
    setFeedbackVerdict(verdict);
    onFeedback({
      id: assessment.id,
      feedback: {
        verdict,
        actual_cause: actualCause || undefined,
        comment: feedbackComment || undefined,
      },
    });
  };

  const currentEst = repricePreview || assessment.estimate || {};
  const initialEst = assessment.estimate || {};
  const diffTotal = (currentEst.total_max || 0) - (initialEst.total_max || 0);

  return (
    <aside className="diag-actions-panel ch-card" aria-label="Review actions">
      <h2 className="diag-section-title">Review & Triage</h2>

      {/* Current Review Status Indicator */}
      <div className="diag-review-status-bar">
        <span>Review Status:</span>
        <span className={`diag-review-badge ${assessment.review_status}`}>
          {assessment.review_status.toUpperCase()}
        </span>
      </div>

      {/* Safety acknowledgement requirement */}
      {hasCriticalSafety && !safetyAcknowledged && (
        <div className="diag-safety-ack-box">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          <label className="diag-ack-label">
            <input
              type="checkbox"
              checked={safetyAcknowledged}
              onChange={(e) => setSafetyAcknowledged(e.target.checked)}
            />
            <span>I acknowledge critical safety flags before approving/quoting</span>
          </label>
        </div>
      )}

      {/* Main Review Actions */}
      {!isEditing ? (
        <div className="diag-action-buttons">
          <button
            type="button"
            className="ch-btn-success btn-block"
            disabled={isReviewLoading || assessment.review_status === 'approved'}
            onClick={() =>
              onApprove({
                id: assessment.id,
                review_status: 'approved',
                review_notes: 'Approved without edits',
              })
            }
          >
            <FontAwesomeIcon icon={faCheckCircle} /> Approve Diagnosis
          </button>

          <button
            type="button"
            className="ch-btn-secondary btn-block"
            onClick={() => setIsEditing(true)}
            disabled={isReviewLoading}
          >
            <FontAwesomeIcon icon={faPenToSquare} /> Edit Diagnosis & Hours
          </button>

          <button
            type="button"
            className="ch-btn-danger btn-block"
            disabled={isReviewLoading || assessment.review_status === 'rejected'}
            onClick={() => setShowRejectModal(true)}
          >
            <FontAwesomeIcon icon={faTimesCircle} /> Reject Diagnosis
          </button>

          <button
            type="button"
            className="ch-btn-ghost btn-block"
            onClick={() => setShowRerunModal(true)}
            title="Re-run assessment with pipeline"
          >
            <FontAwesomeIcon icon={faRotateRight} /> Re-run (Attempt #{assessment.attempt || 1})
          </button>
        </div>
      ) : (
        /* Inline Edit Mode with Live Repricing */
        <div className="diag-inline-edit-box">
          <h4 className="diag-edit-heading">Inline Adjustment</h4>
          
          <div className="diag-edit-field">
            <label className="diag-field-label">Labor Hours Allocation:</label>
            <div className="diag-hours-input-wrap">
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                className="ch-input"
                value={editedHours}
                onChange={(e) => handleHoursChange(e.target.value)}
              />
              <span className="mono">hours</span>
            </div>
          </div>

          {/* Reprice Diff Visualizer */}
          <div className="diag-diff-box">
            <div className="diag-diff-header">
              <span>Live Pricing Diff</span>
              {isRepricing && <span className="mono">Calculating...</span>}
            </div>
            <div className="diag-diff-row">
              <span>Original Max:</span>
              <span className="mono">{formatRM(initialEst.total_max || 0)}</span>
            </div>
            <div className="diag-diff-row">
              <span>Adjusted Max:</span>
              <strong className="mono">{formatRM(currentEst.total_max || 0)}</strong>
            </div>
            <div className="diag-diff-row diff-highlight">
              <span>Delta:</span>
              <span className={`mono ${diffTotal >= 0 ? 'accent-text' : 'green-text'}`}>
                {diffTotal >= 0 ? `+${formatRM(diffTotal)}` : `-${formatRM(Math.abs(diffTotal))}`}
              </span>
            </div>
          </div>

          <div className="diag-edit-actions">
            <button
              type="button"
              className="ch-btn-primary btn-sm"
              onClick={handleSaveEdit}
              disabled={isRepricing}
            >
              <FontAwesomeIcon icon={faFloppyDisk} /> Save & Approve
            </button>
            <button
              type="button"
              className="ch-btn-ghost btn-sm"
              onClick={() => setIsEditing(false)}
            >
              <FontAwesomeIcon icon={faXmark} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Downstream Operations: Create Quote & Dispatch */}
      <div className="diag-downstream-section">
        <h3 className="diag-sub-heading">Downstream Operations</h3>

        <button
          type="button"
          className="ch-btn-primary btn-block diag-quote-btn"
          disabled={!canCreateQuote || isQuoteLoading}
          onClick={() => onCreateQuote(assessment.id)}
          title={
            !canCreateQuote
              ? 'Assessment must be approved and critical safety flags acknowledged'
              : 'Generate official draft invoice quote'
          }
        >
          <FontAwesomeIcon icon={faFileInvoice} />
          {isQuoteLoading ? ' Generating...' : ' Generate Draft Quote'}
        </button>

        {assessment.draft_invoice_number && (
          <div className="diag-quote-success mono">
            <FontAwesomeIcon icon={faCheckCircle} /> Created: {assessment.draft_invoice_number}
          </div>
        )}

        {/* Integration Point for Smart Dispatch (B1) */}
        <button
          type="button"
          className="ch-btn-secondary btn-block"
          onClick={() => alert(`Smart Dispatch Integration (B1):\nAssigned to technician dispatch queue for ${assessment.appliance_category || 'appliance'}.`)}
        >
          <FontAwesomeIcon icon={faUserGear} /> Recommend Technician (B1)
        </button>
      </div>

      {/* Ground Truth Feedback Loop */}
      <div className="diag-feedback-section">
        <h3 className="diag-sub-heading">Was this diagnosis correct?</h3>
        <div className="diag-feedback-buttons">
          <button
            type="button"
            className={`diag-fb-btn ${feedbackVerdict === 'correct' ? 'active-green' : ''}`}
            onClick={() => handleSendFeedback('correct')}
          >
            <FontAwesomeIcon icon={faThumbsUp} /> Correct
          </button>
          <button
            type="button"
            className={`diag-fb-btn ${feedbackVerdict === 'partially_correct' ? 'active-orange' : ''}`}
            onClick={() => handleSendFeedback('partially_correct')}
          >
            Partial
          </button>
          <button
            type="button"
            className={`diag-fb-btn ${feedbackVerdict === 'incorrect' ? 'active-red' : ''}`}
            onClick={() => handleSendFeedback('incorrect')}
          >
            <FontAwesomeIcon icon={faThumbsDown} /> Incorrect
          </button>
        </div>

        {feedbackVerdict && feedbackVerdict !== 'correct' && (
          <div className="diag-feedback-inputs">
            <input
              type="text"
              placeholder="Actual cause found (optional)..."
              className="ch-input diag-fb-input"
              value={actualCause}
              onChange={(e) => setActualCause(e.target.value)}
            />
            <input
              type="text"
              placeholder="Feedback comment (optional)..."
              className="ch-input diag-fb-input"
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
            />
            <button
              type="button"
              className="ch-btn-ghost btn-xs"
              onClick={() => handleSendFeedback(feedbackVerdict)}
            >
              Update Feedback
            </button>
          </div>
        )}
      </div>

      {/* Audit Trail Timeline */}
      <div className="diag-audit-section">
        <h3 className="diag-sub-heading">
          <FontAwesomeIcon icon={faClockRotateLeft} /> Audit Trail
        </h3>
        <div className="diag-audit-timeline">
          <div className="diag-timeline-item">
            <span className="diag-timeline-dot" />
            <div className="diag-timeline-text">
              <strong>Assessment Initiated</strong>
              <small className="mono">{assessment.created_at?.slice(0, 16).replace('T', ' ') || 'Recent'}</small>
            </div>
          </div>
          {assessment.reviewed_at && (
            <div className="diag-timeline-item">
              <span className="diag-timeline-dot success" />
              <div className="diag-timeline-text">
                <strong>Reviewed as {assessment.review_status}</strong>
                <small className="mono">{assessment.reviewed_at.slice(0, 16).replace('T', ' ')}</small>
              </div>
            </div>
          )}
          {assessment.draft_invoice_number && (
            <div className="diag-timeline-item">
              <span className="diag-timeline-dot accent" />
              <div className="diag-timeline-text">
                <strong>Draft Quote Created</strong>
                <small className="mono">{assessment.draft_invoice_number}</small>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="diag-modal-backdrop" role="dialog" aria-modal="true">
          <div className="diag-modal-box">
            <h3>Reject AI Diagnosis</h3>
            <p className="diag-modal-hint">
              A rejection reason is required for safety and audit logs:
            </p>
            <textarea
              className="ch-textarea"
              rows="3"
              placeholder="e.g. Model incorrect, symptoms do not match compressor issue..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="diag-modal-actions">
              <button
                type="button"
                className="ch-btn-danger btn-sm"
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim()}
              >
                Confirm Reject
              </button>
              <button
                type="button"
                className="ch-btn-ghost btn-sm"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rerun Modal */}
      {showRerunModal && (
        <div className="diag-modal-backdrop" role="dialog" aria-modal="true">
          <div className="diag-modal-box">
            <h3>Re-run Diagnostic Pipeline</h3>
            <p className="diag-modal-hint">
              Re-running resets the assessment to &apos;pending&apos; and re-invokes the diagnostic pipeline.
            </p>
            <input
              type="text"
              className="ch-input"
              placeholder="Reason (e.g. New image uploaded, updated symptoms)..."
              value={rerunReason}
              onChange={(e) => setRerunReason(e.target.value)}
            />
            <div className="diag-modal-actions">
              <button
                type="button"
                className="ch-btn-primary btn-sm"
                onClick={handleConfirmRerun}
                disabled={!rerunReason.trim()}
              >
                Re-run Pipeline
              </button>
              <button
                type="button"
                className="ch-btn-ghost btn-sm"
                onClick={() => setShowRerunModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
