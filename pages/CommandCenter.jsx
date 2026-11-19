import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardStore } from '../store/useDashboardStore.js';
import SmartTable from '../components/SmartTable.jsx';
import InteractiveGraph from '../components/InteractiveGraph.jsx';
import OpsBriefingCard from '../components/OpsBriefingCard.jsx';

const MALAYSIAN_REGIONS = [
  { state: 'Kuala Lumpur', zone: 'Kuala Lumpur (Cheras / Ampang / Bukit Bintang)' },
  { state: 'Kuala Lumpur', zone: 'Kuala Lumpur (Bangsar / Mont Kiara / Kepong)' },
  { state: 'Selangor', zone: 'Selangor (Petaling Jaya / Subang Jaya / Sunway)' },
  { state: 'Selangor', zone: 'Selangor (Shah Alam / Klang / Kota Kemuning)' },
  { state: 'Selangor', zone: 'Selangor (Puchong / Cyberjaya / Putrajaya)' },
  { state: 'Selangor', zone: 'Selangor (Gombak / Rawang / Selayang)' },
  { state: 'Penang', zone: 'Penang (Georgetown / Bayan Lepas / Butterworth)' },
  { state: 'Johor', zone: 'Johor (Johor Bahru / Iskandar Puteri / Skudai)' },
  { state: 'Perak', zone: 'Perak (Ipoh / Taiping)' },
  { state: 'Melaka', zone: 'Melaka (Melaka Tengah / Ayer Keroh)' },
  { state: 'Negeri Sembilan', zone: 'Negeri Sembilan (Seremban / Nilai)' },
  { state: 'Pahang', zone: 'Pahang (Kuantan)' },
  { state: 'Kedah', zone: 'Kedah (Alor Setar / Sungai Petani)' },
  { state: 'Kelantan', zone: 'Kelantan (Kota Bharu)' },
  { state: 'Terengganu', zone: 'Terengganu (Kuala Terengganu)' },
  { state: 'Perlis', zone: 'Perlis (Kangar)' },
  { state: 'Sabah', zone: 'Sabah (Kota Kinabalu / Sandakan)' },
  { state: 'Sarawak', zone: 'Sarawak (Kuching / Miri)' },
  { state: 'Putrajaya', zone: 'Putrajaya (Federal Territory)' },
];

