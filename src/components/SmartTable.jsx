import { useState, useMemo } from 'react';

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

const SmartTable = ({
  columns,
  data,
  rowKey = 'id',
  defaultSortKey = '',
  defaultSortOrder = 'asc',
  searchPlaceholder = 'Search records...',
  maxHeight = '420px',
  onAddNew = null,
  addNewLabel = '+ Add New',
}) => {
  const sortableColumns = useMemo(
    () => columns.filter((col) => col.sortable !== false && col.key !== 'action' && col.key !== 'actions'),
    [columns]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState(defaultSortKey || sortableColumns[0]?.key || '');
  const [sortOrder, setSortOrder] = useState(defaultSortOrder);

  const handleCategoryClick = (col) => {
    if (col.sortable === false || col.key === 'action' || col.key === 'actions') return;
    if (sortKey === col.key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(col.key);
      setSortOrder('asc');
    }
  };

  const processedData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = data.filter((row) => {
      if (!query) return true;
      return columns.some((col) => {
        const rawVal = col.getValue ? col.getValue(row) : row[col.key];
        return String(rawVal ?? '').toLowerCase().includes(query);
      });
    });

    if (!sortKey) return filtered;
    const activeCol = columns.find((c) => c.key === sortKey);
    if (!activeCol || activeCol.sortable === false) return filtered;

    return [...filtered].sort((a, b) => {
      const rawA = activeCol.getValue ? activeCol.getValue(a) : a[sortKey];
      const rawB = activeCol.getValue ? activeCol.getValue(b) : b[sortKey];

      const valA = extractComparableValue(rawA, activeCol.sortType);
      const valB = extractComparableValue(rawB, activeCol.sortType);

      let comparison = 0;
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
  }, [data, columns, searchQuery, sortKey, sortOrder]);

  return (
    <div className="ch-table-scroll-container" style={{ maxHeight }}>
      <table className="ch-table">
        <thead>
          {/* TOP CONTROL ROW ABOVE CATEGORY ROW: Searchbar + Add New + Sort By + Asc/Desc */}
          <tr className="ch-table-control-row">
            <th colSpan={columns.length}>
              <div className="ch-table-toolbar">
                <div className="ch-toolbar-left">
                  <div className="ch-toolbar-search">
                    <span className="ch-search-icon">
                      <i className="fa-solid fa-magnifying-glass" style={{ color: 'rgb(255, 255, 255)' }}></i>
                    </span>
                    <input
                      type="text"
                      className="ch-input toolbar-input ch-table-search-input"
                      placeholder={searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="ch-clear-search"
                        onClick={() => setSearchQuery('')}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn-small ch-add-new-btn"
                    onClick={
                      onAddNew ||
                      (() => {
                        window.dispatchEvent(
                          new CustomEvent('cyberhub-toast', {
                            detail: { message: 'Quick Add entry dialog initialized.' },
                          })
                        );
                      })
                    }
                  >
                    {addNewLabel}
                  </button>
                </div>

                <div className="ch-toolbar-sort">
                  <span className="ch-toolbar-label">Sort by:</span>
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
                  >
                    {sortOrder === 'asc' ? '▲ Ascending' : '▼ Descending'}
                  </button>
                </div>
              </div>
            </th>
          </tr>

          {/* CATEGORY HEADER ROW (Click once = Ascending ▲, Click again = Descending ▼) */}
          <tr className="ch-table-category-row">
            {columns.map((col) => {
              const isActionCol = col.key === 'action' || col.key === 'actions' || col.sortable === false;
              const isActive = sortKey === col.key;
              return (
                <th
                  key={col.key}
                  onClick={() => handleCategoryClick(col)}
                  className={!isActionCol ? 'ch-sortable-th' : 'ch-non-interactive-th'}
                >
                  <div className="ch-th-content">
                    <span>{col.label}</span>
                    {!isActionCol && (
                      <span className={`ch-sort-arrow ${isActive ? 'active' : ''}`}>
                        {isActive ? (sortOrder === 'asc' ? '▲' : '▼') : '▲▼'}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {processedData.map((row, idx) => (
            <tr key={row[rowKey] || idx}>
              {columns.map((col) => {
                const isActionCol = col.key === 'action' || col.key === 'actions';
                return (
                  <td
                    key={col.key}
                    className={`${col.className || ''} ${isActionCol ? 'ch-non-interactive-td' : ''}`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                );
              })}
            </tr>
          ))}
          {processedData.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '28px', color: '#9ca3af' }}>
                No matching records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SmartTable;