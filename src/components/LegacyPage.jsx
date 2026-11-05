import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { installLegacyChartRuntime } from './legacyChartRuntime.js';
import './legacy-chart-runtime.css';

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
    if (!table.parentElement?.classList.contains('legacy-table-scroll')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'legacy-table-scroll';
      table.parentElement?.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }

    const headers = [...table.querySelectorAll('thead th')];
    headers.forEach((header, columnIndex) => {
      const label = header.textContent.trim();
      if (!label) return;
      header.classList.add('legacy-sortable-header');
      header.dataset.sortLabel = label;
      header.setAttribute('role', 'button');
      header.tabIndex = 0;
      const sort = () => {
        const direction = header.dataset.sortDirection === 'asc' ? 'desc' : 'asc';
        const rows = [...table.querySelectorAll('tbody tr')];
        const normalize = (row) => row.cells[columnIndex]?.textContent.trim() || '';
        const numberValue = (value) => Number(value.replace(/[^0-9.-]/g, ''));
        rows.sort((a, b) => {
          const first = normalize(a);
          const second = normalize(b);
          const firstNumber = numberValue(first);
          const secondNumber = numberValue(second);
          const result = Number.isFinite(firstNumber) && Number.isFinite(secondNumber) && /\d/.test(first) && /\d/.test(second)
            ? firstNumber - secondNumber
            : first.localeCompare(second, undefined, { numeric: true, sensitivity: 'base' });
          return direction === 'asc' ? result : -result;
        });
        rows.forEach((row) => table.tBodies[0]?.appendChild(row));
        headers.forEach((item) => {
          item.dataset.sortDirection = '';
          item.setAttribute('aria-sort', 'none');
          item.textContent = item.dataset.sortLabel;
        });
        header.dataset.sortDirection = direction;
        header.setAttribute('aria-sort', direction === 'asc' ? 'ascending' : 'descending');
        header.textContent = `${label} ${direction === 'asc' ? '↑' : '↓'}`;
      };
      const onKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          sort();
        }
      };
      header.addEventListener('click', sort);
      header.addEventListener('keydown', onKeyDown);
      cleanups.push(() => {
        header.removeEventListener('click', sort);
        header.removeEventListener('keydown', onKeyDown);
      });
    });
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
  const html = useMemo(() => bodyFromDocument(markup), [markup]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    let active = true;
    let actions = {};
    let chartRuntime;
    addSettingsLink(root);
    const cleanupTables = enhanceTables(root);

    const onClick = (event) => {
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
  }, [navigate, script, usesCharts]);

  return <div ref={rootRef} dangerouslySetInnerHTML={{ __html: html }} />;
}
