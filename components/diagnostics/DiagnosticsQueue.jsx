import { useState, useId } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faFilter,
  faTriangleExclamation,
  faBolt,
  faSnowflake,
  faShirt,
  faUtensils,
  faClock,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import {
  formatRM,
  formatConfidencePct,
  getConfidenceColor,
  formatTimeAgo,
} from '../../lib/diagnosticsFormatters.js';

const STATUS_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'needs_review', label: 'Needs Review' },
  { id: 'low_confidence', label: 'Low Conf.' },
  { id: 'completed', label: 'Completed' },
  { id: 'failed', label: 'Failed' },
];

function getCategoryIcon(cat) {
  const c = (cat || '').toLowerCase();
  if (c.includes('cool') || c.includes('air') || c.includes('hvac')) return faSnowflake;
  if (c.includes('laund') || c.includes('wash') || c.includes('dry')) return faShirt;
  return faUtensils;
}

export default function DiagnosticsQueue({
  items = [],
  selectedId,
  onSelect,
  filters,
  onUpdateFilters,
  isLoading,
  onRefresh,
}) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const searchInputId = useId();
  const categorySelectId = useId();
  const urgencySelectId = useId();
  const confidenceSliderId = useId();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onUpdateFilters({ search: searchInput.trim() });
  };

  const handleStatusClick = (statusId) => {
    onUpdateFilters({ status: statusId });
  };

  return (
    <aside className="diag-queue-panel ch-card" aria-label="AI Diagnostics Queue">
      <div className="diag-queue-header">
        <div className="diag-queue-title-row">
          <h2 className="diag-section-title">
            Diagnostics Queue
            <span className="diag-counter-pill">{items.length}</span>
          </h2>
          <button
            type="button"
            className="ch-btn-ghost btn-sm"
            onClick={onRefresh}
            title="Refresh queue"
            aria-label="Refresh queue"
          >
            <FontAwesomeIcon icon={faRotateRight} className={isLoading ? 'fa-spin' : ''} />
          </button>
        </div>

        {/* Status Chips */}
        <div className="diag-status-chips" role="tablist" aria-label="Filter by status">
          {STATUS_CHIPS.map((chip) => {
            const active = (filters.status || 'all') === chip.id;
            return (
              <button
                key={chip.id}
                role="tab"
                aria-selected={active}
                className={`diag-chip ${active ? 'active' : ''}`}
                onClick={() => handleStatusClick(chip.id)}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="diag-search-form">
          <div className="diag-search-input-wrap">
            <label htmlFor={searchInputId} className="visually-hidden">Search by booking number or keyword</label>
            <FontAwesomeIcon icon={faSearch} className="diag-search-icon" />
            <input
              id={searchInputId}
              type="text"
              placeholder="Search booking # or appliance..."
              className="ch-input diag-search-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </form>

        {/* Category & Urgency Selects */}
        <div className="diag-filter-row">
          <div className="diag-filter-col">
            <label htmlFor={categorySelectId} className="diag-filter-label">Category</label>
            <select
              id={categorySelectId}
              className="ch-select diag-filter-select"
              value={filters.category || 'all'}
              onChange={(e) => onUpdateFilters({ category: e.target.value })}
            >
              <option value="all">All Categories</option>
              <option value="cooling">Cooling & HVAC</option>
              <option value="laundry">Laundry Care</option>
              <option value="kitchen">Kitchen Appliances</option>
            </select>
          </div>
          <div className="diag-filter-col">
            <label htmlFor={urgencySelectId} className="diag-filter-label">Urgency</label>
            <select
              id={urgencySelectId}
              className="ch-select diag-filter-select"
              value={filters.urgency || 'all'}
              onChange={(e) => onUpdateFilters({ urgency: e.target.value })}
            >
              <option value="all">All Urgencies</option>
              <option value="emergency">Emergency</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Confidence Slider */}
        <div className="diag-slider-wrap">
          <div className="diag-slider-header">
            <label htmlFor={confidenceSliderId} className="diag-filter-label">Min Confidence</label>
            <span className="diag-slider-val">
              {Math.round((filters.minConfidence || 0) * 100)}%
            </span>
          </div>
          <input
            id={confidenceSliderId}
            type="range"
            min="0"
            max="1"
            step="0.05"
            className="diag-range-slider"
            value={filters.minConfidence || 0}
            onChange={(e) => onUpdateFilters({ minConfidence: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      {/* Queue List Items */}
      <div
        className="diag-queue-list"
        role="listbox"
        aria-label="Diagnostic cases"
        tabIndex="0"
      >
        {isLoading && items.length === 0 ? (
          <div className="diag-skeleton-list">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="diag-skeleton-item" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="diag-empty-state">
            <FontAwesomeIcon icon={faFilter} className="diag-empty-icon" />
            <p className="diag-empty-text">No diagnostics match current filters.</p>
          </div>
        ) : (
          items.map((item) => {
            const isSelected = item.id === selectedId;
            const confColor = getConfidenceColor(item.confidence);
            const isEmergency = item.suggested_urgency === 'emergency';

            return (
              <div
                key={item.id}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                className={`diag-queue-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelect(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(item.id);
                  }
                }}
              >
                <div className="diag-item-top">
                  <div className="diag-item-ref">
                    <FontAwesomeIcon
                      icon={getCategoryIcon(item.appliance_category)}
                      className="diag-cat-icon"
                      title={item.appliance_category || 'Appliance'}
                    />
                    <span className="diag-booking-mono mono">
                      {item.booking_number || item.id.slice(0, 8)}
                    </span>
                  </div>
                  <span className="diag-time-ago" title={item.created_at || ''}>
                    <FontAwesomeIcon icon={faClock} style={{ marginRight: '4px' }} />
                    {formatTimeAgo(item.created_at)}
                  </span>
                </div>

                <div className="diag-item-title">
                  <strong>{item.brand || ''} {item.model || 'Unknown Model'}</strong>
                </div>

                <div className="diag-item-cause" title={item.top_cause || 'Awaiting analysis'}>
                  {item.top_cause || 'Awaiting diagnosis classification'}
                </div>

                <div className="diag-item-bottom">
                  <div className="diag-conf-badge" style={{ borderColor: confColor }}>
                    <span className="diag-conf-dot" style={{ backgroundColor: confColor }} />
                    <span style={{ color: confColor, fontWeight: 600 }}>
                      {formatConfidencePct(item.confidence)}
                    </span>
                  </div>

                  {item.has_safety_flags && (
                    <span className="diag-badge-safety" title="Safety hazard detected">
                      <FontAwesomeIcon icon={faTriangleExclamation} /> Safety
                    </span>
                  )}

                  {isEmergency && (
                    <span className="diag-badge-emergency" title="Emergency priority">
                      <FontAwesomeIcon icon={faBolt} /> Emergency
                    </span>
                  )}

                  <div className="diag-item-cost mono">
                    {item.estimated_total_min
                      ? `${formatRM(item.estimated_total_min)} - ${formatRM(item.estimated_total_max)}`
                      : 'Est. Pending'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="diag-queue-footer">
        <span className="diag-polling-indicator">
          <span className="diag-polling-pulse" />
          Auto-sync: 15s
        </span>
      </div>
    </aside>
  );
}
