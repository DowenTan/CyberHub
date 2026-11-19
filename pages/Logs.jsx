import { useState, useMemo, useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import SmartTable from '../components/SmartTable.jsx';

export default function Logs() {
  const auditLogs = useDashboardStore((state) => state.auditLogs || []);
  const undoLogAction = useDashboardStore((state) => state.undoLogAction);
  const fetchSupabaseData = useDashboardStore((state) => state.fetchSupabaseData);
  const currentUserProfile = useAuthStore((state) => state.profile);
  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchSupabaseData?.();
  }, [fetchSupabaseData]);

  const currentUserName = currentUserProfile?.full_name || currentUser?.user_metadata?.full_name || currentUserProfile?.email || currentUser?.email || 'Super Admin';
  const currentUserEmail = currentUserProfile?.email || currentUser?.email || 'admin@cyberhub.com';
  const currentUserId = currentUser?.id || currentUserProfile?.id;
  const isSuperAdmin = currentUserProfile?.is_super_admin || currentUserProfile?.roles?.includes('super_admin');

  const [activeActorFilter, setActiveActorFilter] = useState('ALL');
  const [activeStatusFilter, setActiveStatusFilter] = useState('ALL');
  const [confirmUndoModal, setConfirmUndoModal] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isProcessingUndo, setIsProcessingUndo] = useState(false);

  const isLogRevertedByMe = (log) => {
    if (!log || log.status !== 'reverted') return false;
    if (log.revertedById && currentUserId && log.revertedById === currentUserId) return true;
    if (log.revertedByEmail && currentUserEmail && log.revertedByEmail.toLowerCase() === currentUserEmail.toLowerCase()) return true;
    if (log.revertedBy && currentUserName && log.revertedBy.toLowerCase() === currentUserName.toLowerCase()) return true;
    if (isSuperAdmin && (log.revertedBy === 'Super Admin' || log.revertedBy === currentUserName)) return true;
    return false;
  };

  const isLogMadeByMe = (log) => {
    if (!log) return false;
    if (log.isCurrentUser) return true;
    if (currentUserId && log.actorId && log.actorId === currentUserId) return true;
    if (log.actorEmail && currentUserEmail && log.actorEmail.toLowerCase() === currentUserEmail.toLowerCase()) return true;
    if (log.actorName && currentUserName && log.actorName.toLowerCase() === currentUserName.toLowerCase()) return true;
    if (isSuperAdmin && log.actorRole === 'super_admin' && (log.actorName === 'Super Admin' || log.actorName === currentUserName)) {
      return true;
    }
    if (isLogRevertedByMe(log)) return true;
    return false;
  };

  const stats = useMemo(() => {
    const total = auditLogs.length;
    const myLogs = auditLogs.filter(isLogMadeByMe).length;
    const superAdminLogs = auditLogs.filter((l) => l.actorRole === 'super_admin').length;
    const adminLogs = auditLogs.filter((l) => l.actorRole === 'admin').length;
    const technicianLogs = auditLogs.filter((l) => l.actorRole === 'technician').length;
    const systemLogs = auditLogs.filter((l) => l.actorRole === 'system').length;
    const reversible = auditLogs.filter((l) => l.reversible && l.status !== 'reverted').length;
    const reverted = auditLogs.filter((l) => l.status === 'reverted').length;
    return { total, myLogs, superAdminLogs, adminLogs, technicianLogs, systemLogs, reversible, reverted };
  }, [auditLogs, currentUserName, currentUserEmail, currentUserId, isSuperAdmin]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((l) => {
      // Actor filter
      if (activeActorFilter === 'BY_ME' && !isLogMadeByMe(l)) return false;
      if (activeActorFilter === 'SUPER_ADMIN' && l.actorRole !== 'super_admin') return false;
      if (activeActorFilter === 'ADMIN' && l.actorRole !== 'admin') return false;
      if (activeActorFilter === 'TECHNICIAN' && l.actorRole !== 'technician') return false;
      if (activeActorFilter === 'SYSTEM' && l.actorRole !== 'system') return false;

      // Status filter
      if (activeStatusFilter === 'CAN_UNDO' && (!l.reversible || l.status === 'reverted')) return false;
      if (activeStatusFilter === 'REVERTED' && l.status !== 'reverted') return false;

      return true;
    });
  }, [auditLogs, activeActorFilter, activeStatusFilter, currentUserName, currentUserEmail, currentUserId, isSuperAdmin]);

  const triggerUndo = (log) => {
    setConfirmUndoModal(log);
  };

  const executeUndo = async () => {
    if (!confirmUndoModal) return;
    setIsProcessingUndo(true);
    try {
      const res = await undoLogAction(confirmUndoModal.id);
      if (res) {
        setToastMessage(`Action [${confirmUndoModal.id}] has been successfully undone and reverted.`);
      } else {
        setToastMessage(`Could not revert action [${confirmUndoModal.id}].`);
      }
    } catch {
      setToastMessage(`Error reverting action [${confirmUndoModal.id}].`);
    } finally {
      setIsProcessingUndo(false);
      setConfirmUndoModal(null);
      setTimeout(() => setToastMessage(null), 6000);
    }
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Timestamp', 'Actor Role', 'Actor Name', 'Action', 'Target', 'Details', 'Status', 'Reverted By', 'Reverted At'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.time,
      l.actorRole,
      `"${(l.actorName || '').replace(/"/g, '""')}"`,
      l.action,
      `"${(l.target || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      l.status,
      `"${(l.revertedBy || '').replace(/"/g, '""')}"`,
      `"${(l.revertedAt || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cyberhub_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = useMemo(
    () => [
      {
        key: 'time',
        label: 'Timestamp',
        width: 145,
        sortType: 'alphabetical',
        render: (row) => (
          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8' }}>
            {row.time}
          </span>
        ),
      },
      {
        key: 'id',
        label: 'Log Reference',
        width: 110,
        sortType: 'alphabetical',
        render: (row) => (
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#ff7300', fontSize: '11.5px' }}>
            {row.id}
          </span>
        ),
      },
      {
        key: 'actorRole',
        label: 'Done By (Actor)',
        width: 165,
        sortType: 'alphabetical',
        render: (row) => {
          let badgeBg = 'rgba(0, 210, 211, 0.15)';
          let badgeBorder = '#00d2d3';
          let badgeColor = '#00d2d3';
          let roleTitle = 'Admin';

          if (row.actorRole === 'super_admin') {
            badgeBg = 'rgba(255, 187, 0, 0.2)';
            badgeBorder = '#ffbb00';
            badgeColor = '#ffbb00';
            roleTitle = 'Superadmin';
          } else if (row.actorRole === 'technician') {
            badgeBg = 'rgba(46, 213, 115, 0.15)';
            badgeBorder = '#2ed573';
            badgeColor = '#2ed573';
            roleTitle = 'Technician';
          } else if (row.actorRole === 'system') {
            badgeBg = 'rgba(148, 163, 184, 0.15)';
            badgeBorder = '#94a3b8';
            badgeColor = '#cbd5e1';
            roleTitle = 'System Agent';
          }

          const isMe = isLogMadeByMe(row);

          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 800,
                    background: badgeBg,
                    border: `1px solid ${badgeBorder}`,
                    color: badgeColor,
                    letterSpacing: '0.3px',
                  }}
                >
                  {roleTitle}
                </span>
                {isMe && (
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      fontSize: '9.5px',
                      fontWeight: 800,
                      background: 'rgba(0, 210, 211, 0.2)',
                      border: '1px solid #00d2d3',
                      color: '#00d2d3',
                      letterSpacing: '0.4px',
                    }}
                    title="Action performed by your current session"
                  >
                    YOU
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11.5px', color: '#f1f5f9', fontWeight: 600, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {row.actorName} {isMe && !String(row.actorName || '').includes('(You)') ? '(You)' : ''}
              </div>
            </div>
          );
        },
      },
      {
        key: 'action',
        label: 'Action / Event Type',
        width: 175,
        sortType: 'alphabetical',
        render: (row) => {
          const act = String(row.action || '').toLowerCase();
          let tagLabel = 'EVENT';
          let tagBg = 'rgba(148, 163, 184, 0.15)';
          let tagBorder = '#64748b';
          let tagColor = '#94a3b8';

          if (act.includes('create') || act.includes('add') || act.includes('register') || act.includes('invite')) {
            tagLabel = 'CREATE';
            tagBg = 'rgba(46, 213, 115, 0.15)';
            tagBorder = '#2ed573';
            tagColor = '#2ed573';
          } else if (act.includes('update') || act.includes('edit') || act.includes('modify') || act.includes('status')) {
            tagLabel = 'UPDATE';
            tagBg = 'rgba(59, 130, 246, 0.15)';
            tagBorder = '#3b82f6';
            tagColor = '#60a5fa';
          } else if (act.includes('delete') || act.includes('remove') || act.includes('suspend')) {
            tagLabel = 'DELETE';
            tagBg = 'rgba(255, 71, 87, 0.15)';
            tagBorder = '#ff4757';
            tagColor = '#ff4757';
          } else if (act.includes('revert') || act.includes('undo')) {
            tagLabel = 'REVERT';
            tagBg = 'rgba(255, 187, 0, 0.2)';
            tagBorder = '#ffbb00';
            tagColor = '#ffbb00';
          }

          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '3px',
                    background: tagBg,
                    border: `1px solid ${tagBorder}`,
                    color: tagColor,
                    letterSpacing: '0.4px',
                  }}
                >
                  {tagLabel}
                </span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: act.includes('revert') ? '#ffbb00' : '#e2e8f0',
                  }}
                >
                  {row.action}
                </span>
              </div>
              {row.actionLabel && (
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
                  {row.actionLabel}
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: 'target',
        label: 'Affected Entity',
        width: 170,
        render: (row) => (
          <span style={{ fontSize: '11.5px', color: '#cbd5e1', fontWeight: 500 }}>
            {row.target || 'System Record'}
          </span>
        ),
      },
      {
        key: 'details',
        label: 'Action Details / Parameters',
        width: 260,
        render: (row) => {
          const isReverted = row.status === 'reverted';
          const isRevertedByMe = isReverted && isLogRevertedByMe(row);
          return (
            <div>
              <div
                title={row.details}
                style={{
                  fontSize: '11.5px',
                  color: '#94a3b8',
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.details}
              </div>
              {isReverted && (
                <div
                  style={{
                    fontSize: '10px',
                    color: '#ffbb00',
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontStyle: 'italic',
                  }}
                >
                  <span>
                    [Undone by {isRevertedByMe ? 'You' : (row.revertedBy || 'Super Admin')}
                    {row.revertedAt ? ` on ${row.revertedAt}` : ''}]
                  </span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: 'status',
        label: 'Status',
        width: 120,
        render: (row) => {
          const isReverted = row.status === 'reverted';
          const isRevertedByMe = isReverted && isLogRevertedByMe(row);
          return (
            <div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 800,
                  background: isReverted ? 'rgba(255, 187, 0, 0.18)' : 'rgba(46, 213, 115, 0.15)',
                  border: `1px solid ${isReverted ? '#ffbb00' : '#2ed573'}`,
                  color: isReverted ? '#ffbb00' : '#2ed573',
                }}
              >
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: isReverted ? '#ffbb00' : '#2ed573',
                  }}
                />
                {isReverted ? 'REVERTED' : 'APPLIED'}
              </span>
              {isReverted && (
                <div style={{ marginTop: '3px', fontSize: '10px', color: '#ffbb00', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap' }}>
                  <span>Undone by:</span>
                  <span style={{ color: isRevertedByMe ? '#00d2d3' : '#f1f5f9', fontWeight: 700 }}>
                    {isRevertedByMe ? 'You' : (row.revertedBy || 'Super Admin')}
                  </span>
                </div>
              )}
              {row.revertedAt && (
                <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '1px', fontFamily: 'monospace' }}>
                  {row.revertedAt.slice(0, 16)}
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: 'actions',
        label: 'Undo / Revert',
        width: 140,
        render: (row) => {
          if (row.status === 'reverted') {
            const isRevertedByMe = isLogRevertedByMe(row);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10.5px',
                    color: '#ffbb00',
                    fontWeight: 700,
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Reverted
                </span>
                <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                  by <strong style={{ color: isRevertedByMe ? '#00d2d3' : '#cbd5e1' }}>{isRevertedByMe ? 'You' : (row.revertedBy || 'Super Admin')}</strong>
                </span>
              </div>
            );
          }

          if (!row.reversible) {
            return (
              <span style={{ fontSize: '10.5px', color: '#475569', fontStyle: 'italic' }}>
                Read-Only
              </span>
            );
          }

          return (
            <button
              type="button"
              onClick={() => triggerUndo(row)}
              title="Undo this action and restore previous state"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 9px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '5px',
                background: 'rgba(255, 115, 0, 0.15)',
                border: '1px solid #ff7300',
                color: '#ff7300',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
              Undo
            </button>
          );
        },
      },
    ],
    [currentUserName, currentUserEmail, currentUserId, isSuperAdmin]
  );

  return (
    <div className="ch-page-container" style={{ padding: '20px 24px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 1200,
            background: 'rgba(5, 19, 64, 0.95)',
            border: '1.5px solid #2ed573',
            borderRadius: '8px',
            padding: '12px 18px',
            color: '#f8fafc',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12.5px',
            fontWeight: 600,
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2ed573" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', marginLeft: '6px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '0.5px' }}>
              System & Audit Action Logs
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(255, 115, 0, 0.18)',
                color: '#ff7300',
                border: '1px solid rgba(255, 115, 0, 0.35)',
              }}
            >
              {auditLogs.length} Events Logged
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#94a3b8' }}>
            Cryptographically verifiable ledger of administrative actions, dispatch decisions, pricing edits, and system events with one-click undo.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="ch-btn"
            onClick={handleExportCsv}
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '6px',
              background: 'rgba(5, 19, 64, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              cursor: 'pointer',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Audit CSV
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div style={{ background: 'rgba(5, 19, 64, 0.45)', border: '1px solid rgba(255, 115, 0, 0.25)', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Total Action Logs</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>{stats.total}</div>
          <div style={{ fontSize: '11px', color: '#ff7300', marginTop: '2px' }}>Audit trail entries</div>
        </div>
        <div style={{ background: 'rgba(5, 19, 64, 0.45)', border: '1.5px solid rgba(0, 210, 211, 0.4)', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: '#00d2d3', fontWeight: 700, textTransform: 'uppercase' }}>Changes Made by Me</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#00d2d3', marginTop: '4px' }}>{stats.myLogs}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Your user CRUD actions</div>
        </div>
        <div style={{ background: 'rgba(5, 19, 64, 0.45)', border: '1px solid rgba(255, 187, 0, 0.25)', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Done by Superadmin</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffbb00', marginTop: '4px' }}>{stats.superAdminLogs}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Privileged root events</div>
        </div>
        <div style={{ background: 'rgba(5, 19, 64, 0.45)', border: '1px solid rgba(0, 210, 211, 0.25)', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Done by Admin</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#00d2d3', marginTop: '4px' }}>{stats.adminLogs}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Operator level actions</div>
        </div>
        <div style={{ background: 'rgba(5, 19, 64, 0.45)', border: '1px solid rgba(255, 115, 0, 0.25)', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Reversible Actions</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#ff7300', marginTop: '4px' }}>{stats.reversible}</div>
          <div style={{ fontSize: '11px', color: '#ff7300', marginTop: '2px' }}>Can undo immediately</div>
        </div>
        <div style={{ background: 'rgba(5, 19, 64, 0.45)', border: '1px solid rgba(46, 213, 115, 0.25)', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Reverted Actions</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#2ed573', marginTop: '4px' }}>{stats.reverted}</div>
          <div style={{ fontSize: '11px', color: '#2ed573', marginTop: '2px' }}>Actions rolled back</div>
        </div>
      </div>

      {/* 3. Combined Filter Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
        {/* Row A: Filter by Actor (like done by admin or superadmin) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginRight: '4px' }}>
            Actor Role:
          </span>
          {[
            { key: 'ALL', label: 'All Actors', count: auditLogs.length },
            { key: 'BY_ME', label: 'Done by Me', count: stats.myLogs },
            { key: 'SUPER_ADMIN', label: 'Done by Superadmin', count: stats.superAdminLogs },
            { key: 'ADMIN', label: 'Done by Admin', count: stats.adminLogs },
            { key: 'TECHNICIAN', label: 'Done by Technician', count: stats.technicianLogs },
            { key: 'SYSTEM', label: 'Done by System Agent', count: stats.systemLogs },
          ].map((tab) => {
            const active = activeActorFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveActorFilter(tab.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: active ? 'rgba(255, 115, 0, 0.18)' : 'rgba(5, 19, 64, 0.45)',
                  border: active ? '1px solid #ff7300' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: active ? '#ff7300' : '#94a3b8',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '9.5px',
                    padding: '1px 5px',
                    borderRadius: '10px',
                    background: active ? '#ff7300' : 'rgba(255, 255, 255, 0.08)',
                    color: active ? '#fff' : '#94a3b8',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Row B: Filter by Action State */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginRight: '4px' }}>
            Action Status:
          </span>
          {[
            { key: 'ALL', label: 'All Log Entries' },
            { key: 'CAN_UNDO', label: 'Can Undo (Reversible)' },
            { key: 'REVERTED', label: 'Reverted / Undone' },
          ].map((tab) => {
            const active = activeStatusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveStatusFilter(tab.key)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '5px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: active ? 'rgba(0, 210, 211, 0.15)' : 'rgba(5, 19, 64, 0.3)',
                  border: active ? '1px solid #00d2d3' : '1px solid rgba(255, 255, 255, 0.06)',
                  color: active ? '#00d2d3' : '#94a3b8',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. SmartTable Component */}
      <div style={{ background: 'rgba(5, 19, 64, 0.4)', borderRadius: '8px', border: '1px solid rgba(255, 115, 0, 0.15)', overflow: 'hidden' }}>
        <SmartTable
          columns={columns}
          data={filteredLogs}
          rowKey="id"
          tableId="audit_logs_table"
          searchPlaceholder="Search logs by action, actor, target or details..."
          enableAiFilter={true}
          defaultSortKey="time"
          defaultSortOrder="desc"
          maxHeight="calc(100vh - 380px)"
          showIndex={true}
        />
      </div>

      {/* Undo Action Confirmation Modal */}
      {confirmUndoModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(1, 8, 31, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => !isProcessingUndo && setConfirmUndoModal(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#01081f',
              border: '1.5px solid #ff7300',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.9)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: 'rgba(255, 115, 0, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ff7300',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7v6h6" />
                  <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
                  Revert & Undo Action
                </h3>
                <span style={{ fontSize: '11px', color: '#ff7300', fontFamily: 'monospace' }}>
                  Log Reference: {confirmUndoModal.id}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 14px 0' }}>
              Are you sure you want to revert this action? This will undo the changes made and restore the target entity to its previous state. The original log will be preserved with REVERTED status, and a compensating revert log will track this action.
            </p>

            <div style={{ background: 'rgba(5, 19, 64, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '11.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Action Performed:</span>
                <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{confirmUndoModal.action}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Originally Executed By:</span>
                <span style={{ color: '#ff7300', fontWeight: 700 }}>
                  {confirmUndoModal.actorName} ({confirmUndoModal.actorRole})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Reverted By (You):</span>
                <span style={{ color: '#00d2d3', fontWeight: 700 }}>
                  {currentUserName} ({isSuperAdmin ? 'Super Admin' : 'Admin'})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Target:</span>
                <span style={{ color: '#f1f5f9' }}>{confirmUndoModal.target}</span>
              </div>
              <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '6px', color: '#cbd5e1' }}>
                <strong>Details:</strong> {confirmUndoModal.details}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                disabled={isProcessingUndo}
                className="ch-btn"
                onClick={() => setConfirmUndoModal(null)}
                style={{ padding: '7px 14px', fontSize: '12px', background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingUndo}
                className="ch-btn ch-btn-primary"
                onClick={executeUndo}
                style={{
                  padding: '7px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: '#ff7300',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '6px',
                  cursor: isProcessingUndo ? 'wait' : 'pointer',
                  opacity: isProcessingUndo ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7v6h6" />
                  <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                </svg>
                {isProcessingUndo ? 'Reverting Action...' : 'Confirm & Revert Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
