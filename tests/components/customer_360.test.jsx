import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Customer360Card from '../../components/Customer360Card.jsx';

describe('Customer360Card (D7)', () => {
  const sampleOrder = {
    id: 'ORD-501',
    customer: 'Tan Kia Yu',
    phone: '+6012-3456789',
    location: 'Klang Valley',
    isRepeatFault: false,
  };

  it('masks phone number by default and reveals on button click', () => {
    render(<Customer360Card order={sampleOrder} customer={{ name: 'Tan Kia Yu' }} />);

    expect(screen.getByText(/Customer 360 Brief/i)).toBeInTheDocument();
    expect(screen.getByText(/Access is logged/i)).toBeInTheDocument();
    expect(screen.getByText(/\+6012 •••• 789/i)).toBeInTheDocument();

    const revealBtn = screen.getByText(/Reveal/i);
    fireEvent.click(revealBtn);

    expect(screen.getByText(/Revealed \(Audited\)/i)).toBeInTheDocument();

    // Verify zero emoji characters
    const textContent = document.body.textContent || '';
    expect(textContent).not.toMatch(/[\uD83C-\uDBFF\uDC00-\uDFFF]/);
  });

  it('triggers next action callbacks correctly', () => {
    const handleAction = vi.fn();
    render(
      <Customer360Card
        order={sampleOrder}
        customer={{ name: 'Tan Kia Yu' }}
        onActionClick={handleAction}
      />
    );

    const routeEtaBtn = screen.getByText(/Confirm Route ETA/i);
    fireEvent.click(routeEtaBtn);
    expect(handleAction).toHaveBeenCalledWith('route_eta');
  });

  it('renders AI Customer Intelligence evaluation for returning customers, value tier, and scam risk', () => {
    render(
      <Customer360Card
        order={sampleOrder}
        customer={{ name: 'Tan Kia Yu', lifetimeOrders: 3, lifetimePaid: 'RM 850.00' }}
      />
    );

    expect(screen.getByText(/AI Customer Intelligence Evaluation/i)).toBeInTheDocument();
    expect(screen.getByText(/Returning Likelihood/i)).toBeInTheDocument();
    expect(screen.getByText(/92% High/i)).toBeInTheDocument();
    expect(screen.getByText(/Value Tier/i)).toBeInTheDocument();
    expect(screen.getByText(/High-Value VIP/i)).toBeInTheDocument();
    expect(screen.getByText(/Scam Risk/i)).toBeInTheDocument();
    expect(screen.getByText(/Low \(0\.04\) Clean/i)).toBeInTheDocument();
  });
});
