// Utility to resolve esId consistently across components/services
export function resolveEsId(file, fallback) {
  if (!file && !fallback) return null;
  // collect possible keys
  const candidates = [
    file?.esId,
    file?.esID,
    file?.esid,
    file?.ESID,
    file?.ESId,
    file?._raw?.esId,
    file?._raw?.esid,
    file?._raw?.ESID,
    file?._raw?.ESId,
    fallback
  ];
  for (const c of candidates) { if (c) return c; }
  return null;
}

export function buildEsIdPayload(esId){
  // Some backend endpoints may accept either esId or esid; send both for compatibility
  return { esId, esid: esId };
}