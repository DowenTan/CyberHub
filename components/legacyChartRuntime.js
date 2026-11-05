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
  controls.innerHTML = '<button type="button" aria-label="Zoom in chart">+</button><button type="button" aria-label="Zoom out chart">−</button><button type="button" aria-label="Reset chart zoom">Reset</button><button type="button" aria-label="Open chart fullscreen">Fullscreen</button>';
  const [inButton, outButton, resetButton, fullscreenButton] = controls.querySelectorAll('button');
  const zoomIn = () => chart.zoomBy(1.35);
  const zoomOut = () => chart.zoomBy(1 / 1.35);
  const reset = () => chart.resetZoom();
  const fullscreen = () => {
    if (document.fullscreenElement === parent) document.exitFullscreen?.();
    else parent.requestFullscreen?.();
  };
  inButton.addEventListener('click', zoomIn);
  outButton.addEventListener('click', zoomOut);
  resetButton.addEventListener('click', reset);
  fullscreenButton.addEventListener('click', fullscreen);
  parent.appendChild(controls);

  return () => {
    inButton.removeEventListener('click', zoomIn);
    outButton.removeEventListener('click', zoomOut);
    resetButton.removeEventListener('click', reset);
    fullscreenButton.removeEventListener('click', fullscreen);
    controls.remove();
  };
}

export function installLegacyChartRuntime() {
  const charts = [];
  const resizeObserver = new ResizeObserver(() => charts.forEach((chart) => chart.render()));

  class LocalChart {
    static defaults = { global: {} };

    constructor(context, config) {
      this.canvas = context.canvas;
      this.type = config.type;
      this.data = config.data;
      this.options = config.options || {};
      this.zoom = { start: 0, end: 1, factor: 1 };
      this.pan = { active: false, x: 0 };
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
        if (!this.pan.active) return;
        const dx = event.clientX - this.pan.x;
        this.pan.x = event.clientX;
        this.panByPixels(dx);
      };
      this.onPointerUp = () => {
        this.pan.active = false;
        this.canvas.style.cursor = this.type === 'line' ? 'zoom-in' : 'default';
      };
      this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
      this.canvas.addEventListener('pointerdown', this.onPointerDown);
      this.canvas.addEventListener('pointermove', this.onPointerMove);
      this.canvas.addEventListener('pointerup', this.onPointerUp);
      this.canvas.addEventListener('pointercancel', this.onPointerUp);
      this.canvas.style.cursor = this.type === 'line' ? 'zoom-in' : 'default';
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
