/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Calculates great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 * @returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  const R = 6371; // Earth's mean radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Checks whether the donation pickup location is within the specified radius (default 5.0 km)
 */
export function isWithinRadius(
  pickupLat: number,
  pickupLng: number,
  viewerLat: number,
  viewerLng: number,
  maxRadiusKm: number = 5.0
): boolean {
  const dist = calculateDistance(pickupLat, pickupLng, viewerLat, viewerLng);
  return dist <= maxRadiusKm;
}

/**
 * Formats distance in km or meters for user display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

export type VerificationStatus = 'verified' | 'mismatch' | 'unverified';

export interface LocationVerificationResult {
  status: VerificationStatus;
  distanceMeters: number;
  message: string;
}

/**
 * Verifies whether the entered pickup address coordinates match device GPS coordinates
 * with a tolerance threshold (default: 300 meters)
 */
export function verifyLocationMatch(
  enteredCoords: Coordinates | null,
  gpsCoords: Coordinates | null,
  toleranceMeters: number = 300
): LocationVerificationResult {
  if (!enteredCoords || !gpsCoords) {
    return {
      status: 'unverified',
      distanceMeters: 0,
      message: 'Unable to verify location. GPS position or address coordinates are missing.',
    };
  }

  const distKm = calculateDistance(
    enteredCoords.lat,
    enteredCoords.lng,
    gpsCoords.lat,
    gpsCoords.lng
  );
  const distanceMeters = Math.round(distKm * 1000);

  if (distanceMeters <= toleranceMeters) {
    return {
      status: 'verified',
      distanceMeters,
      message: `Location verified! Device GPS matches entered pickup point (${distanceMeters}m discrepancy, well within ${toleranceMeters}m tolerance).`,
    };
  }

  return {
    status: 'mismatch',
    distanceMeters,
    message: `Mismatch detected: device is ${formatDistance(distKm)} from the entered pickup address (exceeds ${toleranceMeters}m tolerance). Please align or confirm.`,
  };
}

/**
 * Checks if a given ISO date/time string has passed
 */
export function isExpired(deadlineIso?: string): boolean {
  if (!deadlineIso) return false;
  const deadlineTime = new Date(deadlineIso).getTime();
  if (isNaN(deadlineTime)) return false;
  return deadlineTime < Date.now();
}
