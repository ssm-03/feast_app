/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Compass,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Coordinates, verifyLocationMatch, calculateDistance, formatDistance } from '../../utils/geo';
import { ViewerLocation, FoodDonation } from '../../types';

interface LocationVerificationProps {
  viewerLocation: ViewerLocation;
  userDonations: FoodDonation[];
  initialAddress?: string;
  initialCoords?: Coordinates;
  onConfirmVerifiedLocation: (coords: Coordinates, address: string) => void;
  onUpdateViewerLocation: (coords: Coordinates, name: string) => void;
}

export const LocationVerification: React.FC<LocationVerificationProps> = ({
  viewerLocation,
  userDonations,
  initialAddress,
  initialCoords,
  onConfirmVerifiedLocation,
  onUpdateViewerLocation,
}) => {
  // Configured tolerance in meters (default 300m)
  const [toleranceMeters, setToleranceMeters] = useState<number>(300);

  // Address and entered coordinates to test
  const [addressInput, setAddressInput] = useState<string>(
    initialAddress || userDonations[0]?.pickupAddress || '420 Grove St, San Francisco, CA'
  );
  const [addressCoords, setAddressCoords] = useState<Coordinates>(
    initialCoords || userDonations[0]?.coordinates || { lat: 37.7781, lng: -122.4215 }
  );

  // Actual or simulated device GPS coordinates
  const [gpsCoords, setGpsCoords] = useState<Coordinates>(viewerLocation.coords);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Map references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const lineLayerRef = useRef<L.Polyline | null>(null);
  const addressMarkerRef = useRef<L.Marker | null>(null);
  const gpsMarkerRef = useRef<L.Marker | null>(null);

  // Current calculation
  const verification = verifyLocationMatch(addressCoords, gpsCoords, toleranceMeters);
  const distanceKm = calculateDistance(
    addressCoords.lat,
    addressCoords.lng,
    gpsCoords.lat,
    gpsCoords.lng
  );

  // Initialize dual-point Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [gpsCoords.lat, gpsCoords.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map markers and line connecting them
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Address Pin (Mint Green)
    const addressIcon = L.divIcon({
      className: 'custom-address-marker',
      html: `
        <div style="background: #2ee59d; color: #000; padding: 4px 8px; border-radius: 20px; font-weight: bold; font-size: 11px; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.6); white-space: nowrap; border: 1.5px solid #fff;">
          <span>📍 Pickup Address</span>
        </div>
      `,
      iconSize: [110, 28],
      iconAnchor: [55, 14],
    });

    // GPS Pin (Cyan / Blue)
    const gpsIcon = L.divIcon({
      className: 'custom-gps-marker',
      html: `
        <div style="background: #38bdf8; color: #000; padding: 4px 8px; border-radius: 20px; font-weight: bold; font-size: 11px; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.6); white-space: nowrap; border: 1.5px solid #fff;">
          <span>🛰️ Device GPS</span>
        </div>
      `,
      iconSize: [100, 28],
      iconAnchor: [50, 14],
    });

    if (addressMarkerRef.current) {
      addressMarkerRef.current.setLatLng([addressCoords.lat, addressCoords.lng]);
    } else {
      addressMarkerRef.current = L.marker([addressCoords.lat, addressCoords.lng], {
        icon: addressIcon,
      }).addTo(map);
    }

    if (gpsMarkerRef.current) {
      gpsMarkerRef.current.setLatLng([gpsCoords.lat, gpsCoords.lng]);
    } else {
      gpsMarkerRef.current = L.marker([gpsCoords.lat, gpsCoords.lng], {
        icon: gpsIcon,
      }).addTo(map);
    }

    // Connect both points with dashed line
    if (lineLayerRef.current) {
      lineLayerRef.current.setLatLngs([
        [addressCoords.lat, addressCoords.lng],
        [gpsCoords.lat, gpsCoords.lng],
      ]);
      lineLayerRef.current.setStyle({
        color: verification.status === 'verified' ? '#2ee59d' : '#f59e0b',
      });
    } else {
      lineLayerRef.current = L.polyline(
        [
          [addressCoords.lat, addressCoords.lng],
          [gpsCoords.lat, gpsCoords.lng],
        ],
        {
          color: verification.status === 'verified' ? '#2ee59d' : '#f59e0b',
          weight: 2.5,
          dashArray: '6, 6',
        }
      ).addTo(map);
    }

    // Fit bounds to show both points comfortably
    const bounds = L.latLngBounds([
      [addressCoords.lat, addressCoords.lng],
      [gpsCoords.lat, gpsCoords.lng],
    ]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
  }, [addressCoords, gpsCoords, verification.status]);

  // Request actual browser GPS
  const handleDetectGPS = () => {
    setIsLocating(true);
    setStatusMessage('Requesting browser device GPS position...');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const detected = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setGpsCoords(detected);
          onUpdateViewerLocation(detected, 'Live GPS Position');
          setStatusMessage('Device GPS retrieved successfully.');
        },
        (err) => {
          setIsLocating(false);
          setStatusMessage(
            `GPS permission denied or unavailable (${err.message}). Using manual coordinates.`
          );
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setIsLocating(false);
      setStatusMessage('Geolocation is not supported by your browser.');
    }
  };

  // Align Address to Current GPS
  const handleAlignToGPS = () => {
    setAddressCoords({ ...gpsCoords });
    setStatusMessage('Pickup coordinates aligned to your exact GPS position.');
  };

  // Simulate Geocoding or Offset for testing
  const handleSimulateMismatch = () => {
    // Offset by ~1.2 km
    setAddressCoords({
      lat: gpsCoords.lat + 0.011,
      lng: gpsCoords.lng + 0.009,
    });
    setStatusMessage('Simulated location mismatch (>1 km) to test warning flow.');
  };

  const handleSimulateMatch = () => {
    // Within ~60 meters
    setAddressCoords({
      lat: gpsCoords.lat + 0.0004,
      lng: gpsCoords.lng + 0.0003,
    });
    setStatusMessage('Simulated close coordinates (<100m) to test verified flow.');
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto p-4 pb-28 text-left overflow-y-auto space-y-4">
      {/* Title */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#2ee59d]">
          Address vs. GPS Integrity
        </span>
        <h1 className="text-xl font-extrabold text-white font-heading">
          Location Verification
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Verifies whether the entered pickup address corresponds to your device's actual GPS coordinates before publishing.
        </p>
      </div>

      {/* Verification Status Banner */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          verification.status === 'verified'
            ? 'bg-[#12281e] border-[#2ee59d]/60 shadow-[0_0_20px_rgba(46,229,157,0.15)]'
            : verification.status === 'mismatch'
            ? 'bg-[#2b1f14] border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
            : 'bg-[#181b22] border-[#272b35]'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {verification.status === 'verified' ? (
              <CheckCircle2 className="w-6 h-6 text-[#2ee59d]" />
            ) : verification.status === 'mismatch' ? (
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            ) : (
              <Info className="w-6 h-6 text-neutral-400" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white font-heading">
                {verification.status === 'verified'
                  ? 'Location Successfully Verified'
                  : verification.status === 'mismatch'
                  ? 'Address & GPS Mismatch Detected'
                  : 'Unable to Verify Automatically'}
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  verification.status === 'verified'
                    ? 'bg-[#2ee59d] text-black'
                    : 'bg-amber-400 text-black'
                }`}
              >
                {verification.distanceMeters}m discrepancy
              </span>
            </div>
            <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">
              {verification.message}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Map Visualizing Both Points */}
      <div className="rounded-2xl overflow-hidden border border-[#272b35] relative bg-[#121418] isolate z-0">
        <div ref={mapContainerRef} className="w-full h-56" />

        <div className="absolute bottom-2 left-2 right-2 z-[1000] bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-700/60 flex items-center justify-between text-[11px] text-neutral-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2ee59d]" />
            <span>Pickup Address</span>
            <span className="text-neutral-500">vs</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
            <span>Device GPS</span>
          </span>
          <span className="font-bold text-white">
            Gap: {formatDistance(distanceKm)}
          </span>
        </div>
      </div>

      {/* Point 1: Entered Address */}
      <div className="p-3.5 rounded-2xl bg-[#181b22] border border-[#272b35] space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-white">
            <MapPin className="w-4 h-4 text-[#2ee59d]" />
            <span>1. Entered Pickup Address</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">
            {addressCoords.lat.toFixed(4)}, {addressCoords.lng.toFixed(4)}
          </span>
        </div>

        <input
          type="text"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          placeholder="Enter pickup address..."
          className="w-full px-3 py-2 rounded-xl bg-[#121418] border border-[#272b35] text-white text-xs focus:outline-none focus:border-[#2ee59d]"
        />
      </div>

      {/* Point 2: GPS Detection */}
      <div className="p-3.5 rounded-2xl bg-[#181b22] border border-[#272b35] space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-white">
            <Navigation className="w-4 h-4 text-[#38bdf8]" />
            <span>2. Device GPS Position</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">
            {gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}
          </span>
        </div>

        <button
          onClick={handleDetectGPS}
          disabled={isLocating}
          className="w-full py-2 px-3 rounded-xl bg-[#1d232e] hover:bg-[#252c3a] border border-[#303848] text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Acquiring GPS...' : 'Retry / Re-detect Device GPS'}</span>
        </button>
      </div>

      {/* Tolerance Configurator & Quick Simulator */}
      <div className="p-3.5 rounded-2xl bg-[#181b22] border border-[#272b35] space-y-2.5 text-xs">
        <div className="flex items-center justify-between text-neutral-300">
          <span className="font-semibold text-white">Verification Tolerance</span>
          <span className="text-[#2ee59d] font-bold">{toleranceMeters} meters</span>
        </div>
        <input
          type="range"
          min={100}
          max={1000}
          step={50}
          value={toleranceMeters}
          onChange={(e) => setToleranceMeters(Number(e.target.value))}
          className="w-full accent-[#2ee59d]"
        />
        <div className="flex items-center justify-between text-[10px] text-neutral-500">
          <span>Strict (100m)</span>
          <span>Standard (300m)</span>
          <span>Relaxed (1 km)</span>
        </div>

        {/* Quick Simulator Buttons */}
        <div className="pt-1 flex items-center gap-2 text-[11px]">
          <span className="text-neutral-400">Test Scenarios:</span>
          <button
            onClick={handleSimulateMatch}
            className="px-2 py-1 rounded-lg bg-[#14231b] border border-[#2ee59d]/40 text-[#2ee59d] hover:bg-[#1a2e23]"
          >
            Match (&lt;100m)
          </button>
          <button
            onClick={handleSimulateMismatch}
            className="px-2 py-1 rounded-lg bg-[#2b1f14] border border-amber-500/40 text-amber-300 hover:bg-[#382819]"
          >
            Mismatch (1.4km)
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        <button
          onClick={handleAlignToGPS}
          className="w-full py-3 rounded-xl bg-[#1a2333] hover:bg-[#202b3f] text-[#38bdf8] border border-[#38bdf8]/40 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <Navigation className="w-4 h-4" />
          <span>Align Pickup Pin to Current Device GPS</span>
        </button>

        <button
          onClick={() => {
            onConfirmVerifiedLocation(addressCoords, addressInput);
            setStatusMessage('Verified pickup location confirmed and linked to donations.');
          }}
          className="w-full py-3.5 rounded-xl bg-[#2ee59d] hover:bg-[#28d48f] text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_2px_14px_rgba(46,229,157,0.3)]"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Confirm Verified Location for 5 km Feed</span>
        </button>
      </div>

      {statusMessage && (
        <p className="text-xs text-center text-[#2ee59d] animate-in fade-in">
          {statusMessage}
        </p>
      )}

      {/* Food Safety & Location Notice */}
      <div className="p-3 rounded-xl bg-[#121418] border border-[#222630] text-[11px] text-neutral-400 flex items-start gap-2">
        <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
        <p>
          GPS is a location verification aid to ensure community proximity. It does not certify the identity of individuals or the quality/safety of food.
        </p>
      </div>
    </div>
  );
};
