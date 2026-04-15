// In-memory cache keyed by rounded lat/lon (3 decimal places ~ 100m precision)
const cache = new Map<string, string | null>();
let lastRequestTime = 0;

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(3)},${lon.toFixed(3)}`;
}

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string | null> {
  const key = cacheKey(lat, lon);

  if (cache.has(key)) {
    return cache.get(key) ?? null;
  }

  // Rate limit: 1 request per second (Nominatim policy)
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1100) {
    await new Promise((resolve) => setTimeout(resolve, 1100 - elapsed));
  }
  lastRequestTime = Date.now();

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
      {
        headers: {
          "User-Agent": "Chatterfall/1.0 (social feed app)",
        },
      }
    );

    if (!res.ok) {
      cache.set(key, null);
      return null;
    }

    const data = await res.json();
    const addr = data.address;
    if (!addr) {
      cache.set(key, null);
      return null;
    }

    // Build a readable location name
    const neighborhood =
      addr.neighbourhood || addr.suburb || addr.quarter || addr.hamlet;
    const city =
      addr.city || addr.town || addr.village || addr.municipality;

    let locationName: string | null = null;
    if (neighborhood && city) {
      locationName = `${neighborhood}, ${city}`;
    } else if (city) {
      locationName = city;
    } else if (neighborhood) {
      locationName = neighborhood;
    } else if (addr.county) {
      locationName = addr.county;
    }

    cache.set(key, locationName);
    return locationName;
  } catch {
    cache.set(key, null);
    return null;
  }
}
