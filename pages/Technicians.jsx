import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useDashboardStore } from '../store/useDashboardStore.js';
import { useTechChatStore, detectFlutterMobileApp } from '../store/useTechChatStore.js';
import { generateGoogleStrongPassword } from '../store/initialDbData.js';
import SmartTable from '../components/SmartTable.jsx';
import CategorySubcategoryFilter from '../components/CategorySubcategoryFilter.jsx';
import WorkforceSkillsPlanner from '../components/WorkforceSkillsPlanner.jsx';
import TechnicianAppraisalModal from '../components/TechnicianAppraisalModal.jsx';
import { resolveApplianceCategory, DEFAULT_TAXONOMY } from '../lib/categories.js';
import { apiFetch } from '../lib/api.js';

const CERT_COLORS = { verified: '#2ed573', pending: '#ff7300', expired: '#ff4757', rejected: '#9ca3af' };


const BASE_SPECIALTY_TAG_OPTIONS = [
  'Heating and Cooling (HVAC)',
  'Refrigeration & Freezing',
  'Laundry & Fabric Care',
  'Cooking Equipment & Ovens',
  'Dishwashers & Ventilation',
  'Commercial & HVAC Systems',
  'Major Appliances (White Goods)',
  'Small Appliances (Countertop & Portable)',
  'Consumer Electronics (Brown Goods)',
  'Air Conditioners',
  'Refrigerators',
  'Washing Machines',
  'Smart Inverters',
  'Heat Pumps',
  'Water Heaters',
  'Dryers',
  'Microwaves',
];

const BASE_CERT_TAG_OPTIONS = [
  'Master Technician',
  'HVAC Pro Certified',
  'Commercial Refrigeration',
  'Smart Electronics',
  'EPA 608 Universal',
  'Gas & Electrical Safety',
  'Scomi Certified',
  'Inverter Systems Specialist',
  'Master HVAC Certified (CIDB)',
  'Defrost Relay Master',
];

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

const COVERAGE_ZONES = [
  'Petaling Jaya',
  'Subang Jaya',
  'Shah Alam',
  'Kuala Lumpur',
  'Ampang / Cheras',
  'Damansara',
  'Puchong',
  'Klang',
  'Cyberjaya / Putrajaya',
  'Bangsar / Mont Kiara',
  'Klang Valley',
];

const CoverageZonePicker = ({ value, onChange, label = 'Assigned Region / Zone (State & Metro Hub)' }) => {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span className="modal-label" style={{ margin: 0 }}>{label}</span>

      </div>
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


const COUNTRY_CODES = [
  { country: 'Malaysia', code: '+60', iso: 'MY' },
  { country: 'Singapore', code: '+65', iso: 'SG' },
  { country: 'Indonesia', code: '+62', iso: 'ID' },
  { country: 'Brunei', code: '+673', iso: 'BN' },
  { country: 'Thailand', code: '+66', iso: 'TH' },
  { country: 'Philippines', code: '+63', iso: 'PH' },
  { country: 'Vietnam', code: '+84', iso: 'VN' },
  { country: 'Australia', code: '+61', iso: 'AU' },
  { country: 'United Kingdom', code: '+44', iso: 'GB' },
  { country: 'United States', code: '+1', iso: 'US' },
  { country: 'China', code: '+86', iso: 'CN' },
  { country: 'India', code: '+91', iso: 'IN' },
];

export const formatPhoneNumber = (fullPhone = '') => {
  if (!fullPhone) return '12 345 6789';
  const clean = String(fullPhone).replace(/\s+/g, '');
  const matched = COUNTRY_CODES.find((c) => clean.startsWith(c.code));
  const countryCode = matched ? matched.code : (clean.startsWith('+') ? clean.slice(0, 3) : '+60');
  const local = matched ? clean.slice(matched.code.length) : (clean.startsWith('+') ? clean.slice(3) : clean);
  const digits = local.replace(/\D/g, '').replace(/^0+/, '');

  if (!digits) return countryCode === '+60' ? '' : countryCode;

  // Format Malaysian numbers (+60 or default) with auto-spaced format: e.g. 12 345 6789 or 11 1234 5678
  if (countryCode === '+60') {
    if (digits.length === 9) {
      return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    }
    if (digits.length === 10) {
      return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
    }
    if (digits.length >= 7) {
      return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    }
    return digits;
  }

  // Format Singapore numbers (+65)
  if (countryCode === '+65' && digits.length === 8) {
    return `+65 ${digits.slice(0, 4)} ${digits.slice(4)}`;
  }

  // Standard international fallback
  if (digits.length >= 7) {
    return `${countryCode} ${digits.slice(0, 3)} ${digits.slice(3)}`;
  }
  return `${countryCode} ${digits}`;
};

export const splitPhone = (fullPhone = '') => {
  const str = String(fullPhone).replace(/\s+/g, '');
  const matched = COUNTRY_CODES.find((c) => str.startsWith(c.code));
  if (matched) {
    const rawLocal = str.slice(matched.code.length);
    const cleanDigits = rawLocal.replace(/\D/g, '').replace(/^0+/, '');
    return { countryCode: matched.code, localNumber: cleanDigits };
  }
  const cleanDigits = str.replace(/^\+60/, '').replace(/\D/g, '').replace(/^0+/, '');
  return { countryCode: '+60', localNumber: cleanDigits };
};

export const validatePhoneNumber = (rawNumber = '', countryCode = '+60') => {
  const digits = String(rawNumber).replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) {
    return { isValid: false, error: 'Phone number is required.' };
  }
  if (countryCode === '+60') {
    if (digits.length !== 9 && digits.length !== 10) {
      return {
        isValid: false,
        error: `Phone number must be 9 or 10 digits (currently ${digits.length}). E.g. 123456789 or 1112345678`,
      };
    }
  } else {
    if (digits.length < 7 || digits.length > 12) {
      return {
        isValid: false,
        error: `International number must be 7 to 12 digits (currently ${digits.length}).`,
      };
    }
  }
  return { isValid: true, error: null, digits };
};

