/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Map as MapIcon,
  List as ListIcon,
  Search,
  Filter,
  Navigation,
  Compass,
  AlertCircle,
  Sparkles,
  ChevronUp,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { FoodDonation, ViewerLocation, DietaryType } from '../../types';
import { calculateDistance, isWithinRadius } from '../../utils/geo';
import { FoodMap } from './FoodMap';
import { FoodCard } from './FoodCard';

interface GlobalFeedProps {
  viewerLocation: ViewerLocation;
  donations: FoodDonation[];
  onContactDonor: (donation: FoodDonation) => void;
  onOpenLocationPicker: () => void;
  onGoToDonate: () => void;
}

export const GlobalFeed: React.FC<GlobalFeedProps> = ({
  viewerLocation,
  donations,
  onContactDonor,
  onOpenLocationPicker,
  onGoToDonate,
}) => {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  // Critical 5 km Filter + Availability ON + Status Active + Haversine calculation
  const eligibleNearbyDonations = useMemo(() => {
    return donations
      .filter((donation) => {
        // 1. Availability toggle MUST be ON
        if (!donation.isAvailable) return false;

        // 2. Status must be active
        if (donation.status !== 'active') return false;

        // 3. Must not be expired
        const deadline = new Date(donation.expiryDeadline).getTime();
        if (deadline < Date.now()) return false;

        // 4. Critical 5.0 km rule using Haversine formula
        const within5Km = isWithinRadius(
          donation.coordinates.lat,
          donation.coordinates.lng,
          viewerLocation.coords.lat,
          viewerLocation.coords.lng,
          5.0
        );
        if (!within5Km) return false;

        // 5. Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = donation.title.toLowerCase().includes(q);
          const matchDesc = donation.description.toLowerCase().includes(q);
          const matchLoc = donation.locality.toLowerCase().includes(q);
          const matchCat = donation.category.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchLoc && !matchCat) return false;
        }

        // 6. Dietary filter
        if (dietaryFilter !== 'all' && donation.dietaryType !== dietaryFilter) {
          return false;
        }

        // 7. Category filter
        if (categoryFilter !== 'all' && donation.category !== categoryFilter) {
          return false;
        }

        return true;
      })
      .map((donation) => {
        const distanceKm = calculateDistance(
          donation.coordinates.lat,
          donation.coordinates.lng,
          viewerLocation.coords.lat,
          viewerLocation.coords.lng
        );
        return { donation, distanceKm };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [
    donations,
    viewerLocation,
    searchQuery,
    dietaryFilter,
    categoryFilter,
  ]);

  const selectedItem = useMemo(() => {
    if (!selectedDonationId) return eligibleNearbyDonations[0] || null;
    return eligibleNearbyDonations.find((item) => item.donation.id === selectedDonationId) || null;
  }, [eligibleNearbyDonations, selectedDonationId]);

  return (
    <div className="flex-1 flex flex-col relative w-full h-[calc(100dvh-116px)] bg-[#0d0f12] overflow-hidden">
      {/* Top Filter and Search Bar */}
      <div className="px-4 py-2.5 bg-[#121418] border-b border-[#222630] z-20 shrink-0 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search food, bakery, produce..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-full bg-[#181b22] border border-[#272b35] text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[#2ee59d]"
            />
          </div>

          {/* Map / List View Toggle */}
          <div className="flex items-center bg-[#181b22] border border-[#272b35] rounded-full p-0.5">
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-full transition-colors ${
                viewMode === 'map'
                  ? 'bg-[#2ee59d] text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              aria-label="Map view"
              title="Show interactive map"
            >
              <MapIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-full transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#2ee59d] text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              aria-label="List view"
              title="Show compact list"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[11px]">
          <button
            onClick={() => setDietaryFilter('all')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
              dietaryFilter === 'all'
                ? 'bg-[#2ee59d] text-black font-semibold'
                : 'bg-[#181b22] text-neutral-300 border border-[#272b35] hover:border-neutral-500'
            }`}
          >
            All Food
          </button>
          <button
            onClick={() => setDietaryFilter(dietaryFilter === 'veg' ? 'all' : 'veg')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
              dietaryFilter === 'veg'
                ? 'bg-green-500 text-black font-semibold'
                : 'bg-[#181b22] text-neutral-300 border border-[#272b35] hover:border-neutral-500'
            }`}
          >
            Vegetarian
          </button>
          <button
            onClick={() => setDietaryFilter(dietaryFilter === 'vegan' ? 'all' : 'vegan')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
              dietaryFilter === 'vegan'
                ? 'bg-emerald-400 text-black font-semibold'
                : 'bg-[#181b22] text-neutral-300 border border-[#272b35] hover:border-neutral-500'
            }`}
          >
            Vegan
          </button>
          <button
            onClick={() => setDietaryFilter(dietaryFilter === 'non-veg' ? 'all' : 'non-veg')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
              dietaryFilter === 'non-veg'
                ? 'bg-amber-400 text-black font-semibold'
                : 'bg-[#181b22] text-neutral-300 border border-[#272b35] hover:border-neutral-500'
            }`}
          >
            Non-Veg
          </button>

          <span className="text-neutral-700">|</span>

          {/* 5 km status chip */}
          <span className="px-2 py-1 rounded-full bg-[#161a22] text-[#2ee59d] border border-[#272b35] text-[10px] font-medium shrink-0 flex items-center gap-1">
            <Compass className="w-3 h-3" />
            Max 5.0 km
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {eligibleNearbyDonations.length === 0 ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#161922] border border-[#272b35] flex items-center justify-center text-neutral-500 mb-4 shadow-lg">
            <AlertCircle className="w-8 h-8 text-[#2ee59d]" />
          </div>
          <h3 className="text-lg font-bold text-white font-heading">
            No food donations nearby right now.
          </h3>
          <p className="text-xs text-neutral-400 max-w-xs mt-2 leading-relaxed">
            There are currently no active surplus food listings within 5 km of{' '}
            <strong className="text-neutral-200">{viewerLocation.name}</strong>.
            Please check again soon or share surplus food from your household or business!
          </p>

          <div className="flex flex-col sm:flex-row gap-2 mt-6">
            <button
              onClick={onOpenLocationPicker}
              className="px-4 py-2 rounded-xl bg-[#181b22] border border-[#272b35] hover:border-[#2ee59d] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <MapPin className="w-4 h-4 text-[#2ee59d]" />
              <span>Change Viewer Location</span>
            </button>
            <button
              onClick={onGoToDonate}
              className="px-4 py-2 rounded-xl bg-[#2ee59d] text-black text-xs font-bold hover:bg-[#28d48f] transition-all shadow-[0_2px_12px_rgba(46,229,157,0.3)] flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Donate Food Now</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'map' ? (
        /* Map View with Floating Bottom Sheet */
        <div className="relative flex-1 w-full h-full">
          <FoodMap
            viewerLocation={viewerLocation}
            donations={eligibleNearbyDonations}
            selectedDonationId={selectedItem?.donation.id || null}
            onSelectDonation={(id) => {
              setSelectedDonationId(id);
              setSheetExpanded(true);
            }}
          />

          {/* Bottom Card / Drawer for Selected Donation */}
          {selectedItem && (
            <div className="absolute bottom-[72px] left-3 right-3 z-[1500] max-w-md mx-auto">
              <div className="relative">
                <button
                  onClick={() => setSelectedDonationId(null)}
                  className="absolute -top-3 right-2 z-10 w-6 h-6 rounded-full bg-black/80 border border-neutral-700 text-white flex items-center justify-center text-xs hover:bg-neutral-800 shadow-md"
                  aria-label="Dismiss card to view map"
                  title="Dismiss card"
                >
                  ✕
                </button>
                <FoodCard
                  donation={selectedItem.donation}
                  distanceKm={selectedItem.distanceKm}
                  isSelected={true}
                  onContactDonor={onContactDonor}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 pb-28">
          <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
            <span>
              Showing <strong className="text-white">{eligibleNearbyDonations.length}</strong> active food offers within 5 km
            </span>
            <span className="text-[#2ee59d] font-medium">Nearest first</span>
          </div>

          {eligibleNearbyDonations.map(({ donation, distanceKm }) => (
            <FoodCard
              key={donation.id}
              donation={donation}
              distanceKm={distanceKm}
              isSelected={donation.id === selectedDonationId}
              onSelect={() => setSelectedDonationId(donation.id)}
              onContactDonor={onContactDonor}
            />
          ))}
        </div>
      )}
    </div>
  );
};
