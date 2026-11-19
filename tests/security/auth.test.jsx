import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useIdleTimeout, DEFAULT_IDLE_TIMEOUT_MS, DEFAULT_WARNING_MS } from '../../hooks/useIdleTimeout.js';
import IdleTimeoutModal from '../../components/IdleTimeoutModal.jsx';
import ProtectedRoute from '../../components/ProtectedRoute.jsx';
import { useAuthStore } from '../../store/useAuthStore.js';

describe('C3 Authentication & Security Suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useAuthStore.setState({
      user: { id: 'test-user-id', email: 'admin@cyberhub.local' },
      session: { access_token: 'valid.token', user: { id: 'test-user-id' } },
      profile: { id: 'test-user-id', is_staff: true, roles: ['admin'], is_super_admin: false },
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Idle Timeout Hook (useIdleTimeout)', () => {
    it('does not display warning when initialized with active session', () => {
      const { result } = renderHook(() => useIdleTimeout());
      expect(result.current.isWarningOpen).toBe(false);
      expect(result.current.secondsRemaining).toBe(120); // 2 minutes (15m - 13m)
    });

    it('triggers warning dialog at 13 minutes', () => {
      const { result } = renderHook(() => useIdleTimeout());

      // Advance by 13 minutes
      act(() => {
        vi.advanceTimersByTime(DEFAULT_WARNING_MS);
      });

      expect(result.current.isWarningOpen).toBe(true);
      expect(result.current.secondsRemaining).toBe(120);
    });

    it('counts down remaining seconds once warning is active', () => {
      const { result } = renderHook(() => useIdleTimeout());

      // Advance to 13 minutes
      act(() => {
        vi.advanceTimersByTime(DEFAULT_WARNING_MS);
      });

      // Advance 30 seconds into warning
      act(() => {
        vi.advanceTimersByTime(30 * 1000);
      });

      expect(result.current.secondsRemaining).toBe(90);
    });

    it('resets timer when staySignedIn is called', () => {
      const { result } = renderHook(() => useIdleTimeout());

      // Advance to warning
      act(() => {
        vi.advanceTimersByTime(DEFAULT_WARNING_MS);
      });
      expect(result.current.isWarningOpen).toBe(true);

      // User chooses to stay signed in
      act(() => {
        result.current.staySignedIn();
      });

      expect(result.current.isWarningOpen).toBe(false);

      // Advance 10 more minutes (total 23m from start, but 10m from reset) - warning should not be open
      act(() => {
        vi.advanceTimersByTime(10 * 60 * 1000);
      });
      expect(result.current.isWarningOpen).toBe(false);
    });

    it('triggers automatic sign-out after 15 minutes of inactivity', () => {
      const onTimeoutMock = vi.fn();
      renderHook(() => useIdleTimeout({ onTimeout: onTimeoutMock }));

      // Advance to full 15 minutes
      act(() => {
        vi.advanceTimersByTime(DEFAULT_IDLE_TIMEOUT_MS);
      });

      expect(onTimeoutMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Idle Timeout Modal Component', () => {
    it('renders dialog and countdown correctly when open', () => {
      render(
        <IdleTimeoutModal
          isOpen={true}
          secondsRemaining={75}
          onStaySignedIn={() => {}}
          onSignOut={() => {}}
        />
      );

      expect(screen.getByText('Session Inactivity Warning')).toBeInTheDocument();
      expect(screen.getByText('1:15')).toBeInTheDocument();
      expect(screen.getByText('Stay Signed In')).toBeInTheDocument();
      expect(screen.getByText('Log Out Now')).toBeInTheDocument();
    });

    it('fires callbacks on user interaction', () => {
      const onStay = vi.fn();
      const onOut = vi.fn();

      render(
        <IdleTimeoutModal
          isOpen={true}
          secondsRemaining={45}
          onStaySignedIn={onStay}
          onSignOut={onOut}
        />
      );

      fireEvent.click(screen.getByText('Stay Signed In'));
      expect(onStay).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText('Log Out Now'));
      expect(onOut).toHaveBeenCalledTimes(1);
    });
  });

  describe('Route Guards (ProtectedRoute)', () => {
    it('redirects unauthenticated users to /login', () => {
      useAuthStore.setState({ session: null, user: null, loading: false });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/login" element={<div>LOGIN_PAGE</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>PROTECTED_CONTENT</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('LOGIN_PAGE')).toBeInTheDocument();
      expect(screen.queryByText('PROTECTED_CONTENT')).not.toBeInTheDocument();
    });

    it('displays Access Denied when logged-in user is not staff', () => {
      useAuthStore.setState({
        session: { access_token: 'cust.token' },
        profile: { is_staff: false, roles: ['customer'] },
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <ProtectedRoute>
            <div>PROTECTED_CONTENT</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('PROTECTED_CONTENT')).not.toBeInTheDocument();
    });

    it('allows authorized staff members through', () => {
      useAuthStore.setState({
        session: { access_token: 'staff.token' },
        profile: { is_staff: true, roles: ['admin'] },
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <ProtectedRoute>
            <div>PROTECTED_CONTENT</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('PROTECTED_CONTENT')).toBeInTheDocument();
    });

    it('enforces specific role requirements on protected sections', () => {
      useAuthStore.setState({
        session: { access_token: 'tech.token' },
        profile: { is_staff: true, roles: ['technician'], is_super_admin: false },
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/admin-only']}>
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <div>ADMIN_ONLY_CONTENT</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Role Restricted')).toBeInTheDocument();
      expect(screen.queryByText('ADMIN_ONLY_CONTENT')).not.toBeInTheDocument();
    });
  });
});