const PhoneCountryPicker = ({ value = '+60', onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentCountry = COUNTRY_CODES.find((c) => c.code === value) || { country: 'Malaysia', code: value || '+60', iso: 'MY' };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return COUNTRY_CODES;
    return COUNTRY_CODES.filter((c) => c.country.toLowerCase().includes(q) || c.code.includes(q) || c.iso.toLowerCase().includes(q));
  }, [search]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '130px', minWidth: '130px' }}>
      <button
        type="button"
        className="ch-input"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          background: 'rgba(5, 19, 64, 0.45)',
          padding: '6px 10px',
          height: '38px',
          width: '100%',
          textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px', background: 'rgba(255,115,0,0.18)', color: '#ff7300', letterSpacing: '0.5px' }}>{currentCountry.iso}</span>
          <strong style={{ color: '#ff7300', fontFamily: 'monospace' }}>{currentCountry.code}</strong>
        </span>
        <span style={{ fontSize: '10px', color: '#9ca3af' }}>▼</span>
      </button>

      {isOpen && (
        <div
          className="ch-region-dropdown-table"
          style={{
            position: 'absolute',
            left: 0,
            top: '100%',
            width: '240px',
            maxHeight: '200px',
            overflowY: 'auto',
            background: '#01081f',
            border: '1.5px solid #ff7300',
            borderRadius: '8px',
            zIndex: 1000,
            boxShadow: '0 10px 30px rgba(0,0,0,0.85)',
            marginTop: '4px',
          }}
        >
          <div style={{ padding: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <input
              type="text"
              className="ch-input"
              placeholder="Search country or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ fontSize: '11px', padding: '4px 8px', height: '28px' }}
              autoFocus
            />
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.code + item.country}
                  className="zone-row-hover"
                  style={{
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: item.code === value ? 'rgba(255,115,0,0.15)' : 'transparent',
                  }}
                  onClick={() => {
                    onChange(item.code);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <td style={{ padding: '6px 10px', width: '34px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px', background: 'rgba(255,115,0,0.18)', color: '#ff7300', letterSpacing: '0.5px' }}>{item.iso}</span>
                  </td>
                  <td style={{ padding: '6px 10px', color: '#e5e7eb' }}>{item.country}</td>
                  <td style={{ padding: '6px 10px', color: '#ff7300', fontWeight: 600, fontFamily: 'monospace', textAlign: 'right' }}>
                    {item.code}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const DraggableStarRating = ({ value = 5.0, onChange }) => {
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);

  const calculateRating = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const ratio = x / rect.width;
    const rawRating = 1.0 + ratio * 4.0;
    const rounded = Math.round(rawRating * 10) / 10;
    const clamped = Math.max(1.0, Math.min(5.0, rounded));
    onChange(clamped);
  }, [onChange]);

  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    calculateRating(e.clientX);

    const handleMouseMove = (moveEvent) => {
      if (isDraggingRef.current) {
        calculateRating(moveEvent.clientX);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const stars = [1, 2, 3, 4, 5];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          cursor: 'grab',
          userSelect: 'none',
          padding: '6px 10px',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 115, 0, 0.3)',
        }}
        title="Click or drag across stars to adjust rating"
      >
        {stars.map((starNum) => {
          const filled = value >= starNum;
          const half = !filled && value >= starNum - 0.5;
          return (
            <span
              key={starNum}
              style={{
                fontSize: '22px',
                color: filled ? '#f1c40f' : half ? '#f39c12' : 'rgba(255, 255, 255, 0.2)',
                filter: filled || half ? 'drop-shadow(0 0 4px rgba(241, 196, 15, 0.6))' : 'none',
                transition: 'transform 0.1s ease',
              }}
            >
              ★
            </span>
          );
        })}
      </div>
      <span style={{ color: '#f1c40f', fontWeight: 800, fontSize: '15px', minWidth: '70px', fontFamily: 'monospace' }}>
        ★ {Number(value || 5.0).toFixed(1)} / 5.0
      </span>
    </div>
  );
};

