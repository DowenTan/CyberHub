const palette = ['#ff7300', '#2ed573', '#3498db', '#e74c3c'];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function prepareCanvas(canvas) {
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(bounds.width));
  const height = Math.max(1, Math.floor(bounds.height));
  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const context = canvas.getContext('2d');
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { context, width, height };
}

function drawLine(chart, context, width, height) {
  const { labels = [], datasets = [] } = chart.data;
  const pad = { top: 24, right: 18, bottom: 34, left: 54 };
  const plotWidth = Math.max(1, width - pad.left - pad.right);
  const plotHeight = Math.max(1, height - pad.top - pad.bottom);
  const zoom = chart.zoom;
  const start = Math.floor(zoom.start * labels.length);
  const end = Math.max(start + 1, Math.ceil(zoom.end * labels.length));
  const visibleLabels = labels.slice(start, end);
  const visibleDatasets = datasets.map((dataset) => ({
    ...dataset,
    data: (dataset.data || []).slice(start, end),
  }));
  const values = visibleDatasets.flatMap((dataset) => dataset.data).filter(Number.isFinite);
  const maxValue = Math.max(1, ...values) * 1.12;
  const minValue = 0;
  const yValue = (value) => pad.top + plotHeight - ((value - minValue) / (maxValue - minValue)) * plotHeight;
  const xValue = (index) => {
    if (visibleLabels.length <= 1) return pad.left + plotWidth / 2;
    return pad.left + (index / (visibleLabels.length - 1)) * plotWidth;
  };

  context.clearRect(0, 0, width, height);
  context.font = '10px Poppins, sans-serif';
  context.lineWidth = 1;
  context.textBaseline = 'middle';

  for (let step = 0; step <= 4; step += 1) {
    const ratio = step / 4;
    const y = pad.top + plotHeight - ratio * plotHeight;
    const tick = Math.round(maxValue * ratio);
    context.strokeStyle = 'rgba(255,255,255,0.07)';
    context.beginPath();
    context.moveTo(pad.left, y);
    context.lineTo(width - pad.right, y);
    context.stroke();
    context.fillStyle = '#8a97b2';
    context.textAlign = 'right';
    context.fillText(chart.currency ? `RM ${tick.toLocaleString()}` : tick.toLocaleString(), pad.left - 8, y);
  }

  const labelStep = Math.max(1, Math.ceil(visibleLabels.length / 8));
  visibleLabels.forEach((label, index) => {
    if (index % labelStep !== 0 && index !== visibleLabels.length - 1) return;
    context.fillStyle = '#8a97b2';
    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    context.fillText(label, xValue(index), height - 10);
  });

  visibleDatasets.forEach((dataset, datasetIndex) => {
    const color = dataset.borderColor || palette[datasetIndex % palette.length];
    const points = dataset.data.map((value, index) => ({ x: xValue(index), y: yValue(value) }));
    if (!points.length) return;

    context.beginPath();
    points.forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.lineWidth = dataset.borderWidth || 2;
    context.strokeStyle = color;
    context.stroke();

    if (dataset.backgroundColor) {
      context.lineTo(points.at(-1).x, pad.top + plotHeight);
      context.lineTo(points[0].x, pad.top + plotHeight);
      context.closePath();
      const fill = context.createLinearGradient(0, pad.top, 0, pad.top + plotHeight);
      fill.addColorStop(0, `${color}66`);
      fill.addColorStop(1, `${color}08`);
      context.fillStyle = fill;
      context.fill();
    }

    context.fillStyle = dataset.pointBackgroundColor || color;
    points.forEach((point) => {
      context.beginPath();
      context.arc(point.x, point.y, 3, 0, Math.PI * 2);
      context.fill();
    });
  });

  // Check if cursor is strictly inside the graph plot area
  const isInside =
    chart.hover?.active &&
    chart.hover.x !== null &&
    chart.hover.y !== null &&
    chart.hover.x >= pad.left &&
    chart.hover.x <= width - pad.right &&
    chart.hover.y >= pad.top &&
    chart.hover.y <= height - pad.bottom;

  const firstDataset = visibleDatasets[0];
  if (isInside && firstDataset?.data?.length > 0) {
    const primaryPoints = firstDataset.data.map((value, index) => ({
      x: xValue(index),
      y: yValue(value),
      val: value,
      label: visibleLabels[index] || '',
    }));

    if (primaryPoints.length > 0) {
      const clampedX = Math.max(
        primaryPoints[0].x,
        Math.min(primaryPoints[primaryPoints.length - 1].x, chart.hover.x)
      );

      let dotY = primaryPoints[0].y;
      let exactVal = primaryPoints[0].val;
      let nearestLabel = primaryPoints[0].label;

      for (let i = 0; i < primaryPoints.length - 1; i++) {
        const p1 = primaryPoints[i];
        const p2 = primaryPoints[i + 1];
        if (clampedX >= p1.x && clampedX <= p2.x) {
          const t = p2.x === p1.x ? 0 : (clampedX - p1.x) / (p2.x - p1.x);
          dotY = p1.y + t * (p2.y - p1.y);
          exactVal = Math.round(p1.val + t * (p2.val - p1.val));
          nearestLabel = t < 0.5 ? p1.label : p2.label;
          break;
        }
      }

      if (clampedX <= primaryPoints[0].x) {
        dotY = primaryPoints[0].y;
        exactVal = primaryPoints[0].val;
        nearestLabel = primaryPoints[0].label;
      } else if (clampedX >= primaryPoints[primaryPoints.length - 1].x) {
        dotY = primaryPoints[primaryPoints.length - 1].y;
        exactVal = primaryPoints[primaryPoints.length - 1].val;
        nearestLabel = primaryPoints[primaryPoints.length - 1].label;
      }

      // 1. Vertical guideline at cursor X
      context.save();
      context.setLineDash([4, 4]);
      context.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(clampedX, pad.top);
      context.lineTo(clampedX, pad.top + plotHeight);
      context.stroke();
      context.restore();

      // 2. Outer glow ring on the line
      context.beginPath();
      context.arc(clampedX, dotY, 8, 0, Math.PI * 2);
      context.fillStyle = 'rgba(255, 115, 0, 0.35)';
      context.fill();

      // 3. Solid tracker dot riding along the line
      context.beginPath();
      context.arc(clampedX, dotY, 4.5, 0, Math.PI * 2);
      context.fillStyle = '#ffffff';
      context.strokeStyle = '#ff7300';
      context.lineWidth = 2.5;
      context.fill();
      context.stroke();

      // 4. Exact Value Tooltip (no zoom cursor)
      const parentEl = chart.canvas.parentElement;
      if (parentEl) {
        if (!chart.tooltipEl) {
          chart.tooltipEl = document.createElement('div');
          chart.tooltipEl.className = 'ch-chart-tooltip';
          chart.tooltipEl.style.position = 'absolute';
          chart.tooltipEl.style.pointerEvents = 'none';
          chart.tooltipEl.style.zIndex = '30';
          chart.tooltipEl.style.background = 'rgba(1, 8, 31, 0.95)';
          chart.tooltipEl.style.border = '1px solid #ff7300';
          chart.tooltipEl.style.padding = '8px 12px';
          chart.tooltipEl.style.borderRadius = '8px';
          chart.tooltipEl.style.boxShadow = '0 8px 24px rgba(0,0,0,0.6)';
          parentEl.appendChild(chart.tooltipEl);
        }
        chart.tooltipEl.style.display = 'block';
        chart.tooltipEl.innerHTML = `
          <div style="color: #ff7300; font-weight: 700; font-size: 11px; margin-bottom: 3px;">${nearestLabel}</div>
          <div style="font-size: 12px; color: #ffffff;">Exact Value: <strong style="color: #2ed573;">${
            chart.currency ? 'RM ' + Number(exactVal).toLocaleString() : Number(exactVal).toLocaleString()
          }</strong></div>
        `;
        const tipX = Math.min(width - 160, Math.max(10, clampedX + 14));
        const tipY = Math.max(10, dotY - 50);
        chart.tooltipEl.style.left = `${tipX}px`;
        chart.tooltipEl.style.top = `${tipY}px`;
      }
    }
  } else if (chart.tooltipEl) {
    chart.tooltipEl.style.display = 'none';
  }

  if (chart.zoom.end - chart.zoom.start < 0.999) {
    context.fillStyle = 'rgba(1,8,31,.82)';
    context.fillRect(width - 73, 9, 64, 20);
    context.fillStyle = '#ffb173';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(`${chart.zoom.factor.toFixed(1)}x`, width - 41, 19);
  }
}

