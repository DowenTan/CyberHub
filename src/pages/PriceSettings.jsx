import { useState } from 'react';
import { useDashboardStore } from '../store/useDashboardStore.js';

const PriceSettings = () => {
  const { globalPricing, spareParts, updateGlobalPricing, updateSparePart, addSparePart } =
    useDashboardStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [savedBanner, setSavedBanner] = useState(false);

  const filteredParts = spareParts.filter(
    (p) =>
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveAll = () => {
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2000);
  };

  const handleAddPart = () => {
    const nextNum = String(spareParts.length + 109).padStart(3, '0');
    addSparePart({
      sku: `PRT-${nextNum}`,
      name: 'Universal Capacitor 45uF',
      category: 'HVAC',
      cost: 22.0,
      markup: 50,
      active: true,
    });
  };

  return (
    <>
      <div className="main-header-line">
        <div>
          <h1>Price Settings & Spare Parts Matrix</h1>
          <p className="header-subtitle" style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>
            Configure base diagnostic rates, labor multipliers, and OEM spare part markups.
          </p>
        </div>
        <div className="order-controls" style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-outline" onClick={handleAddPart}>
            + Add New Part SKU
          </button>
          <button className="action-button" onClick={handleSaveAll} style={{ background: '#ff7300', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
            {savedBanner ? '✓ Saved All Changes!' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Global Pricing Cards (.setting-card & .price-input) */}
      <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="setting-card ch-card">
          <span className="kpi-label">Base Diagnostic Fee (RM)</span>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', gap: '8px' }}>
            <span style={{ color: '#9ca3af', fontWeight: 600 }}>RM</span>
            <input
              type="number"
              step="0.50"
              className="price-input ch-input"
              value={globalPricing.diagnosticFee}
              onChange={(e) => updateGlobalPricing({ diagnosticFee: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <small style={{ color: '#9ca3af', fontSize: '11px', display: 'block', marginTop: '8px' }}>
            Mandatory inspection fee applied to all new bookings.
          </small>
        </div>

        <div className="setting-card ch-card">
          <span className="kpi-label">Standard Labor Rate (RM / hr)</span>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', gap: '8px' }}>
            <span style={{ color: '#9ca3af', fontWeight: 600 }}>RM</span>
            <input
              type="number"
              step="1.00"
              className="price-input ch-input"
              value={globalPricing.laborRate}
              onChange={(e) => updateGlobalPricing({ laborRate: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <small style={{ color: '#9ca3af', fontSize: '11px', display: 'block', marginTop: '8px' }}>
            Hourly technician workmanship rate used by AI Estimator.
          </small>
        </div>

        <div className="setting-card ch-card">
          <span className="kpi-label">Emergency Surge Multiplier (x)</span>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', gap: '8px' }}>
            <span style={{ color: '#9ca3af', fontWeight: 600 }}>x</span>
            <input
              type="number"
              step="0.1"
              className="price-input ch-input"
              value={globalPricing.emergencyMultiplier}
              onChange={(e) => updateGlobalPricing({ emergencyMultiplier: parseFloat(e.target.value) || 1.0 })}
            />
          </div>
          <small style={{ color: '#9ca3af', fontSize: '11px', display: 'block', marginTop: '8px' }}>
            Applied to urgent same-day / after-hours repair dispatches.
          </small>
        </div>
      </div>

      {/* Spare Parts Catalog Table (#partsTable) */}
      <div className="ch-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>OEM Spare Parts Pricing Matrix</h3>
          <input
            type="text"
            placeholder="Search SKU or part name..."
            className="ch-input"
            style={{ width: '240px', marginTop: 0 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <table id="partsTable" className="ch-table">
          <thead>
            <tr>
              <th>Part SKU</th>
              <th>Part Name</th>
              <th>Category</th>
              <th>Supplier Cost (RM)</th>
              <th>Markup (%)</th>
              <th>Final Price (RM)</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {filteredParts.map((part) => {
              const finalPrice = part.cost + part.cost * (part.markup / 100);
              return (
                <tr key={part.sku}>
                  <td className="order-id accent-text mono">{part.sku}</td>
                  <td>{part.name}</td>
                  <td>{part.category}</td>
                  <td>
                    <input
                      type="number"
                      step="0.50"
                      className="cost-input ch-input compact"
                      value={part.cost}
                      onChange={(e) =>
                        updateSparePart(part.sku, { cost: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="1"
                      className="markup-input ch-input compact"
                      value={part.markup}
                      onChange={(e) =>
                        updateSparePart(part.sku, { markup: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </td>
                  <td className="mono green-text">
                    RM <span className="final-price">{finalPrice.toFixed(2)}</span>
                  </td>
                  <td>
                    <label className="toggle-switch" style={{ cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={part.active}
                        onChange={(e) => updateSparePart(part.sku, { active: e.target.checked })}
                      />
                      <span className="slider" style={{ marginLeft: '6px', fontSize: '12px', color: part.active ? '#2ed573' : '#9ca3af' }}>
                        {part.active ? 'Active' : 'Disabled'}
                      </span>
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default PriceSettings;