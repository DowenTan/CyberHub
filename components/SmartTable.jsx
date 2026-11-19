import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { buildTableCatalogue } from '../lib/tableCatalogue.js';
import { queryTableNaturalLanguage } from '../lib/api.js';

const extractComparableValue = (val, sortType) => {
  if (val === null || val === undefined) return '';
  if (sortType === 'alphabetical') {
    return String(val).trim().toLowerCase();
  }
  if (typeof val === 'number') return val;
  const str = String(val).trim();
  const cleanedNumber = str.replace(/^(RM|x|\$|★)\s*/i, '').replace(/[%$,]/g, '');
  if (cleanedNumber !== '' && !Number.isNaN(Number(cleanedNumber)) && /^[-+]?\d+(\.\d+)?$/.test(cleanedNumber)) {
    return Number(cleanedNumber);
  }
  return str.toLowerCase();
};

const parseWidth = (w, defaultVal = 130) => {
  if (!w) return defaultVal;
  if (typeof w === 'number') return w;
  const num = parseInt(String(w).replace(/\D/g, ''), 10);
  return Number.isNaN(num) || num <= 0 ? defaultVal : num;
};

const SmartTable = ({
  columns,
  data = [],
  rowKey = 'id',
  tableId = 'smart_table',
  enableAiFilter = true,
  defaultSortKey = '',
  defaultSortOrder = 'asc',
  searchPlaceholder = 'Search records...',
  maxHeight = 'calc(100vh - 290px)',
  showIndex = true,
  onAddNew = null,
  addNewLabel = '+ Add New',
  defaultRowsPerPage = 25,
  initialLayoutView = 'standard',
  onLayoutChange = null,
  onRowClick = null,
  selectedRowKey = null,
}) => {
  const [layoutView, setLayoutView] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const tableKey = rowKey ? `cyberhub_layout_view_${rowKey}` : null;
        const savedSpecific = tableKey ? localStorage.getItem(tableKey) : null;
        if (savedSpecific === 'standard' || savedSpecific === 'compact') return savedSpecific;
        const savedGlobal = localStorage.getItem('cyberhub_layout_view');
        if (savedGlobal === 'standard' || savedGlobal === 'compact') return savedGlobal;
      } catch {
        // ignore storage access issues
      }
    }
    return initialLayoutView;
  });

  const handleToggleLayoutView = () => {
    const next = layoutView === 'compact' ? 'standard' : 'compact';
    setLayoutView(next);
    if (typeof window !== 'undefined') {
      try {
        if (rowKey) localStorage.setItem(`cyberhub_layout_view_${rowKey}`, next);
        localStorage.setItem('cyberhub_layout_view', next);
      } catch {
        // ignore storage access issues
      }
    }
    if (onLayoutChange) onLayoutChange(next);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState(defaultSortOrder);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  // D3 "Ask the Table" Natural Language Filter State
  const aiInputRef = useRef(null);
  const [aiQueryInput, setAiQueryInput] = useState('');
  const [isAiQuerying, setIsAiQuerying] = useState(false);
  const [activeAiFilters, setActiveAiFilters] = useState([]);
  const [aiInterpretation, setAiInterpretation] = useState('');
  const [aiClarification, setAiClarification] = useState(null);

  // Keyboard shortcut: Press '/' to focus AI filter input
  useEffect(() => {
    if (!enableAiFilter) return;
    const handleKeyDown = (e) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName) &&
        !e.target?.isContentEditable
      ) {
        e.preventDefault();
        aiInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableAiFilter]);

  // Filter columns based on Standard View vs Compact View
  const activeColumns = useMemo(() => {
    const rawCols = typeof columns === 'function' ? columns(layoutView) : columns;
    if (layoutView === 'standard') {
      return rawCols.filter((col) => !col.hideInStandard);
    }
    return rawCols;
  }, [columns, layoutView]);

  const sortableColumns = useMemo(
    () => activeColumns.filter((col) => col.sortable !== false && col.key !== 'action' && col.key !== 'actions'),
    [activeColumns]
  );

  const [sortKey, setSortKey] = useState(defaultSortKey || sortableColumns[0]?.key || '');

  // Column Width Management (Excel / Sheets draggable handles)
  const initialColumnWidths = useMemo(() => {
    const map = {};
    activeColumns.forEach((c) => {
      map[c.key] = parseWidth(c.width, 130);
    });
    return map;
  }, [activeColumns]);

  const [columnWidths, setColumnWidths] = useState(initialColumnWidths);

  useEffect(() => {
    setColumnWidths(initialColumnWidths);
  }, [initialColumnWidths]);

  const handleResetColumnWidths = useCallback(() => {
    setColumnWidths(initialColumnWidths);
  }, [initialColumnWidths]);

  const handleMouseDownResize = useCallback((colKey, e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[colKey] || 130;

    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(60, startWidth + delta);
      setColumnWidths((prev) => ({
        ...prev,
        [colKey]: newWidth,
      }));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [columnWidths]);

  const handleCategoryClick = (col) => {
    if (col.sortable === false || col.key === 'action' || col.key === 'actions') return;
    if (sortKey === col.key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(col.key);
      setSortOrder('asc');
    }
  };

  // Catalogue of metadata for AI query (no row data or PII)
  const tableCatalogue = useMemo(() => {
    return buildTableCatalogue(columns, tableId);
  }, [columns, tableId]);

  const handleExecuteAiQuery = async (queryText = aiQueryInput) => {
    const text = (queryText || '').trim();
    if (!text) return;
    setIsAiQuerying(true);
    setAiClarification(null);
    try {
      const res = await queryTableNaturalLanguage(tableId, text, tableCatalogue);
      if (res && Array.isArray(res.filters) && res.filters.length > 0) {
        setActiveAiFilters((prev) => {
          const newKeys = new Set(res.filters.map((f) => `${f.column}-${f.op}`));
          const kept = prev.filter((f) => !newKeys.has(`${f.column}-${f.op}`));
          const timestamp = Date.now();
          return [
            ...kept,
            ...res.filters.map((f, idx) => ({ ...f, id: `${f.column}_${timestamp}_${idx}` })),
          ];
        });
        setAiInterpretation(res.interpretation || `Filtered by "${text}"`);
        setAiQueryInput('');
        setPage(1);
      } else {
        setAiInterpretation(res?.interpretation || `No matching filter found for "${text}"`);
      }
      if (res && Array.isArray(res.ambiguities) && res.ambiguities.length > 0) {
        setAiClarification(res.ambiguities[0]);
      }
    } catch (err) {
      console.error('Error executing AI table query:', err);
      setAiInterpretation('Could not parse natural language filter.');
    } finally {
      setIsAiQuerying(false);
    }
  };

  const handleRemoveAiFilter = (filterId) => {
    setActiveAiFilters((prev) => prev.filter((f) => f.id !== filterId));
  };

  const handleClearAllAiFilters = () => {
    setActiveAiFilters([]);
    setAiInterpretation('');
    setAiClarification(null);
  };

  // Filter & Sort
  const processedData = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    const query = searchQuery.trim().toLowerCase();

    const filtered = list.filter((row) => {
      // 1. Text Search Filter
      if (query) {
        const matchesQuery = activeColumns.some((col) => {
          const rawVal = col.getValue ? col.getValue(row) : row[col.key];
          return String(rawVal ?? '').toLowerCase().includes(query);
        });
        if (!matchesQuery) return false;
      }

      // 2. Structured AI Filters
      if (activeAiFilters.length > 0) {
        for (const filter of activeAiFilters) {
          const col = activeColumns.find((c) => c.key === filter.column) || { key: filter.column };
          const rawVal = col.getValue ? col.getValue(row) : row[filter.column];
          const valStr = String(rawVal ?? '').trim().toLowerCase();
          const targetStr = String(filter.value ?? '').trim().toLowerCase();

          switch (filter.op) {
            case 'eq':
            case 'equals':
              if (valStr !== targetStr) return false;
              break;
            case 'neq':
              if (valStr === targetStr) return false;
              break;
            case 'contains':
              if (!valStr.includes(targetStr)) return false;
              break;
            case 'in': {
              const allowed = Array.isArray(filter.value)
                ? filter.value.map((v) => String(v).trim().toLowerCase())
                : String(filter.value).split(',').map((s) => s.trim().toLowerCase());
              if (!allowed.some((item) => valStr === item || valStr.includes(item))) return false;
              break;
            }
            case 'gt': {
              const numVal = extractComparableValue(rawVal, 'numeric');
              const numTarget = Number(filter.value);
              if (typeof numVal !== 'number' || numVal <= numTarget) return false;
              break;
            }
            case 'gte': {
              const numVal = extractComparableValue(rawVal, 'numeric');
              const numTarget = Number(filter.value);
              if (typeof numVal !== 'number' || numVal < numTarget) return false;
              break;
            }
            case 'lt': {
              const numVal = extractComparableValue(rawVal, 'numeric');
              const numTarget = Number(filter.value);
              if (typeof numVal !== 'number' || numVal >= numTarget) return false;
              break;
            }
            case 'lte': {
              const numVal = extractComparableValue(rawVal, 'numeric');
              const numTarget = Number(filter.value);
              if (typeof numVal !== 'number' || numVal > numTarget) return false;
              break;
            }
            case 'on': {
              const rowDate = String(rawVal ?? '').slice(0, 10);
              if (rowDate !== String(filter.value).slice(0, 10)) return false;
              break;
            }
            case 'before': {
              const rowDate = String(rawVal ?? '').slice(0, 10);
              if (rowDate >= String(filter.value).slice(0, 10)) return false;
              break;
            }
            case 'after': {
              const rowDate = String(rawVal ?? '').slice(0, 10);
              if (rowDate <= String(filter.value).slice(0, 10)) return false;
              break;
            }
            case 'between': {
              const rowDate = String(rawVal ?? '').slice(0, 10);
              const parts = String(filter.value).split(',');
              if (parts.length === 2) {
                const [start, end] = parts;
                if (rowDate < start || rowDate > end) return false;
              }
              break;
            }
            default:
              if (!valStr.includes(targetStr)) return false;
          }
        }
      }

      return true;
    });

    if (!sortKey) return filtered;
    const activeCol = activeColumns.find((c) => c.key === sortKey);
    if (!activeCol || activeCol.sortable === false) return filtered;

    return [...filtered].sort((a, b) => {
      const rawA = activeCol.getValue ? activeCol.getValue(a) : a[sortKey];
      const rawB = activeCol.getValue ? activeCol.getValue(b) : b[sortKey];

      const valA = extractComparableValue(rawA, activeCol.sortType);
      const valB = extractComparableValue(rawB, activeCol.sortType);

      let comparison;
      const isAlphabetical =
        activeCol.sortType === 'alphabetical' ||
        /appliance|issue|customer|tech|desc|name|sku|part|client/i.test(activeCol.key) ||
        /appliance|issue|customer|tech|desc|name|sku|part|client/i.test(activeCol.label);

      if (isAlphabetical) {
        comparison = String(valA).localeCompare(String(valB), 'en', { sensitivity: 'base' });
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [data, activeColumns, searchQuery, activeAiFilters, sortKey, sortOrder]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(processedData.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    if (rowsPerPage === 'all') return processedData;
    const start = (currentPage - 1) * rowsPerPage;
    return processedData.slice(start, start + rowsPerPage);
  }, [processedData, currentPage, rowsPerPage]);

  // Height Tuning: Increased height to reach the bottom of the page while keeping table wrapper within viewport boundary
  const scrollContainerStyle = {
    maxHeight: maxHeight || 'calc(100vh - 220px)',
    minHeight: '260px',
    overflowY: 'auto',
    overflowX: 'auto',
    boxSizing: 'border-box',
  };

  return (
    <div className="orders-table-wrapper" style={{ maxHeight: 'calc(100vh - 120px)', height: 'auto', overflow: 'visible', boxSizing: 'border-box' }}>
      {/* 1. TOP CONTROL TOOLBAR: Search, Add New, Reset Widths, Sort By, Rows per Table, Layout View */}
      <div className="ch-table-toolbar" style={{ marginBottom: '10px' }}>
        <div className="ch-toolbar-left" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div className="ch-toolbar-search">
            <span className="ch-search-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff7300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className="ch-input toolbar-input ch-table-search-input"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="ch-clear-search"
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* D3 Natural Language Filter Command Bar */}
          {enableAiFilter && (
            <div className="ch-ai-filter-bar" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255, 115, 0, 0.05)',
                  border: '1px solid rgba(255, 115, 0, 0.35)',
                  borderRadius: '6px',
                  padding: '0 4px 0 8px',
                  height: '32px',
                  boxSizing: 'border-box',
                }}
              >
                <span
                  style={{ display: 'flex', alignItems: 'center', marginRight: '6px', color: '#ff7300' }}
                  title="Ask the table (Natural Language AI Filter)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </span>
                <input
                  ref={aiInputRef}
                  type="text"
                  className="ch-input"
                  placeholder='Ask table (e.g. "urgent in Cheras")... [/]'
                  value={aiQueryInput}
                  onChange={(e) => setAiQueryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleExecuteAiQuery();
                    }
                  }}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    width: '210px',
                    padding: 0,
                  }}
                />
                {aiQueryInput && (
                  <button
                    type="button"
                    onClick={() => setAiQueryInput('')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '0 4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                    title="Clear query"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleExecuteAiQuery()}
                  disabled={isAiQuerying || !aiQueryInput.trim()}
                  style={{
                    background: aiQueryInput.trim() ? '#ff7300' : 'rgba(255, 115, 0, 0.2)',
                    color: aiQueryInput.trim() ? '#051340' : '#888',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: aiQueryInput.trim() ? 'pointer' : 'default',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginLeft: '4px',
                    transition: 'all 0.2s ease',
                  }}
                  title="Apply Natural Language Filter (Enter)"
                >
                  {isAiQuerying ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin">
                      <line x1="12" y1="2" x2="12" y2="6"></line>
                      <line x1="12" y1="18" x2="12" y2="22"></line>
                      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                      <line x1="2" y1="12" x2="6" y2="12"></line>
                      <line x1="18" y1="12" x2="22" y2="12"></line>
                    </svg>
                  ) : (
                    'Ask'
                  )}
                </button>
              </div>
            </div>
          )}

          {onAddNew && (
            <button
              type="button"
              className="btn-small ch-add-new-btn"
              onClick={onAddNew}
            >
              {addNewLabel}
            </button>
          )}

          {/* Reset Column Widths Button */}
          <div className="ch-toolbar-reset-widths">
            <button
              type="button"
              className="btn-small outline ch-reset-columns-btn"
              onClick={handleResetColumnWidths}
              title="Reset all column widths to default"
            >
              ↺ Reset Widths
            </button>
          </div>
        </div>

        <div className="ch-toolbar-sort" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Sort By controls */}
          <span className="ch-toolbar-label" style={{ fontSize: '11px', color: '#9ca3af' }}>Sort by:</span>
          <select
            className="ch-select toolbar-select ch-sort-select"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
          >
            {sortableColumns.map((col) => (
              <option key={col.key} value={col.key}>
                {col.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn-small outline ch-order-toggle"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            title="Toggle sort direction"
          >
            {sortOrder === 'asc' ? '▲ Asc' : '▼ Desc'}
          </button>

          <span
            style={{
              fontSize: '11px',
              color: '#b8c4db',
              background: 'rgba(255, 115, 0, 0.12)',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 115, 0, 0.25)',
              whiteSpace: 'nowrap',
            }}
          >
            {processedData.length} records
          </span>

          {/* Rows per table on top (right side of sort by) */}
          <div className="ch-toolbar-pagination" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="ch-toolbar-label" style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap' }}>Rows:</span>
            <select
              className="ch-select ch-per-page-select"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
              title="Rows per table"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Layout view toggle at rightmost (right side of rows per table) */}
          <div
            className="ch-toolbar-layout-view"
            style={{ display: 'flex', alignItems: 'center', marginLeft: '4px' }}
          >
            <button
              type="button"
              className="ch-view-icon-select-btn"
              onClick={handleToggleLayoutView}
              title={`Layout View: ${layoutView === 'compact' ? 'Compact View' : 'Standard View'} (Click to switch to ${layoutView === 'compact' ? 'Standard' : 'Compact'} View)`}
              style={{
                width: '36px',
                height: '32px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#051340',
                border: '1px solid rgba(255, 115, 0, 0.45)',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#ff7300',
                padding: 0,
                transition: 'all 0.2s ease',
              }}
            >
              {layoutView === 'compact' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Active AI Filter Chips Bar */}
      {(activeAiFilters.length > 0 || aiInterpretation || aiClarification) && (
        <div
          className="ch-active-ai-chips-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '10px',
            padding: '6px 12px',
            background: 'rgba(5, 19, 64, 0.65)',
            borderRadius: '6px',
            border: '1px solid rgba(255, 115, 0, 0.3)',
            fontSize: '11px',
            minHeight: '32px',
            boxSizing: 'border-box',
          }}
        >
          <span style={{ color: '#ff7300', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Active Filters:
          </span>

          {activeAiFilters.map((f) => {
            const colDef = activeColumns.find((c) => c.key === f.column);
            const colLabel = colDef?.label || f.column;
            const opDisplay =
              f.op === 'eq' || f.op === 'equals' ? '=' :
              f.op === 'neq' ? '≠' :
              f.op === 'in' ? 'in' :
              f.op === 'contains' ? 'contains' :
              f.op === 'gt' ? '>' :
              f.op === 'gte' ? '≥' :
              f.op === 'lt' ? '<' :
              f.op === 'lte' ? '≤' :
              f.op === 'on' ? 'on' :
              f.op === 'between' ? 'between' : f.op;
            return (
              <span
                key={f.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 115, 0, 0.15)',
                  color: '#fdba74',
                  border: '1px solid rgba(255, 115, 0, 0.4)',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '11px',
                }}
              >
                <strong style={{ color: '#fff' }}>{colLabel}</strong> {opDisplay} &quot;{String(f.value)}&quot;
                <button
                  type="button"
                  onClick={() => handleRemoveAiFilter(f.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#f97316',
                    cursor: 'pointer',
                    padding: '0 2px',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                  title="Remove this filter"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </span>
            );
          })}

          {aiInterpretation && (
            <span style={{ color: '#94a3b8', fontStyle: 'italic', marginLeft: '4px' }}>
              ({aiInterpretation})
            </span>
          )}

          {aiClarification && (
            <span style={{ color: '#fbbf24', marginLeft: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              {aiClarification.prompt || `Did you mean ${aiClarification.suggested_column}?`}
            </span>
          )}

          {activeAiFilters.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllAiFilters}
              style={{
                background: 'none',
                border: 'none',
                color: '#f87171',
                cursor: 'pointer',
                fontSize: '11px',
                textDecoration: 'underline',
                marginLeft: 'auto',
                padding: '2px 4px',
              }}
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* 2. SCROLLABLE TABLE BODY CONTAINER (Internal Scrollbar ONLY, Taller Height) */}
      <div className="ch-table-scroll-container" style={scrollContainerStyle}>
        <table className={`ch-table orders-table view-${layoutView}`} style={{ width: 'max-content', minWidth: '100%', tableLayout: 'fixed' }}>
          <thead>
            {/* CATEGORY HEADER ROW with Sticky Positioning & Resizer Handles */}
            <tr className="ch-table-category-row">
              {showIndex && (
                <th
                  className="ch-index-th"
                  style={{
                    width: '46px',
                    minWidth: '46px',
                    maxWidth: '46px',
                    textAlign: 'center',
                    color: '#ff7300',
                    fontWeight: 700,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    background: '#051340',
                  }}
                >
                  #
                </th>
              )}
              {activeColumns.map((col) => {
                const isActionCol = col.key === 'action' || col.key === 'actions' || col.sortable === false;
                const isActive = sortKey === col.key;
                const colWidth = columnWidths[col.key] || 130;
                const colStyle = {
                  width: `${colWidth}px`,
                  minWidth: `${colWidth}px`,
                  maxWidth: `${colWidth}px`,
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  background: '#051340',
                  boxSizing: 'border-box',
                };
                return (
                  <th
                    key={col.key}
                    onClick={() => handleCategoryClick(col)}
                    className={`${col.className || ''} ${!isActionCol ? 'ch-sortable-th' : 'ch-action-th'}`}
                    style={colStyle}
                  >
                    <div className="ch-th-content" style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span>{col.label}</span>
                      {!isActionCol && (
                        <span className={`ch-sort-arrow ${isActive ? 'active' : ''}`} style={{ fontSize: '10px' }}>
                          {isActive ? (sortOrder === 'asc' ? '▲' : '▼') : '▲▼'}
                        </span>
                      )}
                    </div>
                    {/* Draggable Column Resizer Handle */}
                    <div
                      className="ch-col-resizer"
                      onMouseDown={(e) => handleMouseDownResize(col.key, e)}
                      onClick={(e) => e.stopPropagation()}
                      title="Drag to resize column"
                    />
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((row, idx) => {
              const displayIndex = (currentPage - 1) * (typeof rowsPerPage === 'number' ? rowsPerPage : 0) + idx + 1;
              const currentRowKey = row[rowKey] || row.id || row.code || row.sku || idx;
              const isSelected = Boolean(
                selectedRowKey && (
                  selectedRowKey === currentRowKey ||
                  selectedRowKey === row.id ||
                  selectedRowKey === row.code ||
                  selectedRowKey === row.sku
                )
              );
              return (
                <tr
                  key={currentRowKey}
                  onClick={(e) => {
                    if (e.target.closest('button, input, select, a, .ch-col-resizer, .table-action-btns')) return;
                    if (onRowClick) onRowClick(row);
                  }}
                  className={`orders-table-row ${isSelected ? 'selected-row' : ''}`}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {showIndex && (
                    <td
                      className="ch-index-td"
                      style={{
                        width: '46px',
                        minWidth: '46px',
                        maxWidth: '46px',
                        textAlign: 'center',
                        color: '#ff7300',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                      }}
                    >
                      {displayIndex}
                    </td>
                  )}
                  {activeColumns.map((col) => {
                    const isActionCol = col.key === 'action' || col.key === 'actions';
                    const colWidth = columnWidths[col.key] || 130;
                    const cellStyle = {
                      width: `${colWidth}px`,
                      minWidth: `${colWidth}px`,
                      maxWidth: `${colWidth}px`,
                      boxSizing: 'border-box',
                    };
                    return (
                      <td
                        key={col.key}
                        className={`${col.className || ''} ${isActionCol ? 'ch-action-td' : ''}`}
                        style={cellStyle}
                      >
                        {col.render ? col.render(row, idx, layoutView) : row[col.key]}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {processedData.length === 0 && (
              <tr>
                <td
                  colSpan={activeColumns.length + (showIndex ? 1 : 0)}
                  style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}
                >
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 3. PAGINATION AT BOTTOM LEFT */}
      <div className="ch-table-bottom-bar" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', width: '100%', padding: '10px 0 2px 0', marginTop: '6px' }}>
        <div className="ch-pagination-nav">
          <button
            type="button"
            className="btn-small outline ch-prev-page"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            title="Previous Page"
          >
            ‹ Prev
          </button>

          <span className="ch-page-label">
            Page {currentPage} of {totalPages} ({processedData.length} records)
          </span>

          <button
            type="button"
            className="btn-small outline ch-next-page"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            title="Next Page"
          >
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartTable;
