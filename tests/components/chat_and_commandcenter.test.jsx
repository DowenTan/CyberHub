import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TechnicianChatModal from '../../components/TechnicianChatModal.jsx';
import { useTechChatStore } from '../../store/useTechChatStore.js';
import { useDashboardStore } from '../../store/useDashboardStore.js';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' }),
  };
});

describe('TechnicianChatModal Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    useDashboardStore.setState({
      technicians: [
        {
          id: 101,
          code: 'T-101',
          name: 'Sarah Izzah',
          specialty: 'HVAC Master',
          status: 'AVAILABLE',
          zone: 'Klang Valley',
          avatar: '/logo1.png',
        },
      ],
    });

    useTechChatStore.setState({
      isOpen: true,
      activeTech: {
        id: 101,
        code: 'T-101',
        name: 'Sarah Izzah',
        specialty: 'HVAC Master',
        status: 'AVAILABLE',
        zone: 'Klang Valley',
        avatar: '/logo1.png',
      },
      threads: {},
    });
  });

  it('renders Open Chat Page button (replacing cipher button) and reset buttons', () => {
    render(
      <MemoryRouter>
        <TechnicianChatModal />
      </MemoryRouter>
    );

    // Open chat page button
    const chatBtn = screen.getByTitle('Open dedicated full Chats page');
    expect(chatBtn).toBeInTheDocument();
    expect(screen.getByText('Chats')).toBeInTheDocument();

    // Reset buttons
    const resetPosBtn = screen.getByTitle('Reset position to default bottom-right');
    expect(resetPosBtn).toBeInTheDocument();
    expect(screen.getByText('Reset Pos')).toBeInTheDocument();

    const resetSizeBtn = screen.getByTitle('Reset size to default minimum (460x620)');
    expect(resetSizeBtn).toBeInTheDocument();
    expect(screen.getByText('Reset Size')).toBeInTheDocument();

    // Verify Cipher button is no longer present in header
    expect(screen.queryByTitle('Inspect Raw Encrypted Cipher Payload')).not.toBeInTheDocument();
  });

  it('navigates to /chats and closes modal when Chats button is clicked', () => {
    render(
      <MemoryRouter>
        <TechnicianChatModal />
      </MemoryRouter>
    );

    const chatBtn = screen.getByTitle('Open dedicated full Chats page');
    fireEvent.click(chatBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/chats', { state: { selectedTechCode: 'T-101' } });
    expect(useTechChatStore.getState().isOpen).toBe(false);
  });

  it('resets position and size when reset buttons are clicked', () => {
    localStorage.setItem('cyberhub_tech_chat_pos', JSON.stringify({ x: 100, y: 150 }));
    localStorage.setItem('cyberhub_tech_chat_size', JSON.stringify({ width: 600, height: 750 }));

    render(
      <MemoryRouter>
        <TechnicianChatModal />
      </MemoryRouter>
    );

    const resetPosBtn = screen.getByText('Reset Pos');
    fireEvent.click(resetPosBtn);
    expect(localStorage.getItem('cyberhub_tech_chat_pos')).toBeNull();

    const resetSizeBtn = screen.getByText('Reset Size');
    fireEvent.click(resetSizeBtn);
    expect(localStorage.getItem('cyberhub_tech_chat_size')).toBeNull();
  });
});

describe('AdminCopilot Resizable and Reset Size', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders Reset Size button in AdminCopilot and clears stored size on reset', async () => {
    const { default: AdminCopilot } = await import('../../components/AdminCopilot.jsx');
    localStorage.setItem('cyberhub_copilot_size', JSON.stringify({ width: 500, height: 650 }));

    render(
      <MemoryRouter>
        <AdminCopilot />
      </MemoryRouter>
    );

    // Verify Reset Size button is in the header
    const resetSizeBtn = screen.getByTitle('Reset Copilot size to default minimum (360x500)');
    expect(resetSizeBtn).toBeInTheDocument();

    fireEvent.click(resetSizeBtn);
    expect(localStorage.getItem('cyberhub_copilot_size')).toBeNull();
  });
});

