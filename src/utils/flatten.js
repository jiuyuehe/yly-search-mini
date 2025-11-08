// Shared flatten/unflatten utilities for extraction fields normalization.
// Handles nested objects and arrays (object arrays -> first element expansion + __count).

export function toUnifiedFields(src) {
  if (!src || typeof src !== 'object') return {};
  // Prefer extracted_data if present
  if (src.extracted_data && typeof src.extracted_data === 'object') {
    return { ...src.extracted_data };
  }
  const fields = src.fields;
  if (!fields) return {};
  if (typeof fields === 'object' && !Array.isArray(fields)) {
    return { ...fields }; // plain object
  }
  if (Array.isArray(fields)) {
    const obj = {};
    fields.forEach(f => {
      if (typeof f === 'string') {
        try { const parsed = JSON.parse(f); if (parsed && typeof parsed === 'object') Object.assign(obj, parsed); } catch { /* ignore */ }
      } else if (f && typeof f === 'object' && 'name' in f && 'value' in f) {
        obj[f.name] = f.value;
      } else if (f && typeof f === 'object') {
        Object.assign(obj, f);
      }
    });
    return obj;
  }
  return {};
}

export function flatten(obj, prefix = '', out = {}) {
  Object.entries(obj || {}).forEach(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, key, out);
    } else if (Array.isArray(v)) {
      if (v.length > 0 && v.every(el => el && typeof el === 'object' && !Array.isArray(el))) {
        const first = v[0];
        Object.entries(first).forEach(([subK, subV]) => {
          const subPath = `${key}.${subK}`;
          if (subV && typeof subV === 'object' && !Array.isArray(subV)) flatten(subV, subPath, out);
          else if (Array.isArray(subV)) out[subPath] = JSON.stringify(subV);
          else out[subPath] = subV;
        });
        out[`${key}.__count`] = v.length;
      } else {
        out[key] = JSON.stringify(v);
      }
    } else {
      out[key] = v;
    }
  });
  return out;
}

export function unflatten(rowArrayOrObj, columns) {
  const result = {};
  // rowArrayOrObj may be array (in HOT after getDataAtRow) or object keyed by column data path.
  if (Array.isArray(rowArrayOrObj)) {
    columns.forEach((col, idx) => {
      const path = col.data;
      const value = rowArrayOrObj[idx];
      applyPath(result, path, value);
    });
  } else {
    Object.entries(rowArrayOrObj || {}).forEach(([path, value]) => applyPath(result, path, value));
  }
  return result;
}

function applyPath(root, path, value) {
  const segs = String(path).split('.').filter(s => s !== '__count');
  let cur = root;
  segs.forEach((seg, i) => {
    if (i === segs.length - 1) {
      cur[seg] = value;
    } else {
      if (!cur[seg] || typeof cur[seg] !== 'object') cur[seg] = {};
      cur = cur[seg];
    }
  });
}
