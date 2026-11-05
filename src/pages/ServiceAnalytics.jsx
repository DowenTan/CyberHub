import { useRef, useEffect, useState } from 'react';

const ServiceAnalytics = () => {
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const tooltipRef = useRef(null);

  const [zoomText, setZoomText] = useState('1.0x');
  const [isDaily, setIsDaily] = useState(false);

  // Store normalized viewport range [0..1] in a ref for 60fps canvas rendering
  const viewState = useRef({ start: 0.0, end: 1.0, isDragging: false, dragStartX: 0, hoverX: null, hoverY: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    const tooltip = tooltipRef.current;
    if (!canvas || !viewport) return;
    const ctx = canvas.getContext('2d');

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const startDate = new Date(2026, 0, 1);
    const dailyData = [];

    let seed = 42;
    const pseudoRandom = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < 365; i++) {
      const d = new Date(startDate.getTime() + i * 86400000);
      const seasonalWave = Math.sin((i / 365) * Math.PI * 2) * 350;
      const baseRevenue = 950 + seasonalWave + i * 1.4;
      const noise = (pseudoRandom() - 0.45) * 550;
      const revenue = Math.max(320, Math.round(baseRevenue + noise));
      const jobs = Math.max(2, Math.round(revenue / 185));

      dailyData.push({
        monthIndex: d.getMonth(),
        labelDay: `${String(d.getDate()).padStart(2, '0')} ${monthNames[d.getMonth()]}`,
        labelFull: `${String(d.getDate()).padStart(2, '0')} ${monthNames[d.getMonth()]} 2026`,
        revenue,
        jobs,
      });
    }

    const monthlyData = monthNames.map((mName, mIdx) => {
      const days = dailyData.filter((d) => d.monthIndex === mIdx);
      return {
        monthIndex: mIdx,
        labelDay: `${mName} '26`,
        labelFull: `${mName} 2026 (Monthly Total)`,
        revenue: days.reduce((s, x) => s + x.revenue, 0),
        jobs: days.reduce((s, x) => s + x.jobs, 0),
      };
    });

    const DAILY_SWITCH_ZOOM = 2.2;

    const drawChart = () => {
      const width = viewport.clientWidth;
      const height = viewport.clientHeight;
      const padLeft = 18;
      const padRight = 74;
      const padTop = 24;
      const padBottom = 38;
      const plotW = width - padLeft - padRight;
      const plotH = height - padTop - padBottom;

      ctx.clearRect(0, 0, width, height);

      const { start, end, hoverX } = viewState.current;
      const zoomFactor = 1 / (end - start);
      const dailyMode = zoomFactor >= DAILY_SWITCH_ZOOM;

      setZoomText(`${zoomFactor.toFixed(1)}x`);
      setIsDaily(dailyMode);

      const sourceData = dailyMode ? dailyData : monthlyData;
      const totalCount = sourceData.length;
      const startIdx = Math.max(0, Math.floor(start * totalCount));
      const endIdx = Math.min(totalCount - 1, Math.ceil(end * totalCount));
      const visibleSlice = sourceData.slice(startIdx, endIdx + 1);
      if (visibleSlice.length === 0) return;

      const maxRev = Math.max(...visibleSlice.map((d) => d.revenue)) * 1.12;
      const gridSteps = 5;
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';

      for (let i = 0; i <= gridSteps; i++) {
        const ratio = i / gridSteps;
        const y = padTop + plotH - ratio * plotH;
        const val = Math.round(ratio * maxRev);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(padLeft + plotW, y);
        ctx.stroke();

        ctx.fillStyle = '#9ca3af';
        ctx.fillText(`RM ${val.toLocaleString()}`, padLeft + plotW + 8, y + 4);
      }

      const count = visibleSlice.length;
      const slotW = plotW / count;
      const barW = Math.max(3, Math.min(48, slotW * 0.68));

      let hoveredItem = null;
      let hoveredCenterX = 0;
      let hoveredTopY = 0;
      const linePoints = [];

      visibleSlice.forEach((item, idx) => {
        const centerX = padLeft + idx * slotW + slotW / 2;
        const barH = (item.revenue / maxRev) * plotH;
        const topY = padTop + plotH - barH;
        linePoints.push({ x: centerX, y: topY });

        const isHovered = hoverX !== null && Math.abs(hoverX - centerX) <= slotW / 2;
        if (isHovered) {
          hoveredItem = item;
          hoveredCenterX = centerX;
          hoveredTopY = topY;
        }

        const grad = ctx.createLinearGradient(0, topY, 0, padTop + plotH);
        if (dailyMode) {
          grad.addColorStop(0, isHovered ? '#7bed9f' : '#2ed573');
          grad.addColorStop(1, 'rgba(46, 213, 115, 0.15)');
        } else {
          grad.addColorStop(0, isHovered ? '#ff9f43' : '#ff7300');
          grad.addColorStop(1, 'rgba(255, 115, 0, 0.15)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(centerX - barW / 2, topY, barW, barH, [4, 4, 0, 0]);
        ctx.fill();

        const labelStep = Math.max(1, Math.ceil(count / 12));
        if (idx % labelStep === 0) {
          ctx.fillStyle = '#9ca3af';
          ctx.textAlign = 'center';
          ctx.font = '11px sans-serif';
          ctx.fillText(item.labelDay, centerX, padTop + plotH + 22);
        }
      });

      if (linePoints.length > 1) {
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.beginPath();
        linePoints.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
        ctx.stroke();
      }

      if (hoveredItem && tooltip && hoverX >= padLeft && hoverX <= padLeft + plotW) {
        tooltip.style.display = 'block';
        tooltip.innerHTML = `
          <div style="color:#ff7300;font-weight:700;">${hoveredItem.labelFull}</div>
          <div>Revenue: <strong>RM ${hoveredItem.revenue.toLocaleString()}</strong></div>
          <div>Repairs: <strong>${hoveredItem.jobs} Jobs</strong></div>
        `;
        tooltip.style.left = `${Math.min(width - 180, Math.max(12, hoveredCenterX + 12))}px`;
        tooltip.style.top = `${Math.max(12, hoveredTopY - 60)}px`;
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
      const mouseRatio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const currentSpan = viewState.current.end - viewState.current.start;
      const factor = e.deltaY < 0 ? 0.82 : 1.22;
      const newSpan = Math.min(1.0, Math.max(0.03, currentSpan * factor));

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
        if (viewState.current.start + shift >= 0 && viewState.current.end + shift <= 1) {
          viewState.current.start += shift;
          viewState.current.end += shift;
        }
      }
      drawChart();
    };

    const handleMouseUp = () => {
      viewState.current.isDragging = false;
    };

    const handleAiChartCommand = (e) => {
      const { mode, monthIndex } = e.detail;
      if (mode === 'reset') {
        viewState.current.start = 0;
        viewState.current.end = 1;
      } else if (typeof monthIndex === 'number') {
        viewState.current.start = monthIndex / 12;
        viewState.current.end = (monthIndex + 1) / 12;
      } else {
        viewState.current.start = 0.35;
        viewState.current.end = 0.5;
      }
      drawChart();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    viewport.addEventListener('wheel', handleWheel, { passive: false });
    viewport.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('cyberhub-chart-command', handleAiChartCommand);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      viewport.removeEventListener('wheel', handleWheel);
      viewport.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('cyberhub-chart-command', handleAiChartCommand);
    };
  }, []);

  const resetZoom = () => {
    window.dispatchEvent(new CustomEvent('cyberhub-chart-command', { detail: { mode: 'reset' } }));
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>Service Analytics & Revenue Ticker</h1>
          <p className="subtitle">
            Scroll mouse wheel inside the graph to drill down from Monthly bars into Daily bars. Drag to pan.
          </p>
        </div>
        <button className="btn-small outline" onClick={resetZoom}>
          Reset Zoom (1Y Monthly)
        </button>
      </div>

      <div className="ch-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Revenue & Completed Repairs</h3>
            <span className={`status-pill ${isDaily ? 'completed' : 'pending'}`}>
              {isDaily ? 'VIEW: DAILY BARS (1D)' : 'VIEW: MONTHLY BARS (1M)'}
            </span>
            <span className="mono" style={{ fontSize: '12px', color: '#9ca3af' }}>
              Zoom: {zoomText}
            </span>
          </div>
        </div>

        <div
          ref={viewportRef}
          style={{
            position: 'relative',
            width: '100%',
            height: '380px',
            background: '#030b26',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.07)',
            overflow: 'hidden',
            cursor: 'grab',
          }}
        >
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          <div
            ref={tooltipRef}
            style={{
              position: 'absolute',
              display: 'none',
              pointerEvents: 'none',
              background: 'rgba(1, 8, 31, 0.95)',
              border: '1px solid #ff7300',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ServiceAnalytics;
