import { useEffect, useMemo, useState } from 'react';
import { useDashboardStore } from '../store/useDashboardStore.js';
import SmartTable from '../components/SmartTable.jsx';
import CategorySubcategoryFilter from '../components/CategorySubcategoryFilter.jsx';
import CatalogueHealthAssistant from '../components/CatalogueHealthAssistant.jsx';
import { apiFetch } from '../lib/api.js';
import { DEFAULT_TAXONOMY, buildTaxonomy } from '../lib/categories.js';

const toPart = (p) => {
  const cost = Number(p.cost ?? p.supplier_cost ?? 25.0);
  const markup = Number(p.markup ?? p.markup_percentage ?? 40);
  const finalPrice = Number(p.finalPrice ?? p.final_price ?? (cost * (1 + markup / 100)));
  return {
    sku: p.sku,
    time: (p.created_at || p.time || '').slice(0, 16).replace('T', ' ') || '2026-11-06 19:00',
    name: p.name,
    category: p.category || 'Heating and Cooling',
    cost,
    supplier_cost: cost,
    markup,
    markup_percentage: markup,
    finalPrice,
    final_price: finalPrice,
    active: p.active ?? p.is_active ?? true,
    is_active: p.active ?? p.is_active ?? true,
  };
};

const PriceSettings = () => {
  const {
    globalPricing,
    spareParts,
    updateGlobalPricing,
    updateSparePart,
    deleteSparePart,
    addSparePart,
    setSpareParts,
    selectedRecord,
    setSelectedRecord,
  } = useDashboardStore();
  const [group, setGroup] = useState('All');
  const [category, setCategory] = useState('All');
  const [taxonomy, setTaxonomy] = useState(DEFAULT_TAXONOMY);
  const [live, setLive] = useState(false); // true once the FastAPI/Supabase backend answered
  const [editingPart, setEditingPart] = useState(null);
  const [isAddingPart, setIsAddingPart] = useState(false);
  const [newPart, setNewPart] = useState({
    sku: '',
    name: '',
    category: '',
    cost: 20.0,
    markup: 50,
    active: true,
  });
  const [deletingPart, setDeletingPart] = useState(null);
  const [isHealthAssistantOpen, setIsHealthAssistantOpen] = useState(false);

  // Load parts, categories and global rates from the backend; fall back to the local demo data if it is offline.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiFetch('/api/admin/pricing/parts'),
      apiFetch('/api/admin/pricing/categories'),
      apiFetch('/api/admin/pricing/global'),
    ])
      .then(([parts, categories, g]) => {
        if (cancelled) return;
        setSpareParts(parts.map(toPart));
        setTaxonomy(buildTaxonomy(categories));
        updateGlobalPricing({
          diagnosticFee: Number(g.diagnostic_fee),
          laborRate: Number(g.standard_labor_rate),
          emergencyMultiplier: Number(g.emergency_multiplier),
        });
        setLive(true);
      })
      .catch(() => {
        if (!cancelled) setLive(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setSpareParts, updateGlobalPricing]);

  // groups -> categories, plus an "Other" bucket for any category that is not in the tree
  const tree = useMemo(() => {
    const known = new Set(taxonomy.flatMap((g) => g.categories));
    const extra = [...new Set(spareParts.map((p) => p.category))].filter((c) => !known.has(c)).sort();
    return extra.length ? [...taxonomy, { group: 'Other', categories: extra }] : taxonomy;
  }, [taxonomy, spareParts]);

  const categoryNames = useMemo(
    () => (group === 'All' ? tree.flatMap((g) => g.categories) : tree.find((g) => g.group === group)?.categories ?? []),
    [tree, group]
  );

  const counts = useMemo(() => {
    const res = { all: spareParts.length };
    tree.forEach((g) => {
      res[g.group] = spareParts.filter((p) => g.categories.includes(p.category)).length;
      g.categories.forEach((c) => {
        res[c] = spareParts.filter((p) => p.category === c).length;
      });
    });
    return res;
  }, [tree, spareParts]);

  const visibleParts = spareParts.filter((p) =>
    category !== 'All' ? p.category === category : categoryNames.includes(p.category)
  );
  const scopeLabel = category !== 'All' ? category : group !== 'All' ? group : 'All categories';
  const avgMarkup = visibleParts.length
    ? visibleParts.reduce((sum, p) => sum + Number(p.markup ?? p.markup_percentage ?? 0), 0) / visibleParts.length
    : 0;

  const savePart = (part) => {
    if (!live) return;
    apiFetch(`/api/admin/pricing/parts/${encodeURIComponent(part.sku)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        sku: part.sku,
        markup_percentage: Math.round(part.markup),
        supplier_cost: part.cost,
        is_active: part.active,
      }),
    }).catch(() => {});
  };

  const saveGlobal = () => {
    if (!live) return;
    apiFetch('/api/admin/pricing/global', {
      method: 'POST',
      body: JSON.stringify({
        diagnostic_fee: globalPricing.diagnosticFee,
        standard_labor_rate: globalPricing.laborRate,
        emergency_multiplier: globalPricing.emergencyMultiplier,
      }),
    }).catch(() => {});
  };

  const handleOpenAddModal = () => {
    const nums = spareParts.map((p) => parseInt(String(p.sku).replace(/\D/g, ''), 10)).filter(Number.isFinite);
    const sku = `PRT-${String(Math.max(0, ...nums) + 1).padStart(3, '0')}`;
    setNewPart({
      sku,
      name: '',
      category: category !== 'All' ? category : categoryNames[0] || 'Heating and Cooling',
      cost: 20.0,
      markup: 50,
      active: true,
    });
    setIsAddingPart(true);
  };

  const handleSubmitAddPart = async (e) => {
    e.preventDefault();
    if (!newPart.name.trim()) return;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const part = {
      sku: newPart.sku.trim().toUpperCase(),
      time: nowStr,
      name: newPart.name.trim(),
      category: newPart.category || 'Heating and Cooling',
      cost: Number(newPart.cost) || 0,
      supplier_cost: Number(newPart.cost) || 0,
      markup: Number(newPart.markup) || 0,
      markup_percentage: Number(newPart.markup) || 0,
      active: newPart.active !== false,
    };
    if (live) {
      try {
        await apiFetch('/api/admin/pricing/parts', {
          method: 'POST',
          body: JSON.stringify({
            sku: part.sku,
            name: part.name,
            category: part.category,
            supplier_cost: part.cost,
            markup_percentage: part.markup,
            is_active: part.active,
          }),
        });
      } catch {
        // Fall back to local store update
      }
    }
    addSparePart(part);
    setIsAddingPart(false);
  };

  const handleConfirmDeletePart = () => {
    if (!deletingPart) return;
    deleteSparePart(deletingPart.sku);
    if (selectedRecord?.type === 'part' && selectedRecord?.data?.sku === deletingPart.sku) {
      setSelectedRecord(null);
    }
    setDeletingPart(null);
  };

  const columns = [
    { key: 'sku', label: 'Part SKU', className: 'accent-text mono ch-col-sku', width: '85px' },
    { key: 'time', label: 'Time', className: 'mono' },
    { key: 'name', label: 'Component Name', sortType: 'alphabetical' },
    { key: 'category', label: 'Category', sortType: 'alphabetical' },
    {
      key: 'cost',
      label: 'Supplier Cost (RM)',
      getValue: (part) => Number(part.cost ?? part.supplier_cost ?? 0),
      render: (part) => (
        <input
          type="number"
          step="0.5"
          className="ch-input compact"
          value={part.cost ?? part.supplier_cost ?? 0}
          onChange={(e) => {
            const val = parseFloat(e.target.value) || 0;
            updateSparePart(part.sku, { cost: val, supplier_cost: val });
          }}
          onBlur={() => savePart(part)}
        />
      ),
    },
    {
      key: 'markup',
      label: 'Markup (%)',
      getValue: (part) => Number(part.markup ?? part.markup_percentage ?? 0),
      render: (part) => (
        <input
          type="number"
          step="1"
          className="ch-input compact"
          value={part.markup ?? part.markup_percentage ?? 0}
          onChange={(e) => {
            const val = parseFloat(e.target.value) || 0;
            updateSparePart(part.sku, { markup: val, markup_percentage: val });
          }}
          onBlur={() => savePart(part)}
        />
      ),
    },
    {
      key: 'finalPrice',
      label: 'Final Retail Price',
      getValue: (part) => {
        const cost = Number(part.cost ?? part.supplier_cost ?? 0);
        const markup = Number(part.markup ?? part.markup_percentage ?? 0);
        return cost * (1 + markup / 100);
      },
      render: (part) => {
        const cost = Number(part.cost ?? part.supplier_cost ?? 0);
        const markup = Number(part.markup ?? part.markup_percentage ?? 0);
        const finalPrice = cost * (1 + markup / 100);
        return <span className="mono green-text">RM {finalPrice.toFixed(2)}</span>;
      },
    },
    {
      key: 'action',
      label: 'Action',
      sortable: false,
      width: '110px',
      render: (part) => (
        <div className="table-action-btns" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className="btn-action-edit"
            title="Edit Spare Part"
            onClick={(e) => {
              e.stopPropagation();
              setEditingPart({
                ...part,
                cost: part.cost ?? part.supplier_cost ?? 0,
                markup: part.markup ?? part.markup_percentage ?? 0,
              });
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </button>
          <button
            type="button"
            className="btn-action-delete"
            title="Delete Spare Part"
            onClick={(e) => {
              e.stopPropagation();
              setDeletingPart(part);
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
      <div className="page-header">
        <div>
          <h1>Price Settings & Spare Parts Matrix</h1>
          <p className="subtitle">
            Changes sync immediately with the AI Copilot and customer quote engine.{' '}
            <span className="mono" style={{ fontSize: '11px', color: live ? '#2ed573' : '#9ca3af' }}>
              {live ? '● Live (Supabase)' : '○ Demo data (backend offline)'}
            </span>
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn-small outline"
            onClick={() => setIsHealthAssistantOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#ff7300',
              borderColor: 'rgba(255, 115, 0, 0.45)',
              background: 'rgba(255, 115, 0, 0.08)',
              padding: '6px 12px',
              fontWeight: 600,
              fontSize: '12px',
              borderRadius: '6px',
            }}
            title="Audit catalogue health, simulate price changes, or import supplier CSV"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Catalogue Assistant
          </button>
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
            onBlur={saveGlobal}
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
            onBlur={saveGlobal}
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
            onBlur={saveGlobal}
          />
        </div>
      </div>

      {/* CyberHub Standard Appliance Category & Subcategory Filter System */}
      <CategorySubcategoryFilter
        taxonomy={tree}
        selectedCategory={group === 'All' ? 'all' : group}
        selectedSubcategory={category === 'All' ? 'all' : category}
        onSelectCategory={(g) => {
          setGroup(g === 'all' ? 'All' : g);
          setCategory('All');
        }}
        onSelectSubcategory={(c) => {
          setCategory(c === 'all' ? 'All' : c);
        }}
        counts={counts}
      />

      <div style={{ margin: '0 0 10px 2px' }}>
        <p className="mono" style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
          {scopeLabel}: {visibleParts.length} parts · average markup {avgMarkup.toFixed(1)}%
        </p>
      </div>

      <div className="ch-card" style={{ padding: 0, overflow: 'hidden' }}>
        <SmartTable
          columns={columns}
          data={visibleParts}
          rowKey="sku"
          tableId="price_settings"
          maxHeight="calc(100vh - 220px)"
          onAddNew={handleOpenAddModal}
          addNewLabel="+ Add Spare Part"
          searchPlaceholder="Search spare parts by SKU, name, or category..."
          onRowClick={(part) => setSelectedRecord({ type: 'part', data: part })}
          selectedRowKey={selectedRecord?.data?.sku}
        />
      </div>

      {/* Edit Spare Part Modal */}
      {editingPart && (
        <div className="dispatch-modal-overlay show" onClick={() => setEditingPart(null)}>
          <div className="dispatch-modal ch-crud-modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header ch-crud-modal-header">
              <h3>Edit Spare Part Component</h3>
              <button type="button" className="modal-close ch-crud-modal-close" onClick={() => setEditingPart(null)}>✕</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateSparePart(editingPart.sku, {
                  name: editingPart.name,
                  category: editingPart.category,
                  cost: Number(editingPart.cost),
                  supplier_cost: Number(editingPart.cost),
                  markup: Number(editingPart.markup),
                  markup_percentage: Number(editingPart.markup),
                  active: editingPart.active,
                  is_active: editingPart.active,
                });
                setEditingPart(null);
              }}
              className="modal-body ch-crud-modal-body"
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <p className="modal-order-tag" style={{ margin: 0 }}>{editingPart.sku}</p>
                <span className="status-pill active" style={{ fontSize: '11px' }}>{editingPart.category}</span>
              </div>
              <div className="ch-form-group">
                <span className="modal-label">Component Name</span>
                <input
                  type="text"
                  className="ch-input"
                  value={editingPart.name || ''}
                  onChange={(e) => setEditingPart({ ...editingPart, name: e.target.value })}
                  required
                />
              </div>

              <div className="ch-form-group">
                <span className="modal-label">Category</span>
                <select
                  className="ch-select"
                  style={{ width: '100%' }}
                  value={editingPart.category || ''}
                  onChange={(e) => setEditingPart({ ...editingPart, category: e.target.value })}
                >
                  {categoryNames.length > 0 ? (
                    categoryNames.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))
                  ) : (
                    <option value="Heating and Cooling">Heating and Cooling</option>
                  )}
                </select>
              </div>

              <div className="modal-grid ch-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="ch-form-group">
                  <span className="modal-label">Supplier Cost (RM)</span>
                  <input
                    type="number"
                    step="0.5"
                    className="ch-input"
                    value={editingPart.cost ?? 0}
                    onChange={(e) => setEditingPart({ ...editingPart, cost: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="ch-form-group">
                  <span className="modal-label">Markup (%)</span>
                  <input
                    type="number"
                    step="1"
                    className="ch-input"
                    value={editingPart.markup ?? 0}
                    onChange={(e) => setEditingPart({ ...editingPart, markup: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div style={{ background: 'rgba(255, 115, 0, 0.08)', border: '1px solid rgba(255, 115, 0, 0.25)', borderRadius: '6px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#b8c4db' }}>Calculated Retail Price:</span>
                <span className="mono green-text" style={{ fontSize: '14px', fontWeight: 700 }}>
                  RM {(Number(editingPart.cost ?? 0) * (1 + Number(editingPart.markup ?? 0) / 100)).toFixed(2)}
                </span>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    checked={editingPart.active !== false}
                    onChange={(e) => setEditingPart({ ...editingPart, active: e.target.checked })}
                  />
                  <span style={{ fontSize: '12.5px', color: '#cbd5e1' }}>Active in Price Engine & Copilot</span>
                </label>
              </div>

              <div className="modal-footer ch-crud-modal-footer" style={{ marginTop: '16px' }}>
                <button type="button" className="btn-cancel btn-small outline ch-modal-cancel" onClick={() => setEditingPart(null)}>Cancel</button>
                <button type="submit" className="btn-dispatch btn-primary ch-modal-save">Save to Supabase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Spare Part Modal */}
      {isAddingPart && (
        <div className="dispatch-modal-overlay show" onClick={() => setIsAddingPart(false)}>
          <div className="dispatch-modal ch-crud-modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header ch-crud-modal-header">
              <h3>+ Add New Spare Part</h3>
              <button type="button" className="modal-close ch-crud-modal-close" onClick={() => setIsAddingPart(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmitAddPart} className="modal-body ch-crud-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <p className="modal-order-tag" style={{ margin: 0 }}>{newPart.sku}</p>
                <span className="status-pill active" style={{ fontSize: '11px' }}>NEW COMPONENT</span>
              </div>

              <div className="ch-form-group">
                <span className="modal-label">Category</span>
                <select
                  className="ch-select"
                  style={{ width: '100%' }}
                  value={newPart.category}
                  onChange={(e) => setNewPart({ ...newPart, category: e.target.value })}
                >
                  {categoryNames.length > 0 ? (
                    categoryNames.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))
                  ) : (
                    <option value="Heating and Cooling">Heating and Cooling</option>
                  )}
                </select>
              </div>

              <div className="ch-form-group">
                <span className="modal-label">Component Name</span>
                <input
                  type="text"
                  className="ch-input"
                  placeholder="e.g. Inverter Compressor Relay"
                  value={newPart.name}
                  onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                  required
                />
              </div>

              <div className="modal-grid ch-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="ch-form-group">
                  <span className="modal-label">Supplier Cost (RM)</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    className="ch-input"
                    value={newPart.cost}
                    onChange={(e) => setNewPart({ ...newPart, cost: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="ch-form-group">
                  <span className="modal-label">Markup (%)</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    className="ch-input"
                    value={newPart.markup}
                    onChange={(e) => setNewPart({ ...newPart, markup: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div style={{ background: 'rgba(255, 115, 0, 0.08)', border: '1px solid rgba(255, 115, 0, 0.25)', borderRadius: '6px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#b8c4db' }}>Calculated Retail Price:</span>
                <span className="mono green-text" style={{ fontSize: '14px', fontWeight: 700 }}>
                  RM {(Number(newPart.cost) * (1 + Number(newPart.markup) / 100)).toFixed(2)}
                </span>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    checked={newPart.active}
                    onChange={(e) => setNewPart({ ...newPart, active: e.target.checked })}
                  />
                  <span style={{ fontSize: '12.5px', color: '#cbd5e1' }}>Active in Price Engine & Copilot</span>
                </label>
              </div>

              <div className="modal-footer ch-crud-modal-footer" style={{ marginTop: '16px' }}>
                <button type="button" className="btn-cancel btn-small outline ch-modal-cancel" onClick={() => setIsAddingPart(false)}>Cancel</button>
                <button type="submit" className="btn-dispatch btn-primary ch-modal-save">Save to Supabase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Spare Part Confirmation Modal */}
      {deletingPart && (
        <div className="dispatch-modal-overlay show" onClick={() => setDeletingPart(null)}>
          <div className="dispatch-modal ch-crud-modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header ch-crud-modal-header">
              <h3 style={{ color: '#ff4757', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Confirm Deletion
              </h3>
              <button type="button" className="modal-close ch-crud-modal-close" onClick={() => setDeletingPart(null)}>✕</button>
            </div>
            <div className="modal-body ch-crud-modal-body" style={{ padding: '8px 4px 14px 4px' }}>
              <p style={{ margin: '0 0 14px 0', fontSize: '13.5px', color: '#e5e7eb', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete spare part <strong style={{ color: '#fff' }}>{deletingPart.name}</strong> (<span className="modal-order-tag" style={{ display: 'inline', padding: '2px 6px' }}>{deletingPart.sku}</span>)?
              </p>
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Category: <span style={{ color: '#fff' }}>{deletingPart.category}</span></div>
                <div>Supplier Cost: <span style={{ color: '#fff' }}>RM {Number(deletingPart.cost).toFixed(2)}</span></div>
                <div>Markup: <span style={{ color: '#2ed573' }}>+{deletingPart.markup}%</span></div>
              </div>
              <div className="modal-footer ch-crud-modal-footer">
                <button type="button" className="btn-cancel btn-small outline ch-modal-cancel" onClick={() => setDeletingPart(null)}>
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
                  onClick={handleConfirmDeletePart}
                >
                  Delete Part
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* D9: Spare-parts Catalogue Assistant Modal */}
      <CatalogueHealthAssistant
        parts={spareParts}
        isOpen={isHealthAssistantOpen}
        onClose={() => setIsHealthAssistantOpen(false)}
        onApplyDiff={(diff) => updateSparePart(diff.sku, { [diff.field]: diff.proposed_value })}
      />
    </div>
  );
};

export default PriceSettings;
