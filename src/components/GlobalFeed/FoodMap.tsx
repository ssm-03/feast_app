/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { FoodDonation, ViewerLocation } from '../../types';
import { formatDistance } from '../../utils/geo';

interface FoodMapProps {
  viewerLocation: ViewerLocation;
  donations: { donation: FoodDonation; distanceKm: number }[];
  selectedDonationId: string | null;
  onSelectDonation: (id: string) => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
}

export const FoodMap: React.FC<FoodMapProps> = ({
  viewerLocation,
  donations,
  selectedDonationId,
  onSelectDonation,
  onMapClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const viewerMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [viewerLocation.coords.lat, viewerLocation.coords.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // OpenStreetMap standard tiles with CSS dark inversion from index.css
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Zoom controls at bottom-right so they don't block mobile header
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    if (onMapClick) {
      map.on('click', (e) => {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update viewer position and 5 km circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const centerLatLng = L.latLng(
      viewerLocation.coords.lat,
      viewerLocation.coords.lng
    );

    // Update viewer marker
    if (viewerMarkerRef.current) {
      viewerMarkerRef.current.setLatLng(centerLatLng);
    } else {
      const viewerIcon = L.divIcon({
        className: 'custom-viewer-marker',
        html: `
          <div style="position:relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
            <div style="position:absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(46, 229, 157, 0.25); border: 1.5px solid #2ee59d; animation: pulse-ring 2s infinite;"></div>
            <div style="width: 16px; height: 16px; border-radius: 50%; background: #2ee59d; border: 2.5px solid #000; box-shadow: 0 0 10px #2ee59d;"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      viewerMarkerRef.current = L.marker(centerLatLng, {
        icon: viewerIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    }

    // Update 5 km radius boundary circle (5000 meters)
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setLatLng(centerLatLng);
    } else {
      radiusCircleRef.current = L.circle(centerLatLng, {
        radius: 5000, // 5 km
        color: '#2ee59d',
        weight: 1.5,
        dashArray: '5, 8',
        fillColor: '#2ee59d',
        fillOpacity: 0.04,
      }).addTo(map);
    }

    map.panTo(centerLatLng);
  }, [viewerLocation]);

  // Update donation markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    donations.forEach(({ donation, distanceKm }) => {
      const isSelected = donation.id === selectedDonationId;
      const dietColor =
        donation.dietaryType === 'vegan'
          ? '#10b981'
          : donation.dietaryType === 'veg'
          ? '#22c55e'
          : '#f59e0b';

      const iconHtml = `
        <div style="position:relative; cursor: pointer; transition: transform 0.2s;">
          <div style="
            background: ${isSelected ? '#2ee59d' : '#181b22'};
            color: ${isSelected ? '#000' : '#fff'};
            border: 2px solid ${isSelected ? '#ffffff' : '#2ee59d'};
            padding: 4px 8px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 6px 16px rgba(0,0,0,0.7);
            white-space: nowrap;
          ">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: ${dietColor};"></span>
            <span>${formatDistance(distanceKm)}</span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid ${isSelected ? '#2ee59d' : '#181b22'};
            margin: 0 auto;
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-food-marker',
        html: iconHtml,
        iconSize: [80, 32],
        iconAnchor: [40, 32],
      });

      const marker = L.marker([donation.coordinates.lat, donation.coordinates.lng], {
        icon: customIcon,
      });

      marker.on('click', () => {
        onSelectDonation(donation.id);
        map.panTo([donation.coordinates.lat, donation.coordinates.lng]);
      });

      markersGroup.addLayer(marker);
    });
  }, [donations, selectedDonationId, onSelectDonation]);

  return (
    <div className="relative w-full h-full min-h-[380px] isolate z-0">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* 5 km Radius Tag Legend */}
      <div className="absolute top-3 left-3 z-[1000] bg-[#121418]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#272b35] flex items-center gap-2 shadow-lg text-[11px] text-neutral-300">
        <span className="w-2.5 h-2.5 rounded-full bg-[#2ee59d] animate-pulse" />
        <span className="font-semibold text-white">5 km Food Radius</span>
        <span className="text-neutral-500">•</span>
        <span className="text-[#2ee59d] font-bold">{donations.length} available</span>
      </div>
    </div>
  );
};
