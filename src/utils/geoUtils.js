// Utilitas Perhitungan Geolocation & Geofencing (Formula Haversine)

/**
 * Menghitung jarak antara 2 koordinat bumi dalam satuan meter menggunakan rumus Haversine
 * @param {number} lat1 Latitude titik 1
 * @param {number} lon1 Longitude titik 1
 * @param {number} lat2 Latitude titik 2
 * @param {number} lon2 Longitude titik 2
 * @returns {number} Jarak dalam meter
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return Infinity;
  }

  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Hasil dalam meter
}

/**
 * Format jarak ke format yang ramah pengguna
 * @param {number} meters
 * @returns {string} contoh: "85 m" atau "2.4 km"
 */
export function formatDistance(meters) {
  if (meters === null || meters === undefined || !isFinite(meters)) return '-';
  if (meters < 1000) {
    return `${Math.round(meters)} meter`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Format desimal koordinat agar rapi
 * @param {number} lat
 * @param {number} lng
 * @returns {string} contoh: "0.470142, 101.426221"
 */
export function formatCoordinates(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return 'Memuat koordinat...';
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * Validasi apakah berada di dalam batas radius kantor PTPN IV Regional 3
 * @param {number} distanceMeters
 * @param {number} allowedRadiusMeters
 * @returns {boolean}
 */
export function isWithinGeofence(distanceMeters, allowedRadiusMeters) {
  return distanceMeters <= allowedRadiusMeters;
}
