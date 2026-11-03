const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Cheap rectangular pre-filter that can be pushed down to the database. */
export function boundingBox(lat: number, lng: number, radiusKm: number) {
  const dLat = radiusKm / 111.32;
  const dLng = radiusKm / (111.32 * Math.max(0.01, Math.cos(toRad(lat))));
  return { minLat: lat - dLat, maxLat: lat + dLat, minLng: lng - dLng, maxLng: lng + dLng };
}
