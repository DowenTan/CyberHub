import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import OpsBriefingCard from '../../components/OpsBriefingCard.jsx';
import * as api from '../../lib/api.js';

describe('D1: Daily Operations Briefing Component', () => {
  const mockBriefing = {
    id: 'briefing_test_123',
    scope_type: 'all_branches',
    briefing_date: '2026-11-14',
    generated_at: '2026-11-14 08:00:00 MYT',
    source: 'deterministic_template',
    model: 'rules_facts_v1',
    facts: [
      { id: 'backlog_pending', label: 'Pending Dispatch', value: 4, unit: 'orders', baseline: 'Avg 4-6 orders', link: '/smart-orders' },
      { id: 'urgent_unassigned', label: 'Urgent Unassigned Repairs', value: 2, unit: 'orders', baseline: 'Target: 0', link: '/smart-orders?urgency=URGENT' },
      { id: 'technicians_online', label: 'Field Techs Available', value: 5, unit: 'technicians', baseline: 'Total Fleet: 8', link: '/technicians' },
    ],
    narrative: {
      headline: '2 urgent orders require dispatch • 5 field technicians online across Klang Valley',
      priorities: [
        {
          title: 'Dispatch Critical & Urgent Queue',
          why: '2 high-priority customer repairs waiting for technician assignment.',
          fact_ids: ['urgent_unassigned', 'backlog_pending'],
          action: { type: 'open_filter', label: 'Review Urgent Orders', params: { path: '/smart-orders', filter: 'urgent' } },
        },
        {
          title: 'Balance Field Roster & Zone Coverage',
          why: '5 active technicians deployed with active GPS telemetry.',
          fact_ids: ['technicians_online'],
          action: { type: 'open_page', label: 'View Field Roster', params: { path: '/technicians' } },
        },
      ],
      watchlist: [
        { text: 'Queue volume within nominal thresholds. All zones operating normally.', fact_ids: ['backlog_pending'] },
      ],
      good_news: [
        { text: '5 certified repair specialists active with live GPS telemetry.', fact_ids: ['technicians_online'] },
      ],
    },
    is_stale: false,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, 'getOpsBriefing').mockResolvedValue(mockBriefing);
    vi.spyOn(api, 'submitBriefingFeedback').mockResolvedValue({ status: 'recorded' });
    vi.spyOn(api, 'regenerateOpsBriefing').mockResolvedValue({
      ...mockBriefing,
      id: 'briefing_regenerated_456',
    });
  });

  it('renders daily operations briefing with verified facts and priorities', async () => {
    render(
      <BrowserRouter>
        <OpsBriefingCard />
      </BrowserRouter>
    );

    // Headline and title
    await waitFor(() => {
      expect(screen.getByText('Daily Operations Briefing')).toBeInTheDocument();
      expect(screen.getByText(/Generated 08:00 MYT · AI-assisted/)).toBeInTheDocument();
      expect(screen.getByText(/2 urgent orders require dispatch/)).toBeInTheDocument();
    });

    // Priorities
    expect(screen.getByText('Dispatch Critical & Urgent Queue')).toBeInTheDocument();
    expect(screen.getByText('Review Urgent Orders')).toBeInTheDocument();
    expect(screen.getByText('Balance Field Roster & Zone Coverage')).toBeInTheDocument();
  });

  it('expands facts provenance when clicking "Why am I seeing this?"', async () => {
    render(
      <BrowserRouter>
        <OpsBriefingCard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Why am I seeing this/)).toBeInTheDocument();
    });

    // Facts are initially collapsed
    expect(screen.queryByText('Pending Dispatch')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText(/Why am I seeing this/));

    // Facts now visible
    expect(screen.getByText('Pending Dispatch')).toBeInTheDocument();
    expect(screen.getByText('Urgent Unassigned Repairs')).toBeInTheDocument();
    expect(screen.getByText('Field Techs Available')).toBeInTheDocument();
  });

  it('handles feedback voting (thumbs up/down)', async () => {
    render(
      <BrowserRouter>
        <OpsBriefingCard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTitle('Helpful briefing')).toBeInTheDocument();
    });

    // Click thumbs up
    fireEvent.click(screen.getByTitle('Helpful briefing'));
    expect(api.submitBriefingFeedback).toHaveBeenCalledWith('briefing_test_123', 'up');

    // Click thumbs down
    fireEvent.click(screen.getByTitle('Not helpful / inaccurate'));
    expect(api.submitBriefingFeedback).toHaveBeenCalledWith('briefing_test_123', 'down');
  });

  it('handles refresh regeneration', async () => {
    render(
      <BrowserRouter>
        <OpsBriefingCard orders={[{ id: '1' }]} technicians={[{ id: 't1' }]} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTitle('Regenerate ops briefing')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Regenerate ops briefing'));
    await waitFor(() => {
      expect(api.regenerateOpsBriefing).toHaveBeenCalled();
    });
  });
});