function drawDoughnut(chart, context, width, height) {
  const values = chart.data.datasets?.[0]?.data || [];
  const colors = chart.data.datasets?.[0]?.backgroundColor || palette;
  const total = values.reduce((sum, value) => sum + value, 0) || 1;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.max(24, Math.min(width, height) / 2 - 18);
  const innerRadius = radius * 0.72;
  let angle = -Math.PI / 2;

  context.clearRect(0, 0, width, height);
  values.forEach((value, index) => {
    const arc = (value / total) * Math.PI * 2;
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.arc(centerX, centerY, radius, angle, angle + arc);
    context.closePath();
    context.fillStyle = colors[index % colors.length];
    context.fill();
    angle += arc;
  });
  context.beginPath();
  context.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
  context.fillStyle = '#01081f';
  context.fill();
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '600 14px Poppins, sans-serif';
  context.fillText('Fault mix', centerX, centerY - 7);
  context.fillStyle = '#b8c4db';
  context.font = '11px Poppins, sans-serif';
  context.fillText(`${total}%`, centerX, centerY + 11);
}

function addZoomControls(chart) {
  if (chart.type !== 'line') return () => {};
  const parent = chart.canvas.parentElement;
  if (!parent) return () => {};
  parent.style.position = parent.style.position || 'relative';
  const controls = document.createElement('div');
  controls.className = 'legacy-chart-zoom-controls';
  controls.innerHTML =
    '<button type="button" aria-label="Zoom in chart">+</button><button type="button" aria-label="Zoom out chart">−</button><button type="button" aria-label="Reset chart zoom">Reset</button><button type="button" aria-label="Open chart fullscreen">Fullscreen</button>';
  const [inButton, outButton, resetButton, fullscreenButton] = controls.querySelectorAll('button');
  const zoomIn = () => chart.zoomBy(1.35);
  const zoomOut = () => chart.zoomBy(1 / 1.35);
  const reset = () => chart.resetZoom();

  let modalBackdrop = null;
  const closeModal = () => {
    if (!modalBackdrop) return;
    const placeholder = document.getElementById('chChartPlaceholder_' + chart.id);
    if (placeholder && placeholder.parentNode) {
      placeholder.parentNode.insertBefore(parent, placeholder);
      placeholder.remove();
    }
    modalBackdrop.remove();
    modalBackdrop = null;
    chart.isFullscreen = false;
    setTimeout(() => chart.render(), 30);
  };

  const openModal = () => {
    chart.isFullscreen = true;
    modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'ch-chart-modal-backdrop';

    const modalWindow = document.createElement('div');
    modalWindow.className = 'ch-chart-modal-window';

    const modalHeader = document.createElement('div');
    modalHeader.className = 'ch-chart-modal-header';
    modalHeader.innerHTML = `
      <div class="ch-chart-modal-title">Live Telemetry & Diagnostics Graph</div>
      <button type="button" class="ch-chart-modal-close" aria-label="Close fullscreen modal">✕ Close</button>
    `;

    const modalBody = document.createElement('div');
    modalBody.className = 'ch-chart-modal-body';

    modalWindow.appendChild(modalHeader);
    modalWindow.appendChild(modalBody);
    modalBackdrop.appendChild(modalWindow);
    document.body.appendChild(modalBackdrop);

    const placeholder = document.createElement('div');
    placeholder.id = 'chChartPlaceholder_' + chart.id;
    parent.parentNode.insertBefore(placeholder, parent);
    modalBody.appendChild(parent);

    const closeBtn = modalHeader.querySelector('.ch-chart-modal-close');
    closeBtn.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });

    const onEsc = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        window.removeEventListener('keydown', onEsc);
      }
    };
    window.addEventListener('keydown', onEsc);

    setTimeout(() => chart.render(), 30);
  };

  const toggleFullscreen = () => {
    if (modalBackdrop) closeModal();
    else openModal();
  };

  inButton.addEventListener('click', zoomIn);
  outButton.addEventListener('click', zoomOut);
  resetButton.addEventListener('click', reset);
  fullscreenButton.addEventListener('click', toggleFullscreen);
  parent.appendChild(controls);

  return () => {
    closeModal();
    inButton.removeEventListener('click', zoomIn);
    outButton.removeEventListener('click', zoomOut);
    resetButton.removeEventListener('click', reset);
    fullscreenButton.removeEventListener('click', toggleFullscreen);
    controls.remove();
  };
}

