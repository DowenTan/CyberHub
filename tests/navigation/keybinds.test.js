import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DEFAULT_KEYBINDS,
  getNavKeybinds,
  saveNavKeybinds,
  resetNavKeybinds,
} from '../../lib/navKeybinds.js';

describe('Navigation Keybinds Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides default keybindings 1 to 7 with 7 for user settings', () => {
    const keybinds = getNavKeybinds();
    expect(keybinds).toHaveLength(DEFAULT_KEYBINDS.length);

    const cc = keybinds.find((k) => k.id === 'command-center');
    expect(cc?.key).toBe('1');
    expect(cc?.path).toBe('/');

    const so = keybinds.find((k) => k.id === 'smart-orders');
    expect(so?.key).toBe('2');
    expect(so?.path).toBe('/smart-orders');

    const tech = keybinds.find((k) => k.id === 'technicians');
    expect(tech?.key).toBe('3');
    expect(tech?.path).toBe('/technicians');

    const chats = keybinds.find((k) => k.id === 'chats');
    expect(chats?.key).toBe('4');
    expect(chats?.path).toBe('/chats');

    const ai = keybinds.find((k) => k.id === 'ai-diagnostics');
    expect(ai?.key).toBe('5');
    expect(ai?.path).toBe('/ai-diagnostics');

    const sa = keybinds.find((k) => k.id === 'service-analytics');
    expect(sa?.key).toBe('6');
    expect(sa?.path).toBe('/service-analytics');

    const us = keybinds.find((k) => k.id === 'user-settings');
    expect(us?.key).toBe('7');
    expect(us?.path).toBe('/settings');

    const cust = keybinds.find((k) => k.id === 'customers');
    expect(cust?.key).toBe('9');
    expect(cust?.path).toBe('/customers');

    const adm = keybinds.find((k) => k.id === 'admins');
    expect(adm?.key).toBe('0');
    expect(adm?.path).toBe('/admins');

    const logs = keybinds.find((k) => k.id === 'logs');
    expect(logs?.key).toBe('l');
    expect(logs?.path).toBe('/logs');
  });

  it('saves and retrieves updated custom keybinds', () => {
    const listener = vi.fn();
    window.addEventListener('cyberhub:keybinds-updated', listener);

    saveNavKeybinds({
      'command-center': 'h',
      'user-settings': '9',
    });

    expect(listener).toHaveBeenCalled();

    const keybinds = getNavKeybinds();
    expect(keybinds.find((k) => k.id === 'command-center')?.key).toBe('h');
    expect(keybinds.find((k) => k.id === 'user-settings')?.key).toBe('9');
    // Others retain their defaults
    expect(keybinds.find((k) => k.id === 'smart-orders')?.key).toBe('2');

    window.removeEventListener('cyberhub:keybinds-updated', listener);
  });

  it('resets keybinds back to defaults', () => {
    saveNavKeybinds({
      'command-center': 'x',
      'user-settings': 'z',
    });

    resetNavKeybinds();

    const keybinds = getNavKeybinds();
    expect(keybinds.find((k) => k.id === 'command-center')?.key).toBe('1');
    expect(keybinds.find((k) => k.id === 'user-settings')?.key).toBe('7');
  });
});
