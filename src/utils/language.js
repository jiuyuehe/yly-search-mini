// language display helper
// Provide a single source of truth for mapping language codes to human-readable labels
export const ORDERED_LANGS = ['auto','zh','en','fr','es','de','ja','ru','it','ko','pt','hi'];

export const LANG_MAP = {
  auto: '自动',
  zh: '中文',
  en: '英文',
  fr: '法语',
  es: '西班牙语',
  de: '德语',
  ja: '日语',
  ru: '俄语',
  it: '意大利语',
  ko: '韩语',
  pt: '葡萄牙语',
  hi: '印地语'
};

export function getLangLabel(code) {
  if (!code) return '';
  const key = String(code).trim();
  return LANG_MAP[key] || key;
}

// getLangOptions optionally accepts an array of allowed language codes to limit options
export function getLangOptions(allowed) {
  const all = ORDERED_LANGS;
  const list = Array.isArray(allowed) && allowed.length ? all.filter(v => allowed.includes(v)) : all;
  return list.map(v => ({ value: v, label: getLangLabel(v) }));
}

export default {
  LANG_MAP,
  getLangLabel,
  getLangOptions
};
