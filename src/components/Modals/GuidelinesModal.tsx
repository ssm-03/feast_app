/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ShieldCheck, Heart, Compass, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

interface GuidelinesModalProps {
  onClose: () => void;
}

export const GuidelinesModal: React.FC<GuidelinesModalProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guidelines-modal-title"
    >
      <div className="w-full max-w-md rounded-3xl bg-[#181b22] border border-[#2a303c] shadow-2xl p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 text-left">
        <div className="flex items-center justify-between pb-2 border-b border-[#262b36]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2ee59d]">
              Community Guidelines & Safety
            </span>
            <h2 id="guidelines-modal-title" className="text-lg font-bold text-white font-heading">
              About F.E.A.S.T.
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-[#262b36] transition-colors"
            aria-label="Close guidelines dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mission Statement */}
        <div className="p-3.5 rounded-2xl bg-[#12281e] border border-[#2ee59d]/40">
          <div className="flex items-center gap-2 text-[#2ee59d] font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>F.E.A.S.T. Mission</span>
          </div>
          <p className="text-sm font-extrabold text-white mt-1 font-heading">
            Food Efficiency And Support for Targeted Communities
          </p>
          <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
            Share surplus food. Eliminate waste. Support nearby households, shelters, orphanages, and community kitchens — 100% free of charge.
          </p>
        </div>

        {/* Critical 5 km Rule */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-white font-bold">
            <Compass className="w-4 h-4 text-[#2ee59d]" />
            <span>The 5 km Radius Rule</span>
          </div>
          <p className="text-neutral-400 leading-relaxed text-[11px]">
            To guarantee fresh, prompt collection and prevent long transport times for hot and cold perishables, all active donations are limited to a strictly calculated <strong className="text-white">5.0 km radius</strong> from the viewer's location using the Haversine formula.
          </p>
        </div>

        {/* Core Availability Toggle */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-white font-bold">
            <CheckCircle2 className="w-4 h-4 text-[#2ee59d]" />
            <span>The Availability Toggle</span>
          </div>
          <p className="text-neutral-400 leading-relaxed text-[11px]">
            Donors maintain complete sovereignty over their food. Switching the availability toggle to <strong className="text-white">OFF</strong> instantly removes the listing from the Global feed for all viewers, while preserving it in your profile history.
          </p>
        </div>

        {/* Food Safety & Hygiene Standards */}
        <div className="p-3.5 rounded-2xl bg-[#161a22] border border-[#272b35] space-y-2 text-xs">
          <div className="flex items-center gap-2 text-white font-bold">
            <ShieldCheck className="w-4 h-4 text-[#2ee59d]" />
            <span>Perishable Food Safety Standards</span>
          </div>
          <ul className="space-y-1.5 text-neutral-300 text-[11px] list-disc pl-4 leading-relaxed">
            <li>Food must be freshly cooked or kept chilled below 4°C / 40°F.</li>
            <li>Hot food should not remain in the danger zone (4°C–60°C) for over 2 hours.</li>
            <li>Pack in food-grade, sanitary containers with tight lids.</li>
            <li>Pickups must occur prior to the stated safe-consumption deadline.</li>
          </ul>
        </div>

        {/* GPS Disclaimer */}
        <div className="p-3 rounded-xl bg-[#14161c] border border-[#22252c] text-[11px] text-neutral-400 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            GPS verification assists with address proximity and pickup clarity. It does not replace personal inspection of food packaging and freshness.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-[#2ee59d] text-black font-bold text-xs hover:bg-[#28d48f] transition-all"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
