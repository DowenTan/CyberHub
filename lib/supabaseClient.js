import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://vmyqaamoejjkwfahbpxr.supabase.co';

// Browser client strictly uses publishable/anon key only.
// Service role or secret keys must NEVER be referenced or fallbacked in client source.
const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY)) ||
  'sb_publishable_KDpo2abLv6ZYQjzwYX2eew_tcquPdeT';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
