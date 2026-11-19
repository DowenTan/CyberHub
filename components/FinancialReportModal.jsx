import React, { useState } from 'react';

/**
 * Detailed Quarterly & Annual Financial Statements Report Modal.
 * Includes complete accounting statements:
 * - Balance Sheet (Statement of Financial Position)
 * - Income Statement (Profit & Loss / P&L)
 * - Cash Flow Statement
 * - Key Financial Health Ratios & Audit Notes
 * - Combined Full Statement optimized for clean PDF / A4 print
 * 
 * Strict Zero Emojis - Pure SVG icons only.
 */

const PERIODS = {
  quarterly: [
    { id: 'Q1_2026', label: 'Q1 2026 (Jan – Mar)', desc: 'Actual Audited' },
    { id: 'Q2_2026', label: 'Q2 2026 (Apr – Jun)', desc: 'Actual Audited' },
    { id: 'Q3_2026', label: 'Q3 2026 (Jul – Sep)', desc: 'Actual Closed' },
    { id: 'Q4_2026', label: 'Q4 2026 (Oct – Dec)', desc: 'Projected Forecast' },
  ],
  annual: [
    { id: 'FY2024', label: 'FY2024 Full Year', desc: 'Audited Statements' },
    { id: 'FY2025', label: 'FY2025 Full Year', desc: 'Audited Statements' },
    { id: 'FY2026', label: 'FY2026 YTD Run-Rate', desc: 'Live Management Accounts' },
    { id: 'FY2027', label: 'FY2027 Strategic Plan', desc: 'Board Approved Forecast' },
  ],
};

// Financial Data Model across Periods (Figures in MYR)
const FINANCIAL_DATA = {
  Q3_2026: {
    periodTitle: 'Quarter 3, 2026 (July 1 – September 30, 2026)',
    status: 'CLOSED & VERIFIED',
    revenue: 412500,
    cogs: 172400,
    grossProfit: 240100,
    opex: 148200,
    ebit: 91900,
    tax: 18380,
    netIncome: 73520,
    // Balance Sheet Items
    cash: 512400,
    receivables: 118500,
    inventory: 264200,
    prepaids: 38000,
    totalCurrentAssets: 933100,
    ppeNet: 685400,
    intangibles: 120000,
    totalNonCurrentAssets: 805400,
    totalAssets: 1738500,
    payables: 148500,
    accruedExpenses: 89400,
    taxPayable: 29800,
    deferredRevenue: 52000,
    totalCurrentLiabilities: 319700,
    longTermLease: 315000,
    termLoan: 160000,
    totalNonCurrentLiabilities: 475000,
    totalLiabilities: 794700,
    shareCapital: 500000,
    retainedEarnings: 370280,
    currentSurplus: 73520,
    totalEquity: 943800,
    totalLiabAndEquity: 1738500,
  },
  FY2026: {
    periodTitle: 'Financial Year 2026 (Live YTD & Full Year Projected)',
    status: 'AUDIT IN PROGRESS',
    revenue: 1685000,
    cogs: 698000,
    grossProfit: 987000,
    opex: 612000,
    ebit: 375000,
    tax: 75000,
    netIncome: 300000,
    // Balance Sheet Items
    cash: 585000,
    receivables: 142000,
    inventory: 285000,
    prepaids: 45000,
    totalCurrentAssets: 1057000,
    ppeNet: 720000,
    intangibles: 150000,
    totalNonCurrentAssets: 870000,
    totalAssets: 1927000,
    payables: 165000,
    accruedExpenses: 98000,
    taxPayable: 38000,
    deferredRevenue: 62000,
    totalCurrentLiabilities: 363000,
    longTermLease: 290000,
    termLoan: 140000,
    totalNonCurrentLiabilities: 430000,
    totalLiabilities: 793000,
    shareCapital: 500000,
    retainedEarnings: 334000,
    currentSurplus: 300000,
    totalEquity: 1134000,
    totalLiabAndEquity: 1927000,
  },
};

