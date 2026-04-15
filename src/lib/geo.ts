/** Haversine distance in meters between two lat/lon points */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Add random noise to coordinates (~200m radius) for privacy.
 * Uses a deterministic seed from the post ID so the same post always
 * gets the same fuzzed location (no jitter on re-fetches).
 */
export function fuzzCoordinates(
  lat: number,
  lon: number,
  seed: string
): { lat: number; lon: number } {
  // Simple hash from seed string to get deterministic "random" values
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  // Two pseudo-random values from the hash
  const r1 = ((h & 0xffff) / 0xffff) * 2 - 1; // -1 to 1
  const r2 = (((h >>> 16) & 0xffff) / 0xffff) * 2 - 1; // -1 to 1

  // ~200m offset: 0.002 degrees ≈ 200m at mid-latitudes
  const offsetLat = r1 * 0.002;
  const offsetLon = r2 * 0.002;

  return {
    lat: lat + offsetLat,
    lon: lon + offsetLon,
  };
}

/** Convert feet to meters */
export function feetToMeters(feet: number): number {
  return feet * 0.3048;
}

/** Range options for the filter UI (in meters) */
export const RANGE_OPTIONS = [
  { label: "200 ft", value: feetToMeters(200) },
  { label: "500 ft", value: feetToMeters(500) },
  { label: "1000 ft", value: feetToMeters(1000) },
  { label: "1 mile", value: 1609 },
  { label: "5 miles", value: 8047 },
  { label: "25 miles", value: 40234 },
  { label: "100 miles", value: 160934 },
  { label: "All Posts", value: 0 },
] as const;
