import { useState, useMemo, useEffect, useRef } from 'react';
import { useDashboardStore } from '../store/useDashboardStore.js';
import { useTechChatStore } from '../store/useTechChatStore.js';
import SmartTable from '../components/SmartTable.jsx';
import CategorySubcategoryFilter from '../components/CategorySubcategoryFilter.jsx';
import { resolveApplianceCategory, DEFAULT_TAXONOMY } from '../lib/categories.js';
import { calculateOrderSlaRisk } from '../lib/slaRisk.js';
import { detectLocalDuplicates } from '../lib/duplicateDetection.js';
import DuplicateReviewModal from '../components/DuplicateReviewModal.jsx';
import BatchDispatchPlanner from '../components/BatchDispatchPlanner.jsx';

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

const SmartOrders = () => {
  const { orders, technicians, addOrder, updateOrder, deleteOrder, selectedRecord, setSelectedRecord } = useDashboardStore();
  const { openChatWithTech, startCall } = useTechChatStore();
  const [filter, setFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  
  // Smart Dispatch State & Controls
  const [activeDispatchOrder, setActiveDispatchOrder] = useState(null);
  const [dispatchTech, setDispatchTech] = useState('');
  const [routeMode, setRouteMode] = useState('fastest');
  const [reserveVanParts, setReserveVanParts] = useState(true);
  const [gateNotes, setGateNotes] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Live GPS Tracking State & Controls
  const [activeLiveTrackOrder, setActiveLiveTrackOrder] = useState(null);
  const [radarMapType, setRadarMapType] = useState('roadmap');
  const [audioPinging, setAudioPinging] = useState(false);
  const [liveSpeed, setLiveSpeed] = useState(52);
  const [liveEta, setLiveEta] = useState(12);
  const [liveProgress, setLiveProgress] = useState(45);

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
    status: 'PENDING',
  });
  const [deletingOrder, setDeletingOrder] = useState(null);
  const [showDispatchPlanner, setShowDispatchPlanner] = useState(false);
  const [selectedDuplicate, setSelectedDuplicate] = useState(null);

  // D8 Duplicate & Repeat-Fault Detection
  const duplicateFindings = useMemo(() => {
    return detectLocalDuplicates(orders);
  }, [orders]);

  const duplicateMap = useMemo(() => {
    const map = {};
    duplicateFindings.forEach((f) => {
      map[f.orderId] = f;
      map[f.relatedOrderId] = f;
    });
    return map;
  }, [duplicateFindings]);

  // Dynamic simulation for live tracking speed and route progression
  useEffect(() => {
    if (!activeLiveTrackOrder) return;
    const interval = setInterval(() => {
      setLiveSpeed((prev) => {
        const delta = (Math.random() - 0.48) * 3;
        return Math.round(Math.min(68, Math.max(38, prev + delta)));
      });
      setLiveProgress((prev) => (prev >= 95 ? 95 : prev + 1));
    }, 2500);
    return () => clearInterval(interval);
  }, [activeLiveTrackOrder]);

  const handleOpenDispatch = (order) => {
    setActiveDispatchOrder(order);
    const rawTech = order.matchedTech || order.assignedTech;
    const cleanTech = (!rawTech || /auto[- ]?dispatched/i.test(rawTech)) ? (technicians?.[0]?.name || 'Satou Kenji') : rawTech;
    setDispatchTech(cleanTech);
    setRouteMode('fastest');
    setReserveVanParts(true);
    setGateNotes('');
    setIsDispatching(false);
    setDispatchSuccess(false);
  };

  const handleConfirmDispatch = (orderId) => {
    setIsDispatching(true);
    setTimeout(() => {
      const cleanTech = dispatchTech || 'Satou Kenji';
      updateOrder(orderId, {
        status: 'DISPATCHED',
        assignedTech: cleanTech,
        routeMode,
        dispatchNotes: gateNotes,
      });
      setIsDispatching(false);
      setDispatchSuccess(true);
    }, 500);
  };

  const handleOpenLiveTrack = (order) => {
    setActiveLiveTrackOrder(order);
    setRadarMapType('roadmap');
    setLiveSpeed(52);
    setLiveEta(12);
    setLiveProgress(45);
  };

  const handleAudioPing = () => {
    setAudioPinging(true);
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // AudioContext fallback
    }
    setTimeout(() => setAudioPinging(false), 1000);
  };

  // Compute live KPI metrics
  const pendingCount = useMemo(
    () => orders.filter((o) => (o.status || '').toUpperCase() === 'PENDING').length,
    [orders]
  );

  const emergencyCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          (o.urgency || '').toUpperCase() === 'CRITICAL' ||
          (o.urgency || '').toUpperCase() === 'URGENT' ||
          (o.priority || '').toLowerCase() === 'critical'
      ).length,
    [orders]
  );

  const activeInTransitCount = useMemo(
    () =>
      orders.filter((o) => {
        const st = (o.status || '').toUpperCase();
        return st === 'DISPATCHED' || st === 'IN_TRANSIT' || st === 'IN ROUTE' || st === 'OFFERED';
      }).length,
    [orders]
  );

  const vanStockedCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          (o.partsStock || '').toLowerCase().includes('van') ||
          (o.partsStock || '').toLowerCase().includes('stock')
      ).length,
    [orders]
  );

  const vanStockedPct = orders.length > 0 ? Math.round((vanStockedCount / orders.length) * 100) : 92;

  const completedCount = useMemo(
    () => orders.filter((o) => (o.status || '').toUpperCase() === 'COMPLETED').length,
    [orders]
  );

  // D2 SLA Risk Scoring per order
  const ordersWithRisk = useMemo(() => {
    return orders.map((o) => {
      const risk = calculateOrderSlaRisk(o, technicians);
      return {
        ...o,
        slaRiskScore: risk.risk,
        slaRiskBand: risk.band,
        slaRiskReasons: risk.reasons,
        slaSuggestedAction: risk.suggestedAction,
      };
    });
  }, [orders, technicians]);

  const atRiskCount = useMemo(
    () => ordersWithRisk.filter((o) => o.slaRiskBand === 'breached' || o.slaRiskBand === 'high').length,
    [ordersWithRisk]
  );

  // Compute category breakdown counts for tag chips
  const categoryCounts = useMemo(() => {
    const counts = { all: orders.length };
    orders.forEach((o) => {
      const res = resolveApplianceCategory(o);
      counts[res.group] = (counts[res.group] || 0) + 1;
      counts[res.category] = (counts[res.category] || 0) + 1;
    });
    return counts;
  }, [orders]);

  // Filter orders according to tab selection and category/subcategory tags
  const filteredOrders = useMemo(() => {
    return ordersWithRisk.filter((o) => {
      // 1. Status Filter
      if (filter === 'duplicate_review') {
        if (!duplicateMap[o.id]) return false;
      } else if (filter === 'at_risk') {
        if (o.slaRiskBand !== 'high' && o.slaRiskBand !== 'breached') return false;
      } else if (filter === 'emergency') {
        const isEmerg =
          (o.urgency || '').toUpperCase() === 'CRITICAL' ||
          (o.urgency || '').toUpperCase() === 'URGENT' ||
          (o.priority || '').toLowerCase() === 'critical';
        if (!isEmerg) return false;
      } else if (filter === 'pending') {
        if ((o.status || '').toUpperCase() !== 'PENDING') return false;
      } else if (filter === 'dispatched') {
        const st = (o.status || '').toUpperCase();
        if (st !== 'DISPATCHED' && st !== 'IN_TRANSIT' && st !== 'IN ROUTE' && st !== 'OFFERED') return false;
      } else if (filter === 'completed') {
        if ((o.status || '').toUpperCase() !== 'COMPLETED') return false;
      }

      // 2. Category & Subcategory Filter
      if (selectedCategory !== 'all' || selectedSubcategory !== 'all') {
        const res = resolveApplianceCategory(o);
        if (selectedCategory !== 'all' && res.group !== selectedCategory) {
          return false;
        }
        if (selectedSubcategory !== 'all' && res.category !== selectedSubcategory) {
          return false;
        }
      }

      return true;
    });
  }, [ordersWithRisk, filter, selectedCategory, selectedSubcategory]);

  const handleOpenAddModal = () => {
    const nextNum = 500 + orders.length;
    const nextId = `ORD-${nextNum}`;
    setNewOrder({
      id: nextId,
      customer: '',
      location: 'Klang Valley',
      appliance: '',
      issue: '',
      urgency: 'NORMAL',
      priority: 'Normal',
      cost: 'RM 180.00',
      matchedTech: 'Satou Kenji',
      status: 'PENDING',
    });
    setIsAddingOrder(true);
  };

  const handleSubmitAddOrder = (e) => {
    e.preventDefault();
    if (!newOrder.customer.trim() || !newOrder.appliance.trim()) return;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    addOrder({
      id: newOrder.id.trim() || `ORD-${500 + orders.length}`,
      time: nowStr,
      customer: newOrder.customer.trim(),
      appliance: newOrder.appliance.trim(),
      issue: newOrder.issue.trim() || 'General maintenance & diagnostic',
      location: newOrder.location.trim() || 'Klang Valley',
      urgency: newOrder.urgency || 'NORMAL',
      priority: newOrder.priority || 'Normal',
      status: newOrder.status || 'PENDING',
      cost: newOrder.cost || 'RM 180.00',
      partsStock: 'Van Stocked',
      matchedTech: newOrder.matchedTech || 'Satou Kenji',
      matchedTechCode: 'T-001',
      matchedTechZone: newOrder.location || 'Klang Valley',
      dateCategory: 'Today',
      aiEstimate: 180.0,
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

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    updateOrder(editingOrder.id, {
      customer: editingOrder.customer,
      appliance: editingOrder.appliance,
      issue: editingOrder.issue,
      location: editingOrder.location,
      urgency: editingOrder.urgency,
      priority: editingOrder.priority,
      status: editingOrder.status,
    });
    setEditingOrder(null);
  };

  // Dynamic CyberHub Smart Orders layout (Standard vs Compact View)
  const getColumns = (layoutView) => [
    {
      key: 'id',
      label: 'Order ID',
      width: '105px',
      sortType: 'alphabetical',
      render: (o) => (
        <div>
          <span className="order-id">#{o.id}</span>
          {duplicateMap[o.id] && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDuplicate(duplicateMap[o.id]);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                marginTop: '3px',
                padding: '1px 5px',
                borderRadius: '4px',
                fontSize: '9.5px',
                fontWeight: 700,
                background: duplicateMap[o.id].kind === 'repeat_fault' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: duplicateMap[o.id].kind === 'repeat_fault' ? '#eab308' : '#ef4444',
                border: `1px solid ${duplicateMap[o.id].kind === 'repeat_fault' ? 'rgba(234, 179, 8, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                cursor: 'pointer',
              }}
              title={duplicateMap[o.id].explanation}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {duplicateMap[o.id].kind === 'repeat_fault' ? 'Repeat' : 'Duplicate'}
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'dateCategory',
      label: 'Date Category',
      width: '115px',
      sortType: 'alphabetical',
      getValue: (o) => `${o.dateCategory} ${o.time}`,
      render: (o) => {
        const cat = (o.dateCategory || 'Today').toLowerCase().replace(' ', '-');
        const timePart = o.time && o.time.includes(' ') ? o.time.split(' ')[1] : '09:15';
        return (
          <div>
            <span className={`date-category-tag ${cat}`}>{o.dateCategory || 'Today'}</span>
            <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>{timePart}</div>
          </div>
        );
      },
    },
    {
      key: 'customer',
      label: 'Client & Location',
      sortType: 'alphabetical',
      width: layoutView === 'standard' ? '280px' : '180px',
      className: 'ch-col-client',
      getValue: (o) => `${o.customer} ${o.location}`,
      render: (o) => {
        const u = (o.urgency || 'NORMAL').toLowerCase();
        const p = (o.priority || (o.urgency === 'CRITICAL' ? 'Critical' : 'Normal')).toLowerCase();
        const stock = o.partsStock || 'Van Stocked';
        const isOrderReq = stock.toLowerCase().includes('order');
        const isHub = stock.toLowerCase().includes('hub');
        const stockCls = isOrderReq ? 'order-req' : isHub ? 'hub-stock' : 'in-stock';

        if (layoutView === 'standard') {
          return (
            <div className="client-cell view-standard-cell" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {/* Row 1: Client Name */}
              <div
                className="client-name"
                style={{
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: '#f8fafc',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2,
                }}
              >
                {o.customer || 'Walk-In Customer'}
              </div>
              {/* Row 2: Location */}
              <div
                className="client-loc"
                style={{
                  fontSize: '11.5px',
                  color: '#9ca3af',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2,
                }}
              >
                {o.location || 'Klang Valley'}
              </div>
              {/* Row 3: Merged Urgency, Priority, and Parts Stock */}
              <div
                className="order-relocated-badges"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  lineHeight: 1,
                  flexWrap: 'nowrap',
                  marginTop: '3px',
                }}
              >
                <span
                  className={`urgency-pill ${u}`}
                  style={{ fontSize: '10px', padding: '1.5px 6px', lineHeight: 1.1 }}
                >
                  {o.urgency || 'NORMAL'}
                </span>
                <span
                  className={`priority-pill ${p}`}
                  style={{ fontSize: '10px', padding: '1.5px 6px', lineHeight: 1.1 }}
                >
                  {p === 'critical' ? 'Critical' : p.charAt(0).toUpperCase() + p.slice(1)}
                </span>
                <span
                  className={`truck-stock-tag ${stockCls}`}
                  style={{ fontSize: '10px', padding: '1.5px 6px', lineHeight: 1.1, borderRadius: '4px' }}
                >
                  {stock}
                </span>
              </div>
            </div>
          );
        }

        return (
          <div className="client-cell">
            <span className="client-name">{o.customer || 'Walk-In Customer'}</span>
            <span className="client-loc">{o.location || 'Klang Valley'}</span>
          </div>
        );
      },
    },
    {
      key: 'applianceIssue',
      label: 'Appliance & Reported Issue',
      sortType: 'alphabetical',
      width: layoutView === 'standard' ? '240px' : '200px',
      getValue: (o) => `${o.appliance} ${o.issue}`,
      render: (o) => (
        <div className="fault-cell">
          <span className="appliance-tag">{o.appliance || 'Home Appliance'}</span>
          <span className="fault-desc">{o.issue || 'Diagnostic Request'}</span>
        </div>
      ),
    },
    {
      key: 'urgency',
      label: 'Urgency',
      width: '100px',
      sortType: 'alphabetical',
      hideInStandard: true,
      className: 'ch-col-urgency',
      render: (o) => {
        const u = (o.urgency || 'NORMAL').toLowerCase();
        return <span className={`urgency-pill ${u}`}>{o.urgency || 'NORMAL'}</span>;
      },
    },
    {
      key: 'priority',
      label: 'Priority',
      width: '100px',
      sortType: 'alphabetical',
      hideInStandard: true,
      className: 'ch-col-priority',
      render: (o) => {
        const p = (o.priority || (o.urgency === 'CRITICAL' ? 'Critical' : 'Normal')).toLowerCase();
        return (
          <span className={`priority-pill ${p}`}>
            {p === 'critical' ? 'Critical' : p.charAt(0).toUpperCase() + p.slice(1)}
          </span>
        );
      },
    },
    {
      key: 'partsStock',
      label: 'Parts Stock',
      width: '115px',
      sortType: 'alphabetical',
      hideInStandard: true,
      className: 'ch-col-parts',
      render: (o) => {
        const stock = o.partsStock || 'Van Stocked';
        const isOrderReq = stock.toLowerCase().includes('order');
        const isHub = stock.toLowerCase().includes('hub');
        const cls = isOrderReq ? 'order-req' : isHub ? 'hub-stock' : 'in-stock';
        return <span className={`truck-stock-tag ${cls}`}>{stock}</span>;
      },
    },
    {
      key: 'slaRiskScore',
      label: 'SLA Risk',
      width: '120px',
      sortType: 'numeric',
      getValue: (o) => o.slaRiskScore ?? 0,
      render: (o) => {
        const band = o.slaRiskBand || 'low';
        const reasons = o.slaRiskReasons || [];
        const config = {
          breached: { bg: 'rgba(239, 68, 68, 0.18)', color: '#f87171', border: 'rgba(239, 68, 68, 0.45)', label: 'Breached' },
          high: { bg: 'rgba(249, 115, 22, 0.18)', color: '#fb923c', border: 'rgba(249, 115, 22, 0.45)', label: 'High Risk' },
          medium: { bg: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.45)', label: 'Medium' },
          low: { bg: 'rgba(34, 197, 94, 0.18)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.45)', label: 'Low' },
        }[band] || { bg: 'rgba(34, 197, 94, 0.18)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.45)', label: 'Low' };

        return (
          <div
            title={reasons.join(' • ')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: config.bg,
              color: config.color,
              border: `1px solid ${config.border}`,
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'help',
            }}
          >
            {band === 'breached' ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ) : band === 'high' ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ) : band === 'medium' ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            <span>{config.label}</span>
          </div>
        );
      },
    },
    {
      key: 'matchedTech',
      label: layoutView === 'standard' ? 'Matched Tech & Status' : 'Matched Tech',
      width: layoutView === 'standard' ? '250px' : '200px',
      sortType: 'alphabetical',
      getValue: (o) => {
        const raw = o.matchedTech || o.assignedTech;
        return (!raw || /auto[- ]?dispatched/i.test(raw)) ? 'Satou Kenji' : raw;
      },
      render: (o) => {
        const raw = o.matchedTech || o.assignedTech;
        const techName = (!raw || /auto[- ]?dispatched/i.test(raw)) ? 'Satou Kenji' : raw;
        const s = String(o.status || 'PENDING').toUpperCase();
        const tagMap = {
          PENDING: { bg: 'rgba(255, 165, 2, 0.18)', color: '#ffa502', border: 'rgba(255, 165, 2, 0.45)', dot: '#ffa502', label: 'Pending Dispatch' },
          OFFERED: { bg: 'rgba(56, 189, 248, 0.18)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.45)', dot: '#38bdf8', label: 'Offered' },
          DISPATCHED: { bg: 'rgba(255, 115, 0, 0.18)', color: '#ff8c2b', border: 'rgba(255, 115, 0, 0.45)', dot: '#ff8c2b', label: 'In Route' },
          IN_TRANSIT: { bg: 'rgba(255, 115, 0, 0.18)', color: '#ff8c2b', border: 'rgba(255, 115, 0, 0.45)', dot: '#ff8c2b', label: 'In Transit' },
          ON_JOB: { bg: 'rgba(52, 152, 219, 0.18)', color: '#5dade2', border: 'rgba(52, 152, 219, 0.45)', dot: '#5dade2', label: 'On Job' },
          COMPLETED: { bg: 'rgba(46, 213, 115, 0.18)', color: '#2ed573', border: 'rgba(46, 213, 115, 0.45)', dot: '#2ed573', label: 'Completed' },
          CANCELLED: { bg: 'rgba(255, 71, 87, 0.18)', color: '#ff4757', border: 'rgba(255, 71, 87, 0.45)', dot: '#ff4757', label: 'Cancelled' },
        };
        const cfg = tagMap[s] || { bg: 'rgba(255, 115, 0, 0.15)', color: '#ff8c2b', border: 'rgba(255, 115, 0, 0.35)', dot: '#ff8c2b', label: s };

        if (layoutView === 'standard') {
          return (
            <div className="tech-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img
                  src={o.matchedTechAvatar || '/logo1.png'}
                  alt={techName}
                  className="tech-avatar-img"
                />
                <div>
                  <p className="tech-name" style={{ margin: 0, lineHeight: 1.2 }}>{techName}</p>
                  <span className="tech-meta" style={{ fontSize: '11px', color: '#9ca3af' }}>98% Match • 2.4 km</span>
                </div>
              </div>
              <div style={{ marginTop: '2px' }}>
                <span
                  className={`status-pill status-tag-${s.toLowerCase().replace('_', '-')}`}
                  style={{
                    background: cfg.bg,
                    color: cfg.color,
                    border: `1px solid ${cfg.border}`,
                    padding: '2px 7px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '10.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
                  {cfg.label}
                </span>
              </div>
            </div>
          );
        }

        return (
          <div className="tech-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src={o.matchedTechAvatar || '/logo1.png'}
              alt={techName}
              className="tech-avatar-img"
            />
            <div>
              <p className="tech-name">{techName}</p>
              <span className="tech-meta">98% Match • 2.4 km</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      width: '135px',
      sortType: 'alphabetical',
      hideInStandard: true,
      className: 'ch-col-status',
      render: (o) => {
        const s = String(o.status || 'PENDING').toUpperCase();
        const tagMap = {
          PENDING: { bg: 'rgba(255, 165, 2, 0.18)', color: '#ffa502', border: 'rgba(255, 165, 2, 0.45)', dot: '#ffa502', label: 'Pending Dispatch' },
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
      width: '145px',
      render: (o) => {
        const isPending = (o.status || '').toUpperCase() === 'PENDING' || (o.status || '').toUpperCase() === 'OFFERED';
        const raw = o.matchedTech || o.assignedTech;
        const techName = (!raw || /auto[- ]?dispatched/i.test(raw)) ? 'Satou Kenji' : raw;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isPending ? (
              <button
                type="button"
                className="btn-dispatch btn-dispatch-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDispatch(o);
                }}
                title="Smart Dispatch Technician"
                aria-label="Smart Dispatch Technician"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  padding: 0,
                  borderRadius: '6px',
                  background: 'rgba(255, 115, 0, 0.15)',
                  border: '1px solid rgba(255, 115, 0, 0.4)',
                  color: '#ff8c2b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className="btn-dispatch btn-livetrack-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenLiveTrack(o);
                }}
                title="Live GPS Fleet Tracking"
                aria-label="Live GPS Fleet Tracking"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  padding: 0,
                  borderRadius: '6px',
                  background: 'rgba(52, 152, 219, 0.2)',
                  border: '1px solid #3498db',
                  color: '#38bdf8',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="22" y1="12" x2="18" y2="12" />
                  <line x1="6" y1="12" x2="2" y2="12" />
                  <line x1="12" y1="6" x2="12" y2="2" />
                  <line x1="12" y1="22" x2="12" y2="18" />
                  <circle cx="12" cy="3" r="1" />
                </svg>
              </button>
            )}
            <div className="table-action-btns" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                className="btn-action-chat"
                title={`Encrypted Chat with ${techName}`}
                onClick={(e) => {
                  e.stopPropagation();
                  openChatWithTech({
                    code: o.matchedTechCode || 'T-001',
                    name: techName,
                    avatar: o.matchedTechAvatar,
                    zone: o.matchedTechZone || o.location,
                  });
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </button>
              <button
                type="button"
                className="btn-action-edit"
                title="Edit Record"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingOrder({ ...o });
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
              </button>
              <button
                type="button"
                className="btn-action-delete"
                title="Delete Record"
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
          </div>
        );
      },
    },
  ];

  return (
    <div className="page-wrapper" style={{ minHeight: 'auto', paddingBottom: '6px' }}>
      {/* Page Title & Subtitle */}
      <div className="page-header">
        <div>
          <h1>Smart Orders & Dispatch Telemetry</h1>
          <p className="subtitle">
            Synchronized live dispatch table connected to Supabase active repair requests.
          </p>
        </div>
      </div>

      {/* 1. Dispatcher Operations KPI Ribbon */}
      <div className="dispatcher-kpi-ribbon">
        <div className="dispatcher-kpi-card">
          <div className="dispatcher-kpi-info">
            <h3>Pending Dispatch</h3>
            <span style={{ color: '#ffa502' }}>{pendingCount} Orders</span>
          </div>
          <div className="dispatcher-kpi-icon" style={{ background: 'rgba(255, 165, 2, 0.15)', color: '#ffa502' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>

        <div className="dispatcher-kpi-card">
          <div className="dispatcher-kpi-info">
            <h3>Emergency / Urgent</h3>
            <span style={{ color: '#ff6b6b' }}>{emergencyCount} Active</span>
          </div>
          <div className="dispatcher-kpi-icon" style={{ background: 'rgba(231, 76, 60, 0.15)', color: '#ff6b6b' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        </div>

        <div className="dispatcher-kpi-card">
          <div className="dispatcher-kpi-info">
            <h3>Active In-Transit</h3>
            <span style={{ color: '#3498db' }}>{activeInTransitCount} Field Techs</span>
          </div>
          <div className="dispatcher-kpi-icon" style={{ background: 'rgba(52, 152, 219, 0.15)', color: '#3498db' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
        </div>

        <div className="dispatcher-kpi-card">
          <div className="dispatcher-kpi-info">
            <h3>Van Parts Stocked</h3>
            <span style={{ color: '#2ed573' }}>{vanStockedPct}% Ready</span>
          </div>
          <div className="dispatcher-kpi-icon" style={{ background: 'rgba(46, 213, 115, 0.15)', color: '#2ed573' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. Filter / Metrics Quick Bar */}
      <div className="orders-filter-bar">
        <button
          type="button"
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Orders ({orders.length})
        </button>
        <button
          type="button"
          className={`filter-tab ${filter === 'at_risk' ? 'active' : ''}`}
          style={{ color: '#fb923c', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          onClick={() => setFilter('at_risk')}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          At Risk ({atRiskCount})
        </button>
        <button
          type="button"
          className={`filter-tab ${filter === 'emergency' ? 'active' : ''}`}
          style={{ color: '#ff6b6b', fontWeight: 600 }}
          onClick={() => setFilter('emergency')}
        >
          Emergency ({emergencyCount})
        </button>
        <button
          type="button"
          className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending Dispatch ({pendingCount})
        </button>
        <button
          type="button"
          className={`filter-tab ${filter === 'dispatched' ? 'active' : ''}`}
          onClick={() => setFilter('dispatched')}
        >
          In Route / Active ({activeInTransitCount})
        </button>
        <button
          type="button"
          className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({completedCount})
        </button>
        {duplicateFindings.length > 0 && (
          <button
            type="button"
            className={`filter-tab ${filter === 'duplicate_review' ? 'active' : ''}`}
            style={{ color: '#ef4444', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            onClick={() => setFilter('duplicate_review')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Duplicate Review ({duplicateFindings.length})
          </button>
        )}
        <button
          type="button"
          className={`filter-tab ${showDispatchPlanner ? 'active' : ''}`}
          style={{ marginLeft: 'auto', color: '#ff7300', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          onClick={() => setShowDispatchPlanner(!showDispatchPlanner)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Dispatch Planner
        </button>
      </div>

      {/* 2.2 Batch Dispatch Planner (D6) */}
      {showDispatchPlanner && (
        <BatchDispatchPlanner
          orders={orders}
          technicians={technicians}
          onApplyPlan={(assignments) => {
            assignments.forEach((a) => {
              updateOrder(a.orderId, {
                status: 'DISPATCHED',
                assignedTech: a.techName,
                matchedTech: a.techName,
              });
            });
          }}
          onClose={() => setShowDispatchPlanner(false)}
        />
      )}

      {/* 2.5 CyberHub Category & Subcategory Filter System */}
      <CategorySubcategoryFilter
        taxonomy={DEFAULT_TAXONOMY}
        selectedCategory={selectedCategory}
        selectedSubcategory={selectedSubcategory}
        onSelectCategory={setSelectedCategory}
        onSelectSubcategory={setSelectedSubcategory}
        counts={categoryCounts}
      />

      {/* 3. Orders Smart Table (Height Reaches Near Bottom, Internal Scrollbar Only, Draggable Columns, Pagination) */}
      <div className="ch-card smart-orders-table-card" style={{ padding: 0, overflow: 'visible' }}>
        <SmartTable
          columns={getColumns}
          data={filteredOrders}
          rowKey="id"
          tableId="smart_orders"
          maxHeight="calc(100vh - 515px)"
          showIndex={true}
          defaultSortKey="dateCategory"
          defaultSortOrder="asc"
          onAddNew={handleOpenAddModal}
          addNewLabel="+ Add New Order"
          searchPlaceholder="Search Order ID, customer, appliance, issue, or technician..."
          onRowClick={(order) => setSelectedRecord({ type: 'order', data: order })}
          selectedRowKey={selectedRecord?.data?.id}
        />
      </div>

      {/* 4. Smart Dispatch Modal (AI Match, Specialist Selector, Parts Lock, Route Strategy) */}
      {activeDispatchOrder && (
        <div className="dispatch-modal-overlay show" id="dispatchModal" onClick={() => !isDispatching && setActiveDispatchOrder(null)}>
          <div
            className="dispatch-modal smart-dispatch-modal"
            style={{ maxWidth: '540px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255, 115, 0, 0.2)', border: '1px solid #ff7300', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff7300' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#fff' }}>AI Smart Dispatcher & Routing</h3>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>Encrypted Telemetry Waypoint Transmission</span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => !isDispatching && setActiveDispatchOrder(null)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              {dispatchSuccess ? (
                /* Confirmation Success Screen with option to track live */
                <div style={{ padding: '24px 12px', textAlign: 'center' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(46, 213, 115, 0.15)', border: '2px solid #2ed573', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#2ed573' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 style={{ color: '#fff', fontSize: '18px', margin: '0 0 6px' }}>Smart Dispatch Transmitted!</h3>
                  <p style={{ color: '#9ca3af', fontSize: '13px', margin: '0 0 20px', lineHeight: 1.5 }}>
                    Technician <strong>{dispatchTech}</strong> has received turn-by-turn navigation on vehicle terminal. Van parts locked.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn-dispatch"
                      style={{ padding: '10px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => {
                        const updatedOrd = { ...activeDispatchOrder, status: 'DISPATCHED', assignedTech: dispatchTech };
                        setActiveDispatchOrder(null);
                        handleOpenLiveTrack(updatedOrd);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="22" y1="12" x2="18" y2="12" />
                        <line x1="6" y1="12" x2="2" y2="12" />
                        <line x1="12" y1="6" x2="12" y2="2" />
                        <line x1="12" y1="22" x2="12" y2="18" />
                        <circle cx="12" cy="3" r="1" />
                      </svg>
                      Track Live GPS Radar
                    </button>
                    <button
                      type="button"
                      className="btn-cancel"
                      style={{ padding: '10px 18px', fontSize: '13px' }}
                      onClick={() => setActiveDispatchOrder(null)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <p className="modal-order-tag" style={{ margin: 0, fontSize: '14px' }}>
                      Order #{activeDispatchOrder.id}
                    </p>
                    <span className="ai-match-score" style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(46, 213, 115, 0.15)', color: '#2ed573', border: '1px solid rgba(46, 213, 115, 0.3)' }}>
                      98% Skill Match
                    </span>
                  </div>

                  {/* Work Order Spec */}
                  <div className="modal-grid" style={{ marginBottom: '14px' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <span className="modal-label">Appliance & Issue</span>
                      <p className="modal-val" style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{activeDispatchOrder.appliance}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#9ca3af' }}>{activeDispatchOrder.issue}</p>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <span className="modal-label">Customer & Location</span>
                      <p className="modal-val" style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{activeDispatchOrder.customer || 'Walk-In Customer'}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#38bdf8' }}>{activeDispatchOrder.location}</p>
                    </div>
                  </div>

                  {/* Specialist Assignment */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="modal-label" style={{ margin: 0 }}>Assign Certified Specialist</span>
                      <span style={{ fontSize: '11px', color: '#2ed573' }}>● GPS Terminal Online</span>
                    </div>
                    <select
                      value={dispatchTech}
                      onChange={(e) => setDispatchTech(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: 'rgba(5, 19, 64, 0.85)',
                        border: '1px solid rgba(255, 115, 0, 0.35)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '13px',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      {(technicians && technicians.length > 0 ? technicians : [
                        { name: 'Sarah Izzah', code: 'T-001', zone: 'Kuala Lumpur', status: 'AVAILABLE' },
                        { name: 'Jason Rahman', code: 'T-002', zone: 'Petaling Jaya', status: 'AVAILABLE' },
                        { name: 'Nurul Hakim', code: 'T-003', zone: 'Shah Alam', status: 'AVAILABLE' },
                        { name: 'Kelvin Kaur', code: 'T-004', zone: 'Penang', status: 'AVAILABLE' },
                        { name: 'Satou Kenji', code: 'T-007', zone: 'Bangsar', status: 'AVAILABLE' },
                      ]).map((t) => (
                        <option key={t.code || t.name} value={t.name} style={{ background: '#01081f', color: '#fff' }}>
                          {t.name} ({t.code || 'T-PRO'}) — {t.zone || 'Klang Valley'} [{t.status || 'AVAILABLE'}]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Van Spare Parts Lock */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '10px 12px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="modal-label" style={{ margin: 0 }}>Required Van Component</span>
                      <span className="truck-stock-tag in-stock" style={{ fontSize: '10px' }}>
                        {activeDispatchOrder.partsStock || 'Van Stocked (Bay #2)'}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#2ed573', fontWeight: 600 }}>
                      {activeDispatchOrder.issue?.includes('Fan') ? 'Evaporator Fan Motor & Sensor (PRT-102)' : activeDispatchOrder.issue || 'Diagnostic Calibration Module (PRT-088)'}
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '11.5px', color: '#cbd5e1', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={reserveVanParts}
                        onChange={(e) => setReserveVanParts(e.target.checked)}
                        style={{ accentColor: '#ff7300', cursor: 'pointer' }}
                      />
                      Auto-reserve & lock component from van inventory on dispatch
                    </label>
                  </div>

                  {/* Route & Priority Strategy */}
                  <div style={{ marginBottom: '14px' }}>
                    <span className="modal-label" style={{ marginBottom: '6px' }}>Routing & Dispatch Strategy</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      <div
                        onClick={() => setRouteMode('fastest')}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: routeMode === 'fastest' ? '1.5px solid #ff7300' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: routeMode === 'fastest' ? 'rgba(255, 115, 0, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                          <span>Fastest</span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#ff8c2b', marginTop: '2px' }}>ETA ~14 mins</div>
                      </div>
                      <div
                        onClick={() => setRouteMode('eco')}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: routeMode === 'eco' ? '1.5px solid #2ed573' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: routeMode === 'eco' ? 'rgba(46, 213, 115, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>
                          <span>Eco-Smart</span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#2ed573', marginTop: '2px' }}>-3.4 kg CO₂</div>
                      </div>
                      <div
                        onClick={() => setRouteMode('emergency')}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: routeMode === 'emergency' ? '1.5px solid #ff4757' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: routeMode === 'emergency' ? 'rgba(255, 71, 87, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                          <span>Code Red</span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#ff4757', marginTop: '2px' }}>Emergency Siren</div>
                      </div>
                    </div>
                  </div>

                  {/* Field Notes / Gate Codes */}
                  <div style={{ marginBottom: '14px' }}>
                    <span className="modal-label" style={{ marginBottom: '6px' }}>Dispatcher Field Instructions</span>
                    <input
                      type="text"
                      placeholder="e.g. Visitor Gate 2. Inform security for Tower B. Call customer 5 mins prior."
                      value={gateNotes}
                      onChange={(e) => setGateNotes(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '12.5px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Customer Notifications */}
                  <div style={{ marginBottom: '18px' }}>
                    <button
                      type="button"
                      className="btn-whatsapp-ping"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', fontSize: '12px' }}
                      onClick={() => {
                        const tech = dispatchTech || 'Satou Kenji';
                        const text = `Hello from CyberHub Service! Your certified technician ${tech} is on the way for Order #${activeDispatchOrder.id}. Live GPS tracking link: https://cyberhub.my/live/${activeDispatchOrder.id}`;
                        alert(`WhatsApp Automated Notification Sent to Client at ${activeDispatchOrder.location}:\n\n"${text}"`);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                      Ping Customer Live ETA Link via WhatsApp
                    </button>
                  </div>

                  {/* Footer Buttons */}
                  <div className="modal-footer" style={{ marginTop: '16px' }}>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setActiveDispatchOrder(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-dispatch"
                      disabled={isDispatching}
                      onClick={() => handleConfirmDispatch(activeDispatchOrder.id)}
                      style={{ minWidth: '170px' }}
                    >
                      {isDispatching ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <svg className="ch-spinner" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /><line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" /></svg>
                          Transmitting Route...
                        </span>
                      ) : (
                        'Confirm Smart Dispatch'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Dedicated Live GPS Fleet Tracking & Telemetry Console */}
      {activeLiveTrackOrder && (
        <div className="dispatch-modal-overlay show" id="liveTrackModal" onClick={() => setActiveLiveTrackOrder(null)}>
          <div
            className="dispatch-modal live-tracking-modal"
            style={{ maxWidth: '780px', width: '95%', maxHeight: '92vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'rgba(52, 152, 219, 0.2)', border: '1px solid #3498db', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="22" y1="12" x2="18" y2="12" />
                    <line x1="6" y1="12" x2="2" y2="12" />
                    <line x1="12" y1="6" x2="12" y2="2" />
                    <line x1="12" y1="22" x2="12" y2="18" />
                    <circle cx="12" cy="3" r="1" />
                  </svg>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>Live Fleet GPS Radar</h3>
                    <span className="order-id" style={{ fontSize: '12px' }}>#{activeLiveTrackOrder.id}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2ed573', display: 'inline-block', boxShadow: '0 0 8px #2ed573' }} />
                    <span style={{ fontSize: '11px', color: '#2ed573', fontWeight: 600 }}>5G Real-Time Telemetry Active • 14 Satellites Locked</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setActiveLiveTrackOrder(null)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              {/* Interactive Google Maps Frame with Radar HUD */}
              <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(52, 152, 219, 0.35)', marginBottom: '14px', background: '#01081f' }}>
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent((activeLiveTrackOrder.location || 'Klang Valley') + ', Malaysia')}&t=${radarMapType === 'satellite' ? 'k' : ''}&z=14&ie=UTF8&iwloc=&output=embed`}
                  loading="lazy"
                  title="Google Maps Fleet Tracking"
                  style={{ width: '100%', height: '320px', border: 0, display: 'block' }}
                />

                {/* Floating Radar Telemetry HUD Bar */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  right: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(1, 8, 31, 0.88)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(52, 152, 219, 0.4)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#e2e8f0' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>GPS LOCK:</span>
                    <span>3.1412° N, 101.6881° E</span>
                    <span style={{ color: '#64748b' }}>•</span>
                    <span style={{ color: '#2ed573' }}>Federal Highway (North-West)</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setRadarMapType('roadmap')}
                      style={{
                        padding: '3px 8px',
                        fontSize: '10.5px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        background: radarMapType === 'roadmap' ? '#38bdf8' : 'rgba(255, 255, 255, 0.05)',
                        color: radarMapType === 'roadmap' ? '#01081f' : '#fff',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      Roadmap
                    </button>
                    <button
                      type="button"
                      onClick={() => setRadarMapType('satellite')}
                      style={{
                        padding: '3px 8px',
                        fontSize: '10.5px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        background: radarMapType === 'satellite' ? '#38bdf8' : 'rgba(255, 255, 255, 0.05)',
                        color: radarMapType === 'satellite' ? '#01081f' : '#fff',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      Satellite
                    </button>
                  </div>
                </div>
              </div>

              {/* 4-Card Live Telemetry Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '10px' }}>
                  <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700 }}>Live Speed</span>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                    {liveSpeed} <span style={{ fontSize: '11px', color: '#9ca3af' }}>km/h</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#2ed573', marginTop: '2px' }}>● OBD-II Telemetry OK</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '10px' }}>
                  <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700 }}>Dynamic ETA</span>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#2ed573', marginTop: '2px' }}>
                    {liveEta} <span style={{ fontSize: '11px', color: '#9ca3af' }}>mins</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '2px' }}>Est. Arrival 10:48 AM</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '10px' }}>
                  <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700 }}>Distance Traveled</span>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#ff8c2b', marginTop: '2px' }}>
                    4.8 <span style={{ fontSize: '11px', color: '#9ca3af' }}>/ 14.5 km</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${liveProgress}%`, height: '100%', background: '#ff8c2b', borderRadius: '2px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '10px' }}>
                  <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700 }}>Traffic & Fuel</span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginTop: '4px' }}>
                    Optimal Flow
                  </div>
                  <div style={{ fontSize: '10px', color: '#38bdf8', marginTop: '4px' }}>Battery 94% • Van-04</div>
                </div>
              </div>

              {/* Assigned Technician & Direct Communications Bar */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 115, 0, 0.25)', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={activeLiveTrackOrder.matchedTechAvatar || '/logo1.png'}
                    alt="Tech"
                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ff7300' }}
                  />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                      {activeLiveTrackOrder.matchedTech || activeLiveTrackOrder.assignedTech || 'Satou Kenji'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                      Toyota HiAce Service Van • Destination: <span style={{ color: '#38bdf8' }}>{activeLiveTrackOrder.location}</span>
                    </div>
                  </div>
                </div>

                {/* Instant Communications Button Suite */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handleAudioPing}
                    style={{
                      padding: '6px 12px',
                      fontSize: '11.5px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: audioPinging ? '#ff7300' : 'rgba(255, 115, 0, 0.18)',
                      border: '1px solid #ff7300',
                      color: audioPinging ? '#01081f' : '#ff7300',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease',
                    }}
                    title="Send acoustic radar chime to vehicle terminal"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                    {audioPinging ? 'Pinging...' : 'Audio Ping'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const rawTech = activeLiveTrackOrder.matchedTech || activeLiveTrackOrder.assignedTech;
                      const techName = (!rawTech || /auto[- ]?dispatched/i.test(rawTech)) ? 'Satou Kenji' : rawTech;
                      openChatWithTech({
                        code: activeLiveTrackOrder.matchedTechCode || 'T-001',
                        name: techName,
                        avatar: activeLiveTrackOrder.matchedTechAvatar,
                        zone: activeLiveTrackOrder.matchedTechZone || activeLiveTrackOrder.location,
                      });
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '11.5px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid #38bdf8',
                      color: '#38bdf8',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                    title="Open AES-256 Encrypted Radio Chat"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Chat
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const rawTech = activeLiveTrackOrder.matchedTech || activeLiveTrackOrder.assignedTech;
                      const techName = (!rawTech || /auto[- ]?dispatched/i.test(rawTech)) ? 'Satou Kenji' : rawTech;
                      startCall({ name: techName, code: activeLiveTrackOrder.matchedTechCode || 'T-001' }, 'audio');
                    }}
                    style={{
                      padding: '6px 10px',
                      fontSize: '11.5px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: 'rgba(46, 213, 115, 0.15)',
                      border: '1px solid #2ed573',
                      color: '#2ed573',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                    title="WebRTC Voice Call"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Call
                  </button>
                </div>
              </div>

              {/* Mission Progression Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    style={{
                      padding: '8px 14px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: 'rgba(56, 189, 248, 0.18)',
                      border: '1px solid #38bdf8',
                      color: '#38bdf8',
                      fontWeight: 600,
                    }}
                    onClick={() => {
                      updateOrder(activeLiveTrackOrder.id, { status: 'ON_JOB' });
                      alert(`✓ Order #${activeLiveTrackOrder.id} marked as ARRIVED ON-SITE. Diagnostic session logged.`);
                      setActiveLiveTrackOrder((prev) => ({ ...prev, status: 'ON_JOB' }));
                    }}
                  >
                    Mark Arrived On-Site
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '8px 14px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: 'rgba(46, 213, 115, 0.18)',
                      border: '1px solid #2ed573',
                      color: '#2ed573',
                      fontWeight: 600,
                    }}
                    onClick={() => {
                      updateOrder(activeLiveTrackOrder.id, { status: 'COMPLETED' });
                      alert(`✓ Order #${activeLiveTrackOrder.id} marked as COMPLETED.`);
                      setActiveLiveTrackOrder(null);
                    }}
                  >
                    Mark Job Completed
                  </button>
                </div>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setActiveLiveTrackOrder(null)}
                >
                  Close Radar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Order Edit Modal (CyberHub Old Layout) */}
      {editingOrder && (
        <div className="dispatch-modal-overlay show" onClick={() => setEditingOrder(null)}>
          <div
            className="dispatch-modal ch-crud-modal"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header ch-crud-modal-header">
              <h3>Edit Service Order</h3>
              <button
                type="button"
                className="modal-close ch-crud-modal-close"
                onClick={() => setEditingOrder(null)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="modal-body ch-crud-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
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
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
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
                />
              </div>

              <div className="modal-footer ch-crud-modal-footer" style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-cancel btn-small outline ch-modal-cancel"
                  onClick={() => setEditingOrder(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-dispatch btn-primary ch-modal-save">
                  Save to Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Datalist for Orders Autocomplete Coverage Zones */}
      <datalist id="orders-coverage-zones">
        <option value="Petaling Jaya" />
        <option value="Subang Jaya" />
        <option value="Shah Alam" />
        <option value="Kuala Lumpur" />
        <option value="Ampang / Cheras" />
        <option value="Damansara" />
        <option value="Puchong" />
        <option value="Klang" />
        <option value="Cyberjaya / Putrajaya" />
        <option value="Bangsar / Mont Kiara" />
        <option value="Klang Valley" />
      </datalist>

      {/* 6. Add New Order Modal (CyberHub Old Layout) */}
      {isAddingOrder && (
        <div className="dispatch-modal-overlay show" onClick={() => setIsAddingOrder(false)}>
          <div
            className="dispatch-modal ch-crud-modal"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header ch-crud-modal-header">
              <h3>+ Create New Service Order</h3>
              <button
                type="button"
                className="modal-close ch-crud-modal-close"
                onClick={() => setIsAddingOrder(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitAddOrder} className="modal-body ch-crud-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <p className="modal-order-tag" style={{ margin: 0 }}>#{newOrder.id}</p>
                <span className="status-pill active" style={{ fontSize: '11px' }}>NEW WORK ORDER</span>
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
                    value={newOrder.urgency}
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
                  placeholder="e.g. Samsung Inverter Refrigerator RF28R7351SR"
                  value={newOrder.appliance}
                  onChange={(e) => setNewOrder({ ...newOrder, appliance: e.target.value })}
                  required
                />
              </div>

              <div className="ch-form-group">
                <span className="modal-label">Reported Issue / Symptoms</span>
                <textarea
                  className="ch-input"
                  rows={2}
                  style={{ resize: 'vertical' }}
                  placeholder="Describe observed failure symptoms..."
                  value={newOrder.issue}
                  onChange={(e) => setNewOrder({ ...newOrder, issue: e.target.value })}
                />
              </div>

              <div className="ch-form-group">
                <span className="modal-label">Estimated Fee (RM)</span>
                <input
                  type="text"
                  className="ch-input"
                  value={newOrder.cost}
                  onChange={(e) => setNewOrder({ ...newOrder, cost: e.target.value })}
                />
              </div>

              <div className="modal-footer ch-crud-modal-footer" style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-cancel btn-small outline ch-modal-cancel"
                  onClick={() => setIsAddingOrder(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-dispatch btn-primary ch-modal-save">
                  + Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Delete Work Order Confirmation Modal */}
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
            <div className="modal-body ch-crud-modal-body" style={{ padding: '8px 4px 14px 4px' }}>
              <p style={{ margin: '0 0 14px 0', fontSize: '13.5px', color: '#e5e7eb', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete order <strong style={{ color: '#ff7300', fontFamily: 'monospace' }}>#{deletingOrder.id}</strong>?
              </p>
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Client: <span style={{ color: '#fff' }}>{deletingOrder.customer}</span></div>
                <div>Appliance: <span style={{ color: '#fff' }}>{deletingOrder.appliance}</span></div>
                <div>Location: <span style={{ color: '#fff' }}>{deletingOrder.location}</span></div>
                <div>Status: <span style={{ color: '#fff' }}>{deletingOrder.status}</span></div>
              </div>
              <div className="modal-footer ch-crud-modal-footer">
                <button type="button" className="btn-cancel btn-small outline ch-modal-cancel" onClick={() => setDeletingOrder(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-cancel btn-primary"
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

      {/* Duplicate Review Modal (D8) */}
      <DuplicateReviewModal
        isOpen={Boolean(selectedDuplicate)}
        finding={selectedDuplicate}
        onClose={() => setSelectedDuplicate(null)}
        onResolve={(finding, action) => {
          if (action === 'link_and_cancel') {
            updateOrder(finding.orderA.id, {
              status: 'CANCELLED',
              cancellationReason: `Duplicate of ORD-${finding.orderB.id}`,
            });
          }
          setSelectedDuplicate(null);
        }}
      />
    </div>
  );
};

export default SmartOrders;
