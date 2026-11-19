import { useState, useMemo, useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore.js';
import { generateGoogleStrongPassword } from '../store/initialDbData.js';
import SmartTable from '../components/SmartTable.jsx';
import Customer360Card from '../components/Customer360Card.jsx';

export default function Customers() {
  const customers = useDashboardStore((state) => state.customers || []);
  const addCustomer = useDashboardStore((state) => state.addCustomer);
  const updateCustomer = useDashboardStore((state) => state.updateCustomer);
  const deleteCustomer = useDashboardStore((state) => state.deleteCustomer);
  const fetchSupabaseData = useDashboardStore((state) => state.fetchSupabaseData);

  useEffect(() => {
    fetchSupabaseData?.();
  }, [fetchSupabaseData]);

  const [activeSegmentFilter, setActiveSegmentFilter] = useState('ALL');
  const [selectedCustomer360, setSelectedCustomer360] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Revealed phone numbers map (customer id -> boolean)
  const [revealedPhones, setRevealedPhones] = useState({});

  // Form states for Add/Edit
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCity, setFormCity] = useState('Klang Valley');
  const [formAddress, setFormAddress] = useState('');
  const [formSegment, setFormSegment] = useState('STANDARD');
  const [formRisk, setFormRisk] = useState('LOW_RISK_LEGITIMATE');
  const [formStatus, setFormStatus] = useState('active');

  const stats = useMemo(() => {
    const total = customers.length;
    const highValue = customers.filter((c) => c.segment === 'HIGH_VALUE').length;
    const returning = customers.filter((c) => c.segment === 'RETURNING' || c.totalOrders > 1).length;
    const suspicious = customers.filter((c) => c.riskEvaluation === 'SCAM_FLAGGED' || c.status === 'suspended').length;
    const totalRevenue = customers.reduce((acc, c) => acc + (Number(c.totalSpend) || 0), 0);
    return { total, highValue, returning, suspicious, totalRevenue };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    if (activeSegmentFilter === 'ALL') return customers;
    if (activeSegmentFilter === 'HIGH_VALUE') return customers.filter((c) => c.segment === 'HIGH_VALUE');
    if (activeSegmentFilter === 'RETURNING') return customers.filter((c) => c.segment === 'RETURNING' || c.totalOrders > 1);
    if (activeSegmentFilter === 'STANDARD') return customers.filter((c) => c.segment === 'STANDARD');
    if (activeSegmentFilter === 'SCAM_FLAGGED') return customers.filter((c) => c.riskEvaluation === 'SCAM_FLAGGED' || c.status === 'suspended');
    return customers;
  }, [customers, activeSegmentFilter]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormEmail('');
    setFormPassword(generateGoogleStrongPassword());
    setFormPhone('+60 12-345 6789');
    setFormCity('Klang Valley');
    setFormAddress('');
    setFormSegment('STANDARD');
    setFormRisk('LOW_RISK_LEGITIMATE');
    setFormStatus('active');
    setShowAddModal(true);
  };

  const openEditModal = (c) => {
    setEditingCustomer(c);
    setFormName(c.name || '');
    setFormEmail(c.email || '');
    setFormPassword(c.password || generateGoogleStrongPassword());
    setFormPhone(c.phone || '');
    setFormCity(c.city || 'Klang Valley');
    setFormAddress(c.address || '');
    setFormSegment(c.segment || 'STANDARD');
    setFormRisk(c.riskEvaluation || 'LOW_RISK_LEGITIMATE');
    setFormStatus(c.status || 'active');
    setShowAddModal(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, {
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword.trim() || generateGoogleStrongPassword(),
        phone: formPhone.trim(),
        city: formCity.trim(),
        address: formAddress.trim(),
        segment: formSegment,
        riskEvaluation: formRisk,
        status: formStatus,
      });
    } else {
      await addCustomer({
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword.trim() || generateGoogleStrongPassword(),
        phone: formPhone.trim(),
        city: formCity.trim(),
        address: formAddress.trim(),
        segment: formSegment,
        riskEvaluation: formRisk,
        status: formStatus,
      });
    }
    setShowAddModal(false);
  };

  const togglePhoneReveal = (id) => {
    setRevealedPhones((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const maskPhoneNumber = (raw) => {
    if (!raw) return '—';
    const s = String(raw).trim();
    if (s.length < 8) return s;
    return s.slice(0, 4) + ' ••• •' + s.slice(-3);
  };

  const getColumns = (layoutView) => [
    {
      key: 'id',
      label: 'Customer ID',
      width: 110,
      sortType: 'alphabetical',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#ff7300', fontSize: '12px' }}>
          {row.id}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Client Name',
      width: layoutView === 'standard' ? 360 : 180,
      sortType: 'alphabetical',
      render: (row, idx, layout) => {
        const isStandard = (layout || layoutView) === 'standard';
        const initials = (row.name || 'C')
          .split(' ')
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        if (isStandard) {
          return (
            <div className="view-standard-cell" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Icon expanded to 56px matching 3 rows of client data */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    minWidth: '56px',
                    maxWidth: '56px',
                    borderRadius: '50%',
                    background: row.riskEvaluation === 'SCAM_FLAGGED' ? 'rgba(255, 71, 87, 0.2)' : 'rgba(255, 115, 0, 0.18)',
                    border: `2px solid ${row.riskEvaluation === 'SCAM_FLAGGED' ? '#ff4757' : '#ff7300'}`,
                    color: row.riskEvaluation === 'SCAM_FLAGGED' ? '#ff4757' : '#ff7300',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '17px',
                    fontWeight: 800,
                  }}
                >
                  {initials}
                </div>
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: row.status === 'active' ? '#2ed573' : '#ff4757',
                    border: '2px solid #051340',
                    boxShadow: `0 0 6px ${row.status === 'active' ? '#2ed573' : '#ff4757'}`,
                  }}
                  title={`Status: ${row.status || 'active'}`}
                />
              </div>

              {/* Three rows of Client Data */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '56px',
                  minHeight: '56px',
                  minWidth: 0,
                  boxSizing: 'border-box',
                }}
              >
                {/* 1st Row: Fullname */}
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
                  {row.email || 'No email registered'}
                </div>

                {/* 3rd Row: Value Segment, AI Evaluation, Status Badges */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    lineHeight: 1,
                    flexWrap: 'nowrap',
                  }}
                >
                  {/* Value Segment Badge */}
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '1.5px 6px',
                      borderRadius: '4px',
                      background:
                        row.segment === 'HIGH_VALUE'
                          ? 'rgba(0, 210, 211, 0.15)'
                          : row.segment === 'RETURNING'
                          ? 'rgba(255, 115, 0, 0.15)'
                          : 'rgba(100, 116, 139, 0.2)',
                      border: `1px solid ${
                        row.segment === 'HIGH_VALUE'
                          ? '#00d2d3'
                          : row.segment === 'RETURNING'
                          ? '#ff7300'
                          : '#64748b'
                      }`,
                      color:
                        row.segment === 'HIGH_VALUE'
                          ? '#00d2d3'
                          : row.segment === 'RETURNING'
                          ? '#ff7300'
                          : '#94a3b8',
                    }}
                  >
                    {row.segment === 'HIGH_VALUE'
                      ? 'High Value VIP'
                      : row.segment === 'RETURNING'
                      ? 'Returning'
                      : 'Standard'}
                  </span>

                  {/* AI Evaluation Badge */}
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '1.5px 6px',
                      borderRadius: '4px',
                      background:
                        row.riskEvaluation === 'SCAM_FLAGGED'
                          ? 'rgba(255, 71, 87, 0.2)'
                          : row.riskEvaluation === 'POTENTIAL_RETURNING'
                          ? 'rgba(59, 130, 246, 0.15)'
                          : 'rgba(46, 213, 115, 0.15)',
                      border: `1px solid ${
                        row.riskEvaluation === 'SCAM_FLAGGED'
                          ? '#ff4757'
                          : row.riskEvaluation === 'POTENTIAL_RETURNING'
                          ? '#3b82f6'
                          : '#2ed573'
                      }`,
                      color:
                        row.riskEvaluation === 'SCAM_FLAGGED'
                          ? '#ff4757'
                          : row.riskEvaluation === 'POTENTIAL_RETURNING'
                          ? '#60a5fa'
                          : '#2ed573',
                    }}
                  >
                    {row.riskEvaluation === 'SCAM_FLAGGED'
                      ? 'Scam Risk'
                      : row.riskEvaluation === 'POTENTIAL_RETURNING'
                      ? 'Potential Returning'
                      : 'Low Risk'}
                  </span>

                  {/* Account Status Badge */}
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '1.5px 6px',
                      borderRadius: '4px',
                      background:
                        row.status === 'active'
                          ? 'rgba(46, 213, 115, 0.15)'
                          : 'rgba(255, 71, 87, 0.15)',
                      border: `1px solid ${row.status === 'active' ? '#2ed573' : '#ff4757'}`,
                      color: row.status === 'active' ? '#2ed573' : '#ff4757',
                    }}
                  >
                    {row.status === 'active' ? 'ACTIVE' : 'SUSPENDED'}
                  </span>
                </div>
              </div>
            </div>
          );
        }

        // Compact Mode Fallback
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background:
                  row.riskEvaluation === 'SCAM_FLAGGED'
                    ? 'rgba(255, 71, 87, 0.2)'
                    : 'rgba(255, 115, 0, 0.18)',
                border: `1px solid ${
                  row.riskEvaluation === 'SCAM_FLAGGED' ? '#ff4757' : '#ff7300'
                }`,
                color: row.riskEvaluation === 'SCAM_FLAGGED' ? '#ff4757' : '#ff7300',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontWeight: 600,
                  color: '#f1f5f9',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {row.name}
              </div>
              <div
                style={{
                  fontSize: '10.5px',
                  color: '#94a3b8',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'phone',
      label: 'Contact Phone',
      width: 160,
      render: (row) => {
        const isRevealed = Boolean(revealedPhones[row.id]);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#cbd5e1' }}>
              {isRevealed ? row.phone : maskPhoneNumber(row.phone)}
            </span>
            <button
              type="button"
              onClick={() => togglePhoneReveal(row.id)}
              title={isRevealed ? 'Mask Contact Number' : 'Reveal phone number'}
              style={{
                background: 'transparent',
                border: 'none',
                color: isRevealed ? '#ff7300' : '#64748b',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isRevealed ? (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                ) : (
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </>
                )}
              </svg>
            </button>
          </div>
        );
      },
    },
    {
      key: 'city',
      label: 'Region / City',
      width: 150,
      sortType: 'alphabetical',
      render: (row) => <span style={{ color: '#cbd5e1', fontSize: '11.5px' }}>{row.city}</span>,
    },
    {
      key: 'totalOrders',
      label: 'Repairs',
      width: 85,
      render: (row) => (
        <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '12px' }}>
          {row.totalOrders || 0}
        </span>
      ),
    },
    {
      key: 'totalSpend',
      label: 'Total Spend',
      width: 110,
      render: (row) => (
        <span style={{ fontWeight: 700, color: '#00d2d3', fontFamily: 'monospace', fontSize: '12px' }}>
          RM {Number(row.totalSpend || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'segment',
      label: 'Value Segment',
      width: 130,
      hideInStandard: true,
      sortType: 'alphabetical',
      render: (row) => {
        let bg = 'rgba(100, 116, 139, 0.2)';
        let border = '#64748b';
        let color = '#94a3b8';
        let label = 'Standard';

        if (row.segment === 'HIGH_VALUE') {
          bg = 'rgba(0, 210, 211, 0.15)';
          border = '#00d2d3';
          color = '#00d2d3';
          label = 'High Value VIP';
        } else if (row.segment === 'RETURNING') {
          bg = 'rgba(255, 115, 0, 0.15)';
          border = '#ff7300';
          color = '#ff7300';
          label = 'Returning';
        } else if (row.segment === 'LOW_VALUE') {
          bg = 'rgba(239, 68, 68, 0.15)';
          border = '#ef4444';
          color = '#ef4444';
          label = 'Low Activity';
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
      key: 'riskEvaluation',
      label: 'AI Evaluation & Risk',
      width: 160,
      hideInStandard: true,
      render: (row) => {
        let bg = 'rgba(46, 213, 115, 0.15)';
        let border = '#2ed573';
        let color = '#2ed573';
        let label = 'Low Risk Legitimate';

        if (row.riskEvaluation === 'SCAM_FLAGGED') {
          bg = 'rgba(255, 71, 87, 0.2)';
          border = '#ff4757';
          color = '#ff4757';
          label = 'Scam / Fraud Risk';
        } else if (row.riskEvaluation === 'POTENTIAL_RETURNING') {
          bg = 'rgba(59, 130, 246, 0.15)';
          border = '#3b82f6';
          color = '#60a5fa';
          label = 'Potential Returning';
        }

        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10.5px',
              fontWeight: 700,
              background: bg,
              border: `1px solid ${border}`,
              color,
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: color,
              }}
            />
            {label}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      width: 95,
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
      key: 'actions',
      label: 'Actions',
      width: 140,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setSelectedCustomer360(row)}
            title="View Customer 360 Profile"
            style={{
              padding: '3px 8px',
              fontSize: '10.5px',
              fontWeight: 700,
              borderRadius: '4px',
              background: 'rgba(255, 115, 0, 0.12)',
              border: '1px solid rgba(255, 115, 0, 0.4)',
              color: '#ff7300',
              cursor: 'pointer',
            }}
          >
            360 Brief
          </button>
          <button
            type="button"
            onClick={() => openEditModal(row)}
            title="Edit Customer"
            style={{
              padding: '3px 7px',
              fontSize: '10.5px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="ch-page-container" style={{ padding: '20px 24px' }}>
      {/* 1. Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '0.5px' }}>
              Customers Directory & CRM
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
              {customers.length} Verified Clients
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#94a3b8' }}>
            Unified registry of residential appliance owners, booking metrics, AI customer value segmentation, and risk evaluations.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="ch-btn ch-btn-primary"
            onClick={openAddModal}
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
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New Customer
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div style={{ background: 'rgba(5, 19, 64, 0.45)', border: '1px solid rgba(255, 115, 0, 0.25)', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Total Registered Clients</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>{stats.total}</div>
          <div style={{ fontSize: '11px', color: '#ff7300', marginTop: '2px' }}>RM {stats.totalRevenue.toLocaleString()} lifetime spend</div>
        </div>
        <div style={{ background: 'rgba(5, 19, 64, 0.45)', border: '1px solid rgba(0, 210, 211, 0.25)', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>High Value VIP Clients</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#00d2d3', marginTop: '4px' }}>{stats.highValue}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>≥ RM 1,000 spend & recurring repairs</div>
        </div>
        <div style={{ background: 'rgba(5, 19, 64, 0.45)', border: '1px solid rgba(255, 115, 0, 0.25)', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Returning Customers</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#ff7300', marginTop: '4px' }}>{stats.returning}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>High loyalty index & multiple bookings</div>
        </div>
        <div style={{ background: 'rgba(5, 19, 64, 0.45)', border: '1px solid rgba(255, 71, 87, 0.25)', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Scam & Fraud Risk Flags</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#ff4757', marginTop: '4px' }}>{stats.suspicious}</div>
          <div style={{ fontSize: '11px', color: '#ff4757', marginTop: '2px' }}>Flagged by AI security heuristics</div>
        </div>
      </div>

      {/* 3. Filter Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: 'All Clients', count: customers.length },
          { key: 'HIGH_VALUE', label: 'High Value', count: stats.highValue },
          { key: 'RETURNING', label: 'Returning', count: stats.returning },
          { key: 'STANDARD', label: 'Standard', count: customers.filter((c) => c.segment === 'STANDARD').length },
          { key: 'SCAM_FLAGGED', label: 'Scam / Risk Flagged', count: stats.suspicious },
        ].map((tab) => {
          const active = activeSegmentFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSegmentFilter(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
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
                  fontSize: '10px',
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

      {/* 4. SmartTable Component */}
      <div style={{ background: 'rgba(5, 19, 64, 0.4)', borderRadius: '8px', border: '1px solid rgba(255, 115, 0, 0.15)', overflow: 'hidden' }}>
        <SmartTable
          columns={getColumns}
          data={filteredCustomers}
          rowKey="id"
          tableId="customers_table"
          searchPlaceholder="Search customer by name, email, phone, city..."
          enableAiFilter={true}
          defaultSortKey="totalSpend"
          defaultSortOrder="desc"
          maxHeight="calc(100vh - 360px)"
          showIndex={true}
        />
      </div>

      {/* Customer 360 Modal */}
      {selectedCustomer360 && (
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
          onClick={() => setSelectedCustomer360(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              background: '#01081f',
              border: '1.5px solid #ff7300',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.9)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
                  Customer 360 Profile: {selectedCustomer360.name}
                </h3>
                <span style={{ fontSize: '11px', color: '#ff7300', fontFamily: 'monospace' }}>
                  {selectedCustomer360.id} • {selectedCustomer360.city}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer360(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <Customer360Card
              customer={{
                id: selectedCustomer360.id,
                name: selectedCustomer360.name,
                phone: selectedCustomer360.phone,
                email: selectedCustomer360.email,
                city: selectedCustomer360.city,
                address: selectedCustomer360.address,
                completed_orders_count: selectedCustomer360.totalOrders,
                total_spend_myr: selectedCustomer360.totalSpend,
                loyalty_tier: selectedCustomer360.segment,
                risk_status: selectedCustomer360.riskEvaluation,
              }}
              onClose={() => setSelectedCustomer360(null)}
            />
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {showAddModal && (
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
          onClick={() => setShowAddModal(false)}
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
                {editingCustomer ? `Edit Customer (${editingCustomer.id})` : 'Add New Customer'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Full Name</label>
                <input
                  type="text"
                  required
                  className="ch-input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Mohd Syakir bin Rosli"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Email</label>
                  <input
                    type="email"
                    required
                    className="ch-input"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="client@gmail.com"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Phone Number</label>
                  <input
                    type="text"
                    required
                    className="ch-input"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+60 12-345 6789"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, margin: 0 }}>Password</label>
                  <button
                    type="button"
                    style={{ padding: '2px 8px', fontSize: '11px', color: '#ff7300', border: '1px solid rgba(255, 115, 0, 0.4)', background: 'transparent', borderRadius: '4px', cursor: 'pointer' }}
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

              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Region / City</label>
                <input
                  type="text"
                  className="ch-input"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  placeholder="e.g. Petaling Jaya, Selangor"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Street Address</label>
                <input
                  type="text"
                  className="ch-input"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="e.g. No. 42, Jalan SS2/72"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Value Segment</label>
                  <select
                    className="ch-input"
                    value={formSegment}
                    onChange={(e) => setFormSegment(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="RETURNING">Returning</option>
                    <option value="HIGH_VALUE">High Value VIP</option>
                    <option value="LOW_VALUE">Low Value</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>AI Risk Evaluation</label>
                  <select
                    className="ch-input"
                    value={formRisk}
                    onChange={(e) => setFormRisk(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="LOW_RISK_LEGITIMATE">Low Risk Legitimate</option>
                    <option value="POTENTIAL_RETURNING">Potential Returning</option>
                    <option value="SCAM_FLAGGED">Scam Flagged</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Account Status</label>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="ch-btn"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '7px 14px', fontSize: '12px', background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ch-btn ch-btn-primary"
                  style={{ padding: '7px 16px', fontSize: '12px', fontWeight: 700, background: '#ff7300', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                >
                  {editingCustomer ? 'Update Customer' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