const CoverageZonePicker = ({ value, onChange, label = 'Client Location / Coverage Zone' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState(value || '');
  const containerRef = useRef(null);

  useEffect(() => {
    setFilterText(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredRegions = useMemo(() => {
    const q = (filterText || '').toLowerCase().trim();
    if (!q) return MALAYSIAN_REGIONS;
    return MALAYSIAN_REGIONS.filter(
      (r) => r.state.toLowerCase().includes(q) || r.zone.toLowerCase().includes(q)
    );
  }, [filterText]);

  return (
    <div className="ch-form-group" ref={containerRef} style={{ position: 'relative' }}>
      <span className="modal-label" style={{ marginBottom: '4px' }}>{label}</span>
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type="text"
          className="ch-input"
          value={filterText}
          placeholder="Select or type state / metro hub..."
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            const val = e.target.value;
            setFilterText(val);
            onChange(val);
            setIsOpen(true);
          }}
          autoComplete="off"
        />
      </div>

      {isOpen && (
        <div
          className="ch-region-dropdown-table"
          style={{
            position: 'absolute',
            left: 0,
            top: '100%',
            width: '100%',
            maxHeight: '210px',
            overflowY: 'auto',
            background: '#01081f',
            border: '1.5px solid #ff7300',
            borderRadius: '8px',
            zIndex: 1000,
            boxShadow: '0 10px 30px rgba(0,0,0,0.85)',
            marginTop: '4px',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ background: '#051340', color: '#9ca3af', textAlign: 'left', fontSize: '11px' }}>
                <th style={{ padding: '7px 12px', width: '35%' }}>State</th>
                <th style={{ padding: '7px 12px' }}>Metro Service Hub</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegions.length === 0 ? (
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center', color: '#9ca3af', padding: '10px' }}>
                    No matching Malaysian state or hub
                  </td>
                </tr>
              ) : (
                filteredRegions.map((m) => (
                  <tr
                    key={m.zone}
                    className="zone-row-hover"
                    style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    onClick={() => {
                      setFilterText(m.zone);
                      onChange(m.zone);
                      setIsOpen(false);
                    }}
                  >
                    <td style={{ color: '#ff7300', fontWeight: 600, padding: '7px 12px' }}>{m.state}</td>
                    <td style={{ padding: '7px 12px', color: '#e5e7eb' }}>{m.zone}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const APPLIANCE_TAG_OPTIONS = [
  'Refrigerator',
  'Air Conditioner',
  'Washing Machine',
  'Oven & Range',
  'Heat Pump',
  'Dryer',
  'Dishwasher',
  'Microwave',
  'Water Heater',
];

const CommandCenter = () => {
  const {
    orders,
    technicians,
    globalPricing,
    addOrder,
    updateOrder,
    deleteOrder,
    selectedRecord,
    setSelectedRecord,
  } = useDashboardStore();

  const [editingOrder, setEditingOrder] = useState(null);
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    id: '',
    customer: '',
    location: 'Klang Valley',
    appliance: '',
    issue: '',
    urgency: 'NORMAL',
    priority: 'Normal',
    cost: 'RM 180.00',
    matchedTech: 'Satou Kenji',
    aiEstimate: 165.0,
    status: 'PENDING',
  });
  const [deletingOrder, setDeletingOrder] = useState(null);
  const [mapLocation, setMapLocation] = useState('Mont Kiara, Kuala Lumpur, Malaysia');
  const [selectedFleetTech, setSelectedFleetTech] = useState('');
  const [applianceBreakdownView, setApplianceBreakdownView] = useState('month');

  // Synchronize assignedTechRoster with live technician DB
  const assignedTechRoster = useMemo(() => {
    if (!technicians || technicians.length === 0) {
      return [
        {
          name: 'Sarah Izzah',
          status: 'In Route',
          cert: 'Dishwashers & Ventilation',
          img: '/logo1.png',
        },
        {
          name: 'Jason Rahman',
          status: 'Available',
          cert: 'Refrigeration & Freezing',
          img: '/logo1.png',
        },
      ];
    }
    return technicians.slice(0, 6).map((t) => {
      const st = (t.status || 'AVAILABLE').toUpperCase();
      let statusLabel = 'Available';
      if (st === 'ON_JOB' || st === 'BUSY') statusLabel = 'In Route';
      else if (st === 'OFFLINE') statusLabel = 'Standby';

      return {
        id: t.code || t.id,
        name: t.name,
        status: statusLabel,
        cert: (t.specialty || t.certs || 'Certified Specialist').split(',')[0].trim(),
        img: t.avatar || t.avatarPath || '/logo1.png',
      };
    });
  }, [technicians]);

  // Synchronize fleetTechs with live technician DB
  const fleetTechs = useMemo(() => {
    if (!technicians || technicians.length === 0) {
      return [];
    }
    return technicians.slice(0, 8).map((t) => {
      const st = (t.status || 'AVAILABLE').toUpperCase();
      let statusLabel = 'Available';
      let statusClass = 'pending';
      if (st === 'ON_JOB' || st === 'BUSY') {
        statusLabel = 'In Route';
        statusClass = 'dispatched';
      } else if (st === 'OFFLINE') {
        statusLabel = 'Standby';
        statusClass = 'offline';
      }

      const rawZone = t.zone || 'Klang Valley';
      const cityClean = rawZone.includes('(')
        ? rawZone.split('(')[1].replace(')', '').split('/')[0].trim()
        : rawZone;

      return {
        id: t.code || (t.id ? `T-${t.id}` : 'T-001'),
        name: t.name,
        zone: `${cityClean} • ${t.specialty?.split(',')[0]?.trim() || 'Appliance Specialist'}`,
        status: statusLabel,
        statusClass,
        locationQuery: `${cityClean}, Malaysia`,
        avatar: t.avatar || t.avatarPath || '/logo1.png',
      };
    });
  }, [technicians]);

  useEffect(() => {
    if (fleetTechs.length > 0) {
      const exists = fleetTechs.some((ft) => ft.name === selectedFleetTech);
      if (!selectedFleetTech || !exists) {
        setSelectedFleetTech(fleetTechs[0].name);
        setMapLocation(fleetTechs[0].locationQuery);
      }
    }
  }, [fleetTechs, selectedFleetTech]);

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const activeTechs = technicians.filter((t) => t.status !== 'OFFLINE').length;
  const totalRevenueEst = orders.reduce((sum, o) => sum + o.aiEstimate, 0);

  const handleOpenAddModal = () => {
    const nextId = `ORD-${887 + orders.length}`;
    setNewOrder({
      id: nextId,
      customer: '',
      location: 'Kuala Lumpur (Cheras / Ampang / Bukit Bintang)',
      appliance: '',
      issue: '',
      urgency: 'NORMAL',
      priority: 'Normal',
      cost: 'RM 180.00',
      matchedTech: 'Satou Kenji',
      aiEstimate: 165.0,
      status: 'PENDING',
    });
    setIsAddingOrder(true);
  };

  const handleSubmitAddOrder = (e) => {
    e.preventDefault();
    if (!newOrder.customer.trim() || !newOrder.appliance.trim()) return;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    addOrder({
      id: newOrder.id.trim() || `ORD-${887 + orders.length}`,
      time: nowStr,
      customer: newOrder.customer.trim(),
      appliance: newOrder.appliance.trim(),
      issue: newOrder.issue.trim() || 'General maintenance check',
      location: newOrder.location.trim() || 'Kuala Lumpur (Cheras / Ampang / Bukit Bintang)',
      urgency: newOrder.urgency || 'NORMAL',
      priority: newOrder.urgency === 'CRITICAL' ? 'Critical' : newOrder.urgency === 'URGENT' ? 'High' : 'Normal',
      cost: newOrder.cost || `RM ${(Number(newOrder.aiEstimate) || 165.0).toFixed(2)}`,
      matchedTech: newOrder.matchedTech || 'Satou Kenji',
      aiEstimate: Number(newOrder.aiEstimate) || 165.0,
      status: newOrder.status || 'PENDING',
      assignedTech: newOrder.matchedTech || 'Satou Kenji',
    });
    setIsAddingOrder(false);
  };

  const handleConfirmDeleteOrder = () => {
    if (!deletingOrder) return;
    deleteOrder(deletingOrder.id);
    if (selectedRecord?.type === 'order' && selectedRecord?.data?.id === deletingOrder.id) {
      setSelectedRecord(null);
    }
    setDeletingOrder(null);
  };

  const columns = [
    { key: 'id', label: 'Order ID', className: 'accent-text mono' },
    { key: 'time', label: 'Time', className: 'mono' },
    { key: 'customer', label: 'Customer', sortType: 'alphabetical' },
    {
      key: 'applianceIssue',
      label: 'Appliance & Issue',
      sortType: 'alphabetical',
      getValue: (o) => `${o.appliance} ${o.issue}`,
      render: (o) => (
        <div>
          <strong>{o.appliance}</strong>
          <div className="sub-cell">{o.issue}</div>
        </div>
      ),
    },
    { key: 'location', label: 'Zone', sortType: 'alphabetical' },
    {
      key: 'aiEstimate',
      label: 'Estimate (RM)',
      render: (o) => <span className="mono">RM {o.aiEstimate.toFixed(2)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      width: '135px',
      sortType: 'alphabetical',
      render: (o) => {
        const s = String(o.status || 'PENDING').toUpperCase();
        const tagMap = {
          PENDING: { bg: 'rgba(255, 165, 2, 0.18)', color: '#ffa502', border: 'rgba(255, 165, 2, 0.45)', dot: '#ffa502', label: 'Pending' },
          OFFERED: { bg: 'rgba(56, 189, 248, 0.18)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.45)', dot: '#38bdf8', label: 'Offered' },
          DISPATCHED: { bg: 'rgba(255, 115, 0, 0.18)', color: '#ff8c2b', border: 'rgba(255, 115, 0, 0.45)', dot: '#ff8c2b', label: 'In Route' },
          IN_TRANSIT: { bg: 'rgba(255, 115, 0, 0.18)', color: '#ff8c2b', border: 'rgba(255, 115, 0, 0.45)', dot: '#ff8c2b', label: 'In Transit' },
          ON_JOB: { bg: 'rgba(52, 152, 219, 0.18)', color: '#5dade2', border: 'rgba(52, 152, 219, 0.45)', dot: '#5dade2', label: 'On Job' },
          COMPLETED: { bg: 'rgba(46, 213, 115, 0.18)', color: '#2ed573', border: 'rgba(46, 213, 115, 0.45)', dot: '#2ed573', label: 'Completed' },
          CANCELLED: { bg: 'rgba(255, 71, 87, 0.18)', color: '#ff4757', border: 'rgba(255, 71, 87, 0.45)', dot: '#ff4757', label: 'Cancelled' },
        };
        const cfg = tagMap[s] || { bg: 'rgba(255, 115, 0, 0.15)', color: '#ff8c2b', border: 'rgba(255, 115, 0, 0.35)', dot: '#ff8c2b', label: s };
        return (
          <span
            className={`status-pill status-tag-${s.toLowerCase().replace('_', '-')}`}
            style={{
              background: cfg.bg,
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
              padding: '3px 8px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '11px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: 'action',
      label: 'Action',
      sortable: false,
      width: '110px',
      render: (o) => (
        <div className="table-action-btns" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className="btn-action-edit"
            title="Edit Order"
            onClick={(e) => {
              e.stopPropagation();
              setEditingOrder({ ...o });
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </button>
          <button
            type="button"
            className="btn-action-delete"
            title="Delete Order"
            onClick={(e) => {
              e.stopPropagation();
              setDeletingOrder(o);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="main-header-line page-header" style={{ marginBottom: '18px' }}>
        <div>
          <h1>Repair Operations & Dispatch Center</h1>
          <p className="subtitle">Live operational telemetry across Klang Valley repair zones.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/smart-orders" className="btn-primary" style={{ textDecoration: 'none' }}>
            Open Dispatch Queue ({pendingCount})
          </Link>
        </div>
      </div>

      {/* D1: Daily Operations Briefing Card */}
      <OpsBriefingCard orders={orders} technicians={technicians} />

      {/* 1. Top Row Circular Metric Cards */}
      <div className="chart-row three" style={{ marginBottom: '16px' }}>
        <div className="chart-container-wrapper">
          <div className="chart-container">
            <div className="chart-info-wrapper">
              <h2>Total Repairs</h2>
              <span>{orders.length} Units</span>
            </div>
            <div className="chart-svg">
              <svg viewBox="0 0 36 36" className="circular-chart pink">
                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="circle" strokeDasharray="82, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <text x="18" y="20.35" className="percentage">82%</text>
              </svg>
            </div>
          </div>
        </div>

        <div className="chart-container-wrapper">
          <div className="chart-container">
            <div className="chart-info-wrapper">
              <h2>Active Techs</h2>
              <span>88%</span>
            </div>
            <div className="chart-svg">
              <svg viewBox="0 0 36 36" className="circular-chart orange">
                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="circle" strokeDasharray="88, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <text x="18" y="20.35" className="percentage">88%</text>
              </svg>
            </div>
          </div>
        </div>

        <div className="chart-container-wrapper">
          <div className="chart-container">
            <div className="chart-info-wrapper">
              <h2>1st-Fix Rate</h2>
              <span>94%</span>
            </div>
            <div className="chart-svg">
              <svg viewBox="0 0 36 36" className="circular-chart green">
                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="circle" strokeDasharray="94, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <text x="18" y="20.35" className="percentage">94%</text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CyberHub KPI Grid */}
      <div className="kpi-grid" style={{ marginBottom: '20px' }}>
        <div className="ch-card">
          <span className="kpi-label">Active Repair Requests</span>
          <h2 className="kpi-value">{orders.length} Orders</h2>
          <span className="kpi-sub orange">{pendingCount} awaiting technician dispatch</span>
        </div>
        <div className="ch-card">
          <span className="kpi-label">Field Technicians Online</span>
          <h2 className="kpi-value">
            {activeTechs} / {technicians.length}
          </h2>
          <span className="kpi-sub green">GPS telemetry active</span>
        </div>
        <div className="ch-card">
          <span className="kpi-label">Pipeline Estimated Value</span>
          <h2 className="kpi-value">RM {totalRevenueEst.toFixed(2)}</h2>
          <span className="kpi-sub">Base Diagnostic: RM {globalPricing.diagnosticFee.toFixed(2)}</span>
        </div>
      </div>

      {/* 3. Middle Section: Main Trend Chart + Appliance Breakdown & Active Tech Roster */}
      <div className="chart-row two align-techs-row" style={{ marginBottom: '24px' }}>
        <div className="chart-container-wrapper big">
          <div className="chart-container align-techs-card">
            <InteractiveGraph title="Live Revenue & Completed Repair Services (E-Waste Diverted)" compact />
            <div
              className="chart-data-details"
              style={{
                marginTop: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: '10px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#b8c4db' }}>
                Total Repaired: <strong style={{ color: '#2ed573' }}>1,248 Units</strong> • Landfill Diverted:{' '}
                <strong style={{ color: 'var(--app-logo, #ff7300)' }}>28.4 Tonnes</strong>
              </div>
              <div style={{ fontSize: '11px', color: '#b8c4db' }}>
                Target Pace: <strong style={{ color: '#3498db' }}>+18.2% YoY</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-container-wrapper small">
          {/* Appliance Breakdown Card */}
          <div className="chart-container" id="applianceBreakdownCard">
            <div className="chart-container-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Appliance Breakdown</h2>
              <div className="time-sort-group" style={{ padding: '1px' }}>
                <button
                  type="button"
                  className={`time-sort-btn ${applianceBreakdownView === 'month' ? 'active' : ''}`}
                  style={{ padding: '2px 8px', fontSize: '11px' }}
                  onClick={() => setApplianceBreakdownView('month')}
                >
                  Month
                </button>
                <button
                  type="button"
                  className={`time-sort-btn ${applianceBreakdownView === 'year' ? 'active' : ''}`}
                  style={{ padding: '2px 8px', fontSize: '11px' }}
                  onClick={() => setApplianceBreakdownView('year')}
                >
                  Year
                </button>
              </div>
            </div>

            <div className="acquisitions-bar" style={{ marginTop: '8px' }}>
              <span className="bar-progress rejected" style={{ width: '12%' }} />
              <span className="bar-progress on-hold" style={{ width: '18%' }} />
              <span className="bar-progress shortlisted" style={{ width: '26%' }} />
              <span className="bar-progress applications" style={{ width: '44%' }} />
            </div>

            <div className="progress-bar-info">
              <span className="progress-color applications" />
              <span className="progress-type">Refrigerators</span>
              <span className="progress-amount">44% (138)</span>
            </div>
            <div className="progress-bar-info">
              <span className="progress-color shortlisted" />
              <span className="progress-type">Washing Machines</span>
              <span className="progress-amount">26% (82)</span>
            </div>
            <div className="progress-bar-info">
              <span className="progress-color on-hold" />
              <span className="progress-type">HVAC / Air Conditioners</span>
              <span className="progress-amount">18% (56)</span>
            </div>
            <div className="progress-bar-info">
              <span className="progress-color rejected" />
              <span className="progress-type">Ovens / Induction Hobs</span>
              <span className="progress-amount">12% (38)</span>
            </div>
          </div>

          {/* Active Technician Roster */}
          <div className="chart-container applicants" style={{ marginTop: '16px' }}>
            <div className="chart-container-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Assigned Field Technicians</h2>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>Status</span>
            </div>

            {assignedTechRoster.map((t) => (
              <div className="applicant-line" key={t.name}>
                <img src={t.img} alt={t.name} />
                <div className="applicant-info">
                  <span>{t.name}</span>
                  <p>{t.status} • <strong>{t.cert}</strong></p>
                </div>
              </div>
            ))}

            <Link to="/technicians" className="more-link-btn" title="Open full fleet management">
              View All {technicians.length || 21} Field Technicians
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Google Maps Live Fleet Tracking & Field Dispatch Card */}
      <div className="map-dispatch-card" style={{ marginBottom: '24px' }}>
        <div className="map-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--app-logo, #ff7300)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Google Maps Live Fleet Tracking & Field Dispatch
          </h2>
          <div className="live-radar-badge">
            <span className="radar-ping" />
            Live GPS Stream • {technicians.filter((t) => (t.status || '').toUpperCase() !== 'OFFLINE').length || activeTechs || 8} Technicians Active
          </div>
        </div>

        <div className="map-layout-grid">
          <div className="map-frame-container">
            <div className="map-overlay-stats">
              <div className="map-stat-chip">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2ed573" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Avg ETA: <strong>14 Mins</strong>
              </div>
              <div className="map-stat-chip">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff7300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Active Routes: <strong>6 In-Transit</strong>
              </div>
              <div className="map-stat-chip">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3498db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                Coverage: <strong>Klang Valley</strong>
              </div>
            </div>

            <iframe
              id="cmdGoogleMap"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(mapLocation)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
              loading="lazy"
              title="Google Maps Fleet Tracking"
              style={{ width: '100%', height: '360px', border: 0, borderRadius: '8px' }}
            />
          </div>

          {/* Fleet Roster Selector on Map */}
          <div className="map-fleet-roster">
            {fleetTechs.map((ft) => (
              <div
                key={ft.id}
                className={`map-fleet-item ${selectedFleetTech === ft.name ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedFleetTech(ft.name);
                  setMapLocation(ft.locationQuery);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="fleet-tech-info">
                  <img
                    src={ft.avatar}
                    alt={ft.name}
                    className="tech-avatar-img"
                    style={{ width: '40px', height: '40px', minWidth: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div className="fleet-tech-details">
                    <h4>{ft.name} ({ft.id})</h4>
                    <p>{ft.zone}</p>
                  </div>
                </div>
                <span className={`status-pill ${ft.statusClass}`}>{ft.status}</span>
              </div>
            ))}

            <Link to="/technicians" className="more-link-btn" style={{ gridColumn: '1 / -1', marginTop: '6px' }}>
              View All {technicians.length || 21} Technicians on Full Fleet Map
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Live Orders Dispatch Table wrapped in ch-card */}
      <div className="ch-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
        <SmartTable
          columns={columns}
          data={orders}
          rowKey="id"
          defaultSortKey="time"
          defaultSortOrder="desc"
          onAddNew={handleOpenAddModal}
          addNewLabel="+ Add New Order"
          searchPlaceholder="Search orders, appliances, time, or zone..."
          maxHeight="calc(100vh - 290px)"
          onRowClick={(order) => setSelectedRecord({ type: 'order', data: order })}
          selectedRowKey={selectedRecord?.data?.id}
        />
      </div>

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="dispatch-modal-overlay show" onClick={() => setEditingOrder(null)}>
          <div className="dispatch-modal ch-crud-modal" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header ch-crud-modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                <span>Edit Work Order</span>
              </h3>
              <button type="button" className="modal-close ch-crud-modal-close" onClick={() => setEditingOrder(null)}>✕</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateOrder(editingOrder.id, {
                  customer: editingOrder.customer,
                  appliance: editingOrder.appliance,
                  issue: editingOrder.issue,
                  location: editingOrder.location,
                  urgency: editingOrder.urgency || 'NORMAL',
                  priority: editingOrder.urgency === 'CRITICAL' ? 'Critical' : editingOrder.urgency === 'URGENT' ? 'High' : 'Normal',
                  status: editingOrder.status,
                  aiEstimate: Number(editingOrder.aiEstimate) || 165.0,
                  cost: editingOrder.cost || `RM ${(Number(editingOrder.aiEstimate) || 165.0).toFixed(2)}`,
                  assignedTech: editingOrder.matchedTech || editingOrder.assignedTech || 'Unassigned',
                  matchedTech: editingOrder.matchedTech || editingOrder.assignedTech || 'Unassigned',
                });
                setEditingOrder(null);
              }}
              className="modal-body ch-crud-modal-body"
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <p className="modal-order-tag" style={{ margin: 0 }}>#{editingOrder.id}</p>
                <span className="status-pill active" style={{ fontSize: '11px' }}>{editingOrder.status}</span>
              </div>

              <div className="modal-grid ch-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="ch-form-group">
                  <span className="modal-label">Customer Name</span>
                  <input
                    type="text"
                    className="ch-input"
                    value={editingOrder.customer || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, customer: e.target.value })}
                    required
                  />
                </div>
                <div className="ch-form-group">
                  <span className="modal-label">Urgency Level</span>
                  <select
                    className="ch-select"
                    value={editingOrder.urgency || 'NORMAL'}
                    onChange={(e) => setEditingOrder({ ...editingOrder, urgency: e.target.value })}
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="URGENT">URGENT</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <CoverageZonePicker
                value={editingOrder.location || ''}
                onChange={(loc) => setEditingOrder({ ...editingOrder, location: loc })}
              />

              <div className="modal-grid ch-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="ch-form-group">
                  <span className="modal-label">Order Status</span>
                  <select
                    className="ch-select"
                    value={editingOrder.status || 'PENDING'}
                    onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="OFFERED">OFFERED</option>
                    <option value="DISPATCHED">DISPATCHED</option>
                    <option value="ON_JOB">ON_JOB</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
                <div className="ch-form-group">
                  <span className="modal-label">Service Fee / Est. (RM)</span>
                  <input
                    type="number"
                    step="5"
                    className="ch-input"
                    value={editingOrder.aiEstimate ?? 165.0}
                    onChange={(e) => setEditingOrder({ ...editingOrder, aiEstimate: parseFloat(e.target.value) || 0, cost: `RM ${(parseFloat(e.target.value) || 0).toFixed(2)}` })}
                  />
                </div>
              </div>

              <div className="ch-form-group">
                <span className="modal-label">Appliance Model & Category</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {APPLIANCE_TAG_OPTIONS.map((tag) => {
                    const active = (editingOrder.appliance || '').toLowerCase().includes(tag.toLowerCase());
                    return (
                      <button
                        key={tag}
                        type="button"
                        className={`ch-chip-btn ${active ? 'selected' : ''}`}
                        onClick={() => {
                          setEditingOrder({
                            ...editingOrder,
                            appliance: active ? editingOrder.appliance : `${tag} - ${editingOrder.appliance || ''}`.replace(/^ - /, '').trim(),
                          });
                        }}
                      >
                        {active ? `✓ ${tag}` : `+ ${tag}`}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  className="ch-input"
                  value={editingOrder.appliance || ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, appliance: e.target.value })}
                  required
                />
              </div>

              <div className="ch-form-group">
                <span className="modal-label">Reported Issue / Fault Symptoms</span>
                <textarea
                  className="ch-input"
                  rows={2}
                  style={{ resize: 'vertical' }}
                  value={editingOrder.issue || ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, issue: e.target.value })}
                  required
                />
              </div>

              <div className="ch-form-group">
                <span className="modal-label">Assigned Field Technician</span>
                <select
                  className="ch-select"
                  value={editingOrder.matchedTech || editingOrder.assignedTech || 'Unassigned'}
                  onChange={(e) => setEditingOrder({ ...editingOrder, matchedTech: e.target.value, assignedTech: e.target.value })}
                >
                  <option value="Unassigned">-- Auto-Match Best Technician --</option>
                  {technicians.map((t) => (
                    <option key={t.code || t.name} value={t.name}>
                      {t.name} ({t.code}) - {t.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-footer ch-crud-modal-footer" style={{ marginTop: '16px' }}>
                <button type="button" className="btn-cancel btn-small outline ch-modal-cancel" onClick={() => setEditingOrder(null)}>Cancel</button>
                <button type="submit" className="btn-dispatch btn-primary ch-modal-save">Save to Supabase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Order Modal */}
      {isAddingOrder && (
        <div className="dispatch-modal-overlay show" onClick={() => setIsAddingOrder(false)}>
          <div className="dispatch-modal ch-crud-modal" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header ch-crud-modal-header">
              <h3>+ Create New Work Order</h3>
              <button type="button" className="modal-close ch-crud-modal-close" onClick={() => setIsAddingOrder(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmitAddOrder} className="modal-body ch-crud-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <p className="modal-order-tag" style={{ margin: 0 }}>#{newOrder.id}</p>
                <span className="status-pill active" style={{ fontSize: '11px' }}>NEW ORDER</span>
              </div>

              <div className="modal-grid ch-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="ch-form-group">
                  <span className="modal-label">Customer Name</span>
                  <input
                    type="text"
                    className="ch-input"
                    placeholder="e.g. Sarah Jenkins"
                    value={newOrder.customer}
                    onChange={(e) => setNewOrder({ ...newOrder, customer: e.target.value })}
                    required
                  />
                </div>
                <div className="ch-form-group">
                  <span className="modal-label">Urgency Level</span>
                  <select
                    className="ch-select"
                    value={newOrder.urgency || 'NORMAL'}
                    onChange={(e) =>
                      setNewOrder({
                        ...newOrder,
                        urgency: e.target.value,
                        priority: e.target.value === 'CRITICAL' ? 'Critical' : e.target.value === 'URGENT' ? 'High' : 'Normal',
                      })
                    }
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="URGENT">URGENT</option>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <CoverageZonePicker
                value={newOrder.location || ''}
                onChange={(loc) => setNewOrder({ ...newOrder, location: loc })}
              />

              <div className="modal-grid ch-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="ch-form-group">
                  <span className="modal-label">Initial Status</span>
                  <select
                    className="ch-select"
                    value={newOrder.status}
                    onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value })}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="OFFERED">OFFERED</option>
                    <option value="DISPATCHED">DISPATCHED</option>
                  </select>
                </div>
                <div className="ch-form-group">
                  <span className="modal-label">Service Fee / Est. (RM)</span>
                  <input
                    type="number"
                    step="5"
                    className="ch-input"
                    value={newOrder.aiEstimate}
                    onChange={(e) => setNewOrder({ ...newOrder, aiEstimate: parseFloat(e.target.value) || 0, cost: `RM ${(parseFloat(e.target.value) || 0).toFixed(2)}` })}
                  />
                </div>
              </div>

              <div className="ch-form-group">
                <span className="modal-label">Appliance Model & Category</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {APPLIANCE_TAG_OPTIONS.map((tag) => {
                    const active = (newOrder.appliance || '').toLowerCase().includes(tag.toLowerCase());
                    return (
                      <button
                        key={tag}
                        type="button"
                        className={`ch-chip-btn ${active ? 'selected' : ''}`}
                        onClick={() => {
                          setNewOrder({
                            ...newOrder,
                            appliance: active ? newOrder.appliance : `${tag} - ${newOrder.appliance || ''}`.replace(/^ - /, '').trim(),
                          });
                        }}
                      >
                        {active ? `✓ ${tag}` : `+ ${tag}`}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  className="ch-input"
                  placeholder="e.g. Midea 1.5HP Split AC"
                  value={newOrder.appliance}
                  onChange={(e) => setNewOrder({ ...newOrder, appliance: e.target.value })}
                  required
                />
              </div>

              <div className="ch-form-group">
                <span className="modal-label">Reported Issue / Fault Symptoms</span>
                <textarea
                  className="ch-input"
                  rows={2}
                  placeholder="Symptoms and diagnostics notes..."
                  value={newOrder.issue}
                  onChange={(e) => setNewOrder({ ...newOrder, issue: e.target.value })}
                  required
                />
              </div>

              <div className="ch-form-group">
                <span className="modal-label">Assigned Field Technician</span>
                <select
                  className="ch-select"
                  value={newOrder.matchedTech || 'Unassigned'}
                  onChange={(e) => setNewOrder({ ...newOrder, matchedTech: e.target.value, assignedTech: e.target.value })}
                >
                  <option value="Unassigned">-- Auto-Match Best Technician --</option>
                  {technicians.map((t) => (
                    <option key={t.code || t.name} value={t.name}>
                      {t.name} ({t.code}) - {t.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-footer ch-crud-modal-footer" style={{ marginTop: '16px' }}>
                <button type="button" className="btn-cancel btn-small outline ch-modal-cancel" onClick={() => setIsAddingOrder(false)}>Cancel</button>
                <button type="submit" className="btn-dispatch btn-primary ch-modal-save">Save to Supabase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Order Confirmation Modal */}
      {deletingOrder && (
        <div className="dispatch-modal-overlay show" onClick={() => setDeletingOrder(null)}>
          <div className="dispatch-modal ch-crud-modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header ch-crud-modal-header">
              <h3 style={{ color: '#ff4757', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Confirm Order Deletion
              </h3>
              <button type="button" className="modal-close ch-crud-modal-close" onClick={() => setDeletingOrder(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '8px 4px 14px 4px' }}>
              <p style={{ margin: '0 0 14px 0', fontSize: '13.5px', color: '#e5e7eb', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete order <strong style={{ color: '#ff7300', fontFamily: 'monospace' }}>#{deletingOrder.id}</strong>?
              </p>
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Client: <span style={{ color: '#fff' }}>{deletingOrder.customer}</span></div>
                <div>Appliance: <span style={{ color: '#fff' }}>{deletingOrder.appliance}</span></div>
                <div>Zone: <span style={{ color: '#fff' }}>{deletingOrder.location}</span></div>
                <div>Estimate: <span style={{ color: '#2ed573', fontWeight: 600 }}>RM {Number(deletingOrder.aiEstimate || 0).toFixed(2)}</span></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setDeletingOrder(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  style={{
                    background: '#e84118',
                    borderColor: '#c23616',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                  onClick={handleConfirmDeleteOrder}
                >
                  Delete Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandCenter;
