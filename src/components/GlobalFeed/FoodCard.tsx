/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock, MapPin, Users, PhoneCall, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { FoodDonation } from '../../types';
import { formatDistance, isExpired } from '../../utils/geo';

interface FoodCardProps {
  donation: FoodDonation;
  distanceKm: number;
  isSelected?: boolean;
  onSelect?: () => void;
  onContactDonor: (donation: FoodDonation) => void;
  compact?: boolean;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  donation,
  distanceKm,
  isSelected = false,
  onSelect,
  onContactDonor,
  compact = false,
}) => {
  const expired = isExpired(donation.expiryDeadline);

  const getDietBadge = (type: string) => {
    switch (type) {
      case 'vegan':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-600/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Vegan
          </span>
        );
      case 'veg':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-950/80 text-green-300 border border-green-600/40">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
            Vegetarian
          </span>
        );
      case 'non-veg':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-600/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Non-Veg
          </span>
        );
      default:
        return null;
    }
  };

  const getTimeRemaining = (deadline: string) => {
    const diffMs = new Date(deadline).getTime() - Date.now();
    if (diffMs <= 0) return 'Expired';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      return `${Math.floor(hours / 24)}d left`;
    }
    if (hours > 0) {
      return `${hours}h ${mins}m left`;
    }
    return `${mins}m left`;
  };

  return (
    <article
      onClick={onSelect}
      className={`rounded-2xl bg-[#181b22] border transition-all duration-200 overflow-hidden text-left relative flex flex-col ${
        isSelected
          ? 'border-[#2ee59d] ring-1 ring-[#2ee59d] shadow-[0_0_20px_rgba(46,229,157,0.15)]'
          : 'border-[#262b36] hover:border-[#384152]'
      }`}
    >
      {/* Top Image or Header */}
      <div className="relative w-full h-36 bg-[#13161c] overflow-hidden shrink-0">
        {donation.imageUrl ? (
          <img
            src={donation.imageUrl}
            alt={donation.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 gap-1 bg-gradient-to-br from-[#1a1e27] to-[#12141a]">
            <Sparkles className="w-8 h-8 text-[#2ee59d]/40" />
            <span className="text-xs font-medium">Fresh Surplus Food</span>
          </div>
        )}

        {/* Distance Badge */}
        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-neutral-700/60 text-[#2ee59d] font-bold text-xs flex items-center gap-1 shadow-md">
          <MapPin className="w-3.5 h-3.5" />
          <span>{formatDistance(distanceKm)}</span>
        </div>

        {/* Expiry / Collection Deadline Badge */}
        <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-neutral-700/60 text-xs font-medium flex items-center gap-1 shadow-md">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span className={expired ? 'text-red-400' : 'text-neutral-200'}>
            {getTimeRemaining(donation.expiryDeadline)}
          </span>
        </div>

        {/* Category & Diet on bottom edge of image */}
        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[11px] font-medium text-neutral-300 border border-neutral-800">
            {donation.category}
          </span>
          {getDietBadge(donation.dietaryType)}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base text-white tracking-tight leading-snug font-heading line-clamp-1">
              {donation.title}
            </h3>
          </div>

          <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
            {donation.description}
          </p>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px] py-1 border-y border-[#232733] text-neutral-300">
          <div className="flex items-center gap-1.5 truncate">
            <Users className="w-3.5 h-3.5 text-[#2ee59d] shrink-0" />
            <span className="truncate">
              Serves <strong className="text-white">~{donation.estimatedServings}</strong> ({donation.quantity})
            </span>
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate text-neutral-300 font-medium">{donation.locality}</span>
          </div>

          {donation.prepTime && (
            <div className="flex items-center gap-1.5 truncate col-span-2 text-neutral-400">
              <span className="text-neutral-500">Prepared:</span>
              <span className="text-neutral-300 truncate">{donation.prepTime}</span>
              <span className="text-neutral-600">•</span>
              <span className="text-neutral-500">Window:</span>
              <span className="text-neutral-300 truncate">{donation.pickupWindow}</span>
            </div>
          )}
        </div>

        {/* Donor & Action */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-6 h-6 rounded-full bg-[#272b35] flex items-center justify-center text-[10px] font-bold text-[#2ee59d] shrink-0">
              {donation.donorName.charAt(0)}
            </div>
            <div className="truncate">
              <p className="text-xs text-neutral-200 font-medium truncate">
                {donation.donorName}
              </p>
              {donation.locationVerified && (
                <span className="flex items-center gap-0.5 text-[10px] text-[#2ee59d]">
                  <ShieldCheck className="w-3 h-3" /> GPS verified
                </span>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onContactDonor(donation);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-[#2ee59d] hover:bg-[#28d48f] active:scale-95 text-black font-semibold text-xs flex items-center gap-1.5 transition-all shadow-[0_2px_10px_rgba(46,229,157,0.3)] shrink-0"
            aria-label={`Contact donor ${donation.donorName} for ${donation.title}`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Contact</span>
          </button>
        </div>
      </div>
    </article>
  );
};
