import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomerChatSubpage from '../../components/CustomerChatSubpage.jsx';
import FinancialReportModal from '../../components/FinancialReportModal.jsx';

describe('Customer Chat Subpage & Financial Reports', () => {
  it('renders Customer Chat Subpage with customer inquiries list, message thread, and quick templates', () => {
    render(<CustomerChatSubpage />);

    expect(screen.getByText(/Customer Inquiries/i)).toBeInTheDocument();
    expect(screen.getByText(/WhatsApp Active/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search customer, #ORD, phone\.\.\./i)).toBeInTheDocument();

    // Verify seeded customer thread displays
    expect(screen.getAllByText(/Tan Kia Yu/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Samsung fridge stopped cooling properly/i)).toBeInTheDocument();

    // Test sending a customer support reply
    const input = screen.getByPlaceholderText(/Reply to Tan Kia Yu via WhatsApp Bridge\.\.\./i);
    fireEvent.change(input, { target: { value: 'Your technician is arriving in 5 minutes.' } });
    const sendBtn = screen.getByText('Send');
    fireEvent.click(sendBtn);

    expect(screen.getAllByText('Your technician is arriving in 5 minutes.').length).toBeGreaterThanOrEqual(1);

    // Verify zero emoji characters
    const textContent = document.body.textContent || '';
    expect(textContent).not.toMatch(/[\uD83C-\uDBFF\uDC00-\uDFFF]/);
  });

  it('renders Financial Report Modal with Balance Sheet, P&L, Cash Flow, and verified balance matching', () => {
    render(<FinancialReportModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Financial Statements & Balance Sheet Report/i)).toBeInTheDocument();
    expect(screen.getByText(/STATEMENT OF FINANCIAL POSITION \(BALANCE SHEET\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Balanced: Assets = Liabilities \+ Equity/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Current Assets/i)).toBeInTheDocument();
    expect(screen.getByText(/TOTAL ASSETS/i)).toBeInTheDocument();
    expect(screen.getByText(/TOTAL LIABILITIES & EQUITY/i)).toBeInTheDocument();

    // Switch statement to Income Statement (P&L)
    const pnlTab = screen.getByText(/Income Statement \(P&L\)/i);
    fireEvent.click(pnlTab);
    expect(screen.getByText(/STATEMENT OF PROFIT AND LOSS/i)).toBeInTheDocument();
    expect(screen.getByText(/GROSS SERVICE REVENUE/i)).toBeInTheDocument();
    expect(screen.getByText(/NET PROFIT AFTER TAX/i)).toBeInTheDocument();

    // Switch to Annual Horizon
    const annualBtn = screen.getByText(/Annual Financial Year/i);
    fireEvent.click(annualBtn);
    expect(screen.getByText(/FY2026 YTD Run-Rate/i)).toBeInTheDocument();

    // Switch to Cash Flow Statement
    const cashFlowTab = screen.getByText(/Cash Flow Statement/i);
    fireEvent.click(cashFlowTab);
    expect(screen.getByText(/STATEMENT OF CASH FLOWS/i)).toBeInTheDocument();

    // Switch to Ratios
    const ratiosTab = screen.getByText(/Financial Health & Ratios/i);
    fireEvent.click(ratiosTab);
    expect(screen.getByText(/Current Ratio/i)).toBeInTheDocument();
    expect(screen.getByText(/Quick \(Acid-Test\) Ratio/i)).toBeInTheDocument();

    // Verify zero emoji characters
    const modalText = document.body.textContent || '';
    expect(modalText).not.toMatch(/[\uD83C-\uDBFF\uDC00-\uDFFF]/);
  });

  it('handles CSV export and print triggers in Financial Report Modal', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<FinancialReportModal isOpen={true} onClose={vi.fn()} />);

    const printBtn = screen.getByText(/Print \/ PDF/i);
    fireEvent.click(printBtn);
    expect(printSpy).toHaveBeenCalled();

    const exportCsvBtn = screen.getByText(/Export CSV/i);
    fireEvent.click(exportCsvBtn);
  });
});
