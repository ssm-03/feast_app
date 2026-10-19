/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  MoreVertical,
  MapPin,
  Navigation,
  ShieldCheck,
  Info,
  RotateCcw,
  LogIn,
  LogOut,
  Database,
  User,
} from 'lucide-react';
import { ViewerLocation, UserProfile } from '../types';

interface HeaderProps {
  viewerLocation: ViewerLocation;
  isAuthenticated: boolean;
  currentUser: UserProfile;
  onOpenLocationPicker: () => void;
  onResetData: () => void;
  onOpenGuidelines: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewerLocation,
  isAuthenticated,
  currentUser,
  onOpenLocationPicker,
  onResetData,
  onOpenGuidelines,
  onOpenAuth,
  onSignOut,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[2000] w-full bg-black border-b border-[#22252c] px-4 py-2.5 shadow-md select-none">
      <div className="max-w-md mx-auto flex items-center justify-between relative">
        {/* Left: Location context indicator */}
        <button
          onClick={onOpenLocationPicker}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#161920] border border-[#272b35] hover:border-[#2ee59d]/50 transition-colors text-xs text-neutral-300 max-w-[125px] truncate"
          title={`Viewing food within 5 km of ${viewerLocation.name}`}
          aria-label={`Change viewer location. Currently: ${viewerLocation.name}`}
        >
          {viewerLocation.isGpsVerified ? (
            <Navigation className="w-3.5 h-3.5 text-[#2ee59d] shrink-0 animate-pulse" />
          ) : (
            <MapPin className="w-3.5 h-3.5 text-[#2ee59d] shrink-0" />
          )}
          <span className="truncate font-medium">{viewerLocation.name}</span>
        </button>

        {/* Center: Brand Name (Centered, mint green accent, with FEAST_v2.0 tag) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
          <div className="flex items-center gap-1">
            <span className="text-xl font-extrabold tracking-wider text-white font-heading">
              F<span className="text-[#2ee59d]">.</span>E<span className="text-[#2ee59d]">.</span>A<span className="text-[#2ee59d]">.</span>S<span className="text-[#2ee59d]">.</span>T<span className="text-[#2ee59d]">.</span>
            </span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-[#1e2330] text-[#2ee59d] font-bold border border-[#2ee59d]/30">
              v2.0
            </span>
          </div>
          <span className="text-[8px] uppercase tracking-widest text-[#2ee59d]/80 font-semibold hidden sm:inline">
            5 km Community Food Sharing
          </span>
        </div>

        {/* Right: Auth Button + Overflow menu */}
        <div className="flex items-center gap-1.5">
          {!isAuthenticated ? (
            <button
              onClick={onOpenAuth}
              className="px-2.5 py-1 rounded-full bg-[#181b22] hover:bg-[#202530] text-neutral-200 border border-[#2b303e] hover:border-[#2ee59d] text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <LogIn className="w-3 h-3 text-[#2ee59d]" />
              <span className="hidden xs:inline">Sign In</span>
            </button>
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#202530] border border-[#2ee59d]/60 flex items-center justify-center text-[10px] font-bold text-[#2ee59d]">
              {currentUser.role === 'admin' ? 'A' : currentUser.name.charAt(0)}
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-full text-neutral-300 hover:text-white hover:bg-[#1f232b] transition-colors focus:outline-none focus:ring-1 focus:ring-[#2ee59d]"
              aria-label="More options and settings menu"
              aria-expanded={menuOpen}
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#181b22] border border-[#2a303c] shadow-2xl py-2 z-50 text-xs divide-y divide-[#262b36]">
                  <div className="px-3 py-2 text-neutral-400">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white text-xs">FEAST_v2.0</p>
                      <span className="text-[10px] text-emerald-400 font-mono">SQLite DB</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {isAuthenticated ? `Logged in as ${currentUser.name}` : 'Browsing as Guest'}
                    </p>
                  </div>

                  <div className="py-1">
                    {!isAuthenticated ? (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onOpenAuth();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[#2ee59d] hover:bg-[#222733] transition-colors text-left font-semibold"
                      >
                        <LogIn className="w-4 h-4 text-[#2ee59d]" />
                        <span>Sign In / Admin Login</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onSignOut();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-red-400 hover:bg-[#222733] transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-400" />
                        <span>Sign Out</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenLocationPicker();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-neutral-200 hover:bg-[#222733] hover:text-[#2ee59d] transition-colors text-left"
                    >
                      <MapPin className="w-4 h-4 text-[#2ee59d]" />
                      <span>Change Viewer Location</span>
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenGuidelines();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-neutral-200 hover:bg-[#222733] hover:text-[#2ee59d] transition-colors text-left"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#2ee59d]" />
                      <span>Food Safety & 5km Rules</span>
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenGuidelines();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-neutral-200 hover:bg-[#222733] hover:text-[#2ee59d] transition-colors text-left"
                    >
                      <Info className="w-4 h-4 text-[#2ee59d]" />
                      <span>About FEAST_v2.0</span>
                    </button>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        if (confirm('Reset to initial sample donations and test data?')) {
                          onResetData();
                        }
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-red-400 hover:bg-[#222733] transition-colors text-left"
                    >
                      <RotateCcw className="w-4 h-4 text-red-400" />
                      <span>Reset Sample Data</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
