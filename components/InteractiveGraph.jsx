import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';

// Graph dataset definitions
const GRAPH_MODES = [
  { id: 'revenue-cost', label: 'Revenue & Cost (Multi-Line)', iconType: 'line' },
  { id: 'volume-ewaste', label: 'Repairs & E-Waste Diverted', iconType: 'refresh' },
  { id: 'first-fix-sla', label: 'First-Fix Rate & SLA Quality', iconType: 'target' },
  { id: 'fault-categories', label: 'Appliance Fault Dynamics', iconType: 'bolt' },
];

const renderGraphModeIcon = (type) => {
  if (type === 'line') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    );
  }
  if (type === 'refresh') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
      </svg>
    );
  }
  if (type === 'target') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    );
  }
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
};

const InteractiveGraph = ({ title = 'Live Telemetry & Diagnostics Graph', compact = false }) => {
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const tooltipRef = useRef(null);

  const [graphMode, setGraphMode] = useState('revenue-cost');
  const [zoomText, setZoomText] = useState('1.8x');
  const [resolutionMode, setResolutionMode] = useState('MONTH'); // 'YEAR' | 'MONTH' | 'DAY' | 'HOUR'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hiddenSeries, setHiddenSeries] = useState({});

  const animProgressRef = useRef(1);
  const animFrameRef = useRef(null);

  const viewState = useRef({
    start: 0.0,
    end: 0.55,
    isDragging: false,
    dragStartX: 0,
    hoverX: null,
    hoverY: null,
  });

  // Trigger canvas resize when toggling the 85% Fullscreen modal
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 30);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen]);

  // Trigger animation whenever graphMode or resolutionMode changes
  const startAnimation = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const startTime = performance.now();
    const duration = 400; // ms

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // easeOutCubic: 1 - (1 - t)^3
      animProgressRef.current = 1 - Math.pow(1 - t, 3);

      window.dispatchEvent(new CustomEvent('cyberhub-redraw-chart'));

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        animProgressRef.current = 1;
        window.dispatchEvent(new CustomEvent('cyberhub-redraw-chart'));
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // Pre-generate rich time-series data for all resolutions and graphs
  const dataStore = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let seed = 42;
    const pseudoRandom = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    // 1. Yearly Data (2022-2026)
    const yearly = [
      { labelDay: '2022', labelFull: 'Year 2022', revenue: 268400, cost: 124000, profit: 144400, jobs: 1410, ewaste: 32.5, firstFix: 91.2, slaTarget: 90, rework: 6.8, cooling: 420, washer: 380, hvac: 310, kitchen: 300 },
      { labelDay: '2023', labelFull: 'Year 2023', revenue: 318900, cost: 146000, profit: 172900, jobs: 1690, ewaste: 39.2, firstFix: 92.8, slaTarget: 90, rework: 5.6, cooling: 510, washer: 460, hvac: 380, kitchen: 340 },
      { labelDay: '2024', labelFull: 'Year 2024', revenue: 364200, cost: 162000, profit: 202200, jobs: 1920, ewaste: 45.1, firstFix: 93.5, slaTarget: 90, rework: 5.1, cooling: 590, washer: 520, hvac: 420, kitchen: 390 },
      { labelDay: '2025', labelFull: 'Year 2025', revenue: 398500, cost: 175000, profit: 223500, jobs: 2110, ewaste: 49.8, firstFix: 94.2, slaTarget: 90, rework: 4.4, cooling: 650, washer: 580, hvac: 460, kitchen: 420 },
      { labelDay: '2026', labelFull: 'Year 2026', revenue: 442850, cost: 189500, profit: 253350, jobs: 2345, ewaste: 55.4, firstFix: 95.6, slaTarget: 90, rework: 3.8, cooling: 720, washer: 640, hvac: 520, kitchen: 465 },
    ];

    // 2. Daily & Hourly Data for 2026
    const startDate = new Date(2026, 0, 1);
    const daily = [];
    const hourly = [];

    for (let i = 0; i < 365; i++) {
      const d = new Date(startDate.getTime() + i * 86400000);
      const seasonalWave = Math.sin((i / 365) * Math.PI * 2) * 350;
      const baseRev = 980 + seasonalWave + i * 1.4;
      const noise = (pseudoRandom() - 0.45) * 450;
      const revenue = Math.max(340, Math.round(baseRev + noise));
      const cost = Math.max(120, Math.round(revenue * (0.38 + pseudoRandom() * 0.12)));
      const profit = revenue - cost;
      const jobs = Math.max(2, Math.round(revenue / 175));
      const ewaste = +(jobs * 0.024 + pseudoRandom() * 0.008).toFixed(2);
      const firstFix = +(92 + pseudoRandom() * 6).toFixed(1);
      const slaTarget = 90;
      const rework = +(100 - firstFix).toFixed(1);

      const cooling = Math.round(jobs * 0.38);
      const washer = Math.round(jobs * 0.28);
      const hvac = Math.round(jobs * 0.20);
      const kitchen = Math.max(0, jobs - cooling - washer - hvac);

      const dayLabel = `${String(d.getDate()).padStart(2, '0')} ${monthNames[d.getMonth()]}`;

      daily.push({
        monthIndex: d.getMonth(),
        labelDay: dayLabel,
        labelFull: `${dayLabel} 2026`,
        revenue,
        cost,
        profit,
        jobs,
        ewaste,
        firstFix,
        slaTarget,
        rework,
        cooling,
        washer,
        hvac,
        kitchen,
      });

      for (let hr = 8; hr <= 19; hr++) {
        const hourWeight = 0.06 + Math.sin(((hr - 8) / 11) * Math.PI) * 0.06;
        const hrRev = Math.max(25, Math.round(revenue * hourWeight * (0.85 + pseudoRandom() * 0.3)));
        const hrCost = Math.max(10, Math.round(hrRev * 0.42));
        const hrJobs = Math.max(1, Math.round(hrRev / 160));
        const hrStr = `${String(hr).padStart(2, '0')}:00`;
        hourly.push({
          labelDay: `${dayLabel} ${hrStr}`,
          labelFull: `${dayLabel} 2026 @ ${hrStr}`,
          revenue: hrRev,
          cost: hrCost,
          profit: hrRev - hrCost,
          jobs: hrJobs,
          ewaste: +(hrJobs * 0.022).toFixed(2),
          firstFix: +(93 + pseudoRandom() * 5).toFixed(1),
          slaTarget: 90,
          rework: +(3 + pseudoRandom() * 3).toFixed(1),
          cooling: Math.round(hrJobs * 0.4),
          washer: Math.round(hrJobs * 0.3),
          hvac: Math.round(hrJobs * 0.2),
          kitchen: Math.max(0, hrJobs - Math.round(hrJobs * 0.9)),
        });
      }
    }

    // 3. Monthly Data
    const monthly = monthNames.map((mName, mIdx) => {
      const days = daily.filter((d) => d.monthIndex === mIdx);
      const revenue = days.reduce((s, x) => s + x.revenue, 0);
      const cost = days.reduce((s, x) => s + x.cost, 0);
      const jobs = days.reduce((s, x) => s + x.jobs, 0);
      const ewaste = +days.reduce((s, x) => s + x.ewaste, 0).toFixed(1);
      const firstFix = +(days.reduce((s, x) => s + x.firstFix, 0) / days.length).toFixed(1);
      const rework = +(100 - firstFix).toFixed(1);

      return {
        monthIndex: mIdx,
        labelDay: `${mName} '26`,
        labelFull: `${mName} 2026`,
        revenue,
        cost,
        profit: revenue - cost,
        jobs,
        ewaste,
        firstFix,
        slaTarget: 90,
        rework,
        cooling: days.reduce((s, x) => s + x.cooling, 0),
        washer: days.reduce((s, x) => s + x.washer, 0),
        hvac: days.reduce((s, x) => s + x.hvac, 0),
        kitchen: days.reduce((s, x) => s + x.kitchen, 0),
      };
    });

    return { yearly, monthly, daily, hourly };
  }, []);

  // Configuration for current graph mode
  const currentConfig = useMemo(() => {
    switch (graphMode) {
      case 'volume-ewaste':
        return {
          title: 'Repair Volume & E-Waste Diverted',
          unit: 'Units / Tonnes',
          formatVal: (val) => val.toLocaleString(),
          datasets: [
            { key: 'jobs', label: 'Repairs Completed', color: '#2ed573', fill: true, unit: 'Jobs' },
            { key: 'ewaste', label: 'E-Waste Diverted (Tons)', color: '#ff7300', fill: false, unit: 'Tonnes', scale: 25 },
          ],
        };
      case 'first-fix-sla':
        return {
          title: 'First-Fix Rate & SLA Compliance',
          unit: '%',
          formatVal: (val) => `${val}%`,
          datasets: [
            { key: 'firstFix', label: 'First-Fix Success Rate', color: '#2ed573', fill: true, unit: '%' },
            { key: 'slaTarget', label: 'SLA Target Benchmark (90%)', color: '#f59e0b', fill: false, dashed: true, unit: '%' },
            { key: 'rework', label: 'Return / Re-Work Rate', color: '#ef4444', fill: false, unit: '%' },
          ],
        };
      case 'fault-categories':
        return {
          title: 'Appliance Category Fault Dynamics',
          unit: 'Faults',
          formatVal: (val) => `${val} Repairs`,
          datasets: [
            { key: 'cooling', label: 'Refrigerators & Cooling', color: '#ff7300', fill: true, unit: 'Repairs' },
            { key: 'washer', label: 'Washing Machines & Dryers', color: '#38bdf8', fill: false, unit: 'Repairs' },
            { key: 'hvac', label: 'Air Conditioners & HVAC', color: '#2ed573', fill: false, unit: 'Repairs' },
            { key: 'kitchen', label: 'Kitchen & Induction Hobs', color: '#ec4899', fill: false, unit: 'Repairs' },
          ],
        };
      case 'revenue-cost':
      default:
        return {
          title: 'Gross Revenue vs Parts Cost & Operating Margin',
          unit: 'RM',
          formatVal: (val) => `RM ${val.toLocaleString()}`,
          datasets: [
            { key: 'revenue', label: 'Gross Revenue', color: '#2ed573', fill: true, unit: 'RM' },
            { key: 'cost', label: 'Parts & Supplier Cost', color: '#ff7300', fill: true, unit: 'RM' },
            { key: 'profit', label: 'Net Profit Margin', color: '#38bdf8', fill: false, unit: 'RM' },
          ],
        };
    }
  }, [graphMode]);

  useEffect(() => {
    startAnimation();
  }, [graphMode, startAnimation]);

  // Main Canvas Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    const tooltip = tooltipRef.current;
    if (!canvas || !viewport) return;
    const ctx = canvas.getContext('2d');

    const drawChart = () => {
      const width = viewport.clientWidth;
      const height = viewport.clientHeight;
      if (width === 0 || height === 0) return;

      const padLeft = 24;
      const padRight = 88;
      const padTop = 26;
      const padBottom = 42;
      const plotW = width - padLeft - padRight;
      const plotH = height - padTop - padBottom;

      ctx.clearRect(0, 0, width, height);

      const { start, end, hoverX, hoverY } = viewState.current;
      const span = Math.max(0.005, end - start);
      const zoomFactor = 1 / span;

      let mode;
      let sourceData;

      if (zoomFactor < 1.35) {
        mode = 'YEAR';
        sourceData = dataStore.yearly;
      } else if (zoomFactor < 3.5) {
        mode = 'MONTH';
        sourceData = dataStore.monthly;
      } else if (zoomFactor < 14.0) {
        mode = 'DAY';
        sourceData = dataStore.daily;
      } else {
        mode = 'HOUR';
        sourceData = dataStore.hourly;
      }

      setZoomText(`${zoomFactor.toFixed(1)}x`);
      setResolutionMode(mode);

      const totalCount = sourceData.length;
      const startIdx = Math.max(0, Math.floor(start * totalCount));
      const endIdx = Math.min(totalCount - 1, Math.ceil(end * totalCount));
      const visibleSlice = sourceData.slice(startIdx, Math.max(startIdx + 1, endIdx + 1));
      if (visibleSlice.length === 0) return;

      const activeDatasets = currentConfig.datasets.filter((ds) => !hiddenSeries[ds.key]);

      // Determine max value for Y scaling
      let maxValue = 1;
      activeDatasets.forEach((ds) => {
        visibleSlice.forEach((item) => {
          let val = item[ds.key] || 0;
          if (ds.scale) val *= ds.scale;
          if (val > maxValue) maxValue = val;
        });
      });
      maxValue *= 1.15;

      const animProg = animProgressRef.current;

      // 1. Draw Grid Lines and Y-Axis Ticks
      const gridSteps = 5;
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';

      for (let i = 0; i <= gridSteps; i++) {
        const ratio = i / gridSteps;
        const y = padTop + plotH - ratio * plotH;
        const tickVal = Math.round(ratio * maxValue);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(padLeft + plotW, y);
        ctx.stroke();

        ctx.fillStyle = '#9ca3af';
        ctx.fillText(currentConfig.formatVal(tickVal), padLeft + plotW + 8, y + 4);
      }

      const count = visibleSlice.length;
      const slotW = plotW / count;
      const barW = Math.max(3, Math.min(48, slotW * 0.58));

      // 2. Draw Background Volume/Primary Bars if applicable
      const primaryDs = activeDatasets[0];
      if (primaryDs && graphMode === 'revenue-cost') {
        visibleSlice.forEach((item, idx) => {
          const centerX = padLeft + idx * slotW + slotW / 2;
          const barH = ((item.revenue || 0) / maxValue) * plotH * animProg;
          const topY = padTop + plotH - barH;

          const grad = ctx.createLinearGradient(0, topY, 0, padTop + plotH);
          grad.addColorStop(0, 'rgba(46, 213, 115, 0.22)');
          grad.addColorStop(1, 'rgba(46, 213, 115, 0.02)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(centerX - barW / 2, topY, barW, barH, [4, 4, 0, 0]);
          ctx.fill();
        });
      }

      // 3. Draw X-Axis Ticks & Labels
      const maxLabels = mode === 'HOUR' ? 7 : 11;
      const labelStep = Math.max(1, Math.ceil(count / maxLabels));
      visibleSlice.forEach((item, idx) => {
        if (idx % labelStep === 0) {
          const centerX = padLeft + idx * slotW + slotW / 2;
          ctx.fillStyle = '#9ca3af';
          ctx.textAlign = 'center';
          ctx.font = '11px sans-serif';
          ctx.fillText(item.labelDay, centerX, padTop + plotH + 22);
        }
      });

      // 4. Compute and Render Multi-Line Curves
      const multiLinePoints = {};

      activeDatasets.forEach((ds) => {
        const points = [];
        visibleSlice.forEach((item, idx) => {
          const centerX = padLeft + idx * slotW + slotW / 2;
          let val = item[ds.key] || 0;
          if (ds.scale) val *= ds.scale;
          const pointH = (val / maxValue) * plotH * animProg;
          const y = padTop + plotH - pointH;
          points.push({ x: centerX, y, val: item[ds.key], item, ds });
        });
        multiLinePoints[ds.key] = points;

        if (points.length > 1) {
          // Area gradient fill under line
          if (ds.fill) {
            ctx.save();
            ctx.beginPath();
            points.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
            ctx.lineTo(points[points.length - 1].x, padTop + plotH);
            ctx.lineTo(points[0].x, padTop + plotH);
            ctx.closePath();

            const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
            grad.addColorStop(0, `${ds.color}38`);
            grad.addColorStop(1, `${ds.color}04`);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.restore();
          }

          // Line stroke
          ctx.save();
          if (ds.dashed) ctx.setLineDash([6, 6]);
          ctx.strokeStyle = ds.color;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          points.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
          ctx.stroke();
          ctx.restore();

          // Little glowing dots at points if slice is small
          if (count <= 24) {
            points.forEach((pt) => {
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
              ctx.fillStyle = ds.color;
              ctx.fill();
            });
          }
        }
      });

      // 5. Intelligent Multi-Line Nearest Curve Tracker (CyberHub Old layout)
      const isCursorInside =
        hoverX !== null &&
        hoverY !== null &&
        hoverX >= padLeft &&
        hoverX <= padLeft + plotW &&
        hoverY >= padTop &&
        hoverY <= padTop + plotH;

      if (isCursorInside && activeDatasets.length > 0) {
        const anyKey = activeDatasets[0].key;
        const refPoints = multiLinePoints[anyKey];

        if (refPoints && refPoints.length > 0) {
          const clampedX = Math.max(refPoints[0].x, Math.min(refPoints[refPoints.length - 1].x, hoverX));

          // Find closest line dataset to the cursor
          let closestDs = activeDatasets[0];
          let minDistance = Infinity;
          let targetDotY = padTop + plotH;
          let nearestItem = refPoints[0].item;

          activeDatasets.forEach((ds) => {
            const pts = multiLinePoints[ds.key];
            if (!pts || pts.length === 0) return;

            let dotY = pts[0].y;
            for (let i = 0; i < pts.length - 1; i++) {
              const p1 = pts[i];
              const p2 = pts[i + 1];
              if (clampedX >= p1.x && clampedX <= p2.x) {
                const t = p2.x === p1.x ? 0 : (clampedX - p1.x) / (p2.x - p1.x);
                dotY = p1.y + t * (p2.y - p1.y);
                if (t < 0.5) nearestItem = p1.item;
                else nearestItem = p2.item;
                break;
              }
            }

            const dist = Math.abs(hoverY - dotY);
            if (dist < minDistance) {
              minDistance = dist;
              closestDs = ds;
              targetDotY = dotY;
            }
          });

          // Draw vertical guideline
          ctx.save();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(clampedX, padTop);
          ctx.lineTo(clampedX, padTop + plotH);
          ctx.stroke();
          ctx.restore();

          // Outer glowing ring on closest curve
          ctx.beginPath();
          ctx.arc(clampedX, targetDotY, 8.5, 0, Math.PI * 2);
          ctx.fillStyle = `${closestDs.color}55`;
          ctx.fill();

          // Solid tracker dot
          ctx.beginPath();
          ctx.arc(clampedX, targetDotY, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = closestDs.color;
          ctx.lineWidth = 2.5;
          ctx.fill();
          ctx.stroke();

          // Exact Value Tooltip following the dot
          if (tooltip) {
            tooltip.style.display = 'block';
            tooltip.style.borderColor = closestDs.color;

            const rowsHtml = activeDatasets
              .map((ds) => {
                const isSelected = ds.key === closestDs.key;
                const rawVal = nearestItem[ds.key];
                const displayVal =
                  ds.unit === 'RM'
                    ? `RM ${Number(rawVal).toLocaleString()}`
                    : ds.unit === '%'
                    ? `${rawVal}%`
                    : `${rawVal} ${ds.unit}`;
                return `
                <div style="display:flex; justify-content:space-between; gap:12px; margin-top:2px; ${
                  isSelected ? 'font-weight:700; color:' + ds.color : 'color:#cbd5e1'
                }">
                  <span>${isSelected ? '● ' : ''}${ds.label}:</span>
                  <span style="font-family:monospace; color:${ds.color};">${displayVal}</span>
                </div>
              `;
              })
              .join('');

            tooltip.innerHTML = `
              <div style="color:${closestDs.color}; font-weight:700; margin-bottom:4px; font-size:11.5px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:3px;">
                ${nearestItem.labelFull}
              </div>
              <div style="font-size:11px;">${rowsHtml}</div>
            `;

            const tipX = Math.min(width - 240, Math.max(12, clampedX + 16));
            const tipY = Math.max(12, targetDotY - 60);
            tooltip.style.left = `${tipX}px`;
            tooltip.style.top = `${tipY}px`;
          }
        }
      } else if (tooltip) {
        tooltip.style.display = 'none';
      }
    };

    const resizeCanvas = () => {
      const rect = viewport.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
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
        const shift = (e.deltaX / rect.width) * currentSpan * 0.85;
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

    const handleMouseUp = () => {
      viewState.current.isDragging = false;
    };

    const handleMouseLeave = () => {
      viewState.current.isDragging = false;
      viewState.current.hoverX = null;
      viewState.current.hoverY = null;
      if (tooltip) tooltip.style.display = 'none';
      drawChart();
    };

    const handleAiChartCommand = (e) => {
      const { mode, monthIndex, panDirection } = e.detail;
      if (panDirection) {
        const span = viewState.current.end - viewState.current.start;
        const shift = panDirection === 'left' ? -span * 0.35 : span * 0.35;
        let nextStart = Math.max(0, Math.min(1 - span, viewState.current.start + shift));
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
      startAnimation();
      drawChart();
    };

    const handleRedraw = () => drawChart();

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    viewport.addEventListener('wheel', handleWheel, { passive: false });
    viewport.addEventListener('mousedown', handleMouseDown);
    viewport.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    viewport.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('cyberhub-chart-command', handleAiChartCommand);
    window.addEventListener('cyberhub-redraw-chart', handleRedraw);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      viewport.removeEventListener('wheel', handleWheel);
      viewport.removeEventListener('mousedown', handleMouseDown);
      viewport.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      viewport.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('cyberhub-chart-command', handleAiChartCommand);
      window.removeEventListener('cyberhub-redraw-chart', handleRedraw);
    };
  }, [isFullscreen, dataStore, currentConfig, hiddenSeries, graphMode, startAnimation]);

  const setMode = (mode) => {
    window.dispatchEvent(new CustomEvent('cyberhub-chart-command', { detail: { mode } }));
  };

  const panGraph = (panDirection) => {
    window.dispatchEvent(new CustomEvent('cyberhub-chart-command', { detail: { panDirection } }));
  };

  const toggleSeries = (key) => {
    setHiddenSeries((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const graphBody = (
    <>
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontSize: isFullscreen ? '18px' : '15px' }}>{title}</h3>
          <span className="status-pill completed">RESOLUTION: {resolutionMode}</span>
          <span className="mono" style={{ fontSize: '12px', color: '#9ca3af' }}>
            Zoom: {zoomText}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Time scale switcher */}
          {['year', 'month', 'day', 'hour'].map((m) => (
            <button
              key={m}
              type="button"
              className={`filter-pill ${resolutionMode === m.toUpperCase() ? 'active' : ''}`}
              onClick={() => setMode(m)}
              style={{ fontSize: '11px', padding: '3px 9px' }}
            >
              {m.toUpperCase()}
            </button>
          ))}
          <button type="button" className="btn-small outline" onClick={() => panGraph('left')} title="Pan Left">
            ◀
          </button>
          <button type="button" className="btn-small outline" onClick={() => panGraph('right')} title="Pan Right">
            ▶
          </button>
          {!isFullscreen ? (
            <button
              type="button"
              className="btn-small"
              onClick={() => setIsFullscreen(true)}
              style={{ background: 'var(--app-logo, #ff7300)', color: '#fff' }}
              title="Expand to 80% Fullscreen View"
            >
              ⛶ Fullscreen
            </button>
          ) : (
            <button
              type="button"
              className="btn-small ch-close-fs-btn ch-chart-modal-close"
              onClick={() => setIsFullscreen(false)}
              title="Close Fullscreen (Esc)"
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {/* Graph Modes & Interactive Multi-Line Curve Toggles */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '10px',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '6px 10px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Graph Selection Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {GRAPH_MODES.map((gm) => (
            <button
              key={gm.id}
              type="button"
              className={`filter-pill ${graphMode === gm.id ? 'active' : ''}`}
              onClick={() => setGraphMode(gm.id)}
              style={{
                fontSize: '11px',
                padding: '3px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>{renderGraphModeIcon(gm.iconType)}</span> {gm.label}
            </button>
          ))}
        </div>

        {/* Legend Series Toggle Pills */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af', marginRight: '2px' }}>Curves:</span>
          {currentConfig.datasets.map((ds) => {
            const isHidden = hiddenSeries[ds.key];
            return (
              <button
                key={ds.key}
                type="button"
                onClick={() => toggleSeries(ds.key)}
                style={{
                  background: isHidden ? 'rgba(255,255,255,0.04)' : `${ds.color}22`,
                  border: `1px solid ${isHidden ? 'rgba(255,255,255,0.1)' : ds.color}`,
                  color: isHidden ? '#6b7280' : '#ffffff',
                  fontSize: '11px',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease',
                  textDecoration: isHidden ? 'line-through' : 'none',
                }}
                title={isHidden ? `Show ${ds.label}` : `Hide ${ds.label}`}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: isHidden ? '#6b7280' : ds.color,
                  }}
                />
                {ds.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Canvas Viewport with Tooltip */}
      <div
        ref={viewportRef}
        style={{
          position: 'relative',
          width: '100%',
          height: isFullscreen ? 'calc(80vh - 165px)' : compact ? '270px' : '400px',
          background: '#030b26',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden',
          cursor: 'default',
          userSelect: 'none',
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
            zIndex: 30,
            boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
          }}
        />
      </div>
    </>
  );

  if (isFullscreen) {
    return (
      <>
        <div className="ch-card" style={{ minHeight: compact ? '270px' : '400px', opacity: 0.25, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '13px', color: '#ff7300' }}>⛶ Interactive Telemetry Graph in 80% Fullscreen Mode</span>
        </div>
        {createPortal(
          <>
            <div
              className="ch-fullscreen-backdrop"
              onClick={() => setIsFullscreen(false)}
              title="Click backdrop to close (Esc)"
            />
            <div className="ch-card chart-card-fullscreen-80">
              {graphBody}
            </div>
          </>,
          document.body
        )}
      </>
    );
  }

  return (
    <div className="ch-card">
      {graphBody}
    </div>
  );
};

export default InteractiveGraph;
