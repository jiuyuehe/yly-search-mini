export function getCssVariable(varName, fallback = '') {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallback;
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue(varName);
  return value ? value.trim() : fallback;
}

export function getPrimaryColor(fallback = '#3B82F6') {
  return getCssVariable('--primary-color', fallback) || fallback;
}

export function getPrimaryColorRgb(fallback = '59, 130, 246') {
  return getCssVariable('--primary-color-rgb', fallback) || fallback;
}

export function getPrimaryColorWithAlpha(alpha = 1) {
  const rgb = getPrimaryColorRgb();
  return `rgba(${rgb}, ${alpha})`;
}
