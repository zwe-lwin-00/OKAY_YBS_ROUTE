/** Stable stop place IDs shared across routes (curb-level ≈11m). */

export function normalizeStopName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Human-readable canonical id: `sule@16.7742,96.1586` */
export function canonicalPlaceId(
  nameNorm: string,
  lat: number,
  lng: number,
): string {
  return `${nameNorm || "stop"}@${lat.toFixed(4)},${lng.toFixed(4)}`;
}

/** Short URL-safe alias: `p_1a2b3c4d` (stable hash of canonical). */
export function shortPlaceId(canonical: string): string {
  let h = 2166136261;
  for (let i = 0; i < canonical.length; i++) {
    h ^= canonical.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `p_${(h >>> 0).toString(36)}`;
}

export function buildPlaceIds(
  nameEn: string,
  lat: number,
  lng: number,
): { id: string; short_id: string } {
  const id = canonicalPlaceId(normalizeStopName(nameEn), lat, lng);
  return { id, short_id: shortPlaceId(id) };
}
