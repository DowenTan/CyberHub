import { useState, useMemo, useRef, useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { generateGoogleStrongPassword } from '../store/initialDbData.js';
import SmartTable from '../components/SmartTable.jsx';
import { inviteStaffUser } from '../lib/api.js';

// Helper to auto-format email to lowercase dot format name@cyberhub.com
const generateAdminEmail = (name) => {
  const clean = String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
  return clean ? `${clean}@cyberhub.com` : 'staff@cyberhub.com';
};

export default function Admins() {
  const admins = useDashboardStore((state) => state.admins || []);
  const addAdmin = useDashboardStore((state) => state.addAdmin);
  const updateAdmin = useDashboardStore((state) => state.updateAdmin);
  const deleteAdmin = useDashboardStore((state) => state.deleteAdmin);
  const fetchSupabaseData = useDashboardStore((state) => state.fetchSupabaseData);
  const currentUserRole = useAuthStore((state) => state.role);

  useEffect(() => {
    fetchSupabaseData?.();
  }, [fetchSupabaseData]);

  const [activeRoleFilter, setActiveRoleFilter] = useState('ALL');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);

  // Form states
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('admin');
  const [formBranchId, setFormBranchId] = useState('00000000-0000-0000-0000-000000000101');
  const [formBranchName, setFormBranchName] = useState('Kuala Lumpur Central HQ');
  const [formStatus, setFormStatus] = useState('active');
  const [formMfa, setFormMfa] = useState(true);
  const [inviteFeedback, setInviteFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const BRANCH_OPTIONS = [
    { id: '00000000-0000-0000-0000-000000000101', name: 'Kuala Lumpur Central HQ' },
    { id: '00000000-0000-0000-0000-000000000102', name: 'Selangor Regional Hub' },
    { id: '00000000-0000-0000-0000-000000000103', name: 'Penang Northern Branch' },
    { id: '00000000-0000-0000-0000-000000000104', name: 'Johor Southern Hub' },
  ];

  const stats = useMemo(() => {
    const total = admins.length;
    const superAdmins = admins.filter((a) => a.role === 'super_admin').length;
    const regularAdmins = admins.filter((a) => a.role === 'admin' || a.role === 'branch_admin').length;
    const mfaEnforced = admins.filter((a) => a.mfaEnabled || (a.mfa && a.mfa.includes('AAL2'))).length;
    const activeCount = admins.filter((a) => a.status === 'active').length;
    return { total, superAdmins, regularAdmins, mfaEnforced, activeCount };
  }, [admins]);

  const filteredAdmins = useMemo(() => {
    if (activeRoleFilter === 'ALL') return admins;
    if (activeRoleFilter === 'SUPER_ADMIN') return admins.filter((a) => a.role === 'super_admin');
    if (activeRoleFilter === 'ADMIN') return admins.filter((a) => a.role === 'admin' || a.role === 'branch_admin');
    if (activeRoleFilter === 'BRANCH_ADMIN') return admins.filter((a) => a.role === 'branch_admin');
    if (activeRoleFilter === 'HR_EXEC') return admins.filter((a) => a.role === 'hr_manager' || a.role === 'executive');
    if (activeRoleFilter === 'SUSPENDED') return admins.filter((a) => a.status === 'suspended');
    return admins;
  }, [admins, activeRoleFilter]);

  const openInviteModal = () => {
    setEditingAdmin(null);
    setFormName('');
    setFormEmail(generateAdminEmail(''));
    setFormPassword(generateGoogleStrongPassword());
    setFormRole('admin');
    setFormBranchId('00000000-0000-0000-0000-000000000101');
    setFormBranchName('Kuala Lumpur Central HQ');
    setFormStatus('active');
    setFormMfa(true);
    setInviteFeedback(null);
    setShowInviteModal(true);
  };

  const openEditModal = (a) => {
    setEditingAdmin(a);
    setFormName(a.name || '');
    setFormEmail(a.email || generateAdminEmail(a.name));
    setFormPassword(a.password || generateGoogleStrongPassword());
    setFormRole(a.role || 'admin');
    setFormBranchId(a.branchId || '00000000-0000-0000-0000-000000000101');
    setFormBranchName(a.branchName || 'Kuala Lumpur Central HQ');
    setFormStatus(a.status || 'active');
    setFormMfa(Boolean(a.mfaEnabled || (a.mfa && a.mfa.includes('AAL2'))));
    setInviteFeedback(null);
    setShowInviteModal(true);
  };

  const handleBranchChange = (e) => {
    const id = e.target.value;
    setFormBranchId(id);
    const found = BRANCH_OPTIONS.find((b) => b.id === id);
    if (found) setFormBranchName(found.name);
  };

  const handleSaveAdmin = async (e) => {
    e.preventDefault();
    if (submittingRef.current || isSubmitting) return;
    if (!formName.trim()) return;

    submittingRef.current = true;
    setIsSubmitting(true);

    const email = (formEmail.trim() && formEmail.includes('@cyberhub.com'))
      ? formEmail.trim()
      : generateAdminEmail(formName);
    const password = formPassword.trim() || generateGoogleStrongPassword();

    try {
      if (editingAdmin) {
        await updateAdmin(editingAdmin.id, {
          name: formName.trim(),
          email,
          password,
          role: formRole,
          branchId: formBranchId,
          branchName: formBranchName,
          status: formStatus,
          mfaEnabled: formMfa,
          mfa: formMfa ? 'AAL2 (Enforced)' : 'AAL1 (Standard)',
        });
        setShowInviteModal(false);
      } else {
        try {
          await inviteStaffUser({
            email,
            full_name: formName.trim(),
            role: formRole,
            branch_id: formBranchId,
          });
        } catch (err) {
          console.warn('Invite API notice:', err);
        }

        await addAdmin({
          name: formName.trim(),
          email,
          password,
          role: formRole,
          branchId: formBranchId,
          branchName: formBranchName,
          status: formStatus,
          mfaEnabled: formMfa,
          mfa: formMfa ? 'AAL2 (Enforced)' : 'AAL1 (Standard)',
        });
        setShowInviteModal(false);
      }
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  const handleToggleSuspend = async (admin) => {
    const nextStatus = admin.status === 'active' ? 'suspended' : 'active';
    await updateAdmin(admin.id, { status: nextStatus });
  };

  const getColumns = (layoutView = 'compact') => {
    const isStandard = layoutView === 'standard';
    return [
      {
        key: 'id',
        label: 'Staff ID',
        width: 120,
        sortType: 'alphabetical',
        render: (row) => (
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#ff7300', fontSize: '12px' }}>
            {row.id}
          </span>
        ),
      },
      {
        key: 'name',
        label: 'Personnel Name',
        width: isStandard ? 320 : 190,
        sortType: 'alphabetical',
        render: (row) => {
          const initials = (row.name || 'A')
            .split(' ')
            .map((w) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
          const isSuper = row.role === 'super_admin';
          const isActive = row.status === 'active';

          let roleBg = 'rgba(0, 210, 211, 0.15)';
          let roleBorder = '#00d2d3';
          let roleColor = '#00d2d3';
          let roleLabel = 'Admin';
          if (row.role === 'super_admin') {
            roleBg = 'rgba(255, 187, 0, 0.2)';
            roleBorder = '#ffbb00';
            roleColor = '#ffbb00';
            roleLabel = 'Superadmin';
          } else if (row.role === 'branch_admin') {
            roleBg = 'rgba(59, 130, 246, 0.15)';
            roleBorder = '#3b82f6';
            roleColor = '#60a5fa';
            roleLabel = 'Branch Admin';
          } else if (row.role === 'hr_manager') {
            roleBg = 'rgba(168, 85, 247, 0.15)';
            roleBorder = '#a855f7';
            roleColor = '#c084fc';
            roleLabel = 'HR Manager';
          } else if (row.role === 'executive') {
            roleBg = 'rgba(236, 72, 153, 0.15)';
            roleBorder = '#ec4899';
            roleColor = '#f472b6';
            roleLabel = 'Executive';
          }

          const isMfaEnforced = row.mfaEnabled || (row.mfa && String(row.mfa).includes('AAL2'));

          if (isStandard) {
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '56px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    minWidth: '56px',
                    maxWidth: '56px',
                    borderRadius: '50%',
                    background: isSuper ? 'rgba(255, 187, 0, 0.18)' : 'rgba(0, 210, 211, 0.18)',
                    border: `2px solid ${isSuper ? '#ffbb00' : '#00d2d3'}`,
                    color: isSuper ? '#ffbb00' : '#00d2d3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 800,
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  {initials}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '1px',
                      right: '1px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: isActive ? '#2ed573' : '#ff4757',
                      border: '2px solid #01081f',
                    }}
                    title={isActive ? 'Active Staff' : 'Suspended Staff'}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '56px',
                    minHeight: '56px',
                    overflow: 'hidden',
                  }}
                >
                  {/* 1st Row: Personnel Name */}
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#f8fafc',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.2,
                    }}
                  >
                    {row.name}
                  </div>

                  {/* 2nd Row: Email */}
                  <div
                    style={{
                      fontSize: '11.5px',
                      color: '#94a3b8',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.2,
                    }}
                  >
                    {row.email || 'staff@cyberhub.com'}
                  </div>

                  {/* 3rd Row: System Role, MFA Security, Status Badges */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      lineHeight: 1,
                      flexWrap: 'nowrap',
                    }}
                  >
                    {/* Role badge */}
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        padding: '1.5px 6px',
                        borderRadius: '4px',
                        background: roleBg,
                        border: `1px solid ${roleBorder}`,
                        color: roleColor,
                        letterSpacing: '0.3px',
                      }}
                    >
                      {roleLabel}
                    </span>

                    {/* MFA badge */}
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        padding: '1.5px 6px',
                        borderRadius: '4px',
                        background: isMfaEnforced ? 'rgba(46, 213, 115, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                        border: `1px solid ${isMfaEnforced ? '#2ed573' : '#64748b'}`,
                        color: isMfaEnforced ? '#2ed573' : '#94a3b8',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      {isMfaEnforced ? 'AAL2 Enforced' : 'AAL1 Standard'}
                    </span>

                    {/* Status badge */}
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        padding: '1.5px 6px',
                        borderRadius: '4px',
                        background: isActive ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255, 71, 87, 0.15)',
                        border: `1px solid ${isActive ? '#2ed573' : '#ff4757'}`,
                        color: isActive ? '#2ed573' : '#ff4757',
                      }}
                    >
                      {isActive ? 'ACTIVE' : 'SUSPENDED'}
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: isSuper ? 'rgba(255, 187, 0, 0.2)' : 'rgba(0, 210, 211, 0.2)',
                  border: `1.5px solid ${isSuper ? '#ffbb00' : '#00d2d3'}`,
                  color: isSuper ? '#ffbb00' : '#00d2d3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {row.name}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                  {row.email}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: 'role',
        label: 'System Role',
        width: 140,
        sortType: 'alphabetical',
        hideInStandard: true,
        render: (row) => {
          let bg = 'rgba(0, 210, 211, 0.15)';
          let border = '#00d2d3';
          let color = '#00d2d3';
          let label = 'Admin';

          if (row.role === 'super_admin') {
            bg = 'rgba(255, 187, 0, 0.2)';
            border = '#ffbb00';
            color = '#ffbb00';
            label = 'Superadmin';
          } else if (row.role === 'branch_admin') {
            bg = 'rgba(59, 130, 246, 0.15)';
            border = '#3b82f6';
            color = '#60a5fa';
            label = 'Branch Admin';
          } else if (row.role === 'hr_manager') {
            bg = 'rgba(168, 85, 247, 0.15)';
            border = '#a855f7';
            color = '#c084fc';
            label = 'HR Manager';
          } else if (row.role === 'executive') {
            bg = 'rgba(236, 72, 153, 0.15)';
            border = '#ec4899';
            color = '#f472b6';
            label = 'Executive';
          }

          return (
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '10.5px',
                fontWeight: 700,
                background: bg,
                border: `1px solid ${border}`,
                color,
                letterSpacing: '0.4px',
              }}
            >
              {label}
            </span>
          );
        },
      },
      {
        key: 'branchName',
        label: 'Assigned Branch Scope',
        width: 180,
        sortType: 'alphabetical',
        render: (row) => (
          <span style={{ color: '#cbd5e1', fontSize: '11.5px', fontWeight: 500 }}>
            {row.branchName || 'Global / Unassigned'}
          </span>
        ),
      },
      {
        key: 'mfa',
        label: 'MFA Security',
        width: 140,
        hideInStandard: true,
        render: (row) => {
          const isEnforced = row.mfaEnabled || (row.mfa && String(row.mfa).includes('AAL2'));
          return (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 7px',
                borderRadius: '4px',
                fontSize: '10.5px',
                fontWeight: 700,
                background: isEnforced ? 'rgba(46, 213, 115, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                border: `1px solid ${isEnforced ? '#2ed573' : '#64748b'}`,
                color: isEnforced ? '#2ed573' : '#94a3b8',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              {isEnforced ? 'AAL2 Enforced' : 'AAL1 Standard'}
            </span>
          );
        },
      },
      {
        key: 'status',
        label: 'Status',
        width: 100,
        hideInStandard: true,
        render: (row) => {
          const isActive = row.status === 'active';
          return (
            <span
              style={{
                padding: '2px 7px',
                borderRadius: '4px',
                fontSize: '10.5px',
                fontWeight: 700,
                background: isActive ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255, 71, 87, 0.15)',
                border: `1px solid ${isActive ? '#2ed573' : '#ff4757'}`,
                color: isActive ? '#2ed573' : '#ff4757',
              }}
            >
              {isActive ? 'ACTIVE' : 'SUSPENDED'}
            </span>
          );
        },
      },
      {
        key: 'lastLogin',
        label: 'Last Login',
        width: 140,
        render: (row) => <span style={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}>{row.lastLogin || '—'}</span>,
      },
      {
        key: 'actions',
        label: 'Actions',
        width: 130,
        render: (row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => openEditModal(row)}
              title="Edit Staff Credentials"
              aria-label="Edit Staff Credentials"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(255, 115, 0, 0.12)',
                border: '1px solid rgba(255, 115, 0, 0.4)',
                color: '#ff7300',
                cursor: 'pointer',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
            {row.role !== 'super_admin' && (
              <button
                type="button"
                onClick={() => handleToggleSuspend(row)}
                title={row.status === 'active' ? 'Suspend account access' : 'Reactivate account access'}
                style={{
                  padding: '3px 7px',
                  fontSize: '10.5px',
                  borderRadius: '4px',
                  background: row.status === 'active' ? 'rgba(255, 71, 87, 0.12)' : 'rgba(46, 213, 115, 0.12)',
                  border: `1px solid ${row.status === 'active' ? '#ff4757' : '#2ed573'}`,
                  color: row.status === 'active' ? '#ff4757' : '#2ed573',
                  cursor: 'pointer',
                }}
              >
                {row.status === 'active' ? 'Suspend' : 'Activate'}
              </button>
            )}
          </div>
        ),
      },
    ];
  };

  return (
    <div className="ch-page-container" style={{ padding: '20px 24px' }}>
      {/* 1. Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '0.5px' }}>
              Admin & Staff Administration
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(255, 187, 0, 0.18)',
                color: '#ffbb00',
                border: '1px solid rgba(255, 187, 0, 0.35)',
              }}
            >
              {admins.length} Staff Personnel
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#94a3b8' }}>
            Superadmins, Branch Admins, and Executive credentials with Role-Based Access Control (RBAC) and Multi-Factor Authentication.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="ch-btn ch-btn-primary"
            onClick={openInviteModal}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '6px',
              background: '#ff7300',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            Invite Staff / Admin
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div style={{ background: 'rgba(5, 19, 64, 0.45)', border: '1px solid rgba(255, 187, 0, 0.25)', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Superadmin Accounts</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffbb00', marginTop: '4px' }}>{stats.superAdmins}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Full root system privileges</div>
        </div>
        <div style={{ background: 'rgba(5, 19, 64, 0.45)', border: '1px solid rgba(0, 210, 211, 0.25)', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Branch & Regional Admins</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#00d2d3', marginTop: '4px' }}>{stats.regularAdmins}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Scoped by physical branch location</div>
        </div>
        <div style={{ background: 'rgba(5, 19, 64, 0.45)', border: '1px solid rgba(46, 213, 115, 0.25)', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>MFA Protected (AAL2)</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#2ed573', marginTop: '4px' }}>{stats.mfaEnforced}</div>
          <div style={{ fontSize: '11px', color: '#2ed573', marginTop: '2px' }}>TOTP / FIDO2 Passkey Enforced</div>
        </div>
        <div style={{ background: 'rgba(5, 19, 64, 0.45)', border: '1px solid rgba(255, 115, 0, 0.25)', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Active Staff Personnel</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#ff7300', marginTop: '4px' }}>{stats.activeCount}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Operational dashboard operators</div>
        </div>
      </div>

      {/* 3. Filter Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: 'All Roles', count: admins.length },
          { key: 'SUPER_ADMIN', label: 'Superadmins', count: stats.superAdmins },
          { key: 'ADMIN', label: 'Admins', count: admins.filter((a) => a.role === 'admin').length },
          { key: 'BRANCH_ADMIN', label: 'Branch Admins', count: admins.filter((a) => a.role === 'branch_admin').length },
          { key: 'HR_EXEC', label: 'HR & Executive', count: admins.filter((a) => a.role === 'hr_manager' || a.role === 'executive').length },
          { key: 'SUSPENDED', label: 'Suspended', count: admins.filter((a) => a.status === 'suspended').length },
        ].map((tab) => {
          const active = activeRoleFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveRoleFilter(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                background: active ? 'rgba(255, 187, 0, 0.18)' : 'rgba(5, 19, 64, 0.45)',
                border: active ? '1px solid #ffbb00' : '1px solid rgba(255, 255, 255, 0.08)',
                color: active ? '#ffbb00' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '10px',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  background: active ? '#ffbb00' : 'rgba(255, 255, 255, 0.08)',
                  color: active ? '#000' : '#94a3b8',
                  fontWeight: 800,
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. SmartTable Component */}
      <div style={{ background: 'rgba(5, 19, 64, 0.4)', borderRadius: '8px', border: '1px solid rgba(255, 115, 0, 0.15)', overflow: 'hidden' }}>
        <SmartTable
          columns={getColumns}
          data={filteredAdmins}
          rowKey="id"
          tableId="admins_table"
          searchPlaceholder="Search staff by name, email, role, branch..."
          enableAiFilter={true}
          defaultSortKey="role"
          defaultSortOrder="asc"
          maxHeight="calc(100vh - 360px)"
          showIndex={true}
        />
      </div>

      {/* Invite / Edit Admin Modal */}
      {showInviteModal && (
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
          onClick={() => setShowInviteModal(false)}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
                {editingAdmin ? `Edit Staff Credentials (${editingAdmin.id})` : 'Invite Staff Personnel'}
              </h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Full Name</label>
                <input
                  type="text"
                  required
                  className="ch-input"
                  value={formName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormName(val);
                    if (!editingAdmin) {
                      setFormEmail(generateAdminEmail(val));
                    }
                  }}
                  placeholder="e.g. Lim Wei Shen"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Work Email (CyberHub Managed)</label>
                <input
                  type="email"
                  readOnly
                  disabled
                  className="ch-input"
                  value={formEmail}
                  placeholder="staff@cyberhub.com"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#9ca3af',
                    cursor: 'not-allowed',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, margin: 0 }}>Password</label>
                  <button
                    type="button"
                    style={{
                      padding: '2px 8px',
                      fontSize: '11px',
                      color: '#ff7300',
                      border: '1px solid rgba(255, 115, 0, 0.4)',
                      background: 'transparent',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setFormPassword(generateGoogleStrongPassword());
                    }}
                  >
                    Generate Strong Password
                  </button>
                </div>
                <input
                  type="text"
                  className="ch-input"
                  placeholder="Click generate or enter password..."
                  value={formPassword || ''}
                  onChange={(e) => setFormPassword(e.target.value)}
                  style={{ fontFamily: 'monospace', letterSpacing: '0.5px', width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>RBAC Role</label>
                  <select
                    className="ch-input"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Superadmin</option>
                    <option value="branch_admin">Branch Admin</option>
                    <option value="hr_manager">HR Manager</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Assigned Branch</label>
                  <select
                    className="ch-input"
                    value={formBranchId}
                    onChange={handleBranchChange}
                    style={{ width: '100%' }}
                  >
                    {BRANCH_OPTIONS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Status</label>
                  <select
                    className="ch-input"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>MFA Security Policy</label>
                  <select
                    className="ch-input"
                    value={formMfa ? 'enforced' : 'optional'}
                    onChange={(e) => setFormMfa(e.target.value === 'enforced')}
                    style={{ width: '100%' }}
                  >
                    <option value="enforced">AAL2 Enforced</option>
                    <option value="optional">AAL1 Standard</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="ch-btn"
                  onClick={() => setShowInviteModal(false)}
                  style={{ padding: '7px 14px', fontSize: '12px', background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="ch-btn ch-btn-primary"
                  style={{
                    padding: '7px 16px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: '#ff7300',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '6px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? 'Processing...' : (editingAdmin ? 'Save Changes' : 'Send Invitation')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
