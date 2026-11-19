import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { apiFetch } from '../../lib/api';

describe('Security & C2 Architectural Guardrails', () => {
  it('useDashboardStore does not import or call @supabase/supabase-js', () => {
    const storePath = path.resolve(__dirname, '../../store/useDashboardStore.js');
    const content = fs.readFileSync(storePath, 'utf8');

    // Assert no import of supabase-js or supabaseClient
    expect(content).not.toMatch(/from\s+['"]@supabase\/supabase-js['"]/);
    expect(content).not.toMatch(/from\s+['"][^'"]*supabaseClient['"]/);

    // Assert no direct supabase.from calls
    expect(content).not.toMatch(/supabase\.from\(/);
  });

  it('client environment contains NO service role key or secret fallback', () => {
    // Assert forbidden service role or secret env vars are not defined
    const forbiddenKeys = [
      ['VITE', 'SUPABASE', 'SERVICE', 'ROLE', 'KEY'].join('_'),
      ['VITE', 'SUPABASE', 'SECRET', 'KEY'].join('_'),
    ];
    forbiddenKeys.forEach((key) => {
      expect(import.meta.env[key]).toBeUndefined();
    });
  });

  it('apiFetch parses error detail cleanly and attaches HTTP status code', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ detail: 'Conflict: SKU PRT-999 already exists' }),
    });

    try {
      await expect(apiFetch('/api/admin/pricing/parts', { method: 'POST' })).rejects.toThrow(
        'Conflict: SKU PRT-999 already exists'
      );
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('apiFetch handles non-JSON error responses gracefully', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('Not JSON');
      },
    });

    try {
      await expect(apiFetch('/api/admin/orders')).rejects.toThrow('API 502 /api/admin/orders');
    } finally {
      global.fetch = originalFetch;
    }
  });
});