export function installLegacyChartRuntime() {
  const charts = [];
  const resizeObserver = new ResizeObserver(() => charts.forEach((chart) => chart.render()));

  class LocalChart {
    static defaults = { global: {} };

    constructor(context, config) {
      this.id = Math.random().toString(36).substring(2, 9);
      this.canvas = context.canvas;
      this.type = config.type;
      this.data = config.data;
      this.options = config.options || {};
      this.zoom = { start: 0, end: 1, factor: 1 };
      this.pan = { active: false, x: 0 };
      this.hover = { active: false, x: null, y: null };
      this.currency = Boolean(this.options?.scales?.yAxes?.[0]?.ticks?.callback);

      this.onWheel = (event) => {
        if (this.type !== 'line') return;
        event.preventDefault();
        this.zoomBy(event.deltaY < 0 ? 1.35 : 1 / 1.35, event.offsetX / this.canvas.clientWidth);
      };

      this.onPointerDown = (event) => {
        if (this.type !== 'line' || this.zoom.factor <= 1) return;
        this.pan = { active: true, x: event.clientX };
        this.canvas.setPointerCapture?.(event.pointerId);
        this.canvas.style.cursor = 'grabbing';
      };

      this.onPointerMove = (event) => {
        if (this.pan.active) {
          const dx = event.clientX - this.pan.x;
          this.pan.x = event.clientX;
          this.panByPixels(dx);
          return;
        }
        const rect = this.canvas.getBoundingClientRect();
        this.hover = {
          active: true,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };
        this.render();
      };

      this.onPointerUp = () => {
        this.pan.active = false;
        this.canvas.style.cursor = 'default';
      };

      this.onPointerLeave = () => {
        this.hover = { active: false, x: null, y: null };
        if (this.tooltipEl) {
          this.tooltipEl.style.display = 'none';
        }
        this.render();
      };

      this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
      this.canvas.addEventListener('pointerdown', this.onPointerDown);
      this.canvas.addEventListener('pointermove', this.onPointerMove);
      this.canvas.addEventListener('pointerup', this.onPointerUp);
      this.canvas.addEventListener('pointercancel', this.onPointerUp);
      this.canvas.addEventListener('pointerleave', this.onPointerLeave);
      this.canvas.style.cursor = 'default';

      this.removeControls = addZoomControls(this);
      resizeObserver.observe(this.canvas);
      charts.push(this);
      this.render();
    }

    update() {
      this.render();
    }

    resetZoom() {
      this.zoom = { start: 0, end: 1, factor: 1 };
      this.render();
    }

    zoomBy(multiplier, anchor = 0.5) {
      const oldSpan = this.zoom.end - this.zoom.start;
      if (multiplier < 1 && oldSpan >= 0.999) {
        window.dispatchEvent(new CustomEvent('cyberhub-chart-granularity', { detail: { time: 'year' } }));
        return;
      }
      const newSpan = clamp(oldSpan / multiplier, 0.12, 1);
      const pivot = this.zoom.start + oldSpan * clamp(anchor, 0, 1);
      let start = pivot - newSpan * clamp(anchor, 0, 1);
      start = clamp(start, 0, 1 - newSpan);
      this.zoom = { start, end: start + newSpan, factor: 1 / newSpan };
      const time = this.zoom.factor >= 6 ? 'hour' : this.zoom.factor >= 2.2 ? 'day' : 'month';
      window.dispatchEvent(new CustomEvent('cyberhub-chart-granularity', { detail: { time } }));
      this.render();
    }

    panByPixels(deltaX) {
      const span = this.zoom.end - this.zoom.start;
      const shift = -(deltaX / Math.max(1, this.canvas.clientWidth)) * span;
      const start = clamp(this.zoom.start + shift, 0, 1 - span);
      this.zoom = { start, end: start + span, factor: 1 / span };
      this.render();
    }

    focusMonth(index) {
      const count = this.data.labels?.length || 1;
      const span = Math.min(1, Math.max(0.12, 1 / Math.min(count, 5)));
      const anchor = (index + 0.5) / count;
      let start = anchor - span / 2;
      start = clamp(start, 0, 1 - span);
      this.zoom = { start, end: start + span, factor: 1 / span };
      this.render();
    }

    render() {
      const { context, width, height } = prepareCanvas(this.canvas);
      if (this.type === 'doughnut') drawDoughnut(this, context, width, height);
      else drawLine(this, context, width, height);
    }

    destroy() {
      this.canvas.removeEventListener('wheel', this.onWheel);
      this.canvas.removeEventListener('pointerdown', this.onPointerDown);
      this.canvas.removeEventListener('pointermove', this.onPointerMove);
      this.canvas.removeEventListener('pointerup', this.onPointerUp);
      this.canvas.removeEventListener('pointercancel', this.onPointerUp);
      this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
      this.tooltipEl?.remove();
      this.removeControls();
      resizeObserver.unobserve(this.canvas);
    }
  }

  const chartCommand = (event) => {
    const detail = event.detail || {};
    charts.filter((chart) => chart.type === 'line').forEach((chart) => {
      if (detail.mode === 'reset') chart.resetZoom();
      else if (typeof detail.monthIndex === 'number') chart.focusMonth(detail.monthIndex);
      else chart.zoomBy(2);
    });
  };
  window.addEventListener('cyberhub-chart-command', chartCommand);
  const pendingCommand = window.sessionStorage.getItem('cyberhub-chart-command');
  if (pendingCommand) {
    try {
      chartCommand({ detail: JSON.parse(pendingCommand) });
      window.sessionStorage.removeItem('cyberhub-chart-command');
    } catch {
      window.sessionStorage.removeItem('cyberhub-chart-command');
    }
  }

  return {
    Chart: LocalChart,
    dispose: () => {
      window.removeEventListener('cyberhub-chart-command', chartCommand);
      charts.forEach((chart) => chart.destroy());
      resizeObserver.disconnect();
    },
  };
}
