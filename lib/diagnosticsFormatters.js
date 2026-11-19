// Currency, Timezone (Asia/Kuala_Lumpur), and Confidence formatters

export function formatRM(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'RM 0.00';
  }
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  return `RM ${num.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatConfidencePct(conf) {
  if (conf === null || conf === undefined || isNaN(conf)) return '0%';
  const val = conf <= 1 ? conf * 100 : conf;
  return `${Math.round(val)}%`;
}

export function getConfidenceBand(conf) {
  if (conf === null || conf === undefined || isNaN(conf)) return 'low';
  const val = conf <= 1 ? conf : conf / 100;
  if (val < 0.55) return 'low';
  if (val <= 0.8) return 'medium';
  return 'high';
}

export function getConfidenceColor(conf) {
  const band = getConfidenceBand(conf);
  if (band === 'low') return '#ff4757';
  if (band === 'medium') return '#ffa502';
  return '#2ed573';
}

export function formatTimeAgo(isoString) {
  if (!isoString) return 'Just now';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDays = Math.floor(diffHour / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
}

export function formatDateTimeMY(isoString) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-MY', {
      timeZone: 'Asia/Kuala_Lumpur',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return String(isoString);
  }
}
