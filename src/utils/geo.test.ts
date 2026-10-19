/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistance,
  isWithinRadius,
  formatDistance,
  verifyLocationMatch,
  isExpired
} from './geo.ts';

test('Haversine distance calculates accurate distance between two coordinates', () => {
  // New York City Empire State (40.7484, -73.9857) to Times Square (40.7580, -73.9855) ~ 1.07 km
  const dist = calculateDistance(40.7484, -73.9857, 40.7580, -73.9855);
  assert.ok(dist >= 0.9 && dist <= 1.2, `Expected distance ~1.07km, got ${dist}`);

  // Identical points should return 0
  assert.equal(calculateDistance(37.7749, -122.4194, 37.7749, -122.4194), 0);
});

test('isWithinRadius respects the critical 5 km radius boundary rule', () => {
  const centerLat = 37.7749;
  const centerLng = -122.4194;

  // Approx 2 km away
  const nearbyLat = 37.7890;
  const nearbyLng = -122.4194;
  assert.equal(isWithinRadius(nearbyLat, nearbyLng, centerLat, centerLng, 5.0), true);

  // Point ~ 10 km away
  const farLat = 37.8651;
  const farLng = -122.2585;
  assert.equal(isWithinRadius(farLat, farLng, centerLat, centerLng, 5.0), false);
});

test('formatDistance displays human-friendly strings', () => {
  assert.equal(formatDistance(0.25), '250 m away');
  assert.equal(formatDistance(2.34), '2.3 km away');
  assert.equal(formatDistance(4.0), '4.0 km away');
});

test('verifyLocationMatch correctly detects matches and mismatches against 300m tolerance', () => {
  // Point within ~50m
  const coords1 = { lat: 37.7749, lng: -122.4194 };
  const coordsClose = { lat: 37.7751, lng: -122.4195 };
  const resClose = verifyLocationMatch(coords1, coordsClose, 300);
  assert.equal(resClose.status, 'verified');
  assert.ok(resClose.distanceMeters <= 300);

  // Point > 300m away (e.g. ~1500m)
  const coordsFar = { lat: 37.7880, lng: -122.4194 };
  const resFar = verifyLocationMatch(coords1, coordsFar, 300);
  assert.equal(resFar.status, 'mismatch');
  assert.ok(resFar.distanceMeters > 300);

  // Missing coords
  const resMissing = verifyLocationMatch(null, coords1, 300);
  assert.equal(resMissing.status, 'unverified');
});

test('isExpired checks safe consumption deadline', () => {
  const past = new Date(Date.now() - 1000 * 60 * 60).toISOString();
  const future = new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString();

  assert.equal(isExpired(past), true);
  assert.equal(isExpired(future), false);
  assert.equal(isExpired(undefined), false);
});
