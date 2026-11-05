import { useRef, useEffect, useState } from 'react';

const ServiceAnalytics = () => {
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const tooltipRef = useRef(null);

  const [zoomText, setZoomText] = useState('1.8x');
  const [resolutionMode, setResolutionMode] = useState('MONTH');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sliderPos, setSliderPos] = useState({ start: 0.0, end: 0.55 });

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

      let mode = 'MONTH';
      let sourceData = monthlyData;
      let barColors = ['rgba(255, 115, 0, 0.38)', 'rgba(255, 115, 0, 0.08)'];

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

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>Service Analytics & Revenue Ticker</h1>
          <p className="subtitle">
            Hover inside the graph to track exact line values. Scroll wheel to switch between Year, Month, Day, and Hour.
          </p>
        </div>
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

      {/* Dimmed Backdrop when Graph is in 85% Fullscreen Modal Mode */}
      {isFullscreen && (
        <div className="ch-fullscreen-backdrop" onClick={() => setIsFullscreen(false)} />
      )}

      <div className={`ch-card ${isFullscreen ? 'chart-card-fullscreen-85' : ''}`}>
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
            {!isFullscreen ? (
              <button className="btn-small" onClick={() => setIsFullscreen(true)}>
                ⛶ Fullscreen
              </button>
            ) : (
              <button className="btn-small ch-close-fs-btn" onClick={() => setIsFullscreen(false)}>
                ✕ Close
              </button>
            )}
          </div>
        </div>

        <div
          ref={viewportRef}
          style={{
            position: 'relative',
            width: '100%',
            height: isFullscreen ? 'calc(85vh - 155px)' : '400px',
            background: '#030b26',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
            cursor: 'default', // Exact value dot & tooltip instead of zoom cursor
            touchAction: 'none',
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
    </div>
  );
};

export default ServiceAnalytics;