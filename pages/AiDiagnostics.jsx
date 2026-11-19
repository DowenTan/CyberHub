import { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faKeyboard,
  faArrowLeft,
  faCheckCircle,
  faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useAssessments } from '../hooks/useAssessments.js';
import DiagnosticsQueue from '../components/diagnostics/DiagnosticsQueue.jsx';
import DiagnosticsDetail from '../components/diagnostics/DiagnosticsDetail.jsx';
import DiagnosticsActions from '../components/diagnostics/DiagnosticsActions.jsx';
import KeyboardShortcutsModal from '../components/diagnostics/KeyboardShortcutsModal.jsx';
import '../styles/ai-diagnostics.css';

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Command Center',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18" />
      </svg>
    ),
  },
  {
    path: '/smart-orders',
    label: 'Smart Orders',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    path: '/technicians',
    label: 'Technicians',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    path: '/chats',
    label: 'Chats',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    path: '/ai-diagnostics',
    label: 'AI Diagnostics',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    path: '/service-analytics',
    label: 'Service Analytics',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    path: '/price-settings',
    label: 'Price Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    path: '/settings',
    label: 'User Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function AiDiagnostics() {
  const navigate = useNavigate();
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'detail'

  const {
    filters,
    updateFilters,
    selectedId,
    setSelectedId,
    queueItems,
    isQueueLoading,
    refetchQueue,
    selectedDetail,
    isDetailLoading,
    detailError,
    reviewMutation,
    repriceMutation,
    rerunMutation,
    quoteMutation,
    feedbackMutation,
    toast,
    clearToast,
  } = useAssessments();

  // Keyboard navigation shortcuts
  const handleKeyDown = useCallback(
    (e) => {
      // Ignore if user is inside an input, textarea, or select
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      } else if (e.key === 'j') {
        // Next queue item
        e.preventDefault();
        if (queueItems.length > 0) {
          const currentIndex = queueItems.findIndex((it) => it.id === selectedId);
          const nextIndex = currentIndex < queueItems.length - 1 ? currentIndex + 1 : 0;
          setSelectedId(queueItems[nextIndex].id);
        }
      } else if (e.key === 'k') {
        // Previous queue item
        e.preventDefault();
        if (queueItems.length > 0) {
          const currentIndex = queueItems.findIndex((it) => it.id === selectedId);
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : queueItems.length - 1;
          setSelectedId(queueItems[prevIndex].id);
        }
      } else if (e.key === 'a') {
        // Quick approve
        e.preventDefault();
        if (selectedDetail && selectedDetail.review_status !== 'approved') {
          reviewMutation.mutate({
            id: selectedDetail.id,
            review_status: 'approved',
            review_notes: 'Approved via keyboard shortcut (a)',
          });
        }
      } else if (e.key === 'Escape') {
        setShowShortcutsModal(false);
      }
    },
    [queueItems, selectedId, selectedDetail, reviewMutation, setSelectedId]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSelectItem = (id) => {
    setSelectedId(id);
    setMobileView('detail');
  };

  return (
    <div className="app-container">
      {/* 1. Left Sidebar Navigation */}
      <aside className="app-left">
        <div
          className="app-logo"
          style={{ cursor: 'pointer', padding: '0 24px', marginBottom: '28px' }}
          onClick={() => navigate('/')}
        >
          <img
            src="/image/MainLogo.png"
            height="56px"
            alt="CyberHub Logo"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <ul className="nav-list">
          {NAV_ITEMS.map((item) => {
            const isActive = item.path === '/ai-diagnostics';
            return (
              <li key={item.path} className={`nav-list-item ${isActive ? 'active' : ''}`}>
                <NavLink to={item.path} className="nav-list-link" style={{ textDecoration: 'none' }}>
                  {item.icon}
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* 2. Main Viewport */}
      <main className="app-main diag-main-page">
        {/* Toast Notification Banner */}
        {toast && (
          <div
            className={`diag-toast ${toast.type}`}
            role="status"
            onClick={clearToast}
          >
            <FontAwesomeIcon
              icon={toast.type === 'success' ? faCheckCircle : faExclamationCircle}
            />
            <span>{toast.message}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="diag-page-header">
          <div className="diag-header-text">
            {mobileView === 'detail' && (
              <button
                type="button"
                className="ch-btn-ghost btn-sm mobile-back-btn"
                onClick={() => setMobileView('list')}
              >
                <FontAwesomeIcon icon={faArrowLeft} /> Back to Queue
              </button>
            )}
            <h1 className="diag-main-heading">AI Diagnostics Engine</h1>
            <p className="diag-subtitle">
              Automated multimodal symptom classification, field guidance & deterministic pricing.
            </p>
          </div>

          <div className="diag-header-controls">
            <button
              type="button"
              className="ch-btn-ghost btn-sm"
              onClick={() => setShowShortcutsModal(true)}
              title="Keyboard Shortcuts (?)"
              aria-label="View keyboard shortcuts"
            >
              <FontAwesomeIcon icon={faKeyboard} />
              <span className="hide-mobile"> Shortcuts (?)</span>
            </button>
          </div>
        </div>

        {/* 3-Column Responsive Work Area */}
        <div className={`diag-workbench-grid mobile-${mobileView}`}>
          {/* Column 1: Queue */}
          <div className="diag-col-queue">
            <DiagnosticsQueue
              items={queueItems}
              selectedId={selectedId}
              onSelect={handleSelectItem}
              filters={filters}
              onUpdateFilters={updateFilters}
              isLoading={isQueueLoading}
              onRefresh={refetchQueue}
            />
          </div>

          {/* Column 2: Detail */}
          <div className="diag-col-detail">
            <DiagnosticsDetail
              assessment={selectedDetail}
              isLoading={isDetailLoading}
              error={detailError}
              onRerun={() =>
                rerunMutation.mutate({
                  id: selectedDetail?.id,
                  reason: 'User manual re-run',
                })
              }
            />
          </div>

          {/* Column 3: Actions & Audit */}
          <div className="diag-col-actions">
            <DiagnosticsActions
              key={selectedDetail?.id || 'empty'}
              assessment={selectedDetail}
              onApprove={(payload) => reviewMutation.mutate(payload)}
              onReject={(payload) => reviewMutation.mutate(payload)}
              onRerun={(payload) => rerunMutation.mutate(payload)}
              onReprice={(payload) => repriceMutation.mutateAsync(payload)}
              onCreateQuote={(id) => quoteMutation.mutate(id)}
              onFeedback={(payload) => feedbackMutation.mutate(payload)}
              isReviewLoading={reviewMutation.isPending}
              isQuoteLoading={quoteMutation.isPending}
            />
          </div>
        </div>
      </main>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}
