import { useRef, useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import CategoryRevenueCard from '../components/CategoryRevenueCard.jsx';
import KpiExplainerDrawer from '../components/KpiExplainerDrawer.jsx';
import ExecutiveReportModal from '../components/ExecutiveReportModal.jsx';
import FieldServiceReportsModal from '../components/FieldServiceReportsModal.jsx';
import FinancialReportModal from '../components/FinancialReportModal.jsx';

const FAULT_DISTRIBUTIONS = {
  HOUR: [
    { label: 'Cooling & HVAC', pct: 45, color: '#ff7300' },
    { label: 'Washing Machines', pct: 28, color: '#2ed573' },
    { label: 'Kitchen Appliances', pct: 17, color: '#3498db' },
    { label: 'Others', pct: 10, color: '#e74c3c' },
  ],
  DAY: [
    { label: 'Cooling & HVAC', pct: 40, color: '#ff7300' },
    { label: 'Washing Machines', pct: 32, color: '#2ed573' },
    { label: 'Kitchen Appliances', pct: 18, color: '#3498db' },
    { label: 'Others', pct: 10, color: '#e74c3c' },
  ],
  MONTH: [
    { label: 'Cooling & HVAC', pct: 42, color: '#ff7300' },
    { label: 'Washing Machines', pct: 30, color: '#2ed573' },
    { label: 'Kitchen Appliances', pct: 18, color: '#3498db' },
    { label: 'Others', pct: 10, color: '#e74c3c' },
  ],
  YEAR: [
    { label: 'Cooling & HVAC', pct: 44, color: '#ff7300' },
    { label: 'Washing Machines', pct: 29, color: '#2ed573' },
    { label: 'Kitchen Appliances', pct: 19, color: '#3498db' },
    { label: 'Others', pct: 8, color: '#e74c3c' },
  ],
};

const REGIONAL_HUBS = [
  { id: 1, hub: 'Kuala Lumpur Central', jobs: 148, ticket: 'RM 168.00', topFault: 'Air Conditioning', fixRate: '95%', completion: '98%' },
  { id: 2, hub: 'Petaling Jaya (PJ Core)', jobs: 132, ticket: 'RM 146.00', topFault: 'Washing Machines', fixRate: '93%', completion: '96%' },
  { id: 3, hub: 'Subang Jaya & USJ', jobs: 115, ticket: 'RM 134.00', topFault: 'Inverter Refrigerators', fixRate: '92%', completion: '95%' },
  { id: 4, hub: 'Mont Kiara & Hartamas', jobs: 98, ticket: 'RM 215.00', topFault: 'French-Door Coolers', fixRate: '96%', completion: '99%' },
  { id: 5, hub: 'Bangsar & Damansara Heights', jobs: 94, ticket: 'RM 205.00', topFault: 'Built-in Ovens & Hobs', fixRate: '95%', completion: '97%' },
  { id: 6, hub: 'Cyberjaya / Putrajaya', jobs: 86, ticket: 'RM 155.00', topFault: 'Smart Inverters', fixRate: '94%', completion: '97%' },
  { id: 7, hub: 'Shah Alam Core & Kota Kemuning', jobs: 79, ticket: 'RM 142.00', topFault: 'Commercial HVAC', fixRate: '91%', completion: '94%' },
  { id: 8, hub: 'Cheras & Ampang Hub', jobs: 72, ticket: 'RM 138.00', topFault: 'Heat Pump Dryers', fixRate: '90%', completion: '93%' },
];

const ServiceAnalytics = () => {
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const tooltipRef = useRef(null);

  const [zoomText, setZoomText] = useState('1.8x');
  const [resolutionMode, setResolutionMode] = useState('MONTH');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sliderPos, setSliderPos] = useState({ start: 0.0, end: 0.55 });
  const [explainingMetric, setExplainingMetric] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isFsrModalOpen, setIsFsrModalOpen] = useState(false);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);

  const viewState = useRef({
    start: 0.0,
    end: 0.55,
    isDragging: false,
    dragStartX: 0,
    hoverX: null,
    hoverY: null,
  });

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 40);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    const tooltip = tooltipRef.current;
    if (!canvas || !viewport) return;
    const ctx = canvas.getContext('2d');

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let seed = 42;
    const pseudoRandom = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const yearlyData = [
      { labelDay: '2022', labelFull: 'Year 2022', revenue: 268400, jobs: 1410 },
      { labelDay: '2023', labelFull: 'Year 2023', revenue: 318900, jobs: 1690 },
      { labelDay: '2024', labelFull: 'Year 2024', revenue: 364200, jobs: 1920 },
      { labelDay: '2025', labelFull: 'Year 2025', revenue: 398500, jobs: 2110 },
      { labelDay: '2026', labelFull: 'Year 2026', revenue: 442850, jobs: 2345 },
    ];

    const startDate = new Date(2026, 0, 1);
    const dailyData = [];
    const hourlyData = [];

    for (let i = 0; i < 365; i++) {
      const d = new Date(startDate.getTime() + i * 86400000);
      const seasonalWave = Math.sin((i / 365) * Math.PI * 2) * 350;
      const baseRevenue = 980 + seasonalWave + i * 1.4;
      const noise = (pseudoRandom() - 0.45) * 520;
      const revenue = Math.max(340, Math.round(baseRevenue + noise));
      const jobs = Math.max(2, Math.round(revenue / 180));
      const dayLabel = `${String(d.getDate()).padStart(2, '0')} ${monthNames[d.getMonth()]}`;

      dailyData.push({
        monthIndex: d.getMonth(),
        labelDay: dayLabel,
        labelFull: `${dayLabel} 2026`,
        revenue,
        jobs,
      });

      for (let hr = 8; hr <= 19; hr++) {
        const hourWeight = 0.06 + Math.sin(((hr - 8) / 11) * Math.PI) * 0.06;
        const hrRev = Math.max(25, Math.round(revenue * hourWeight * (0.85 + pseudoRandom() * 0.3)));
        const hrJobs = Math.max(1, Math.round(hrRev / 160));
        const hrStr = `${String(hr).padStart(2, '0')}:00`;
        hourlyData.push({
          labelDay: `${dayLabel} ${hrStr}`,
          labelFull: `${dayLabel} 2026 @ ${hrStr}`,
          revenue: hrRev,
          jobs: hrJobs,
        });
      }
    }

    const monthlyData = monthNames.map((mName, mIdx) => {
      const days = dailyData.filter((d) => d.monthIndex === mIdx);
      return {
        monthIndex: mIdx,
        labelDay: `${mName} '26`,
        labelFull: `${mName} 2026`,
        revenue: days.reduce((s, x) => s + x.revenue, 0),
        jobs: days.reduce((s, x) => s + x.jobs, 0),
      };
    });

    const drawChart = () => {
      const width = viewport.clientWidth;
      const height = viewport.clientHeight;
      if (width === 0 || height === 0) return;

      const padLeft = 22;
      const padRight = 84;
      const padTop = 28;
      const padBottom = 42;
      const plotW = width - padLeft - padRight;
      const plotH = height - padTop - padBottom;

      ctx.clearRect(0, 0, width, height);

      const { start, end, hoverX } = viewState.current;
      const span = Math.max(0.005, end - start);
      const zoomFactor = 1 / span;

      let mode;
      let sourceData;
      let barColors;

      if (zoomFactor < 1.35) {
        mode = 'YEAR';
        sourceData = yearlyData;
        barColors = ['rgba(165, 94, 234, 0.38)', 'rgba(165, 94, 234, 0.08)'];
      } else if (zoomFactor < 3.5) {
        mode = 'MONTH';
        sourceData = monthlyData;
        barColors = ['rgba(255, 115, 0, 0.38)', 'rgba(255, 115, 0, 0.08)'];
      } else if (zoomFactor < 14.0) {
        mode = 'DAY';
        sourceData = dailyData;
        barColors = ['rgba(46, 213, 115, 0.38)', 'rgba(46, 213, 115, 0.08)'];
      } else {
        mode = 'HOUR';
        sourceData = hourlyData;
        barColors = ['rgba(0, 210, 211, 0.38)', 'rgba(0, 210, 211, 0.08)'];
      }

      setZoomText(`${zoomFactor.toFixed(1)}x`);
      setResolutionMode(mode);
      setSliderPos({ start, end });

      const totalCount = sourceData.length;
      const startIdx = Math.max(0, Math.floor(start * totalCount));
      const endIdx = Math.min(totalCount - 1, Math.ceil(end * totalCount));
      const visibleSlice = sourceData.slice(startIdx, Math.max(startIdx + 1, endIdx + 1));
      if (visibleSlice.length === 0) return;

      const maxRev = Math.max(...visibleSlice.map((d) => d.revenue)) * 1.15;
      const gridSteps = 5;
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';

      for (let i = 0; i <= gridSteps; i++) {
        const ratio = i / gridSteps;
        const y = padTop + plotH - ratio * plotH;
        const val = Math.round(ratio * maxRev);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(padLeft + plotW, y);
        ctx.stroke();

        ctx.fillStyle = '#9ca3af';
        ctx.fillText(`RM ${val.toLocaleString()}`, padLeft + plotW + 8, y + 4);
      }

      const count = visibleSlice.length;
      const slotW = plotW / count;
      const barW = Math.max(4, Math.min(60, slotW * 0.65));
      const linePoints = [];

      visibleSlice.forEach((item, idx) => {
        const centerX = padLeft + idx * slotW + slotW / 2;
        const barH = (item.revenue / maxRev) * plotH;
        const topY = padTop + plotH - barH;
        linePoints.push({ x: centerX, y: topY, item });

        const grad = ctx.createLinearGradient(0, topY, 0, padTop + plotH);
        grad.addColorStop(0, barColors[0]);
        grad.addColorStop(1, barColors[1]);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(centerX - barW / 2, topY, barW, barH, [4, 4, 0, 0]);
        ctx.fill();

        const maxLabels = mode === 'HOUR' ? 8 : 12;
        const labelStep = Math.max(1, Math.ceil(count / maxLabels));
        if (idx % labelStep === 0) {
          ctx.fillStyle = '#9ca3af';
          ctx.textAlign = 'center';
          ctx.font = '11px sans-serif';
          ctx.fillText(item.labelDay, centerX, padTop + plotH + 22);
        }
      });

      // Draw Graph Line
      if (linePoints.length > 1) {
        ctx.strokeStyle = '#ff7300';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        linePoints.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
        ctx.stroke();
      }

      // Continuous Dot Following the Graph Line Horizontally + Exact Value Tooltip
      if (hoverX !== null && hoverX >= padLeft && hoverX <= padLeft + plotW && linePoints.length > 0) {
        let dotX = hoverX;
        let dotY = linePoints[0].y;
        let exactRev = linePoints[0].item.revenue;
        let nearestPt = linePoints[0];

        if (linePoints.length === 1 || hoverX <= linePoints[0].x) {
          dotX = linePoints[0].x;
          dotY = linePoints[0].y;
          exactRev = linePoints[0].item.revenue;
          nearestPt = linePoints[0];
        } else if (hoverX >= linePoints[linePoints.length - 1].x) {
          const last = linePoints[linePoints.length - 1];
          dotX = last.x;
          dotY = last.y;
          exactRev = last.item.revenue;
          nearestPt = last;
        } else {
          for (let i = 0; i < linePoints.length - 1; i++) {
            const p1 = linePoints[i];
            const p2 = linePoints[i + 1];
            if (hoverX >= p1.x && hoverX <= p2.x) {
              const t = (hoverX - p1.x) / (p2.x - p1.x);
              dotX = hoverX;
              dotY = p1.y + t * (p2.y - p1.y);
              exactRev = Math.round(p1.item.revenue + t * (p2.item.revenue - p1.item.revenue));
              nearestPt = t < 0.5 ? p1 : p2;
              break;
            }
          }
        }

        // Subtle vertical guide line
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(dotX, padTop);
        ctx.lineTo(dotX, padTop + plotH);
        ctx.stroke();
        ctx.restore();

        // Outer glow of the line-following dot
        ctx.beginPath();
        ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 115, 0, 0.35)';
        ctx.fill();

        // Inner crisp dot on the line
        ctx.beginPath();
        ctx.arc(dotX, dotY, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ff7300';
        ctx.lineWidth = 2.5;
        ctx.fill();
        ctx.stroke();

        if (tooltip) {
          tooltip.style.display = 'block';
          tooltip.innerHTML = `
            <div style="color:#ff7300;font-weight:700;margin-bottom:2px;">${nearestPt.item.labelFull}</div>
            <div>Exact Line Value: <strong>RM ${exactRev.toLocaleString()}</strong></div>
            <div>Period Exact Revenue: <strong>RM ${nearestPt.item.revenue.toLocaleString()}</strong></div>
            <div>Completed Repairs: <strong>${nearestPt.item.jobs} Jobs</strong></div>
          `;
          const tipX = Math.min(width - 215, Math.max(12, dotX + 14));
          const tipY = Math.max(12, dotY - 76);
          tooltip.style.left = `${tipX}px`;
          tooltip.style.top = `${tipY}px`;
        }
      } else if (tooltip) {
        tooltip.style.display = 'none';
      }
    };

    const resizeCanvas = () => {
      const rect = viewport.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      drawChart();
    };

    const handleWheel = (e) => {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const currentSpan = viewState.current.end - viewState.current.start;

      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        const shift = (e.deltaX / rect.width) * currentSpan * 0.8;
        let nextStart = Math.max(0, Math.min(1 - currentSpan, viewState.current.start + shift));
        viewState.current.start = nextStart;
        viewState.current.end = nextStart + currentSpan;
        drawChart();
        return;
      }

      const mouseRatio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const factor = e.deltaY < 0 ? 0.8 : 1.25;
      const newSpan = Math.min(1.0, Math.max(0.008, currentSpan * factor));

      const anchor = viewState.current.start + mouseRatio * currentSpan;
      let nextStart = anchor - mouseRatio * newSpan;
      let nextEnd = nextStart + newSpan;

      if (nextStart < 0) {
        nextEnd -= nextStart;
        nextStart = 0;
      }
      if (nextEnd > 1) {
        nextStart -= nextEnd - 1;
        nextEnd = 1;
      }
      viewState.current.start = Math.max(0, nextStart);
      viewState.current.end = Math.min(1, nextEnd);
      drawChart();
    };

    const handleMouseDown = (e) => {
      viewState.current.isDragging = true;
      viewState.current.dragStartX = e.clientX;
    };

    const handleMouseMove = (e) => {
      const rect = viewport.getBoundingClientRect();
      viewState.current.hoverX = e.clientX - rect.left;
      viewState.current.hoverY = e.clientY - rect.top;

      if (viewState.current.isDragging) {
        const dx = e.clientX - viewState.current.dragStartX;
        viewState.current.dragStartX = e.clientX;
        const span = viewState.current.end - viewState.current.start;
        const shift = -(dx / rect.width) * span;
        let nextStart = Math.max(0, Math.min(1 - span, viewState.current.start + shift));
        viewState.current.start = nextStart;
        viewState.current.end = nextStart + span;
      }
      drawChart();
    };

    const handleMouseLeave = () => {
      viewState.current.isDragging = false;
      viewState.current.hoverX = null;
      viewState.current.hoverY = null;
      if (tooltip) tooltip.style.display = 'none';
      drawChart();
    };

    const handleMouseUp = () => {
      viewState.current.isDragging = false;
    };

    const handleAiChartCommand = (e) => {
      const { mode, monthIndex, panDirection } = e.detail;
      if (panDirection) {
        const span = viewState.current.end - viewState.current.start;
        const shift = panDirection === 'left' ? -span * 0.35 : span * 0.35;
        const nextStart = Math.max(0, Math.min(1 - span, viewState.current.start + shift));
        viewState.current.start = nextStart;
        viewState.current.end = nextStart + span;
      } else if (mode === 'year') {
        viewState.current.start = 0.0;
        viewState.current.end = 1.0;
      } else if (mode === 'month' || mode === 'reset') {
        viewState.current.start = 0.0;
        viewState.current.end = 0.55;
      } else if (mode === 'day' || mode === 'daily') {
        viewState.current.start = 0.33;
        viewState.current.end = 0.45;
      } else if (mode === 'hour') {
        viewState.current.start = 0.35;
        viewState.current.end = 0.38;
      } else if (typeof monthIndex === 'number') {
        viewState.current.start = monthIndex / 12;
        viewState.current.end = (monthIndex + 1) / 12;
      }
      drawChart();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    viewport.addEventListener('wheel', handleWheel, { passive: false });
    viewport.addEventListener('mousedown', handleMouseDown);
    viewport.addEventListener('mousemove', handleMouseMove);
    viewport.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('cyberhub-chart-command', handleAiChartCommand);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      viewport.removeEventListener('wheel', handleWheel);
      viewport.removeEventListener('mousedown', handleMouseDown);
      viewport.removeEventListener('mousemove', handleMouseMove);
      viewport.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('cyberhub-chart-command', handleAiChartCommand);
    };
  }, []);

  const triggerMode = (mode) => {
    window.dispatchEvent(new CustomEvent('cyberhub-chart-command', { detail: { mode } }));
  };

  const panGraph = (panDirection) => {
    window.dispatchEvent(new CustomEvent('cyberhub-chart-command', { detail: { panDirection } }));
  };

  const handleScrubberChange = (e) => {
    const val = parseFloat(e.target.value);
    const span = viewState.current.end - viewState.current.start;
    const nextStart = Math.max(0, Math.min(1 - span, val));
    viewState.current.start = nextStart;
    viewState.current.end = nextStart + span;
    window.dispatchEvent(new Event('resize'));
  };

  const currentFaults = FAULT_DISTRIBUTIONS[resolutionMode] || FAULT_DISTRIBUTIONS.MONTH;
  const [hoveredSlice, setHoveredSlice] = useState(null);

  // SVG Doughnut Calculation
  const circumference = 2 * Math.PI * 38; // r = 38 => ~238.76
  const faultSlices = useMemo(() => {
    return currentFaults.map((slice, idx) => {
      const priorPct = currentFaults.slice(0, idx).reduce((sum, s) => sum + s.pct, 0);
      const strokeDash = (slice.pct / 100) * circumference;
      const strokeOffset = (priorPct / 100) * circumference;
      return {
        ...slice,
        strokeDash,
        strokeOffset,
      };
    });
  }, [currentFaults, circumference]);

  return (
    <div className="page-wrapper" style={{ boxSizing: 'border-box' }}>
      <div className="page-header" style={{ marginBottom: '14px' }}>
        <div>
          <h1>Service Analytics & Performance Ticker</h1>
          <p className="subtitle">
            Hover inside the graph to track exact line values. Scroll wheel to switch between Year, Month, Day, and Hour.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-small outline"
            onClick={() => setIsReportModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#ff7300',
              borderColor: 'rgba(255, 115, 0, 0.45)',
              background: 'rgba(255, 115, 0, 0.08)',
              padding: '6px 12px',
              fontWeight: 600,
              fontSize: '12px',
              borderRadius: '6px',
            }}
            title="Generate and export monthly executive report"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Executive Report
          </button>

          <button
            type="button"
            className="btn-small outline"
            onClick={() => setIsFsrModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#38bdf8',
              borderColor: 'rgba(56, 189, 248, 0.45)',
              background: 'rgba(56, 189, 248, 0.08)',
              padding: '6px 12px',
              fontWeight: 600,
              fontSize: '12px',
              borderRadius: '6px',
            }}
            title="Inspect FSR, Diagnostics, Maintenance, Quote, Invoice, and CSAT reports"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Service Reports (FSR)
          </button>

          <button
            type="button"
            className="btn-small outline"
            onClick={() => setIsFinancialModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#2ed573',
              borderColor: 'rgba(46, 213, 115, 0.45)',
              background: 'rgba(46, 213, 115, 0.08)',
              padding: '6px 12px',
              fontWeight: 600,
              fontSize: '12px',
              borderRadius: '6px',
            }}
            title="Inspect Detailed Quarterly and Annual Financial Statements and Balance Sheet"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Financial Report (Q & Annual)
          </button>

          <div className="pill-group">
            <button className={`filter-pill ${resolutionMode === 'YEAR' ? 'active' : ''}`} onClick={() => triggerMode('year')}>
              Year (1Y)
            </button>
            <button className={`filter-pill ${resolutionMode === 'MONTH' ? 'active' : ''}`} onClick={() => triggerMode('month')}>
              Month (1M)
            </button>
            <button className={`filter-pill ${resolutionMode === 'DAY' ? 'active' : ''}`} onClick={() => triggerMode('day')}>
              Day (1D)
            </button>
            <button className={`filter-pill ${resolutionMode === 'HOUR' ? 'active' : ''}`} onClick={() => triggerMode('hour')}>
              Hour (1H)
            </button>
          </div>
        </div>
      </div>

      {/* 1. CyberHub Old Analytics KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div className="ch-card ai-metric-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
          <div>
            <span className="kpi-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>Total Revenue</span>
            <h2 className="kpi-value" style={{ color: '#2ed573', margin: '4px 0 0', fontSize: '24px', fontWeight: 700 }}>RM 45,210</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '11px', color: '#2ed573' }}>+18.4% MoM</span>
              <button
                type="button"
                onClick={() => setExplainingMetric('Total Revenue')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2ed573',
                  cursor: 'pointer',
                  fontSize: '11px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: 0,
                  fontWeight: 600,
                  textDecoration: 'underline',
                }}
                title="Explain why Total Revenue changed"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Explain
              </button>
            </div>
          </div>
          <div className="ai-metric-icon" style={{ color: '#2ed573', background: 'rgba(46, 213, 115, 0.15)', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </div>

        <div className="ch-card ai-metric-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
          <div>
            <span className="kpi-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>Completed Jobs</span>
            <h2 className="kpi-value" style={{ color: '#ff7300', margin: '4px 0 0', fontSize: '24px', fontWeight: 700 }}>312</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '11px', color: '#ff7300' }}>+12% vs last mo</span>
              <button
                type="button"
                onClick={() => setExplainingMetric('Completed Jobs')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff7300',
                  cursor: 'pointer',
                  fontSize: '11px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: 0,
                  fontWeight: 600,
                  textDecoration: 'underline',
                }}
                title="Explain why Completed Jobs changed"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Explain
              </button>
            </div>
          </div>
          <div className="ai-metric-icon" style={{ color: '#ff7300', background: 'rgba(255, 115, 0, 0.15)', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
        </div>

        <div className="ch-card ai-metric-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
          <div>
            <span className="kpi-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>Avg. Resolution</span>
            <h2 className="kpi-value" style={{ color: '#3498db', margin: '4px 0 0', fontSize: '24px', fontWeight: 700 }}>1.4 Days</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '11px', color: '#3498db' }}>SLA 98.2% on-time</span>
              <button
                type="button"
                onClick={() => setExplainingMetric('Avg. Resolution')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3498db',
                  cursor: 'pointer',
                  fontSize: '11px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: 0,
                  fontWeight: 600,
                  textDecoration: 'underline',
                }}
                title="Explain why Avg. Resolution changed"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Explain
              </button>
            </div>
          </div>
          <div className="ai-metric-icon" style={{ color: '#3498db', background: 'rgba(52, 152, 219, 0.15)', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>

        <div className="ch-card ai-metric-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
          <div>
            <span className="kpi-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>Customer CSAT</span>
            <h2 className="kpi-value" style={{ color: '#ffa502', margin: '4px 0 0', fontSize: '24px', fontWeight: 700 }}>4.8 <small style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 400 }}>/ 5.0</small></h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '11px', color: '#ffa502' }}>96% 5-star ratings</span>
              <button
                type="button"
                onClick={() => setExplainingMetric('Customer CSAT')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffa502',
                  cursor: 'pointer',
                  fontSize: '11px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: 0,
                  fontWeight: 600,
                  textDecoration: 'underline',
                }}
                title="Explain why Customer CSAT changed"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Explain
              </button>
            </div>
          </div>
          <div className="ai-metric-icon" style={{ color: '#ffa502', background: 'rgba(255, 165, 2, 0.15)', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
        </div>
      </div>

      {/* Dimmed Backdrop & 80% Fullscreen Container via Portal (Mounted on body to override all views) */}
      {isFullscreen &&
        createPortal(
          <>
            <div
              className="ch-fullscreen-backdrop"
              onClick={() => setIsFullscreen(false)}
              title="Click backdrop to close (Esc)"
            />
            <div className="ch-card chart-card-fullscreen-80">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0 }}>Revenue & Completed Repairs</h3>
                  <span className="status-pill completed">SORTED BY: {resolutionMode}</span>
                  <span className="mono" style={{ fontSize: '12px', color: '#9ca3af' }}>
                    Zoom: {zoomText}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button className="btn-small outline" onClick={() => panGraph('left')}>
                    ◀ Swipe Left
                  </button>
                  <button className="btn-small outline" onClick={() => panGraph('right')}>
                    Swipe Right ▶
                  </button>
                  <button
                    type="button"
                    className="btn-small ch-close-fs-btn"
                    onClick={() => setIsFullscreen(false)}
                    title="Close Fullscreen (Esc)"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              <div
                ref={viewportRef}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 'calc(80vh - 165px)',
                  background: '#030b26',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                  cursor: 'default',
                  touchAction: 'none',
                  boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)',
                }}
              >
                <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
                <div
                  ref={tooltipRef}
                  style={{
                    position: 'absolute',
                    display: 'none',
                    pointerEvents: 'none',
                    background: 'rgba(1, 8, 31, 0.96)',
                    border: '1px solid #ff7300',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    zIndex: 20,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.65)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                <span style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap' }}>Swipe Timeline:</span>
                <input
                  type="range"
                  min="0"
                  max={Math.max(0.01, 1 - (sliderPos.end - sliderPos.start))}
                  step="0.005"
                  value={sliderPos.start}
                  onChange={handleScrubberChange}
                  style={{ flex: 1, accentColor: '#ff7300', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' }}>
                  {Math.round(sliderPos.start * 100)}% – {Math.round(sliderPos.end * 100)}%
                </span>
              </div>
            </div>
          </>,
          document.body
        )}

      {/* 2. Main Charts Section: Revenue Line Chart & CyberHub Old Faults Doughnut Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(360px, 1fr)', gap: '16px', marginBottom: '16px' }}>
        {/* Left: Revenue vs Parts Cost Line Chart */}
        <div className="ch-card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0 }}>Revenue & Completed Repairs</h3>
              <span className="status-pill completed">SORTED BY: {resolutionMode}</span>
              <span className="mono" style={{ fontSize: '12px', color: '#9ca3af' }}>
                Zoom: {zoomText}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button className="btn-small outline" onClick={() => panGraph('left')}>
                ◀ Swipe Left
              </button>
              <button className="btn-small outline" onClick={() => panGraph('right')}>
                Swipe Right ▶
              </button>
              <button
                type="button"
                className="btn-small"
                onClick={() => setIsFullscreen(true)}
                style={{ background: 'var(--app-logo, #ff7300)', color: '#fff' }}
                title="Expand to 80% Fullscreen View"
              >
                ⛶ Fullscreen
              </button>
            </div>
          </div>

          <div
            ref={!isFullscreen ? viewportRef : undefined}
            style={{
              position: 'relative',
              width: '100%',
              height: '370px',
              background: '#030b26',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
              cursor: 'default',
              touchAction: 'none',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)',
            }}
          >
            {!isFullscreen && (
              <>
                <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
                <div
                  ref={tooltipRef}
                  style={{
                    position: 'absolute',
                    display: 'none',
                    pointerEvents: 'none',
                    background: 'rgba(1, 8, 31, 0.96)',
                    border: '1px solid #ff7300',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    zIndex: 20,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.65)',
                  }}
                />
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap' }}>Swipe Timeline:</span>
            <input
              type="range"
              min="0"
              max={Math.max(0.01, 1 - (sliderPos.end - sliderPos.start))}
              step="0.005"
              value={sliderPos.start}
              onChange={handleScrubberChange}
              style={{ flex: 1, accentColor: '#ff7300', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' }}>
              {Math.round(sliderPos.start * 100)}% – {Math.round(sliderPos.end * 100)}%
            </span>
          </div>
        </div>

        {/* Right: Restored CyberHub Old Faults Breakdown Doughnut Chart - Bigger and Centered */}
        {!isFullscreen && (
          <div className="ch-card analytics-chart-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', margin: 0, padding: '20px' }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', marginBottom: '14px', width: '100%' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '16px' }}>Fault Category Distribution</h3>
                  <span className="mono" style={{ fontSize: '11px', color: '#ff7300', background: 'rgba(255, 115, 0, 0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(255, 115, 0, 0.3)' }}>
                    {resolutionMode}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
                  Failure breakdown across repaired appliance subsystems
                </p>
              </div>

              {/* Interactive SVG Doughnut Chart - Enlarged & Centered */}
              <div style={{ position: 'relative', width: '100%', minHeight: '270px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'auto 0' }}>
                <svg viewBox="0 0 100 100" style={{ width: '240px', height: '240px', transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                  {faultSlices.map((slice) => {
                    const isHovered = hoveredSlice === slice.label;

                    return (
                      <circle
                        key={slice.label}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke={slice.color}
                        strokeWidth={isHovered ? 15 : 12}
                        strokeDasharray={`${slice.strokeDash} ${circumference}`}
                        strokeDashoffset={-slice.strokeOffset}
                        style={{
                          transition: 'all 0.25s ease',
                          cursor: 'pointer',
                          filter: isHovered ? `drop-shadow(0 0 8px ${slice.color})` : 'none',
                        }}
                        onMouseEnter={() => setHoveredSlice(slice.label)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    );
                  })}
                </svg>

                {/* Center text inside doughnut hole */}
                <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  {(() => {
                    const activeSlice = hoveredSlice ? currentFaults.find((s) => s.label === hoveredSlice) : null;
                    const activeColor = activeSlice?.color || '#ff7300';

                    return (
                      <>
                        <span style={{ fontSize: '32px', fontWeight: 800, color: hoveredSlice ? activeColor : '#ffffff', display: 'block', lineHeight: 1.1, fontFamily: 'monospace', transition: 'color 0.25s ease' }}>
                          {activeSlice ? `${activeSlice.pct}%` : '412'}
                        </span>
                        <span style={{ fontSize: '12px', color: hoveredSlice ? activeColor : '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, marginTop: '2px', transition: 'color 0.25s ease' }}>
                          {hoveredSlice || 'Total Faults'}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Custom Legend Matching CyberHub Old - Centered */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', maxWidth: '380px', margin: '14px auto 0', width: '100%' }}>
              {currentFaults.map((slice) => {
                const isHovered = hoveredSlice === slice.label;
                return (
                  <div
                    key={slice.label}
                    onMouseEnter={() => setHoveredSlice(slice.label)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      fontSize: '11.5px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: isHovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isHovered ? slice.color : 'rgba(255,255,255,0.06)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: slice.color, flexShrink: 0 }} />
                    <span style={{ color: isHovered ? '#fff' : '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {slice.label} <strong>({slice.pct}%)</strong>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Performance by Appliance Category Card */}
      <CategoryRevenueCard />

      {/* 4. Restored Regional Performance Table (Klang Valley) from CyberHub Old */}
      <div className="ch-card orders-table-wrapper" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0 }}>Regional Performance (Klang Valley)</h3>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#9ca3af' }}>Real-time telemetry aggregated across monitored metro hubs.</p>
          </div>
          <span className="status-pill active" style={{ fontSize: '11px', fontWeight: 600 }}>16 Monitored Hubs Active</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="orders-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr className="ch-table-category-row" style={{ background: '#051340', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th className="ch-index-th" style={{ width: '44px', textAlign: 'center', color: '#ff7300', fontWeight: 700, padding: '10px' }}>#</th>
                <th style={{ textAlign: 'left', padding: '10px 12px' }}>Region Hub</th>
                <th style={{ textAlign: 'left', padding: '10px 12px' }}>Total Jobs</th>
                <th style={{ textAlign: 'left', padding: '10px 12px' }}>Avg. Ticket Size</th>
                <th style={{ textAlign: 'left', padding: '10px 12px' }}>Top Fault Category</th>
                <th style={{ textAlign: 'left', padding: '10px 12px' }}>1st-Fix Rate</th>
                <th style={{ textAlign: 'left', padding: '10px 12px' }}>Completion Rate</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', width: '80px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {REGIONAL_HUBS.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ textAlign: 'center', color: '#ff7300', fontWeight: 700, fontFamily: 'monospace', padding: '10px' }}>{r.id}</td>
                  <td style={{ fontWeight: 600, color: '#fff', padding: '10px 12px' }}>{r.hub}</td>
                  <td style={{ padding: '10px 12px' }}>{r.jobs}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{r.ticket}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className="status-pill active" style={{ fontSize: '11px' }}>{r.topFault}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <strong style={{ color: '#2ed573' }}>{r.fixRate}</strong>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <strong style={{ color: '#2ed573' }}>{r.completion}</strong>
                  </td>
                  <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                    <span className="status-pill completed" style={{ fontSize: '10px', padding: '2px 8px' }}>LIVE</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* D4: "Why did this change?" KPI Explainer Drawer */}
      <KpiExplainerDrawer
        metric={explainingMetric}
        isOpen={Boolean(explainingMetric)}
        onClose={() => setExplainingMetric(null)}
      />

      {/* D5: Monthly Executive Report Writer Modal */}
      <ExecutiveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* Field Service Reports Modal (FSR, Diagnostic, Maintenance, Quote, Invoice, Feedback) */}
      <FieldServiceReportsModal
        isOpen={isFsrModalOpen}
        onClose={() => setIsFsrModalOpen(false)}
      />

      {/* Detailed Financial Report Modal (Quarterly & Annual Balance Sheet, P&L, Cash Flow) */}
      <FinancialReportModal
        isOpen={isFinancialModalOpen}
        onClose={() => setIsFinancialModalOpen(false)}
      />
    </div>
  );
};

export default ServiceAnalytics;