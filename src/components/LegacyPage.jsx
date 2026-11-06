import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { installLegacyChartRuntime } from './legacyChartRuntime.js';
import { useDashboardStore } from '../store/useDashboardStore.js';
import './legacy-chart-runtime.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
const PAGE_PATHS = {
  'index.html': '/',
  'smart-orders.html': '/smart-orders',
  'technicians.html': '/technicians',
  'ai-diagnostics.html': '/ai-diagnostics',
  'service-analytics.html': '/service-analytics',
  'price-settings.html': '/price-settings',
  'settings.html': '/settings',
};


function bodyFromDocument(markup) {
  const body = markup.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? markup;

  return body
    .replaceAll('./image/', '/image/')
    .replace(/\sonclick=/gi, ' data-legacy-click=')
    .replace(/\sonchange=/gi, ' data-legacy-change=');
}

function executeLegacyScript(root, source, Chart) {
  const functionNames = [...new Set(
    [...source.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].map((match) => match[1])
  )];
  const returnValue = functionNames.length ? `return { ${functionNames.join(', ')} };` : 'return {};';
  const runner = new Function(
    'root',
    'Chart',
    `const document = root.ownerDocument; const window = document.defaultView;\n${source}\n${returnValue}`
  );

  return runner(root, Chart);
}