export default function FinancialReportModal({ isOpen, onClose }) {
  const [horizon, setHorizon] = useState('quarterly'); // 'quarterly' | 'annual'
  const [selectedPeriod, setSelectedPeriod] = useState('Q3_2026');
  const [activeStatement, setActiveStatement] = useState('balance_sheet'); // 'balance_sheet' | 'income' | 'cash_flow' | 'ratios' | 'combined'

  if (!isOpen) return null;

  const data = FINANCIAL_DATA[selectedPeriod] || FINANCIAL_DATA.Q3_2026;

  const formatMYR = (val) => {
    return `RM ${Number(val).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrintCombined = () => {
    setActiveStatement('combined');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleExportCsv = () => {
    const csvRows = [
      ['CyberHub Financial Report', data.periodTitle],
      ['Statement', activeStatement.toUpperCase()],
      ['Generated On', new Date().toISOString().slice(0, 10)],
      [],
      ['Metric / Account Item', 'Amount (MYR)'],
      ['Total Current Assets', data.totalCurrentAssets],
      ['Total Non-Current Assets', data.totalNonCurrentAssets],
      ['TOTAL ASSETS', data.totalAssets],
      ['Total Current Liabilities', data.totalCurrentLiabilities],
      ['Total Non-Current Liabilities', data.totalNonCurrentLiabilities],
      ['TOTAL LIABILITIES', data.totalLiabilities],
      ['TOTAL SHAREHOLDERS EQUITY', data.totalEquity],
      ['TOTAL LIABILITIES & EQUITY', data.totalLiabAndEquity],
      [],
      ['Gross Service Revenue', data.revenue],
      ['Cost of Goods Sold (COGS)', data.cogs],
      ['Gross Profit', data.grossProfit],
      ['Operating Expenses (OPEX)', data.opex],
      ['Operating Profit (EBIT)', data.ebit],
      ['Net Profit After Tax', data.netIncome],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_report_${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reusable sub-statement renderers
  const renderBalanceSheet = (isCombined = false) => (
    <div
      className="printable-statement"
      style={{
        background: '#051133',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: isCombined ? '24px' : '0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #38bdf8', paddingBottom: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>
            STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)
          </div>
          <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '2px' }}>
            Standard Accounting Format (MFRS / IFRS Compliant) · Currency: Malaysian Ringgit (MYR)
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', color: '#cbd5e1' }}>
          <div>As of <strong style={{ color: '#fff' }}>{data.periodTitle}</strong></div>
          <div style={{ color: '#2ed573', fontWeight: 600, marginTop: '2px' }}>Balanced: Assets = Liabilities + Equity</div>
        </div>
      </div>

      {/* Balance Sheet 2-Column Grid (Assets vs Liabilities & Equity) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Column: ASSETS */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', borderBottom: '1px solid rgba(56, 189, 248, 0.3)', paddingBottom: '4px', marginBottom: '8px' }}>
            ASSETS
          </div>

          {/* Current Assets */}
          <div style={{ fontSize: '11.5px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginTop: '6px' }}>
            Current Assets
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px', marginTop: '4px', fontSize: '11.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>Cash & Bank Balances (Maybank/CIMB)</span>
              <span style={{ fontFamily: 'monospace' }}>{formatMYR(data.cash)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>Trade Accounts Receivable</span>
              <span style={{ fontFamily: 'monospace' }}>{formatMYR(data.receivables)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>Van Stock & Central Hub Spare-Parts</span>
              <span style={{ fontFamily: 'monospace' }}>{formatMYR(data.inventory)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>Prepaid Operating Expenses & Deposits</span>
              <span style={{ fontFamily: 'monospace' }}>{formatMYR(data.prepaids)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 700, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '4px', marginTop: '2px' }}>
              <span>Total Current Assets</span>
              <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{formatMYR(data.totalCurrentAssets)}</span>
            </div>
          </div>

          {/* Non-Current Assets */}
          <div style={{ fontSize: '11.5px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginTop: '14px' }}>
            Non-Current (Fixed) Assets
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px', marginTop: '4px', fontSize: '11.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>Service Fleet Vehicles & Tooling (Net of Depr.)</span>
              <span style={{ fontFamily: 'monospace' }}>{formatMYR(data.ppeNet)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>Intellectual Property & AI Dispatch Systems</span>
              <span style={{ fontFamily: 'monospace' }}>{formatMYR(data.intangibles)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 700, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '4px', marginTop: '2px' }}>
              <span>Total Non-Current Assets</span>
              <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{formatMYR(data.totalNonCurrentAssets)}</span>
            </div>
          </div>

          {/* Total Assets Summary Box */}
          <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '10px 12px', borderRadius: '6px', marginTop: '20px', fontWeight: 800, fontSize: '13px', color: '#fff' }}>
            <span>TOTAL ASSETS</span>
            <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{formatMYR(data.totalAssets)}</span>
          </div>
        </div>

        {/* Right Column: LIABILITIES & SHAREHOLDERS' EQUITY */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#ff7300', textTransform: 'uppercase', borderBottom: '1px solid rgba(255, 115, 0, 0.3)', paddingBottom: '4px', marginBottom: '8px' }}>
            LIABILITIES & SHAREHOLDERS' EQUITY
          </div>

          {/* Current Liabilities */}
          <div style={{ fontSize: '11.5px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginTop: '6px' }}>
            Current Liabilities
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px', marginTop: '4px', fontSize: '11.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>Trade Accounts Payable (OEM Parts Vendors)</span>
              <span style={{ fontFamily: 'monospace' }}>{formatMYR(data.payables)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>Accrued Tech Wages & Commissions</span>
              <span style={{ fontFamily: 'monospace' }}>{formatMYR(data.accruedExpenses)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>Sales & Service Tax (SST 8%) Provision</span>
              <span style={{ fontFamily: 'monospace' }}>{formatMYR(data.taxPayable)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>Deferred Warranty & Service Revenue</span>
              <span style={{ fontFamily: 'monospace' }}>{formatMYR(data.deferredRevenue)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 700, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '4px', marginTop: '2px' }}>
              <span>Total Current Liabilities</span>
              <span style={{ fontFamily: 'monospace', color: '#ff7300' }}>{formatMYR(data.totalCurrentLiabilities)}</span>
            </div>
          </div>

          {/* Non-Current Liabilities */}
          <div style={{ fontSize: '11.5px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginTop: '14px' }}>
            Non-Current (Long-Term) Liabilities
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px', marginTop: '4px', fontSize: '11.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>Long-Term Fleet Vehicle Lease Obligations</span>
              <span style={{ fontFamily: 'monospace' }}>{formatMYR(data.longTermLease)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>SME Bank Term Expansion Loan</span>
              <span style={{ fontFamily: 'monospace' }}>{formatMYR(data.termLoan)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 700, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '4px', marginTop: '2px' }}>
              <span>Total Non-Current Liabilities</span>
              <span style={{ fontFamily: 'monospace', color: '#ff7300' }}>{formatMYR(data.totalNonCurrentLiabilities)}</span>
            </div>
          </div>

          {/* Shareholders' Equity */}
          <div style={{ fontSize: '11.5px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginTop: '14px' }}>
            Shareholders' Equity
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px', marginTop: '4px', fontSize: '11.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>Paid-Up Ordinary Share Capital</span>
              <span style={{ fontFamily: 'monospace' }}>{formatMYR(data.shareCapital)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>Retained Earnings (Accumulated Reserves)</span>
              <span style={{ fontFamily: 'monospace' }}>{formatMYR(data.retainedEarnings)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>Current Period Operating Surplus</span>
              <span style={{ fontFamily: 'monospace', color: '#2ed573' }}>{formatMYR(data.currentSurplus)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 700, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '4px', marginTop: '2px' }}>
              <span>Total Shareholders' Equity</span>
              <span style={{ fontFamily: 'monospace', color: '#2ed573' }}>{formatMYR(data.totalEquity)}</span>
            </div>
          </div>

          {/* Total Liabilities & Equity Box */}
          <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(46, 213, 115, 0.1)', border: '1px solid rgba(46, 213, 115, 0.35)', padding: '10px 12px', borderRadius: '6px', marginTop: '20px', fontWeight: 800, fontSize: '13px', color: '#fff' }}>
            <span>TOTAL LIABILITIES & EQUITY</span>
            <span style={{ fontFamily: 'monospace', color: '#2ed573' }}>{formatMYR(data.totalLiabAndEquity)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIncomeStatement = (isCombined = false) => (
    <div
      className="printable-statement"
      style={{
        background: '#051133',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: isCombined ? '24px' : '0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #ff7300', paddingBottom: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>
            STATEMENT OF PROFIT AND LOSS (INCOME STATEMENT)
          </div>
          <div style={{ fontSize: '11px', color: '#ff7300', marginTop: '2px' }}>
            Operational Revenue & Expense Decomposition · Currency: MYR
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', color: '#cbd5e1' }}>
          <div>Period: <strong style={{ color: '#fff' }}>{data.periodTitle}</strong></div>
          <div style={{ color: '#2ed573', fontWeight: 600 }}>Net Margin: {((data.netIncome / data.revenue) * 100).toFixed(1)}%</div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#cbd5e1' }}>
        <tbody>
          <tr style={{ background: 'rgba(255,255,255,0.03)', fontWeight: 700, color: '#fff' }}>
            <td style={{ padding: '8px 12px' }}>GROSS SERVICE REVENUE</td>
            <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#38bdf8' }}>{formatMYR(data.revenue)}</td>
          </tr>
          <tr>
            <td style={{ padding: '6px 20px', color: '#9ca3af' }}>Less: Cost of Goods Sold (OEM Parts Wholesale)</td>
            <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace' }}>({formatMYR(data.cogs * 0.65)})</td>
          </tr>
          <tr>
            <td style={{ padding: '6px 20px', color: '#9ca3af' }}>Less: Direct Field Technician Labor & Commissions</td>
            <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace' }}>({formatMYR(data.cogs * 0.35)})</td>
          </tr>
          <tr style={{ background: 'rgba(56, 189, 248, 0.08)', fontWeight: 700, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <td style={{ padding: '8px 12px', color: '#fff' }}>GROSS PROFIT (Margin: {((data.grossProfit / data.revenue) * 100).toFixed(1)}%)</td>
            <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#2ed573' }}>{formatMYR(data.grossProfit)}</td>
          </tr>
          <tr>
            <td style={{ padding: '6px 20px', color: '#9ca3af' }}>Less: Fleet Fuel, Tolls & Van Maintenance</td>
            <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace' }}>({formatMYR(data.opex * 0.28)})</td>
          </tr>
          <tr>
            <td style={{ padding: '6px 20px', color: '#9ca3af' }}>Less: Dispatch IT, Telemetry & Server Hosting</td>
            <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace' }}>({formatMYR(data.opex * 0.22)})</td>
          </tr>
          <tr>
            <td style={{ padding: '6px 20px', color: '#9ca3af' }}>Less: Central Service Hub Facility & Administration</td>
            <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace' }}>({formatMYR(data.opex * 0.50)})</td>
          </tr>
          <tr style={{ background: 'rgba(255, 115, 0, 0.08)', fontWeight: 700, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <td style={{ padding: '8px 12px', color: '#fff' }}>OPERATING PROFIT (EBITDA / EBIT)</td>
            <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#ff7300' }}>{formatMYR(data.ebit)}</td>
          </tr>
          <tr>
            <td style={{ padding: '6px 20px', color: '#9ca3af' }}>Less: Corporate Tax Provision (20% Effective Rate)</td>
            <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace' }}>({formatMYR(data.tax)})</td>
          </tr>
          <tr style={{ background: 'rgba(46, 213, 115, 0.12)', fontWeight: 800, fontSize: '13.5px', borderTop: '2px solid #2ed573' }}>
            <td style={{ padding: '10px 12px', color: '#fff' }}>NET PROFIT AFTER TAX (PAT)</td>
            <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#2ed573' }}>{formatMYR(data.netIncome)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const renderCashFlow = (isCombined = false) => (
    <div
      className="printable-statement"
      style={{
        background: '#051133',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: isCombined ? '24px' : '0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #2ed573', paddingBottom: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>
            STATEMENT OF CASH FLOWS
          </div>
          <div style={{ fontSize: '11px', color: '#2ed573', marginTop: '2px' }}>
            Direct Method Cash Flow Breakdown · Currency: MYR
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', color: '#cbd5e1' }}>
          <div>Ending Cash: <strong style={{ color: '#2ed573' }}>{formatMYR(data.cash)}</strong></div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
            <span>1. Net Cash Generated from Operating Activities</span>
            <span style={{ fontFamily: 'monospace', color: '#2ed573' }}>{formatMYR(data.netIncome * 1.25)}</span>
          </div>
          <div style={{ color: '#9ca3af', fontSize: '11px' }}>
            Includes client collections via FPX/DuitNow (+RM 395,000) minus vendor inventory payouts (-RM 142,000) and staff payroll (-RM 160,000).
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
            <span>2. Net Cash Used in Investing Activities</span>
            <span style={{ fontFamily: 'monospace', color: '#ef4444' }}>({formatMYR(28500)})</span>
          </div>
          <div style={{ color: '#9ca3af', fontSize: '11px' }}>
            Procurement of specialized HVAC recovery instruments and van racking systems for 2 newly onboarded technicians.
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
            <span>3. Net Cash Used in Financing Activities</span>
            <span style={{ fontFamily: 'monospace', color: '#ef4444' }}>({formatMYR(18200)})</span>
          </div>
          <div style={{ color: '#9ca3af', fontSize: '11px' }}>
            Monthly principal repayment on SME fleet lease obligations and commercial term loan.
          </div>
        </div>
      </div>
    </div>
  );

  const renderFinancialHealth = (isCombined = false) => (
    <div
      className="printable-statement"
      style={{
        background: '#051133',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: isCombined ? '24px' : '0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #a855f7', paddingBottom: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>
            FINANCIAL HEALTH RATIOS & SOLVENCY MATRIX
          </div>
          <div style={{ fontSize: '11px', color: '#a855f7', marginTop: '2px' }}>
            Liquidity, Profitability, and Operating Capital Benchmarks
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', color: '#cbd5e1' }}>
          <div>Solvency Rating: <strong style={{ color: '#2ed573' }}>TIER 1 (AAA)</strong></div>
        </div>
      </div>

      {/* Ratios Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '14px' }}>
          <div style={{ fontSize: '10.5px', color: '#9ca3af', textTransform: 'uppercase' }}>Current Ratio</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#2ed573', marginTop: '4px' }}>
            {(data.totalCurrentAssets / data.totalCurrentLiabilities).toFixed(2)}x
          </div>
          <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>
            Target: &gt; 1.5x · High liquidity coverage against short-term supplier debt.
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '14px' }}>
          <div style={{ fontSize: '10.5px', color: '#9ca3af', textTransform: 'uppercase' }}>Quick (Acid-Test) Ratio</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
            {((data.cash + data.receivables) / data.totalCurrentLiabilities).toFixed(2)}x
          </div>
          <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>
            Target: &gt; 1.0x · Immediate liquid cash buffer excluding van spare parts.
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '14px' }}>
          <div style={{ fontSize: '10.5px', color: '#9ca3af', textTransform: 'uppercase' }}>Debt to Equity Ratio</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#ff7300', marginTop: '4px' }}>
            {(data.totalLiabilities / data.totalEquity).toFixed(2)}x
          </div>
          <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>
            Target: &lt; 1.2x · Conservatively financed with solid equity capitalization.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="ch-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .ch-financial-modal-printable, .ch-financial-modal-printable * {
            visibility: visible !important;
          }
          .ch-financial-modal-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #0f172a !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .print-page-break {
            page-break-before: always !important;
            break-before: page !important;
            margin-top: 24px !important;
          }
          .no-print {
            display: none !important;
          }
          .printable-statement {
            background: #ffffff !important;
            color: #0f172a !important;
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
          }
          .printable-statement * {
            color: #0f172a !important;
          }
        }
      `}</style>

      <div
        className="ch-modal-card ch-financial-modal-printable"
        style={{
          width: '100%',
          maxWidth: '960px',
          background: '#040d21',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '12px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Modal Top Header */}
        <div
          className="no-print"
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(56, 189, 248, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 700 }}>
                  Financial Statements & Balance Sheet Report
                </h3>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(46, 213, 115, 0.15)',
                    border: '1px solid #2ed573',
                    color: '#2ed573',
                    fontWeight: 700,
                  }}
                >
                  {data.status}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                CyberHub Technologies Sdn. Bhd. · Double-Entry Ledger (MFRS / IFRS Framework)
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleExportCsv}
              style={{
                fontSize: '11.5px',
                padding: '5px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                fontSize: '11.5px',
                padding: '5px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print / PDF
            </button>
            <button
              type="button"
              onClick={handlePrintCombined}
              style={{
                fontSize: '11.5px',
                padding: '5px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print Combined PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Period & Horizon Selector Bar */}
        <div
          className="no-print"
          style={{
            padding: '10px 22px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          {/* Horizon Switcher */}
          <div style={{ display: 'inline-flex', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '6px', padding: '2px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              type="button"
              onClick={() => {
                setHorizon('quarterly');
                setSelectedPeriod('Q3_2026');
              }}
              style={{
                fontSize: '11px',
                padding: '4px 12px',
                borderRadius: '4px',
                border: 'none',
                background: horizon === 'quarterly' ? '#38bdf8' : 'transparent',
                color: horizon === 'quarterly' ? '#000' : '#cbd5e1',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Quarterly Statement
            </button>
            <button
              type="button"
              onClick={() => {
                setHorizon('annual');
                setSelectedPeriod('FY2026');
              }}
              style={{
                fontSize: '11px',
                padding: '4px 12px',
                borderRadius: '4px',
                border: 'none',
                background: horizon === 'annual' ? '#38bdf8' : 'transparent',
                color: horizon === 'annual' ? '#000' : '#cbd5e1',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Annual Financial Year
            </button>
          </div>

          {/* Period Selector Pills */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {PERIODS[horizon].map((p) => {
              const isSelected = selectedPeriod === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPeriod(p.id)}
                  style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: isSelected ? '#38bdf8' : '#9ca3af',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Statement Tabs */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            padding: '4px 22px 0',
            background: 'rgba(5, 19, 64, 0.3)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'balance_sheet', label: 'Balance Sheet (Position)' },
            { id: 'income', label: 'Income Statement (P&L)' },
            { id: 'cash_flow', label: 'Cash Flow Statement' },
            { id: 'ratios', label: 'Financial Health & Ratios' },
            { id: 'combined', label: 'Combined Full Report (PDF Print)' },
          ].map((tab) => {
            const isActive = activeStatement === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStatement(tab.id)}
                style={{
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isActive ? '#38bdf8' : '#9ca3af',
                  background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #38bdf8' : '2px solid transparent',
                  cursor: 'pointer',
                  borderRadius: '4px 4px 0 0',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Document Content */}
        <div style={{ padding: '22px', overflowY: 'auto', background: '#020718', flex: 1 }}>
          {/* Individual Statement Tabs */}
          {activeStatement === 'balance_sheet' && renderBalanceSheet(false)}
          {activeStatement === 'income' && renderIncomeStatement(false)}
          {activeStatement === 'cash_flow' && renderCashFlow(false)}
          {activeStatement === 'ratios' && renderFinancialHealth(false)}

          {/* =========================================================================
              STATEMENT 5: COMBINED FULL FINANCIAL REPORT (PDF PRINT OPTIMIZED)
             ========================================================================= */}
          {activeStatement === 'combined' && (
            <div className="combined-financial-statement" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Master Corporate Header */}
              <div
                style={{
                  background: '#040d21',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '8px',
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#38bdf8', fontWeight: 700 }}>
                    Official Consolidated Financial Report
                  </div>
                  <h2 style={{ margin: '4px 0 0', fontSize: '20px', color: '#fff', fontWeight: 800 }}>
                    CyberHub Technologies Sdn. Bhd.
                  </h2>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                    SSM Registration: 202401018923 (1529124-K) · Level 28, Menara CyberHub, Bangsar South, 59200 Kuala Lumpur
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '11.5px', color: '#cbd5e1' }}>
                  <div>Reporting Framework: <strong style={{ color: '#fff' }}>MFRS / IFRS</strong></div>
                  <div>Period: <strong style={{ color: '#38bdf8' }}>{data.periodTitle}</strong></div>
                  <div style={{ color: '#2ed573', fontWeight: 700, marginTop: '2px' }}>Audit Status: {data.status}</div>
                </div>
              </div>

              {/* SECTION I: BALANCE SHEET */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Section I: Statement of Financial Position
                </div>
                {renderBalanceSheet(true)}
              </div>

              {/* Print Page Break */}
              <div className="print-page-break" />

              {/* SECTION II: INCOME STATEMENT */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ff7300', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Section II: Statement of Profit or Loss
                </div>
                {renderIncomeStatement(true)}
              </div>

              {/* Print Page Break */}
              <div className="print-page-break" />

              {/* SECTION III: STATEMENT OF CASH FLOWS */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#2ed573', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Section III: Statement of Cash Flows
                </div>
                {renderCashFlow(true)}
              </div>

              {/* SECTION IV: FINANCIAL HEALTH & SOLVENCY MATRIX */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Section IV: Financial Solvency & Liquidity Ratios
                </div>
                {renderFinancialHealth(true)}
              </div>

              {/* SECTION V: STATUTORY AUDIT & BOARD SIGN-OFF */}
              <div
                style={{
                  background: 'rgba(5, 19, 64, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '20px 24px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', marginBottom: '14px' }}>
                  Section V: Statutory Declaration & Audit Sign-Off
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', fontSize: '11.5px', color: '#cbd5e1' }}>
                  <div>
                    <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.2)', paddingBottom: '32px', marginBottom: '8px' }}>
                      <span style={{ color: '#9ca3af' }}>Authorized Signature:</span>
                    </div>
                    <strong style={{ color: '#fff', display: 'block' }}>Managing Director & Chief Executive</strong>
                    <span style={{ color: '#9ca3af' }}>CyberHub Technologies Sdn. Bhd.</span>
                  </div>
                  <div>
                    <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.2)', paddingBottom: '32px', marginBottom: '8px' }}>
                      <span style={{ color: '#9ca3af' }}>Auditor Verification Seal:</span>
                    </div>
                    <strong style={{ color: '#fff', display: 'block' }}>Chartered Accountant & Financial Controller (MIA)</strong>
                    <span style={{ color: '#9ca3af' }}>BDO PLT / External Audit Partner</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