describe('SmartOrders Standard View Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('merges urgency, priority, and partsStock under Client & Location in standard view', async () => {
    const { default: SmartOrders } = await import('../../pages/SmartOrders.jsx');

    useDashboardStore.setState({
      orders: [
        {
          id: 'ORD-999',
          customer: 'David Tan',
          location: 'Petaling Jaya',
          appliance: 'Refrigerator',
          issue: 'Compressor clicking sound',
          urgency: 'CRITICAL',
          priority: 'Critical',
          partsStock: 'Van Stocked',
          status: 'PENDING',
          cost: 'RM 220.00',
          time: '2026-11-14 10:00',
          dateCategory: 'Today',
        },
      ],
    });

    render(
      <MemoryRouter>
        <SmartOrders />
      </MemoryRouter>
    );

    // In standard view (default):
    // 1. Client & Location cell contains the merged badges
    expect(screen.getByText('David Tan')).toBeInTheDocument();
    expect(screen.getByText('Petaling Jaya')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('Van Stocked')).toBeInTheDocument();

    // 2. Standalone column headers for Urgency, Priority, Parts Stock, and Status should be hidden in standard view
    const colHeaders = screen.getAllByRole('columnheader').map((th) => th.textContent);
    expect(colHeaders).not.toContain('Urgency');
    expect(colHeaders).not.toContain('Priority');
    expect(colHeaders).not.toContain('Parts Stock');
    expect(colHeaders).not.toContain('Status');
    expect(colHeaders.some((h) => h.includes('Matched Tech & Status'))).toBe(true);
  });

  it('sanitizes auto-dispatched to real tech, merges status into matched tech, and uses icon dispatch/track with tooltips', async () => {
    const { default: SmartOrders } = await import('../../pages/SmartOrders.jsx');

    useDashboardStore.setState({
      orders: [
        {
          id: 'ORD-101',
          customer: 'Amina Kassim',
          location: 'Shah Alam',
          appliance: 'Washing Machine',
          issue: 'Drum spinning error',
          urgency: 'NORMAL',
          priority: 'Normal',
          partsStock: 'Van Stocked',
          status: 'PENDING',
          assignedTech: 'Auto-Dispatched Field Unit',
          matchedTech: 'Auto-Dispatched',
          cost: 'RM 190.00',
          time: '2026-11-14 11:00',
          dateCategory: 'Today',
        },
        {
          id: 'ORD-102',
          customer: 'Liam Chen',
          location: 'Subang Jaya',
          appliance: 'Air Conditioner',
          issue: 'Sensor flashing red',
          urgency: 'NORMAL',
          priority: 'Normal',
          partsStock: 'Van Stocked',
          status: 'DISPATCHED',
          assignedTech: 'Jason Rahman',
          matchedTech: 'Jason Rahman',
          cost: 'RM 250.00',
          time: '2026-11-14 11:30',
          dateCategory: 'Today',
        },
      ],
    });

    render(
      <MemoryRouter>
        <SmartOrders />
      </MemoryRouter>
    );

    // 1. Matched tech should not display 'Auto-Dispatched'
    expect(screen.queryByText('Auto-Dispatched Field Unit')).not.toBeInTheDocument();
    expect(screen.queryByText('Auto-Dispatched')).not.toBeInTheDocument();
    expect(screen.getByText('Satou Kenji')).toBeInTheDocument();
    expect(screen.getByText('Jason Rahman')).toBeInTheDocument();

    // 2. Status pills rendered inside matched tech
    expect(screen.getAllByText('Pending Dispatch').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('In Route')).toBeInTheDocument();

    // 3. Dispatch and Live Track buttons are icons with tooltips
    const dispatchBtn = screen.getByTitle('Smart Dispatch Technician');
    expect(dispatchBtn).toBeInTheDocument();
    expect(dispatchBtn).toHaveClass('btn-dispatch-icon');

    const liveTrackBtn = screen.getByTitle('Live GPS Fleet Tracking');
    expect(liveTrackBtn).toBeInTheDocument();
    expect(liveTrackBtn).toHaveClass('btn-livetrack-icon');

    // 4. Verify no chat button inside tech cell, but present in table-action-btns
    const techCells = document.querySelectorAll('.tech-cell');
    expect(techCells.length).toBeGreaterThan(0);
    techCells.forEach((tc) => {
      expect(tc.querySelector('.btn-action-chat')).toBeNull();
    });

    const actionChatBtns = document.querySelectorAll('.table-action-btns .btn-action-chat');
    expect(actionChatBtns.length).toBeGreaterThan(0);
  });

  it('opens and interacts with advanced features in Smart Dispatch and Live Tracking consoles', async () => {
    const { default: SmartOrders } = await import('../../pages/SmartOrders.jsx');

    useDashboardStore.setState({
      orders: [
        {
          id: 'ORD-201',
          customer: 'Kamal Hasan',
          location: 'Petaling Jaya',
          appliance: 'Bosch Dishwasher',
          issue: 'Drain pump blockage',
          urgency: 'NORMAL',
          priority: 'Normal',
          partsStock: 'Van Stocked',
          status: 'PENDING',
          assignedTech: 'Sarah Izzah',
          matchedTech: 'Sarah Izzah',
          cost: 'RM 180.00',
          time: '2026-11-14 12:00',
          dateCategory: 'Today',
        },
        {
          id: 'ORD-202',
          customer: 'Grace Ooi',
          location: 'Kuala Lumpur',
          appliance: 'Samsung Refrigerator',
          issue: 'Inverter cooling fault',
          urgency: 'URGENT',
          priority: 'High',
          partsStock: 'Van Stocked',
          status: 'DISPATCHED',
          assignedTech: 'Jason Rahman',
          matchedTech: 'Jason Rahman',
          cost: 'RM 280.00',
          time: '2026-11-14 12:30',
          dateCategory: 'Today',
        },
      ],
      technicians: [
        { name: 'Sarah Izzah', code: 'T-001', zone: 'Kuala Lumpur', status: 'AVAILABLE' },
        { name: 'Jason Rahman', code: 'T-002', zone: 'Petaling Jaya', status: 'ON_JOB' },
        { name: 'Kelvin Kaur', code: 'T-004', zone: 'Penang', status: 'AVAILABLE' },
      ],
    });

    render(
      <MemoryRouter>
        <SmartOrders />
      </MemoryRouter>
    );

    // 1. Open Smart Dispatch Console
    const dispatchBtn = screen.getByTitle('Smart Dispatch Technician');
    fireEvent.click(dispatchBtn);

    expect(screen.getByText('AI Smart Dispatcher & Routing')).toBeInTheDocument();
    expect(screen.getByText('Assign Certified Specialist')).toBeInTheDocument();
    expect(screen.getByText('Required Van Component')).toBeInTheDocument();
    expect(screen.getByText('Routing & Dispatch Strategy')).toBeInTheDocument();
    expect(screen.getByText(/Fastest/)).toBeInTheDocument();
    expect(screen.getByText(/Eco-Smart/)).toBeInTheDocument();
    expect(screen.getByText(/Code Red/)).toBeInTheDocument();

    // Select Eco-Smart route
    fireEvent.click(screen.getByText(/Eco-Smart/));

    // Select a different technician
    const techSelect = screen.getByDisplayValue(/Sarah Izzah/);
    fireEvent.change(techSelect, { target: { value: 'Kelvin Kaur' } });

    // Confirm dispatch
    const confirmDispatchBtn = screen.getByText('Confirm Smart Dispatch');
    fireEvent.click(confirmDispatchBtn);

    // 2. Open Live Tracking Console
    const liveTrackBtn = screen.getByTitle('Live GPS Fleet Tracking');
    fireEvent.click(liveTrackBtn);

    expect(screen.getByText('Live Fleet GPS Radar')).toBeInTheDocument();
    expect(screen.getByText('Live Speed')).toBeInTheDocument();
    expect(screen.getByText('Dynamic ETA')).toBeInTheDocument();
    expect(screen.getByText('Distance Traveled')).toBeInTheDocument();
    expect(screen.getByText('Audio Ping')).toBeInTheDocument();
    expect(screen.getByText('Mark Arrived On-Site')).toBeInTheDocument();
    expect(screen.getByText('Mark Job Completed')).toBeInTheDocument();

    // Trigger Audio Ping
    const audioPingBtn = screen.getByText('Audio Ping');
    fireEvent.click(audioPingBtn);

    // Close Live Radar
    const closeRadarBtn = screen.getByText('Close Radar');
    fireEvent.click(closeRadarBtn);
    expect(screen.queryByText('Live Fleet GPS Radar')).not.toBeInTheDocument();
  });
});
