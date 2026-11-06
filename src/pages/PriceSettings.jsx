import { useDashboardStore } from '../store/useDashboardStore.js';
import SmartTable from '../components/SmartTable.jsx';

const PriceSettings = () => {
  const { globalPricing, spareParts, updateGlobalPricing, updateSparePart, addSparePart } = useDashboardStore();

  const handleAddPart = () => {
    const nextNum = String(spareParts.length + 125).padStart(3, '0');
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    addSparePart({
      sku: `PRT-${nextNum}`,
      time: nowStr,
      name: 'Universal Run Capacitor 45uF',
      category: 'HVAC',
      cost: 22.0,
      markup: 50,
      active: true,
    });
  };

  const columns = [
    { key: 'sku', label: 'Part SKU', className: 'accent-text mono' },
    { key: 'time', label: 'Time', className: 'mono' },
    { key: 'name', label: 'Component Name', sortType: 'alphabetical' },
    { key: 'category', label: 'Category', sortType: 'alphabetical' },
    {
      key: 'cost',
      label: 'Supplier Cost (RM)',
      render: (part) => (
        <input
          type="number"
          step="0.5"
          className="ch-input compact"
          value={part.cost}
          onChange={(e) => updateSparePart(part.sku, { cost: parseFloat(e.target.value) || 0 })}
        />
      ),
    },
    {
      key: 'markup',
      label: 'Markup (%)',
      render: (part) => (
        <input
          type="number"
          step="1"
          className="ch-input compact"
          value={part.markup}
          onChange={(e) => updateSparePart(part.sku, { markup: parseFloat(e.target.value) || 0 })}
        />
      ),
    },
    {
      key: 'finalPrice',
      label: 'Final Retail Price',
      getValue: (part) => part.cost * (1 + part.markup / 100),
      render: (part) => {
        const finalPrice = part.cost * (1 + part.markup / 100);
        return <span className="mono green-text">RM {finalPrice.toFixed(2)}</span>;
      },
    },
    {
      key: 'action',
      label: 'Action',
      sortable: false,
      render: (part) => (
        <span className="ch-static-action-badge">
          {part.active ? 'Catalog Synced' : 'Archived'}
        </span>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>Price Settings & Spare Parts Matrix</h1>
          <p className="subtitle">Changes sync immediately with the AI Copilot and customer quote engine.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="ch-card">
          <span className="kpi-label">Base Diagnostic Fee (RM)</span>
          <input
            type="number"
            step="1"
            className="ch-input large-Input"
            value={globalPricing.diagnosticFee}
            onChange={(e) => updateGlobalPricing({ diagnosticFee: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="ch-card">
          <span className="kpi-label">Standard Labor Rate (RM / Hour)</span>
          <input
            type="number"
            step="1"
            className="ch-input large-Input"
            value={globalPricing.laborRate}
            onChange={(e) => updateGlobalPricing({ laborRate: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="ch-card">
          <span className="kpi-label">Emergency Surge Multiplier (x)</span>
          <input
            type="number"
            step="0.1"
            className="ch-input large-Input"
            value={globalPricing.emergencyMultiplier}
            onChange={(e) => updateGlobalPricing({ emergencyMultiplier: parseFloat(e.target.value) || 1 })}
          />
        </div>
      </div>

      <div className="ch-card" style={{ padding: 0, overflow: 'hidden' }}>
        <SmartTable
          columns={columns}
          data={spareParts}
          rowKey="sku"
          defaultSortKey="sku"
          onAddNew={handleAddPart}
          addNewLabel="+ Add New Part SKU"
          searchPlaceholder="Search SKU, part name, category, or time..."
          maxHeight="460px"
        />
      </div>
    </div>
  );
};

export default PriceSettings; 