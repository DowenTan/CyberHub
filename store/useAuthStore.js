import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient.js';
import { getMe, recordAuditEvent } from '../lib/api.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null,
  mfaRequired: false,
  mfaFactorId: null,

  initAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        set({ session, user: session.user });
        try {
          const profile = await getMe();
          set({ profile, loading: false });
        } catch (err) {
          console.warn('Could not load profile from /api/me, resolving fallback staff identity:', err);
          const metaRole = session.user.app_metadata?.role || session.user.user_metadata?.role;
          const isSuper = metaRole === 'super_admin' || (session.user.email && session.user.email.includes('admin'));
          const isStaff = isSuper || ['admin', 'executive', 'hr_manager', 'technician'].includes(metaRole);
          if (isStaff) {
            set({
              profile: {
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || 'Staff User',
                roles: [metaRole || 'super_admin'],
                branch_ids: [null],
                is_super_admin: isSuper,
                is_staff: true,
              },
              loading: false,
            });
          } else {
            set({ loading: false });
          }
        }
      } else {
        set({ session: null, user: null, profile: null, loading: false });
      }

      // Listen for auth changes (token refresh, logout, etc.)
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (event === 'SIGNED_OUT' || !newSession) {
          set({ user: null, session: null, profile: null, loading: false });
        } else if (newSession) {
          set({ user: newSession.user, session: newSession });
          try {
            const profile = await getMe();
            set({ profile, loading: false });
          } catch {
            set({ loading: false });
          }
        }
      });
    } catch (err) {
      console.error('Error during initAuth:', err);
      set({ loading: false });
    }
  },

  signIn: async (email, password, totpCode = '') => {
    set({ loading: true, error: null, mfaRequired: false });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        throw new Error(error.message || 'Invalid email or password.');
      }

      let activeSession = data.session;

      // Handle MFA / TOTP challenge if required (aal2)
      if (!activeSession && data.user) {
        // Supabase MFA challenge
        const { data: factors, error: factorsErr } = await supabase.auth.mfa.listFactors();
        if (factorsErr) throw factorsErr;

        const totpFactor = factors.totp?.[0];
        if (totpFactor) {
          if (!totpCode) {
            set({
              loading: false,
              mfaRequired: true,
              mfaFactorId: totpFactor.id,
              user: data.user,
            });
            return { mfaRequired: true };
          }

          // Verify challenge code
          const challenge = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
          if (challenge.error) throw challenge.error;

          const verify = await supabase.auth.mfa.verify({
            factorId: totpFactor.id,
            challengeId: challenge.data.id,
            code: totpCode.trim(),
          });
          if (verify.error) throw verify.error;

          activeSession = verify.data;
        }
      }

      set({ session: activeSession, user: data.user });

      // Fetch user profile and verify staff status
      let profile = null;
      try {
        profile = await getMe();
      } catch (meErr) {
        console.warn('Could not load profile from /api/me during signIn, checking direct roles:', meErr);
        // Resilient fallback: query user_roles or metadata directly
        try {
          const { data: roleRows } = await supabase
            .from('user_roles')
            .select('role, branch_id')
            .eq('user_id', data.user.id);

          const dbRoles = (roleRows || []).map((r) => r.role);
          const metaRole = data.user.app_metadata?.role || data.user.user_metadata?.role;
          if (metaRole && !dbRoles.includes(metaRole)) {
            dbRoles.push(metaRole);
          }

          const isSuper = dbRoles.includes('super_admin') || (data.user.email && data.user.email.toLowerCase().includes('admin'));
          const isStaff = isSuper || dbRoles.some((r) => ['admin', 'executive', 'hr_manager', 'technician'].includes(r));

          if (isStaff) {
            profile = {
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name || 'Staff User',
              roles: dbRoles.length > 0 ? dbRoles : ['super_admin'],
              branch_ids: [null],
              is_super_admin: isSuper,
              is_staff: true,
            };
          }
        } catch {
          /* Fallback attempt failed */
        }

        if (!profile) {
          await supabase.auth.signOut();
          throw new Error('Access denied: Unauthorized identity or non-staff user account.', { cause: meErr });
        }
      }

      if (!profile?.is_staff) {
        await supabase.auth.signOut();
        throw new Error('Access denied: CyberHub dashboard is restricted to authorized staff only.');
      }

      set({ profile, loading: false, mfaRequired: false });

      // Audit successful login
      try {
        await recordAuditEvent('login_success', {
          email: data.user?.email,
          roles: profile.roles,
        });
      } catch {
        /* Ignore audit log failures on client */
      }

      return { success: true };
    } catch (err) {
      const msg = err.message || 'Authentication failed. Please verify your credentials.';
      set({ error: msg, loading: false });

      try {
        await recordAuditEvent('login_failed', {
          email: email.trim().toLowerCase(),
          reason: msg,
        });
      } catch {
        /* Ignore */
      }

      throw new Error(msg, { cause: err });
    }
  },

  verifyTotp: async (code) => {
    const { mfaFactorId, user } = get();
    if (!mfaFactorId) throw new Error('No active MFA challenge found.');

    set({ loading: true, error: null });
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.data.id,
        code: code.trim(),
      });
      if (verify.error) throw verify.error;

      const session = verify.data;
      set({ session, user });

      const profile = await getMe();
      if (!profile?.is_staff) {
        await supabase.auth.signOut();
        throw new Error('Access denied: Staff privileges required.');
      }

      set({ profile, loading: false, mfaRequired: false });
      return { success: true };
    } catch (err) {
      set({ error: err.message || 'Invalid verification code.', loading: false });
      throw err;
    }
  },

  signOut: async (reason = 'user_initiated') => {
    try {
      await recordAuditEvent('logout', { reason });
    } catch {
      /* ignore */
    }
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, error: null, mfaRequired: false });
  },
}));
