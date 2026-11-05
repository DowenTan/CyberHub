import { useState, useMemo } from 'react';

const extractComparableValue = (val, forceAlphabetical = false) => {
  if (val === null || val === undefined) return '';
  if (forceAlphabetical) return String(val).trim().toLowerCase();
  if (typeof val === 'number') return val;

  const str = String(val).trim();
  const cleanedNumber = str.replace(/^(RM|x|\$|★)\s*/i, '').replace(/[%$,]/g, '').trim();
  if (cleanedNumber !== '' && !Number.isNaN(Number(cleanedNumber)) && /^[-+]?\d+(\.\d+)?$/.test(cleanedNumber)) {
    return Number(cleanedNumber);
  }
  return str.toLowerCase();
};

const SmartTable = ({
  columns,
  data,
  rowKey = 'id',
  defaultSortKey = 'createdAt',
  defaultSortOrder = 'desc',
  searchPlaceholder = 'Search records...',
  maxHeight = '460px',
  onAddNew,
  addNewLabel = '+ Add New',
}) => {
  const sortableColumns = useMemo(
    () => columns.filter((col) => col.sortable !== false),
    [columns]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState(defaultSortKey || sortableColumns[0]?.key || '');
  const [sortOrder, setSortOrder] = useState(defaultSortOrder);

  // Click category header once -> Ascending (▲), click again -> Descending (▼)
  const handleCategoryClick = (colKey, isSortable = true) => {
    if (!isSortable) return;
    if (sortKey === colKey) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(colKey);
      setSortOrder('asc');
    }
  };

  const processedData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // 1. Filter rows by search query
    const filtered = data.filter((row) => {
      if (!query) return true;
      return columns.some((col) => {
        const rawVal = col.getValue ? col.getValue(row) : row[col.key];
        return String(rawVal ?? '').toLowerCase().includes(query);
      });
    });

    // 2. Sort rows by selected column & direction
    if (!sortKey) return filtered;
    const activeCol = columns.find((c) => c.key === sortKey);
    if (!activeCol || activeCol.sortable === false) return filtered;

    return [...filtered].sort((a, b) => {
      const rawA = activeCol.getValue ? activeCol.getValue(a) : a[sortKey];
      const rawB = activeCol.getValue ? activeCol.getValue(b) : b[sortKey];

      if (activeCol.alphabetical) {
        const strA = String(rawA ?? '').trim().toLowerCase();
        const strB = String(rawB ?? '').trim().toLowerCase();
        const cmp = strA.localeCompare(strB, undefined, { sensitivity: 'base' });
        return sortOrder === 'asc' ? cmp : -cmp;
      }

      const valA = extractComparableValue(rawA);
      const valB = extractComparableValue(rawB);

      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
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
          {/* TOP ROW ABOVE CATEGORY HEADERS: Searchbar + Add New + Sort By (Time, etc.) + Asc/Desc */}
          <tr className="ch-table-control-row">
            <th colSpan={columns.length}>
              <div className="ch-table-toolbar">
                <div className="ch-toolbar-left">
                  <div className="ch-toolbar-search">
                    <span className="ch-search-icon">🔍</span>
                    <input
                      type="text"
                      className="ch-input toolbar-input"
                      placeholder={searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="ch-clear-search"
                        onClick={() => setSearchQuery('')}
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {onAddNew && (
                    <button type="button" className="btn-small ch-add-new-btn" onClick={onAddNew}>
                      {addNewLabel}
                    </button>
                  )}
                </div>

                <div className="ch-toolbar-sort">
                  <span className="ch-toolbar-label">Sort By:</span>
                  <select
                    className="ch-select toolbar-select"
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

          {/* CATEGORY HEADER ROW WITH CLICK SORT & RIGHT-SIDE ARROW */}
          <tr className="ch-table-category-row">
            {columns.map((col) => {
              const isSortable = col.sortable !== false;
              const isActive = sortKey === col.key;
              return (
                <th
                  key={col.key}
                  onClick={() => handleCategoryClick(col.key, isSortable)}
                  className={isSortable ? 'ch-sortable-th' : 'ch-non-sortable-th'}
                >
                  <div className="ch-th-content">
                    <span>{col.label}</span>
                    {isSortable && (
                      <span className={`ch-sort-arrow ${isActive ? 'active' : ''}`}>
                        {isActive ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}
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
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`${col.className || ''} ${col.isAction ? 'ch-action-cell-disabled' : ''}`}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
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