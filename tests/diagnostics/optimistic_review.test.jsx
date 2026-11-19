import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAssessments } from '../../hooks/useAssessments.js';
import * as api from '../../lib/api.js';

describe('useAssessments Hook Optimistic Review & Rollback', () => {
  it('optimistically updates review_status and rolls back on server 500 error', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const mockDetail = {
      id: 'DIAG-ROLLBACK',
      booking_number: 'BK-999',
      review_status: 'pending',
      probable_causes: [],
      safety_flags: [],
      estimate: {},
    };

    // Prepopulate query cache
    queryClient.setQueryData(['diagnosticDetail', 'DIAG-ROLLBACK'], mockDetail);
    queryClient.setQueryData(['diagnosticsQueue', expect.anything()], {
      items: [mockDetail],
      next_cursor: null,
    });

    // Mock API review call to delay slightly then reject with 500
    vi.spyOn(api, 'reviewDiagnostic').mockImplementationOnce(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('API 500 Internal Server Error')), 50)
        )
    );

    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useAssessments(), { wrapper });

    act(() => {
      result.current.setSelectedId('DIAG-ROLLBACK');
    });

    // Trigger review mutation
    act(() => {
      result.current.reviewMutation.mutate({
        id: 'DIAG-ROLLBACK',
        review_status: 'approved',
      });
    });

    // Optimistic state was applied
    await waitFor(() => {
      const intermediateData = queryClient.getQueryData(['diagnosticDetail', 'DIAG-ROLLBACK']);
      expect(intermediateData?.review_status).toBe('approved');
    });

    // Wait for mutation to fail and roll back
    await waitFor(() => {
      expect(result.current.reviewMutation.isError).toBe(true);
    });
    await waitFor(() => {
      expect(result.current.reviewMutation.isError).toBe(true);
    });

    // Verified rollback to 'pending'
    const rolledBackData = queryClient.getQueryData(['diagnosticDetail', 'DIAG-ROLLBACK']);
    expect(rolledBackData?.review_status).toBe('pending');

    // Toast shows error message
    expect(result.current.toast?.type).toBe('error');
    expect(result.current.toast?.message).toContain('API 500 Internal Server Error');
  });
});