export const getTechnicianCertList = (t) => {
  if (!t) return [];
  if (Array.isArray(t.certifications) && t.certifications.length > 0) {
    return t.certifications
      .map((c) => (typeof c === 'string' ? c.trim() : (c.title || c.name || '').trim()))
      .filter(Boolean);
  }
  const certStr = typeof t.certifications === 'string' && t.certifications.trim()
    ? t.certifications
    : typeof t.certs === 'string' && t.certs.trim()
    ? t.certs
    : '';
  if (certStr) {
    return certStr.split(/[,•|]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

export const CertBadges = ({ certs = [], rawCerts = '' }) => {
  let list = [];
  if (Array.isArray(certs) && certs.length > 0) {
    list = certs
      .map((c) =>
        typeof c === 'string'
          ? { title: c.trim(), status: 'verified' }
          : { title: (c.title || c.name || '').trim(), status: c.status || 'verified' }
      )
      .filter((c) => c.title);
  } else if (typeof certs === 'string' && certs.trim()) {
    list = certs.split(/[,•|]/).map((s) => ({ title: s.trim(), status: 'verified' })).filter((c) => c.title);
  } else if (typeof rawCerts === 'string' && rawCerts.trim()) {
    list = rawCerts.split(/[,•|]/).map((s) => ({ title: s.trim(), status: 'verified' })).filter((c) => c.title);
  }

  if (!list.length) {
    return <span style={{ fontSize: '11px', color: '#9ca3af' }}>EPA Universal 608</span>;
  }

  const tooltip = list.map((c) => `${c.title} [${c.status || 'verified'}]`).join('\n');

  return (
    <div
      className="tech-certs-badges"
      title={tooltip}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        alignItems: 'center',
        maxWidth: '240px',
      }}
    >
      {list.map((c, idx) => {
        const color = CERT_COLORS[c.status] || '#2ed573';
        return (
          <span
            key={c.title + idx}
            style={{
              display: 'inline-block',
              background: 'rgba(46, 213, 115, 0.15)',
              color,
              border: `1px solid rgba(46, 213, 115, 0.4)`,
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '10.5px',
              fontWeight: 600,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              maxWidth: '220px',
            }}
          >
            {c.title}
          </span>
        );
      })}
    </div>
  );
};


const Technicians = () => {
  const { technicians, addTechnician, updateTechnician, deleteTechnician, setTechnicians, selectedRecord, setSelectedRecord } = useDashboardStore();
  const openChatWithTech = useTechChatStore((state) => state.openChatWithTech);
  const [certSummary, setCertSummary] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [showWorkforcePlanner, setShowWorkforcePlanner] = useState(false);
  const [appraisalTech, setAppraisalTech] = useState(null);
  const [isAppraisalModalOpen, setIsAppraisalModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState(null);
  const [isAddingTech, setIsAddingTech] = useState(false);
  const [newTech, setNewTech] = useState({
    code: '',
    name: '',
    password: '',
    specialty: 'Home Appliances & HVAC',
    certifications: 'Master Technician, HVAC Pro Certified',
    certs: 'Master Technician, HVAC Pro Certified',
    zone: 'Kuala Lumpur (Cheras / Ampang / Bukit Bintang)',
    status: 'AVAILABLE',
    rating: 4.0,
    phoneNumber: '+60123456789',
    email: '',
    avatar_url: '/logo1.png',
  });
  const [addPhoneError, setAddPhoneError] = useState(null);
  const [editPhoneError, setEditPhoneError] = useState(null);
  const [deletingTech, setDeletingTech] = useState(null);

  const filteredTechnicians = useMemo(() => {
    if (selectedCategory === 'all' && selectedSubcategory === 'all') return technicians;
    return technicians.filter((t) => {
      const res = resolveApplianceCategory(t);
      if (selectedCategory !== 'all' && res.group !== selectedCategory) return false;
      if (selectedSubcategory !== 'all' && res.category !== selectedSubcategory) return false;
      return true;
    });
  }, [technicians, selectedCategory, selectedSubcategory]);

  const categoryCounts = useMemo(() => {
    const counts = { all: technicians.length };

    technicians.forEach((t) => {
      const res = resolveApplianceCategory(t);
      counts[res.group] = (counts[res.group] || 0) + 1;
      counts[res.category] = (counts[res.category] || 0) + 1;
    });
    return counts;
  }, [technicians]);

  // Dynamic specialty options: aggregate default categories and all unique specialties across the technician fleet
  const availableSpecialtyTags = useMemo(() => {
    const set = new Set(BASE_SPECIALTY_TAG_OPTIONS);
    technicians.forEach((t) => {
      if (t.specialty) {
        t.specialty.split(/[,•|]/).forEach((s) => {
          const trimmed = s.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set);
  }, [technicians]);

  const availableCertTags = useMemo(() => {
    const set = new Set(BASE_CERT_TAG_OPTIONS);
    technicians.forEach((t) => {
      const cStr = typeof t.certifications === 'string'
        ? t.certifications
        : Array.isArray(t.certifications)
        ? t.certifications.map((c) => c.title || c).join(', ')
        : t.certs || '';
      if (cStr) {
        cStr.split(/[,•|]/).forEach((s) => {
          const trimmed = s.trim();
          if (trimmed && trimmed.length > 2) set.add(trimmed);
        });
      }
    });
    return Array.from(set);
  }, [technicians]);

  // Load backend technicians only if at least 100 records exist to avoid overwriting complete fleet
  useEffect(() => {
    let cancelled = false;
    Promise.all([apiFetch('/api/admin/technicians'), apiFetch('/api/admin/technicians/certifications/summary')])
      .then(([techs, summary]) => {
        if (cancelled) return;
        if (Array.isArray(techs) && techs.length >= 100) {
          setTechnicians(techs);
        }
        if (summary) setCertSummary(summary);
      })
      .catch(() => {}); // backend offline: preserve full offline 108 roster
    return () => {
      cancelled = true;
    };

  }, [setTechnicians]);

  const handleOpenAddModal = () => {
    const nextCode = `T-${String(technicians.length + 1).padStart(3, '0')}`;
    setAddPhoneError(null);
    setNewTech({
      code: nextCode,
      name: '',
      password: '',
      specialty: 'Home Appliances & HVAC',
      certifications: 'Master Technician, HVAC Pro Certified',
      certs: 'Master Technician, HVAC Pro Certified',
      zone: 'Kuala Lumpur (Cheras / Ampang / Bukit Bintang)',
      status: 'AVAILABLE',
      rating: 4.0,
      phoneNumber: '+60123456789',
      email: `${nextCode.toLowerCase()}@cyberhub.com`,
      avatar_url: '/logo1.png',
    });
    setIsAddingTech(true);
  };


  const handleSubmitAddTech = (e) => {
    e.preventDefault();
    if (!newTech.name.trim()) return;

    const { countryCode, localNumber } = splitPhone(newTech.phoneNumber || '+60');
    const phoneVal = validatePhoneNumber(localNumber, countryCode);
    if (!phoneVal.isValid) {
      setAddPhoneError(phoneVal.error);
      return;
    }
    setAddPhoneError(null);

    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const code = newTech.code.trim().toUpperCase() || `T-${String(technicians.length + 1).padStart(3, '0')}`;
    const rawCerts = newTech.certifications || newTech.certs || '';
    const certString = typeof rawCerts === 'string'
      ? rawCerts
      : Array.isArray(rawCerts)
      ? rawCerts.map((c) => (typeof c === 'string' ? c : c.title || c.name || '')).filter(Boolean).join(', ')
      : '';
    const certArray = certString
      ? certString
          .split(/[,•|]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((title) => ({
            title,
            status: 'verified',
            issuer: 'CyberHub Academy',
          }))
      : [];
    const cleanPhone = `${countryCode}${phoneVal.digits}`;
    const email = `${code.toLowerCase()}@cyberhub.com`;
    const password = newTech.password?.trim() || generateGoogleStrongPassword();

    addTechnician({
      code,
      time: nowStr,
      name: newTech.name.trim(),
      password,
      specialty: newTech.specialty.trim() || 'Home Appliances & HVAC',
      certifications: certArray,
      certs: certString,
      bio: certString ? `Primary Certifications: ${certString}` : '',
      zone: newTech.zone.trim() || 'Kuala Lumpur (Cheras / Ampang / Bukit Bintang)',
      phoneNumber: cleanPhone,
      email,
      rating: Number(newTech.rating) || 4.0,
      completedJobs: 0,
      firstFixRate: '95%',
      status: newTech.status || 'AVAILABLE',
      avatarUrl: newTech.avatar_url || '/logo1.png',
      avatar_url: newTech.avatar_url || '/logo1.png',
    });
    setIsAddingTech(false);
  };


  const handleConfirmDeleteTech = () => {
    if (!deletingTech) return;
    deleteTechnician(deletingTech.code);
    if (selectedRecord?.type === 'technician' && selectedRecord?.data?.code === deletingTech.code) {
      setSelectedRecord(null);
    }
    setDeletingTech(null);
  };


  // Fleet metric counts for the 4 technician KPI cards
  const totalFleet = technicians.length;
  const availableNow = technicians.filter((t) => (t.status || '').toUpperCase() === 'AVAILABLE').length;
  const avgRating = (
    technicians.reduce((sum, t) => sum + (Number(t.rating) || 0), 0) / (technicians.length || 1)
  ).toFixed(1);
  const activeJobs = technicians.filter((t) =>
    ['ON_JOB', 'DISPATCHED', 'BUSY'].includes((t.status || '').toUpperCase())
  ).length;

  const getColumns = (layoutView) => [
    { key: 'code', label: 'Tech ID', className: 'accent-text mono', width: '80px' },
    {
      key: 'technician',
      label: 'Technician',
      sortType: 'alphabetical',
      width: layoutView === 'standard' ? '340px' : '220px',
      className: 'ch-col-tech',
      getValue: (t) => t.name,
      render: (t) => {
        const avatarSrc = t.avatar_url || t.avatar || '/logo1.png';
        const flutter = detectFlutterMobileApp(t);
        const statusColor = (t.status || 'AVAILABLE').toUpperCase() === 'AVAILABLE' ? '#2ed573' : '#ffa502';
        if (layoutView === 'standard') {
          return (
            <div className="tech-cell view-standard-cell" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img
                  src={avatarSrc}
                  alt={t.name}
                  className="tech-avatar-img"
                  style={{
                    width: '56px',
                    height: '56px',
                    minWidth: '56px',
                    maxWidth: '56px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid rgba(255, 115, 0, 0.45)',
                    display: 'block',
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/image/MainLogo.png';
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: statusColor,
                    border: '2px solid #051340',
                    boxShadow: `0 0 6px ${statusColor}`,
                  }}
                  title={`Status: ${t.status || 'AVAILABLE'}`}
                />
                {flutter.isUsingFlutterApp && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: '15px',
                      height: '15px',
                      background: '#040d2d',
                      border: '1px solid #38bdf8',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 6px #38bdf8',
                    }}
                    title="Active on Flutter Mobile App (Telemetry Live)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                  </span>
                )}
              </div>
              <div
                className="tech-info-col"
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
                  className="tech-fullname"
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
                  {t.name}
                </div>
                {/* 2nd Row: Location */}
                <div
                  className="tech-location"
                  style={{
                    fontSize: '11.5px',
                    color: '#9ca3af',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.2,
                  }}
                >
                  {t.zone || t.location || 'Klang Valley'}
                </div>
                {/* 3rd Row: Relocated Status, Rating, and 1st Fix Rate */}
                <div
                  className="tech-relocated-badges"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    lineHeight: 1,
                    flexWrap: 'nowrap',
                  }}
                >
                  <span
                    className={`status-pill ${(t.status || 'AVAILABLE').toLowerCase()}`}
                    style={{ fontSize: '10px', padding: '1.5px 6px', lineHeight: 1.1 }}
                  >
                    {t.status}
                  </span>
                  <span
                    className="tech-mini-badge tech-mini-rating"
                    style={{
                      fontSize: '10px',
                      padding: '1.5px 5px',
                      color: '#f1c40f',
                      background: 'rgba(241, 196, 15, 0.15)',
                      border: '1px solid rgba(241, 196, 15, 0.4)',
                      borderRadius: '4px',
                      fontWeight: 700,
                      lineHeight: 1.1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ★ {Number(t.rating || 4.8).toFixed(1)}
                  </span>
                  <span
                    className="tech-mini-badge tech-mini-fix"
                    style={{
                      fontSize: '10px',
                      padding: '1.5px 5px',
                      color: '#2ed573',
                      background: 'rgba(46, 213, 113, 0.15)',
                      border: '1px solid rgba(46, 213, 113, 0.4)',
                      borderRadius: '4px',
                      fontWeight: 700,
                      lineHeight: 1.1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.firstFixRate || '95%'} 1st-Fix
                  </span>
                </div>
              </div>
            </div>
          );
        }

        // Compact View
        return (
          <div className="tech-cell" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={avatarSrc}
                alt={t.name}
                className="tech-avatar-img"
                style={{
                  width: '36px',
                  height: '36px',
                  minWidth: '36px',
                  maxWidth: '36px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  display: 'block',
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/image/MainLogo.png';
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: statusColor,
                  border: '1.5px solid #051340',
                  boxShadow: `0 0 5px ${statusColor}`,
                }}
              />
              {flutter.isUsingFlutterApp && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: '13px',
                    height: '13px',
                    background: '#040d2d',
                    border: '1px solid #38bdf8',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 5px #38bdf8',
                  }}
                  title="Flutter Mobile App Active"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                </span>
              )}
            </div>
            <div className="tech-compact-meta" style={{ minWidth: 0, overflow: 'hidden' }}>
              <div
                className="tech-fullname"
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#f8fafc',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {t.name}
              </div>
              <div
                className="tech-meta"
                style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {t.zone || 'Klang Valley'}
              </div>
            </div>
          </div>
        );
      },
    },
    ...(layoutView === 'standard'
      ? [
          {
            key: 'contact',
            label: 'Contact',
            className: 'mono ch-col-contact',
            sortType: 'alphabetical',
            width: '220px',
            getValue: (t) => `${t.email || `${(t.code || 't-000').toLowerCase()}@cyberhub.com`} ${formatPhoneNumber(t.phoneNumber)}`,
            render: (t) => {
              const email = t.email || `${(t.code || 't-000').toLowerCase()}@cyberhub.com`;
              const phone = formatPhoneNumber(t.phoneNumber);
              return (
                <div
                  className="tech-contact-box"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    className="tech-contact-email"
                    style={{
                      color: '#38bdf8',
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}>
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1-0.9-2-2-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    {email}
                  </span>
                  <span
                    className="tech-contact-phone"
                    style={{
                      color: '#9ca3af',
                      fontSize: '11px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}>
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    {phone}
                  </span>
                </div>
              );
            },
          },
        ]
      : [
          {
            key: 'email',
            label: 'Email',
            className: 'mono ch-col-email',
            sortType: 'alphabetical',
            width: '185px',
            getValue: (t) => t.email || `${(t.code || 't-000').toLowerCase()}@cyberhub.com`,
            render: (t) => {
              const email = t.email || `${(t.code || 't-000').toLowerCase()}@cyberhub.com`;
              return (
                <span
                  className="tech-contact-email"
                  style={{
                    color: '#38bdf8',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1-0.9-2-2-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  {email}
                </span>
              );
            },
          },
          {
            key: 'phoneNumber',
            label: 'Phone Number',
            className: 'mono ch-col-phone',
            sortType: 'alphabetical',
            width: '145px',
            getValue: (t) => formatPhoneNumber(t.phoneNumber),
            render: (t) => {
              const phone = formatPhoneNumber(t.phoneNumber);
              return (
                <span
                  className="tech-contact-phone"
                  style={{
                    color: '#cbd5e1',
                    fontSize: '11.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  {phone}
                </span>
              );
            },
          },
        ]),
    {
      key: 'specialty',
      label: 'Primary Specialty',
      sortType: 'alphabetical',
      width: '140px',
      render: (t) => (
        <span
          className="appliance-tag"
          style={{
            background: 'rgba(255, 115, 0, 0.15)',
            color: '#ff7300',
            border: '1px solid rgba(255, 115, 0, 0.3)',
            padding: '3px 6px',
            borderRadius: '4px',
            fontWeight: 600,
            fontSize: '11px',
            whiteSpace: 'normal',
            lineHeight: 1.25,
            display: 'inline-block',
            maxWidth: '135px',
          }}
        >
          {t.specialty}
        </span>
      ),
    },
    {
      key: 'certifications',
      label: 'Primary Certifications',
      width: '240px',
      sortable: false,
      getValue: (t) => getTechnicianCertList(t).join(', ') || t.certs || '',
      render: (t) => <CertBadges certs={t.certifications} rawCerts={t.certs} />,
    },
    {
      key: 'status',
      label: 'Status',
      sortType: 'alphabetical',
      hideInStandard: true,
      className: 'ch-col-status',
      render: (t) => <span className={`status-pill ${(t.status || 'AVAILABLE').toLowerCase()}`}>{t.status}</span>,
    },
    {
      key: 'rating',
      label: 'Customer Rating',
      hideInStandard: true,
      className: 'ch-col-rating',
      getValue: (t) => t.rating,
      render: (t) => <span style={{ color: '#f1c40f', fontWeight: 700 }}>★ {Number(t.rating || 4.8).toFixed(1)}</span>,
    },
    {
      key: 'firstFixRate',
      label: '1st-Fix Rate',
      hideInStandard: true,
      className: 'ch-col-fixrate',
      getValue: (t) => t.firstFixRate || '95%',
      render: (t) => (
        <strong className="cost-badge" style={{ color: '#2ed573' }}>
          {t.firstFixRate || '95%'}
        </strong>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      sortable: false,
      width: '180px',
      render: (t) => (
        <div className="table-action-btns" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className="btn-action-chat"
            title={`Encrypted Radio Chat with ${t.name}`}
            onClick={(e) => {
              e.stopPropagation();
              openChatWithTech(t);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <button
            type="button"
            className="btn-action-report"
            title={`AI Performance Appraisal & Ethics Report for ${t.name}`}
            onClick={(e) => {
              e.stopPropagation();
              setAppraisalTech(t);
              setIsAppraisalModalOpen(true);
            }}
            style={{
              background: 'rgba(255, 115, 0, 0.15)',
              border: '1px solid rgba(255, 115, 0, 0.4)',
              color: '#ff7300',
              padding: '4px',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              width: '26px',
              height: '26px',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </button>
          <button
            type="button"
            className="btn-action-edit"
            title="Edit Technician Record"
            onClick={(e) => {
              e.stopPropagation();
              setEditPhoneError(null);
              setEditingTech({ ...t });
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
          </button>
          <button
            type="button"
            className="btn-action-delete"
            title="Delete Technician"
            onClick={(e) => {
              e.stopPropagation();
              setDeletingTech(t);
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
    <div className="page-wrapper" style={{ boxSizing: 'border-box' }}>
      <div className="page-header" style={{ marginBottom: '12px' }}>
        <div>
          <h1>Technician Fleet Management</h1>
          <p className="subtitle">Live technician availability, multi-tier certifications, and aggregate customer ratings.</p>
        </div>
      </div>

      {/* 4 CyberHub Technician Fleet Metric KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div className="ch-card tech-metric-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
          <div>
            <span className="kpi-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>Total Fleet</span>
            <h2 className="kpi-value" style={{ color: '#3498db', margin: '4px 0 0', fontSize: '24px', fontWeight: 700 }}>{totalFleet}</h2>
          </div>
          <div className="tech-metric-icon" style={{ color: '#3498db', background: 'rgba(52, 152, 219, 0.15)', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        </div>

        <div className="ch-card tech-metric-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
          <div>
            <span className="kpi-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>Available Now</span>
            <h2 className="kpi-value" style={{ color: '#2ed573', margin: '4px 0 0', fontSize: '24px', fontWeight: 700 }}>{availableNow}</h2>
          </div>
          <div className="tech-metric-icon" style={{ color: '#2ed573', background: 'rgba(46, 213, 115, 0.15)', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>

        <div className="ch-card tech-metric-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
          <div>
            <span className="kpi-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>Average Rating</span>
            <h2 className="kpi-value" style={{ color: '#ffa502', margin: '4px 0 0', fontSize: '24px', fontWeight: 700 }}>
              {avgRating} <small style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 400 }}>/ 5.0</small>
            </h2>
          </div>
          <div className="tech-metric-icon" style={{ color: '#ffa502', background: 'rgba(255, 165, 2, 0.15)', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
        </div>

        <div className="ch-card tech-metric-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
          <div>
            <span className="kpi-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>Active Dispatches</span>
            <h2 className="kpi-value" style={{ color: '#ff7300', margin: '4px 0 0', fontSize: '24px', fontWeight: 700 }}>{activeJobs}</h2>
          </div>
          <div className="tech-metric-icon" style={{ color: '#ff7300', background: 'rgba(255, 115, 0, 0.15)', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        {certSummary ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#9ca3af' }}>
            <span style={{ fontWeight: 600 }}>Certs Overview:</span>
            <span style={{ color: CERT_COLORS.verified }}>{certSummary.verified || 0} Verified</span>
            <span style={{ color: CERT_COLORS.pending }}>{certSummary.pending || 0} Pending</span>
            <span style={{ color: '#f1c40f' }}>{certSummary.expiring_90d || 0} Expiring 90d</span>
            <span style={{ color: CERT_COLORS.expired }}>{certSummary.expired || 0} Expired</span>
          </div>
        ) : <div />}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => {
              setAppraisalTech(filteredTechnicians[0] || technicians[0]);
              setIsAppraisalModalOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              padding: '5px 12px',
              borderRadius: '6px',
              background: 'rgba(255, 115, 0, 0.15)',
              border: '1px solid #ff7300',
              color: '#ff7300',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <polyline points="17 11 19 13 23 9" />
            </svg>
            Technicians AI Appraisal & KPI Report
          </button>

          <button
            type="button"
            onClick={() => setShowWorkforcePlanner(!showWorkforcePlanner)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              padding: '5px 12px',
              borderRadius: '6px',
              background: showWorkforcePlanner ? '#38bdf8' : 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38bdf8',
              color: showWorkforcePlanner ? '#000' : '#38bdf8',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Workforce Planner
          </button>
        </div>
      </div>

      {showWorkforcePlanner && (
        <WorkforceSkillsPlanner
          technicians={technicians}
          onClose={() => setShowWorkforcePlanner(false)}
        />
      )}

      {/* CyberHub Category & Subcategory Filter System for Technicians Specialty */}
      <CategorySubcategoryFilter
        taxonomy={DEFAULT_TAXONOMY}
        selectedCategory={selectedCategory}
        selectedSubcategory={selectedSubcategory}
        onSelectCategory={setSelectedCategory}
        onSelectSubcategory={setSelectedSubcategory}
        counts={categoryCounts}
      />

      <div className="ch-card technicians-table-card" style={{ padding: 0, overflow: 'visible' }}>
        <SmartTable
          columns={getColumns}
          data={filteredTechnicians}
          rowKey="code"
          defaultSortKey="rating"
          defaultSortOrder="desc"
          onAddNew={handleOpenAddModal}
          addNewLabel="+ Add New Tech"
          searchPlaceholder="Search technician name, ID, specialty, zone, certificate..."
          maxHeight="calc(100vh - 465px)"
          onRowClick={(tech) => setSelectedRecord({ type: 'technician', data: tech })}
          selectedRowKey={selectedRecord?.data?.code}
        />
      </div>

      {/* Datalist for Autocomplete Coverage Zones */}
      <datalist id="coverage-zone-options">
        {COVERAGE_ZONES.map((zone) => (
          <option key={zone} value={zone} />
        ))}
      </datalist>

      {/* Edit Technician Modal */}
      {editingTech && (
        <div className="dispatch-modal-overlay show" onClick={() => setEditingTech(null)}>
          <div className="dispatch-modal ch-crud-modal" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header ch-crud-modal-header">
              <h3>Edit Field Technician</h3>
              <button type="button" className="modal-close ch-crud-modal-close" onClick={() => setEditingTech(null)}>✕</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const { countryCode, localNumber } = splitPhone(editingTech.phoneNumber || '+60');
                const phoneVal = validatePhoneNumber(localNumber, countryCode);
                if (!phoneVal.isValid) {
                  setEditPhoneError(phoneVal.error);
                  return;
                }
                setEditPhoneError(null);

                const cleanPhone = `${countryCode}${phoneVal.digits}`;
                const email = `${(editingTech.code || 't-000').toLowerCase()}@cyberhub.com`;
                const rawCerts = editingTech.certifications || editingTech.certs || '';
                const certString = typeof rawCerts === 'string'
                  ? rawCerts
                  : Array.isArray(rawCerts)
                  ? rawCerts.map((c) => (typeof c === 'string' ? c : c.title || c.name || '')).filter(Boolean).join(', ')
                  : '';
                const certArray = certString
                  ? certString
                      .split(/[,•|]/)
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((title) => ({
                        title,
                        status: 'verified',
                        issuer: 'CyberHub Academy',
                      }))
                  : [];

                updateTechnician(editingTech.code, {
                  name: editingTech.name,
                  password: editingTech.password,
                  email,
                  specialty: editingTech.specialty,
                  certifications: certArray,
                  certs: certString,
                  bio: certString ? `Primary Certifications: ${certString}` : editingTech.bio,
                  zone: editingTech.zone,
                  phoneNumber: cleanPhone,
                  status: editingTech.status,
                  rating: Number(editingTech.rating),
                  avatar_url: editingTech.avatar_url,
                  avatar: editingTech.avatar_url,
                });
                if (selectedRecord?.type === 'technician' && selectedRecord?.data?.code === editingTech.code) {
                  setSelectedRecord({
                    type: 'technician',
                    data: {
                      ...selectedRecord.data,
                      name: editingTech.name,
                      password: editingTech.password,
                      email,
                      specialty: editingTech.specialty,
                      certifications: certArray,
                      certs: certString,
                      bio: certString ? `Primary Certifications: ${certString}` : editingTech.bio,
                      zone: editingTech.zone,
                      phoneNumber: cleanPhone,
                      status: editingTech.status,
                      rating: Number(editingTech.rating),
                      avatar_url: editingTech.avatar_url,
                      avatar: editingTech.avatar_url,
                    },
                  });
                }
                setEditingTech(null);
              }}
              className="modal-body ch-crud-modal-body"
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <p className="modal-order-tag" style={{ margin: 0 }}>{editingTech.code}</p>
                <span className="status-pill completed" style={{ fontSize: '11px' }}>★ {Number(editingTech.rating || 5.0).toFixed(1)} Rating</span>
              </div>

              {/* Profile Picture Upload Area from CyberHub Old */}
              <div className="ch-form-group">
                <span className="modal-label" style={{ color: '#ff7300' }}>Technician Profile Picture</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(5, 19, 64, 0.45)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <img
                    src={editingTech.avatar_url || editingTech.avatar || '/logo1.png'}
                    alt="Profile Preview"
                    style={{ width: '54px', height: '54px', minWidth: '54px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ff7300', background: '#01081f', boxShadow: '0 0 12px rgba(255, 115, 0, 0.4)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <label className="btn-small outline" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', fontSize: '11.5px', margin: 0, color: '#ff7300', borderColor: 'rgba(255, 115, 0, 0.4)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff7300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      Choose Profile Pic
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setEditingTech({ ...editingTech, avatar_url: url, avatar: url });
                          }
                        }}
                      />
                    </label>
                    <div style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0 0' }}>
                      Profile photo active
                    </div>
                  </div>
                </div>
              </div>

              <div className="ch-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span className="modal-label" style={{ margin: 0 }}>This will be your Email Address</span>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>Non-editable</span>
                </div>
                <input
                  type="email"
                  className="ch-input"
                  readOnly
                  tabIndex={-1}
                  value={`${(editingTech.code || 't-000').toLowerCase()}@cyberhub.com`}
                  style={{
                    fontFamily: 'monospace',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#9ca3af',
                    cursor: 'not-allowed',
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                    opacity: 0.75,
                  }}
                />
              </div>

              <div className="ch-form-group">
                <span className="modal-label">Full Name</span>
                <input
                  type="text"
                  className="ch-input"
                  value={editingTech.name || ''}
                  onChange={(e) => setEditingTech({ ...editingTech, name: e.target.value })}
                  required
                />
              </div>

              {/* Password Field with Random Generate Strong Password Button from CyberHub Old */}
              <div className="ch-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span className="modal-label" style={{ margin: 0 }}>Password</span>
                  <button
                    type="button"
                    className="btn-small outline"
                    style={{ padding: '2px 8px', fontSize: '11px', color: '#ff7300', borderColor: 'rgba(255, 115, 0, 0.4)', cursor: 'pointer' }}
                    onClick={() => {
                      setEditingTech({ ...editingTech, password: generateGoogleStrongPassword() });
                    }}
                  >
                    Generate Strong Password
                  </button>
                </div>
                <input
                  type="text"
                  className="ch-input"
                  placeholder="Click generate or enter password..."
                  value={editingTech.password || ''}
                  onChange={(e) => setEditingTech({ ...editingTech, password: e.target.value })}
                  style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}
                />
              </div>

              <div className="ch-form-group">
                <span className="modal-label">Categories / Specialty Tags</span>
                <div className="ch-chips-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {Array.from(new Set([
                    ...availableSpecialtyTags,
                    ...((editingTech.specialty || '').split(/[,•|]/).map((s) => s.trim()).filter(Boolean))
                  ])).map((tag) => {
                    const currentTags = (editingTech.specialty || '')
                      .split(/[,•|]/)
                      .map((s) => s.trim())
                      .filter(Boolean);
                    const active = currentTags.some((s) => s.toLowerCase() === tag.toLowerCase());
                    return (
                      <button
                        key={tag}
                        type="button"
                        className={`ch-chip-btn ${active ? 'selected' : ''}`}
                        onClick={() => {
                          const exists = currentTags.some((s) => s.toLowerCase() === tag.toLowerCase());
                          const newTags = exists
                            ? currentTags.filter((s) => s.toLowerCase() !== tag.toLowerCase())
                            : [...currentTags, tag];
                          setEditingTech({ ...editingTech, specialty: newTags.join(', ') });
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
                  placeholder="Selected tags / Custom specialties..."
                  value={editingTech.specialty || ''}
                  onChange={(e) => setEditingTech({ ...editingTech, specialty: e.target.value })}
                  required
                />
              </div>

              {/* Primary Certifications & Accreditations Field from CyberHub Old */}
              <div className="ch-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span className="modal-label" style={{ margin: 0, color: '#2ed573' }}>Primary Certifications & Accreditations</span>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>Click tag to toggle</span>
                </div>
                <div className="ch-chips-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {Array.from(new Set([
                    ...availableCertTags,
                    ...((typeof editingTech.certifications === 'string'
                      ? editingTech.certifications
                      : Array.isArray(editingTech.certifications)
                      ? editingTech.certifications.map((c) => c.title || c).join(', ')
                      : editingTech.certs || '').split(/[,•|]/).map((s) => s.trim()).filter(Boolean))
                  ])).map((tag) => {
                    const currentStr = typeof editingTech.certifications === 'string'
                      ? editingTech.certifications
                      : Array.isArray(editingTech.certifications)
                      ? editingTech.certifications.map((c) => c.title || c).join(', ')
                      : editingTech.certs || '';
                    const currentTags = currentStr.split(/[,•|]/).map((s) => s.trim()).filter(Boolean);
                    const active = currentTags.some((s) => s.toLowerCase() === tag.toLowerCase());
                    return (
                      <button
                        key={tag}
                        type="button"
                        className={`ch-chip-btn ${active ? 'selected' : ''}`}
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: active ? 'rgba(46, 213, 115, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                          borderColor: active ? '#2ed573' : 'rgba(255, 255, 255, 0.1)',
                          color: active ? '#2ed573' : '#cbd5e1',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          const exists = currentTags.some((s) => s.toLowerCase() === tag.toLowerCase());
                          const newTags = exists
                            ? currentTags.filter((s) => s.toLowerCase() !== tag.toLowerCase())
                            : [...currentTags, tag];
                          const joined = newTags.join(', ');
                          setEditingTech({ ...editingTech, certifications: joined, certs: joined });
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
                  placeholder="e.g. Master Tech, EPA 608 Universal, HVAC Certified..."
                  value={
                    typeof editingTech.certifications === 'string'
                      ? editingTech.certifications
                      : Array.isArray(editingTech.certifications)
                      ? editingTech.certifications.map((c) => c.title || c).join(', ')
                      : editingTech.certs || ''
                  }
                  onChange={(e) => setEditingTech({ ...editingTech, certifications: e.target.value, certs: e.target.value })}
                />
              </div>

              {/* Coverage Zone Dropdown Table from CyberHub Old */}
              <CoverageZonePicker
                value={editingTech.zone || ''}
                onChange={(zone) => setEditingTech({ ...editingTech, zone })}
              />

              <div className="ch-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span className="modal-label" style={{ margin: 0 }}>Phone Country & Contact Number</span>
                  <span style={{ fontSize: '11px', color: editPhoneError ? '#ff4757' : '#9ca3af' }}>
                    {editPhoneError ? 'Invalid length (Must be 9 or 10 digit)' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {(() => {
                    const { countryCode, localNumber } = splitPhone(editingTech.phoneNumber || '+60');
                    return (
                      <>
                        <PhoneCountryPicker
                          value={countryCode}
                          onChange={(newCode) => {
                            const cleanLocal = String(localNumber || '').replace(/\D/g, '').replace(/^0+/, '');
                            setEditingTech({ ...editingTech, phoneNumber: `${newCode}${cleanLocal}` });
                            if (editPhoneError) {
                              const val = validatePhoneNumber(cleanLocal, newCode);
                              setEditPhoneError(val.isValid ? null : val.error);
                            }
                          }}
                        />
                        <input
                          type="text"
                          className="ch-input"
                          style={{
                            flex: 1,
                            fontFamily: 'monospace',
                            letterSpacing: '0.5px',
                            borderColor: editPhoneError ? '#ff4757' : undefined,
                            boxShadow: editPhoneError ? '0 0 8px rgba(255, 71, 87, 0.4)' : undefined,
                          }}
                          placeholder="e.g. 123456789 or 1112345678"
                          maxLength={11}
                          value={localNumber}
                          onChange={(e) => {
                            const cleanLocal = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                            setEditingTech({ ...editingTech, phoneNumber: `${countryCode}${cleanLocal}` });
                            if (cleanLocal.length > 0) {
                              const val = validatePhoneNumber(cleanLocal, countryCode);
                              setEditPhoneError(val.isValid ? null : val.error);
                            } else {
                              setEditPhoneError('Phone number is required.');
                            }
                          }}
                        />
                      </>
                    );
                  })()}
                </div>
                {editPhoneError && (
                  <span style={{ color: '#ff4757', fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff4757" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {editPhoneError}
                  </span>
                )}
              </div>

              <div className="modal-grid ch-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="ch-form-group">
                  <span className="modal-label">Availability Status</span>
                  <select
                    className="ch-select"
                    value={editingTech.status || 'AVAILABLE'}
                    onChange={(e) => setEditingTech({ ...editingTech, status: e.target.value })}
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="ON_JOB">ON_JOB</option>
                    <option value="BUSY">BUSY</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                </div>
                <div className="ch-form-group">
                  <span className="modal-label">Technician Rating</span>
                  <DraggableStarRating
                    value={Number(editingTech.rating || 5.0)}
                    onChange={(r) => setEditingTech({ ...editingTech, rating: r })}
                  />
                </div>
              </div>

              <div className="modal-footer ch-crud-modal-footer" style={{ marginTop: '16px' }}>
                <button type="button" className="btn-cancel btn-small outline ch-modal-cancel" onClick={() => setEditingTech(null)}>Cancel</button>
                <button type="submit" className="btn-dispatch btn-primary ch-modal-save">Save to Supabase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Technician Modal */}
      {isAddingTech && (
        <div className="dispatch-modal-overlay show" onClick={() => setIsAddingTech(false)}>
          <div className="dispatch-modal ch-crud-modal" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header ch-crud-modal-header">
              <h3>+ Create New Field Technician</h3>
              <button type="button" className="modal-close ch-crud-modal-close" onClick={() => setIsAddingTech(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmitAddTech} className="modal-body ch-crud-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <p className="modal-order-tag" style={{ margin: 0 }}>{newTech.code}</p>
                <span className="status-pill active" style={{ fontSize: '11px' }}>NEW ASSIGNMENT</span>
              </div>

              {/* Profile Picture Upload Area from CyberHub Old */}
              <div className="ch-form-group">
                <span className="modal-label" style={{ color: '#ff7300' }}>Technician Profile Picture</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(5, 19, 64, 0.45)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <img
                    src={newTech.avatar_url || '/logo1.png'}
                    alt="Profile Preview"
                    style={{ width: '54px', height: '54px', minWidth: '54px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ff7300', background: '#01081f', boxShadow: '0 0 12px rgba(255, 115, 0, 0.4)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <label className="btn-small outline" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', fontSize: '11.5px', margin: 0, color: '#ff7300', borderColor: 'rgba(255, 115, 0, 0.4)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff7300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      Choose Profile Pic
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setNewTech({ ...newTech, avatar_url: url });
                          }
                        }}
                      />
                    </label>
                    <div style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0 0' }}>
                      Default photo active (select file to replace)
                    </div>
                  </div>
                </div>
              </div>

              <div className="ch-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span className="modal-label" style={{ margin: 0 }}>This is their Email Address</span>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>Non-editable</span>
                </div>
                <input
                  type="email"
                  className="ch-input"
                  readOnly
                  tabIndex={-1}
                  value={`${(newTech.code || 't-000').toLowerCase()}@cyberhub.com`}
                  style={{
                    fontFamily: 'monospace',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#9ca3af',
                    cursor: 'not-allowed',
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                    opacity: 0.75,
                  }}
                />
              </div>

              <div className="ch-form-group">
                <span className="modal-label">Full Name</span>
                <input
                  type="text"
                  className="ch-input"
                  placeholder="e.g. Ahmad Faizal"
                  value={newTech.name}
                  onChange={(e) => setNewTech({ ...newTech, name: e.target.value })}
                  required
                />
              </div>

              {/* Password Field with Random Generate Strong Password Button from CyberHub Old */}
              <div className="ch-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span className="modal-label" style={{ margin: 0 }}>Password</span>
                  <button
                    type="button"
                    className="btn-small outline"
                    style={{ padding: '2px 8px', fontSize: '11px', color: '#ff7300', borderColor: 'rgba(255, 115, 0, 0.4)', cursor: 'pointer' }}
                    onClick={() => {
                      setNewTech({ ...newTech, password: generateGoogleStrongPassword() });
                    }}
                  >
                    Generate Strong Password
                  </button>
                </div>
                <input
                  type="text"
                  className="ch-input"
                  placeholder="Click generate or enter password..."
                  value={newTech.password || ''}
                  onChange={(e) => setNewTech({ ...newTech, password: e.target.value })}
                  style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}
                />
              </div>

              <div className="ch-form-group">
                <span className="modal-label">Categories / Specialty Tags</span>
                <div className="ch-chips-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {Array.from(new Set([
                    ...availableSpecialtyTags,
                    ...((newTech.specialty || '').split(/[,•|]/).map((s) => s.trim()).filter(Boolean))
                  ])).map((tag) => {
                    const currentTags = (newTech.specialty || '')
                      .split(/[,•|]/)
                      .map((s) => s.trim())
                      .filter(Boolean);
                    const active = currentTags.some((s) => s.toLowerCase() === tag.toLowerCase());
                    return (
                      <button
                        key={tag}
                        type="button"
                        className={`ch-chip-btn ${active ? 'selected' : ''}`}
                        onClick={() => {
                          const exists = currentTags.some((s) => s.toLowerCase() === tag.toLowerCase());
                          const newTags = exists
                            ? currentTags.filter((s) => s.toLowerCase() !== tag.toLowerCase())
                            : [...currentTags, tag];
                          setNewTech({ ...newTech, specialty: newTags.join(', ') });
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
                  placeholder="Selected tags / Custom specialties..."
                  value={newTech.specialty}
                  onChange={(e) => setNewTech({ ...newTech, specialty: e.target.value })}
                  required
                />
              </div>

              {/* Primary Certifications & Accreditations Field from CyberHub Old */}
              <div className="ch-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span className="modal-label" style={{ margin: 0, color: '#2ed573' }}>Primary Certifications & Accreditations</span>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>Click tag to toggle</span>
                </div>
                <div className="ch-chips-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {Array.from(new Set([
                    ...availableCertTags,
                    ...((newTech.certifications || newTech.certs || '').split(/[,•|]/).map((s) => s.trim()).filter(Boolean))
                  ])).map((tag) => {
                    const currentStr = typeof newTech.certifications === 'string'
                      ? newTech.certifications
                      : Array.isArray(newTech.certifications)
                      ? newTech.certifications.map((c) => c.title || c).join(', ')
                      : newTech.certs || '';
                    const currentTags = currentStr.split(/[,•|]/).map((s) => s.trim()).filter(Boolean);
                    const active = currentTags.some((s) => s.toLowerCase() === tag.toLowerCase());
                    return (
                      <button
                        key={tag}
                        type="button"
                        className={`ch-chip-btn ${active ? 'selected' : ''}`}
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: active ? 'rgba(46, 213, 115, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                          borderColor: active ? '#2ed573' : 'rgba(255, 255, 255, 0.1)',
                          color: active ? '#2ed573' : '#cbd5e1',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          const exists = currentTags.some((s) => s.toLowerCase() === tag.toLowerCase());
                          const newTags = exists
                            ? currentTags.filter((s) => s.toLowerCase() !== tag.toLowerCase())
                            : [...currentTags, tag];
                          const joined = newTags.join(', ');
                          setNewTech({ ...newTech, certifications: joined, certs: joined });
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
                  placeholder="e.g. Master Tech, EPA 608 Universal, HVAC Certified..."
                  value={newTech.certifications || newTech.certs || ''}
                  onChange={(e) => setNewTech({ ...newTech, certifications: e.target.value, certs: e.target.value })}
                />
              </div>

              {/* Coverage Zone Dropdown Table from CyberHub Old */}
              <CoverageZonePicker
                value={newTech.zone || ''}
                onChange={(zone) => setNewTech({ ...newTech, zone })}
              />

              <div className="ch-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span className="modal-label" style={{ margin: 0 }}>Phone Country & Contact Number</span>
                  <span style={{ fontSize: '11px', color: addPhoneError ? '#ff4757' : '#9ca3af' }}>
                    {addPhoneError ? 'Invalid length (Must be 9 or 10 digit)' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {(() => {
                    const { countryCode, localNumber } = splitPhone(newTech.phoneNumber || '+60');
                    return (
                      <>
                        <PhoneCountryPicker
                          value={countryCode}
                          onChange={(newCode) => {
                            const cleanLocal = String(localNumber || '').replace(/\D/g, '').replace(/^0+/, '');
                            setNewTech({ ...newTech, phoneNumber: `${newCode}${cleanLocal}` });
                            if (addPhoneError) {
                              const val = validatePhoneNumber(cleanLocal, newCode);
                              setAddPhoneError(val.isValid ? null : val.error);
                            }
                          }}
                        />
                        <input
                          type="text"
                          className="ch-input"
                          style={{
                            flex: 1,
                            fontFamily: 'monospace',
                            letterSpacing: '0.5px',
                            borderColor: addPhoneError ? '#ff4757' : undefined,
                            boxShadow: addPhoneError ? '0 0 8px rgba(255, 71, 87, 0.4)' : undefined,
                          }}
                          placeholder="e.g. 123456789 or 1112345678"
                          maxLength={11}
                          value={localNumber}
                          onChange={(e) => {
                            const cleanLocal = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                            setNewTech({ ...newTech, phoneNumber: `${countryCode}${cleanLocal}` });
                            if (cleanLocal.length > 0) {
                              const val = validatePhoneNumber(cleanLocal, countryCode);
                              setAddPhoneError(val.isValid ? null : val.error);
                            } else {
                              setAddPhoneError('Phone number is required.');
                            }
                          }}
                        />
                      </>
                    );
                  })()}
                </div>
                {addPhoneError && (
                  <span style={{ color: '#ff4757', fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff4757" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {addPhoneError}
                  </span>
                )}
              </div>

              <div className="ch-form-group">
                <span className="modal-label">Availability Status</span>
                <select
                  className="ch-select"
                  value={newTech.status}
                  onChange={(e) => setNewTech({ ...newTech, status: e.target.value })}
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="ON_JOB">ON_JOB</option>
                  <option value="BUSY">BUSY</option>
                  <option value="OFFLINE">OFFLINE</option>
                </select>
              </div>

              <div className="modal-footer ch-crud-modal-footer" style={{ marginTop: '16px' }}>
                <button type="button" className="btn-cancel btn-small outline ch-modal-cancel" onClick={() => setIsAddingTech(false)}>Cancel</button>
                <button type="submit" className="btn-dispatch btn-primary ch-modal-save">Save to Supabase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Technician Confirmation Modal */}
      {deletingTech && (
        <div className="dispatch-modal-overlay show" onClick={() => setDeletingTech(null)}>
          <div className="dispatch-modal ch-crud-modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header ch-crud-modal-header">
              <h3 style={{ color: '#ff4757', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Confirm Technician Removal
              </h3>
              <button type="button" className="modal-close ch-crud-modal-close" onClick={() => setDeletingTech(null)}>✕</button>
            </div>
            <div className="modal-body ch-crud-modal-body" style={{ padding: '8px 4px 14px 4px' }}>
              <p style={{ margin: '0 0 14px 0', fontSize: '13.5px', color: '#e5e7eb', lineHeight: 1.5 }}>
                Are you sure you want to remove technician <strong style={{ color: '#fff' }}>{deletingTech.name}</strong> (<span className="modal-order-tag" style={{ display: 'inline', padding: '2px 6px' }}>{deletingTech.code}</span>)?
              </p>
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Specialty: <span style={{ color: '#fff' }}>{deletingTech.specialty}</span></div>
                <div>Zone: <span style={{ color: '#fff' }}>{deletingTech.zone}</span></div>
                <div>Status: <span style={{ color: '#fff' }}>{deletingTech.status}</span></div>
                <div>Rating: <span style={{ color: '#f1c40f', fontWeight: 700 }}>★ {Number(deletingTech.rating || 5.0).toFixed(1)}</span></div>
              </div>
              <div className="modal-footer ch-crud-modal-footer">
                <button type="button" className="btn-cancel btn-small outline ch-modal-cancel" onClick={() => setDeletingTech(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-cancel btn-primary"
                  style={{
                    background: '#ff4757',
                    borderColor: '#ff4757',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                  onClick={handleConfirmDeleteTech}
                >
                  Delete Technician
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Technician AI Performance Appraisal & Work Ethics Modal */}
      <TechnicianAppraisalModal
        isOpen={isAppraisalModalOpen}
        onClose={() => setIsAppraisalModalOpen(false)}
        technician={appraisalTech}
        fleet={technicians}
      />
    </div>
  );
};


export default Technicians;
