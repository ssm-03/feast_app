/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Utensils, ClipboardList, MapPin, User } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  nearbyCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  nearbyCount = 0,
}) => {
  const tabs: {
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    {
      id: 'global',
      label: 'Global',
      icon: Utensils,
      badge: nearbyCount > 0 ? nearbyCount : undefined,
    },
    {
      id: 'donate',
      label: 'Donate',
      icon: ClipboardList, // Explicitly form/clipboard icon, not plus icon
    },
    {
      id: 'location',
      label: 'Location',
      icon: MapPin,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[2000] bg-black border-t border-[#1f232b] px-2 py-1.5 shadow-[0_-8px_25px_rgba(0,0,0,0.85)]"
      role="navigation"
      aria-label="Primary application navigation"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'text-[#2ee59d]'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              aria-label={`${tab.label} tab${isActive ? ' (active)' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  }`}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-[#2ee59d] text-black rounded-full px-1 shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[11px] font-medium mt-1 tracking-wide transition-colors ${
                  isActive ? 'text-[#2ee59d] font-semibold' : 'text-neutral-400'
                }`}
              >
                {tab.label}
              </span>

              {/* Active glow indicator */}
              {isActive && (
                <div className="absolute -bottom-1 w-8 h-1 bg-[#2ee59d] rounded-full shadow-[0_0_8px_#2ee59d]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
