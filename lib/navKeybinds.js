export const DEFAULT_KEYBINDS = [
  { id: 'command-center', label: 'Command Center', path: '/', defaultKey: '1' },
  { id: 'smart-orders', label: 'Smart Orders', path: '/smart-orders', defaultKey: '2' },
  { id: 'technicians', label: 'Technicians', path: '/technicians', defaultKey: '3' },
  { id: 'customers', label: 'Customers', path: '/customers', defaultKey: '9' },
  { id: 'admins', label: 'Admins', path: '/admins', defaultKey: '0' },
  { id: 'logs', label: 'Logs', path: '/logs', defaultKey: 'l' },
  { id: 'chats', label: 'Chats', path: '/chats', defaultKey: '4' },
  { id: 'ai-diagnostics', label: 'AI Diagnostics', path: '/ai-diagnostics', defaultKey: '5' },
  { id: 'service-analytics', label: 'Service Analytics', path: '/service-analytics', defaultKey: '6' },
  { id: 'user-settings', label: 'User Settings', path: '/settings', defaultKey: '7' },
  { id: 'price-settings', label: 'Price Settings', path: '/price-settings', defaultKey: '8' },
];

const STORAGE_KEY = 'cyberhub_nav_keybinds';

export function getNavKeybinds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_KEYBINDS.map((item) => ({ ...item, key: item.defaultKey }));
    }
    const parsed = JSON.parse(raw);
    return DEFAULT_KEYBINDS.map((item) => ({
      ...item,
      key:
        parsed[item.id] !== undefined && parsed[item.id] !== null && String(parsed[item.id]).trim() !== ''
          ? String(parsed[item.id]).trim()
          : item.defaultKey,
    }));
  } catch {
    return DEFAULT_KEYBINDS.map((item) => ({ ...item, key: item.defaultKey }));
  }
}

export function saveNavKeybinds(keybindsMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keybindsMap));
    window.dispatchEvent(new CustomEvent('cyberhub:keybinds-updated', { detail: keybindsMap }));
  } catch {
    // ignore
  }
}

export function resetNavKeybinds() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('cyberhub:keybinds-updated'));
  } catch {
    // ignore
  }
}
