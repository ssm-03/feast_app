/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Navigation, MapPin, Check, Compass, AlertCircle } from 'lucide-react';
import { ViewerLocation } from '../../types';
import { Coordinates } from '../../utils/geo';

interface LocationPickerModalProps {
  currentLocation: ViewerLocation;
  onSelectLocation: (location: ViewerLocation) => void;
  onClose: () => void;
}

const PRESET_LOCATIONS: { name: string; desc: string; coords: Coordinates }[] = [
  {
    name: 'San Francisco (Civic Center)',
    desc: 'Downtown core with multiple active surplus food offers within 0.5km - 3km.',
    coords: { lat: 37.7749, lng: -122.4194 },
  },
  {
    name: 'San Francisco (Mission District)',
    desc: 'Vibrant neighbourhood within 1.2km of organic produce & warm meals.',
    coords: { lat: 37.7599, lng: -122.4148 },
  },
  {
    name: 'Berkeley (East Bay)',
    desc: '~17 km away — tests the 5 km boundary exclusion rule! (SF food excluded)',
    coords: { lat: 37.8715, lng: -122.2730 },
  },
  {
    name: 'New York (Midtown Central)',
    desc: 'Simulated remote city with zero local listings (tests empty feed state).',
    coords: { lat: 40.7549, lng: -73.9840 },
  },
];

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  currentLocation,
  onSelectLocation,
  onClose,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleUseBrowserGPS = () => {
    setIsLocating(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setIsLocating(false);
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        onSelectLocation({
          coords: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
          name: 'My GPS Location',
          isGpsVerified: true,
        });
        onClose();
      },
      (err) => {
        setIsLocating(false);
        setGpsError(
          `GPS permission denied or unavailable (${err.message}). You can select a preset location below.`
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loc-modal-title"
    >
      <div className="w-full max-w-md rounded-3xl bg-[#181b22] border border-[#2a303c] shadow-2xl p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-[#262b36]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2ee59d]">
              5 km Geographic Boundary
            </span>
            <h2 id="loc-modal-title" className="text-lg font-bold text-white font-heading">
              Select Viewer Location
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-[#262b36] transition-colors"
            aria-label="Close location selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed">
          The Global feed strictly enforces a <strong className="text-white">5 km radius rule</strong> using the Haversine distance formula. Choose your live GPS or test with preset locations to observe boundary filtering.
        </p>

        {/* Browser GPS Action */}
        <button
          onClick={handleUseBrowserGPS}
          disabled={isLocating}
          className="w-full py-3 px-4 rounded-2xl bg-[#1e2738] hover:bg-[#253247] border border-[#3b82f6]/40 text-sky-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Navigation className={`w-4 h-4 ${isLocating ? 'animate-pulse text-[#2ee59d]' : ''}`} />
          <span>{isLocating ? 'Detecting Device GPS...' : 'Use Live Device GPS (Browser)'}</span>
        </button>

        {gpsError && (
          <div className="p-3 rounded-xl bg-[#26181b] border border-red-500/40 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p>{gpsError}</p>
          </div>
        )}

        {/* Preset Locations */}
        <div className="space-y-2 pt-1">
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Quick Testing Presets
          </p>

          {PRESET_LOCATIONS.map((preset) => {
            const isSelected =
              Math.abs(currentLocation.coords.lat - preset.coords.lat) < 0.001 &&
              Math.abs(currentLocation.coords.lng - preset.coords.lng) < 0.001;

            return (
              <button
                key={preset.name}
                onClick={() => {
                  onSelectLocation({
                    coords: preset.coords,
                    name: preset.name,
                    isGpsVerified: false,
                  });
                  onClose();
                }}
                className={`w-full p-3 rounded-2xl text-left border transition-all flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#12281e] border-[#2ee59d] ring-1 ring-[#2ee59d]'
                    : 'bg-[#14161c] border-[#262b36] hover:border-neutral-500'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#2ee59d] shrink-0" />
                    <span className="font-bold text-xs text-white truncate">
                      {preset.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                    {preset.desc}
                  </p>
                </div>

                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[#2ee59d] flex items-center justify-center text-black shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