function runTemplateAction(expression, actions, element) {
  const functionName = expression.match(/^\s*([A-Za-z_$][\w$]*)\s*\(/)?.[1];
  const availableActions = {
    ...actions,
    alert: window.alert.bind(window),
  };
  if (!functionName || typeof availableActions[functionName] !== 'function') return;

  const call = expression
    .replace(/^\s*[A-Za-z_$][\w$]*\s*\(/, `actions.${functionName}(`)
    .replace(/\bthis\b/g, 'element');

  new Function('actions', 'element', `"use strict"; ${call}`)(availableActions, element);
}

function enhanceTables(root) {
  const cleanups = [];
  root.querySelectorAll('table').forEach((table) => {
    // 1. Ensure table is wrapped in a scroll container with visible scrollbar
    if (!table.parentElement?.classList.contains('legacy-table-scroll')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'legacy-table-scroll ch-table-scroll-container';
      table.parentElement?.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }

    const thead = table.querySelector('thead');
    if (!thead) return;

    let categoryRow = thead.querySelector('tr.ch-table-category-row') || thead.querySelector('tr');
    if (!categoryRow) return;
    categoryRow.classList.add('ch-table-category-row');

    const headers = [...categoryRow.querySelectorAll('th')];
    if (headers.length === 0) return;

    // 2. Identify and remove all interaction for the "Action" column
    const actionIndex = headers.findIndex((h) => /action/i.test(h.textContent));
    if (actionIndex !== -1) {
      const actionHeader = headers[actionIndex];
      actionHeader.classList.add('ch-non-interactive-th');
      actionHeader.style.pointerEvents = 'none';
      actionHeader.style.cursor = 'default';
      actionHeader.removeAttribute('role');
      actionHeader.tabIndex = -1;

      // Disable all interaction in the action column cells across all rows
      const rows = [...table.querySelectorAll('tbody tr')];
      rows.forEach((row) => {
        const actionCell = row.cells[actionIndex];
        if (actionCell) {
          actionCell.classList.add('ch-non-interactive-td');
          actionCell.style.pointerEvents = 'none';
          actionCell.style.cursor = 'default';
          actionCell.querySelectorAll('button, a, input, select').forEach((el) => {
            el.setAttribute('disabled', 'true');
            el.style.pointerEvents = 'none';
            el.style.cursor = 'default';
            el.tabIndex = -1;
            el.onclick = null;
          });
        }
      });
    }

    // 3. Add Control Row on Top of Category (Searchbar, Add New, Sort by, Asc/Desc)
    let controlRow = thead.querySelector('.ch-table-control-row');
    if (!controlRow) {
      controlRow = document.createElement('tr');
      controlRow.className = 'ch-table-control-row';
      const controlTh = document.createElement('th');
      controlTh.colSpan = headers.length;
      controlTh.innerHTML = `
        <div class="ch-table-toolbar">
          <div class="ch-toolbar-left">
            <div class="ch-toolbar-search">
              <span class="ch-search-icon"><i class="fa-solid fa-magnifying-glass" style="color: rgba(255, 255, 255, 0.5);"></i></span>
              <input type="text" class="ch-input toolbar-input ch-table-search-input" placeholder="Search" />
              <button type="button" class="ch-clear-search" style="display: none;">✕</button>
            </div>
            <button type="button" class="btn-small ch-add-new-btn">+ Add New</button>
          </div>
          <div class="ch-toolbar-sort">
            <span class="ch-toolbar-label">Sort by:</span>
            <select class="ch-select toolbar-select ch-sort-select"></select>
            <button type="button" class="btn-small outline ch-order-toggle">▲ Ascending</button>
          </div>
        </div>
      `;
      controlRow.appendChild(controlTh);
      thead.insertBefore(controlRow, categoryRow);
    }

    const sortSelect = controlRow.querySelector('.ch-sort-select');
    const orderToggle = controlRow.querySelector('.ch-order-toggle');
    const searchInput = controlRow.querySelector('.ch-table-search-input');
    const clearBtn = controlRow.querySelector('.ch-clear-search');
    const addNewBtn = controlRow.querySelector('.ch-add-new-btn');

    // Populate Sort by dropdown with non-action columns
    if (sortSelect && sortSelect.options.length === 0) {
      headers.forEach((h, idx) => {
        if (idx === actionIndex) return;
        const text = h.textContent.trim().replace(/[↑↓▲▼]/g, '').trim();
        if (!text) return;
        const opt = document.createElement('option');
        opt.value = String(idx);
        opt.textContent = text;
        sortSelect.appendChild(opt);
      });
    }

    let currentSortCol = sortSelect?.value ? Number(sortSelect.value) : 0;
    let currentSortDir = 'asc';

    // 4. Sorting Engine (Supports alphabetical sorting for Appliance & Issue, AI diagnostics, and numeric for prices/counts)
    const sortRows = (columnIndex, direction) => {
      currentSortCol = columnIndex;
      currentSortDir = direction;

      const colHeader = headers[columnIndex];
      const headerLabel = colHeader ? colHeader.textContent.trim().replace(/[↑↓▲▼]/g, '').trim() : '';
      const isAlphabetical =
        /appliance|issue|customer|client|technician|region|sku|description|part|name/i.test(headerLabel) ||
        table.id === 'aiTable';

      const rows = [...table.querySelectorAll('tbody tr')];
      const normalize = (row) => row.cells[columnIndex]?.textContent.trim() || '';
      const numberValue = (value) => Number(value.replace(/[^0-9.-]/g, ''));

      rows.sort((a, b) => {
        const first = normalize(a);
        const second = normalize(b);

        if (isAlphabetical) {
          // Strict alphabetical sort (A-Z or Z-A)
          const comp = first.localeCompare(second, undefined, { sensitivity: 'base', numeric: true });
          return direction === 'asc' ? comp : -comp;
        }

        const firstNumber = numberValue(first);
        const secondNumber = numberValue(second);
        const result =
          Number.isFinite(firstNumber) && Number.isFinite(secondNumber) && /\d/.test(first) && /\d/.test(second)
            ? firstNumber - secondNumber
            : first.localeCompare(second, undefined, { numeric: true, sensitivity: 'base' });
        return direction === 'asc' ? result : -result;
      });

      rows.forEach((row) => table.tBodies[0]?.appendChild(row));

      // Update Category headers visual arrows
      headers.forEach((h, idx) => {
        if (idx === actionIndex) return;
        const originalLabel = h.dataset.sortLabel || h.textContent.trim().replace(/[↑↓▲▼]/g, '').trim();
        h.dataset.sortLabel = originalLabel;
        if (idx === columnIndex) {
          h.dataset.sortDirection = direction;
          h.setAttribute('aria-sort', direction === 'asc' ? 'ascending' : 'descending');
          h.textContent = `${originalLabel} ${direction === 'asc' ? '▲' : '▼'}`;
        } else {
          h.dataset.sortDirection = '';
          h.setAttribute('aria-sort', 'none');
          h.textContent = originalLabel;
        }
      });

      // Update control row dropdown & toggle button
      if (sortSelect) sortSelect.value = String(columnIndex);
      if (orderToggle) {
        orderToggle.textContent = direction === 'asc' ? '▲ Ascending' : '▼ Descending';
      }
    };

    // Category Header Click Listeners
    headers.forEach((header, columnIndex) => {
      if (columnIndex === actionIndex) return;
      const label = header.textContent.trim().replace(/[↑↓▲▼]/g, '').trim();
      if (!label) return;
      header.classList.add('legacy-sortable-header');
      header.dataset.sortLabel = label;
      header.setAttribute('role', 'button');
      header.tabIndex = 0;

      const onClick = () => {
        const nextDir = currentSortCol === columnIndex && currentSortDir === 'asc' ? 'desc' : 'asc';
        sortRows(columnIndex, nextDir);
      };

      const onKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      };

      header.addEventListener('click', onClick);
      header.addEventListener('keydown', onKeyDown);
      cleanups.push(() => {
        header.removeEventListener('click', onClick);
        header.removeEventListener('keydown', onKeyDown);
      });
    });

    // Control Row Listeners
    if (sortSelect) {
      const onSelectChange = (e) => {
        sortRows(Number(e.target.value), currentSortDir);
      };
      sortSelect.addEventListener('change', onSelectChange);
      cleanups.push(() => sortSelect.removeEventListener('change', onSelectChange));
    }

    if (orderToggle) {
      const onToggleClick = () => {
        const nextDir = currentSortDir === 'asc' ? 'desc' : 'asc';
        sortRows(currentSortCol, nextDir);
      };
      orderToggle.addEventListener('click', onToggleClick);
      cleanups.push(() => orderToggle.removeEventListener('click', onToggleClick));
    }

    if (searchInput) {
      const onSearchInput = (e) => {
        const q = e.target.value.toLowerCase().trim();
        if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';
        const rows = [...table.querySelectorAll('tbody tr')];
        rows.forEach((row) => {
          const match = !q || row.textContent.toLowerCase().includes(q);
          row.style.display = match ? '' : 'none';
        });
      };
      searchInput.addEventListener('input', onSearchInput);
      cleanups.push(() => searchInput.removeEventListener('input', onSearchInput));
    }

    if (clearBtn) {
      const onClear = () => {
        if (searchInput) searchInput.value = '';
        clearBtn.style.display = 'none';
        const rows = [...table.querySelectorAll('tbody tr')];
        rows.forEach((row) => (row.style.display = ''));
      };
      clearBtn.addEventListener('click', onClear);
      cleanups.push(() => clearBtn.removeEventListener('click', onClear));
    }

    if (addNewBtn) {
      const onAddNew = () => {
        const tbody = table.tBodies[0];
        if (!tbody) return;
        const newRow = document.createElement('tr');
        newRow.style.animation = 'fadeIn 0.3s ease-out';
        newRow.style.background = 'rgba(255, 115, 0, 0.12)';

        // Build generic populated cells fitting the table's column count
        const colCount = headers.length;
        const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
        const randomId = `#NEW-${Math.floor(1000 + Math.random() * 9000)}`;

        let cellsHtml = '';
        for (let i = 0; i < colCount; i++) {
          if (i === actionIndex) {
            cellsHtml += `<td class="ch-non-interactive-td" style="pointer-events: none; cursor: default;"><span class="status-pill offline" style="opacity:0.75;">No Action</span></td>`;
          } else if (i === 0) {
            cellsHtml += `<td class="order-id" style="color:#ff7300; font-weight:700;">${randomId}</td>`;
          } else if (headers[i].textContent.toLowerCase().includes('time') || headers[i].textContent.toLowerCase().includes('date')) {
            cellsHtml += `<td style="font-family: monospace;">${now}</td>`;
          } else if (headers[i].textContent.toLowerCase().includes('appliance')) {
            cellsHtml += `<td><div class="fault-cell"><span class="appliance-tag" style="color:#2ed573;">Daikin Inverter AC</span><span class="fault-desc">New diagnostics logged</span></div></td>`;
          } else if (headers[i].textContent.toLowerCase().includes('status')) {
            cellsHtml += `<td><span class="status-pill pending">Pending</span></td>`;
          } else {
            cellsHtml += `<td>Entry Detail (${headers[i].textContent.trim()})</td>`;
          }
        }
        newRow.innerHTML = cellsHtml;
        tbody.insertBefore(newRow, tbody.firstChild);

        // Show toast
        const toast = document.createElement('div');
        toast.className = 'settings-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '24px';
        toast.style.right = '24px';
        toast.style.zIndex = '99999';
        toast.textContent = `✓ New record ${randomId} added to table.`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
      };
      addNewBtn.addEventListener('click', onAddNew);
      cleanups.push(() => addNewBtn.removeEventListener('click', onAddNew));
    }

    // Default alphabetical sorting for AI Diagnostics table Appliance & Issue category
    if (table.id === 'aiTable') {
      const applianceHeaderIndex = headers.findIndex((h) => /appliance/i.test(h.textContent));
      if (applianceHeaderIndex !== -1) {
        sortRows(applianceHeaderIndex, 'asc');
      }
    }
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}

function addSettingsLink(root) {
  const nav = root.querySelector('.nav-list');
  if (!nav || nav.querySelector('[data-user-settings-link]')) return;
  const item = document.createElement('li');
  item.className = 'nav-list-item';
  item.innerHTML = '<a class="nav-list-link" data-user-settings-link href="settings.html"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"></path></svg>User Settings</a>';
  nav.appendChild(item);
}

export default function LegacyPage({ markup, script, usesCharts = false }) {
  const rootRef = useRef(null);
  const navigate = useNavigate();
  const { userProfile } = useDashboardStore();
  const html = useMemo(() => bodyFromDocument(markup), [markup]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    let active = true;
    let actions = {};
    let chartRuntime;
    addSettingsLink(root);
    const cleanupTables = enhanceTables(root);

    // Sync user in Command Center & other pages with userProfile
    const syncUser = () => {
      root.querySelectorAll('.profile-box .profile-text').forEach((el) => {
        if (el.id !== 'panelName') el.textContent = userProfile.username;
      });
      root.querySelectorAll('.profile-box .profile-subtext').forEach((el) => {
        if (el.id !== 'panelRole') el.textContent = userProfile.role;
      });
      root.querySelectorAll('.profile-box .profile-photo-wrapper img').forEach((el) => {
        el.src = userProfile.avatarUrl;
        el.alt = userProfile.username;
      });
      root.querySelectorAll('.profile-box .profile-photo-wrapper').forEach((el) => {
        const toRemove = [];
        el.classList.forEach((c) => {
          if (c.startsWith('frame-')) toRemove.push(c);
        });
        toRemove.forEach((c) => el.classList.remove(c));
        const activeFrame = userProfile.avatarFrame || 'neon-orange';
        el.classList.add(`frame-${activeFrame}`);
      });
    };
    syncUser();

    const onClick = (event) => {
      // Allow clicking the profile box to open User Settings
      const profileBox = event.target.closest('.profile-box');
      const logoutBtn = event.target.closest('.btn-logout');
      if (profileBox && !logoutBtn && root.contains(profileBox)) {
        event.preventDefault();
        navigate('/settings');
        return;
      }

      const actionTarget = event.target.closest('[data-legacy-click]');
      if (actionTarget && root.contains(actionTarget)) {
        event.preventDefault();
        runTemplateAction(actionTarget.dataset.legacyClick, actions, actionTarget);
        return;
      }

      const link = event.target.closest('a[href]');
      if (!link || !root.contains(link)) return;

      const href = link.getAttribute('href')?.replace(/^\.\//, '');
      const path = PAGE_PATHS[href];
      if (path) {
        event.preventDefault();
        navigate(path);
      }
    };

    const onChange = (event) => {
      const actionTarget = event.target.closest('[data-legacy-change]');
      if (actionTarget && root.contains(actionTarget)) {
        runTemplateAction(actionTarget.dataset.legacyChange, actions, actionTarget);
      }
    };
    const onGranularity = (event) => {
      const time = event.detail?.time;
      if (!time) return;
      const switcher = actions.switchCmdTimeSort || actions.switchTimeSort;
      switcher?.(time);
    };

    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    window.addEventListener('cyberhub-chart-granularity', onGranularity);

    const start = () => {
      try {
        if (usesCharts) chartRuntime = installLegacyChartRuntime(root);
        if (active) actions = executeLegacyScript(root, script, chartRuntime?.Chart);
      } catch (error) {
        // The complete static dashboard remains usable if an optional visual enhancement fails.
        console.warn('A legacy dashboard enhancement did not load.', error);
      }
    };

    start();

    return () => {
      active = false;
      chartRuntime?.dispose();
      cleanupTables();
      root.removeEventListener('click', onClick);
      root.removeEventListener('change', onChange);
      window.removeEventListener('cyberhub-chart-granularity', onGranularity);
    };
  }, [navigate, script, usesCharts, userProfile]);

  return <div ref={rootRef} style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: html }} />;
}
