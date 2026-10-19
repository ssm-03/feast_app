/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  User,
  Phone,
  MapPin,
  Sparkles,
  Heart,
  Users,
  Package,
  Edit2,
  Trash2,
  CheckCircle,
  PlusCircle,
  Save,
  Palette,
  ShieldAlert,
  Database,
  LogOut,
  LogIn,
  KeyRound,
  Check,
  Server,
} from 'lucide-react';
import { UserProfile, FoodDonation, ContactMethod, AppTheme } from '../../types';
import { dataService } from '../../services/storage';

interface ProfilePageProps {
  user: UserProfile;
  isAuthenticated: boolean;
  userDonations: FoodDonation[];
  allDonations?: FoodDonation[];
  currentTheme: AppTheme;
  onChangeTheme: (theme: AppTheme) => void;
  onUpdateUser: (updated: UserProfile) => void;
  onEditDonation: (donation: FoodDonation) => void;
  onToggleDonationAvailability: (id: string, isAvailable: boolean) => void;
  onMarkCollected: (id: string) => void;
  onDeleteDonation: (id: string) => void;
  onGoToDonate: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  isAuthenticated,
  userDonations,
  allDonations = [],
  currentTheme,
  onChangeTheme,
  onUpdateUser,
  onEditDonation,
  onToggleDonationAvailability,
  onMarkCollected,
  onDeleteDonation,
  onGoToDonate,
  onOpenAuth,
  onSignOut,
}) => {
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [locality, setLocality] = useState(user.locality);
  const [contactMethod, setContactMethod] = useState<ContactMethod>(user.preferredContact);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showDbDiagnostics, setShowDbDiagnostics] = useState(false);

  const metrics = dataService.getImpactMetrics(user.id);
  const isAdmin = user.role === 'admin';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      name: name.trim(),
      phone: phone.trim(),
      locality: locality.trim(),
      preferredContact: contactMethod,
    });
    setIsEditingUser(false);
  };

  const themes: { id: AppTheme; label: string; desc: string; previewColor: string; accentColor: string }[] = [
    {
      id: 'charcoal',
      label: 'Dark Charcoal',
      desc: 'Default reference dark UI with deep charcoal canvas',
      previewColor: '#121418',
      accentColor: '#2ee59d',
    },
    {
      id: 'midnight',
      label: 'Midnight OLED',
      desc: 'Ultra pure black canvas for maximum OLED contrast',
      previewColor: '#000000',
      accentColor: '#34d399',
    },
    {
      id: 'slate',
      label: 'Deep Slate',
      desc: 'Cool slate navy undertones with subtle accents',
      previewColor: '#0a0f1d',
      accentColor: '#38bdf8',
    },
    {
      id: 'emerald',
      label: 'Forest Mint',
      desc: 'Deep emerald forest background with vibrant mint highlights',
      previewColor: '#03140e',
      accentColor: '#10b981',
    },
  ];

  return (
    <div className="flex-1 w-full max-w-md mx-auto p-4 pb-28 text-left overflow-y-auto space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2ee59d]">
            {isAdmin ? 'Admin Management Center' : 'Community Profile & Settings'}
          </span>
          <h1 className="text-xl font-extrabold text-white font-heading">
            {isAdmin ? 'Administrator Portal' : 'Profile & Impact'}
          </h1>
        </div>

        {isAuthenticated ? (
          <button
            onClick={() => setIsEditingUser(!isEditingUser)}
            className="p-2 rounded-xl bg-[#181b22] border border-[#272b35] hover:border-[#2ee59d] text-neutral-300 hover:text-white transition-colors text-xs flex items-center gap-1.5"
            aria-label={isEditingUser ? 'Close profile editor' : 'Edit profile'}
          >
            <Edit2 className="w-3.5 h-3.5 text-[#2ee59d]" />
            <span>{isEditingUser ? 'Cancel' : 'Edit'}</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-3 py-1.5 rounded-xl bg-[#2ee59d] text-black font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>

      {/* Guest Warning Banner if not logged in */}
      {!isAuthenticated && (
        <div className="p-3.5 rounded-2xl bg-[#1a202c] border border-sky-500/40 text-xs flex items-start gap-3">
          <KeyRound className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-white">Currently Browsing as Guest</p>
            <p className="text-neutral-300 mt-0.5 text-[11px] leading-relaxed">
              Sign in with seeded Admin credentials (<strong className="text-white">admin@feast.org</strong>) or register to publish food and manage your donations.
            </p>
            <button
              onClick={onOpenAuth}
              className="mt-2 px-3 py-1 rounded-lg bg-[#2ee59d] text-black font-bold text-[11px]"
            >
              Sign In / Admin Login
            </button>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className="p-4 rounded-2xl bg-[#181b22] border border-[#272b35]">
        {isEditingUser ? (
          <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#121418] border border-[#272b35] text-white focus:outline-none focus:border-[#2ee59d]"
                required
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#121418] border border-[#272b35] text-white focus:outline-none focus:border-[#2ee59d]"
                required
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Neighbourhood / Locality</label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#121418] border border-[#272b35] text-white focus:outline-none focus:border-[#2ee59d]"
                required
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Preferred Contact</label>
              <div className="grid grid-cols-3 gap-2">
                {(['whatsapp', 'phone', 'sms'] as ContactMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setContactMethod(m)}
                    className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                      contactMethod === m
                        ? 'bg-[#2ee59d] text-black'
                        : 'bg-[#121418] text-neutral-400 border border-[#272b35]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#2ee59d] text-black font-bold text-xs flex items-center justify-center gap-1.5 mt-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Profile Updates</span>
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3.5">
              <div className="relative">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-[#2ee59d]/40"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#202530] flex items-center justify-center text-[#2ee59d]">
                    <User className="w-7 h-7" />
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#2ee59d] border-2 border-black" />
              </div>

              <div className="flex-1 min-w-0 text-xs">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white truncate font-heading">{user.name}</h2>
                  {isAdmin && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                      ADMIN
                    </span>
                  )}
                </div>

                <span className="inline-block px-2 py-0.5 rounded-full bg-[#1e2330] text-[#2ee59d] text-[10px] font-semibold mt-0.5 border border-[#2ee59d]/30">
                  {user.userType}
                </span>

                <div className="mt-2 space-y-1 text-neutral-400 text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <Phone className="w-3 h-3 text-neutral-500" />
                    <span>{user.phone}</span>
                    <span className="text-neutral-600">•</span>
                    <span className="text-[#2ee59d] capitalize">{user.preferredContact}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3 h-3 text-neutral-500" />
                    <span>{user.locality}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Authenticated user actions */}
            {isAuthenticated && (
              <div className="pt-2 border-t border-[#252a36] flex items-center justify-between text-xs">
                <span className="text-[11px] text-neutral-400 font-mono">
                  {user.email}
                </span>
                <button
                  onClick={onSignOut}
                  className="text-[11px] text-red-400 hover:text-red-300 font-medium flex items-center gap-1 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* APP THEME TOGGLING (Required Feature) */}
      {/* ==================================================== */}
      <div className="p-4 rounded-2xl bg-[#181b22] border border-[#272b35] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#2ee59d]" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider font-heading">
              App Appearance & Theme
            </h2>
          </div>
          <span className="text-[10px] font-semibold text-[#2ee59d] capitalize">
            {currentTheme} active
          </span>
        </div>

        <p className="text-[11px] text-neutral-400 leading-snug">
          Choose your preferred dark visual aesthetic. Selected theme applies dynamically across all screens and maps.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {themes.map((t) => {
            const isSelected = currentTheme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChangeTheme(t.id)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-20 ${
                  isSelected
                    ? 'border-[#2ee59d] ring-1 ring-[#2ee59d] shadow-[0_0_12px_rgba(46,229,157,0.15)]'
                    : 'border-[#272b35] hover:border-neutral-500'
                }`}
                style={{ backgroundColor: t.previewColor }}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: t.accentColor }}
                    />
                    <span className="text-xs font-bold text-white truncate">
                      {t.label}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-[#2ee59d] flex items-center justify-center text-black shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-neutral-400 line-clamp-1 mt-1">
                  {t.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================== */}
      {/* DATABASE & ADMIN CREDENTIALS SECTION */}
      {/* ==================================================== */}
      <div className="p-4 rounded-2xl bg-[#181b22] border border-[#272b35] space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-400" />
            <h2 className="font-bold text-white uppercase tracking-wider font-heading">
              Backend Database Status
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
            CONNECTED
          </span>
        </div>

        <p className="text-[11px] text-neutral-300 leading-relaxed">
          FEAST_v2.0 maintains a persistent SQLite database with schema tables for <strong className="text-white">users</strong> and <strong className="text-white">donations</strong>, seeded with admin authentication.
        </p>

        <div className="p-3 rounded-xl bg-[#121418] border border-[#222733] space-y-1.5 text-[11px] font-mono">
          <div className="flex justify-between text-neutral-400">
            <span>Database Engine:</span>
            <span className="text-sky-300">SQLite (node:sqlite)</span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>Database Path:</span>
            <span className="text-neutral-200">./data/feast.db</span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>Admin Account:</span>
            <span className="text-emerald-400">admin@feast.org</span>
          </div>
        </div>

        <button
          onClick={() => setShowDbDiagnostics(!showDbDiagnostics)}
          className="w-full py-2 px-3 rounded-xl bg-[#1d2330] hover:bg-[#252e40] text-sky-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-sky-500/30"
        >
          <Server className="w-3.5 h-3.5" />
          <span>{showDbDiagnostics ? 'Hide Database Setup Instructions' : 'How Database Connection Works & Setup'}</span>
        </button>

        {showDbDiagnostics && (
          <div className="p-3 rounded-xl bg-[#141822] border border-sky-500/40 text-[11px] text-neutral-300 space-y-2 animate-in fade-in">
            <p className="font-bold text-white">How SQLite Database is Connected:</p>
            <ol className="list-decimal pl-4 space-y-1 text-neutral-400">
              <li><strong className="text-neutral-200">Node:sqlite Engine:</strong> Handled by Node 22 native <code className="text-sky-300">DatabaseSync</code> in <code className="text-sky-300">src/server/db.ts</code>.</li>
              <li><strong className="text-neutral-200">Admin Seed:</strong> Created with scrypt password hashing on startup for <code className="text-emerald-300">admin@feast.org</code> with password <code className="text-emerald-300">AdminPassword123!</code>.</li>
              <li><strong className="text-neutral-200">External DB Setup (PostgreSQL / Cloud SQL / Supabase):</strong> Replace <code className="text-sky-300">db.ts</code> with a connection string (<code className="text-neutral-300">DATABASE_URL</code>) using Postgres client or Drizzle ORM.</li>
            </ol>
          </div>
        )}
      </div>

      {/* Real Impact Summary Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-[#181b22] border border-[#272b35] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#12281e] flex items-center justify-center text-[#2ee59d]">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-white font-heading leading-tight">
              {metrics.totalDonations}
            </p>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
              Donations Shared
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#181b22] border border-[#272b35] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#281d12] flex items-center justify-center text-amber-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-white font-heading leading-tight">
              {metrics.peopleServed}
            </p>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
              People Served
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#181b22] border border-[#272b35] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1e2330] flex items-center justify-center text-sky-400">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-white font-heading leading-tight">
              {metrics.activeAvailable}
            </p>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
              Active in 5 km
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#181b22] border border-[#272b35] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1f1628] flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-white font-heading leading-tight">
              ~{metrics.estimatedKgSaved} kg
            </p>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
              Food Diverted
            </p>
          </div>
        </div>
      </div>

      {/* Section: My Food Donations (Or All Donations if Admin) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-heading">
              <span>{isAdmin ? 'All Community Listings (Admin Mode)' : 'My Donation Listings'}</span>
              <span className="text-xs text-[#2ee59d]">
                ({isAdmin ? allDonations.length : userDonations.length})
              </span>
            </h2>
            <p className="text-[11px] text-neutral-400">
              {isAdmin
                ? 'Full admin moderation: toggle availability or remove any community listing.'
                : 'Toggle availability directly to remove or show listings in the Global feed.'}
            </p>
          </div>
          <button
            onClick={onGoToDonate}
            className="px-3 py-1.5 rounded-xl bg-[#2ee59d] hover:bg-[#28d48f] text-black font-bold text-xs flex items-center gap-1 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Food</span>
          </button>
        </div>

        {(isAdmin ? allDonations : userDonations).length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#181b22] border border-[#272b35] text-center">
            <p className="text-xs text-neutral-400">
              No food donations registered in database.
            </p>
            <button
              onClick={onGoToDonate}
              className="mt-3 px-4 py-2 rounded-xl bg-[#2ee59d] text-black text-xs font-bold"
            >
              Register First Donation
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {(isAdmin ? allDonations : userDonations).map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl bg-[#181b22] border transition-all ${
                  item.isAvailable && item.status === 'active'
                    ? 'border-[#2ee59d]/60 shadow-[0_0_15px_rgba(46,229,157,0.1)]'
                    : 'border-[#272b35]'
                }`}
              >
                {/* Header with Title and Core Availability Toggle */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.isAvailable && item.status === 'active'
                            ? 'bg-[#2ee59d]'
                            : 'bg-neutral-600'
                        }`}
                      />
                      <h3 className="font-bold text-sm text-white truncate font-heading">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                      {item.quantity} • Serves ~{item.estimatedServings} • {item.locality}
                    </p>
                    {isAdmin && (
                      <p className="text-[10px] text-sky-400 mt-0.5 truncate font-mono">
                        Donor: {item.donorName} ({item.donorPhone})
                      </p>
                    )}
                  </div>

                  {/* DIRECT AVAILABILITY TOGGLE ON CARD */}
                  <div className="flex flex-col items-end shrink-0">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.isAvailable}
                      onClick={() => onToggleDonationAvailability(item.id, !item.isAvailable)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        item.isAvailable ? 'bg-[#2ee59d]' : 'bg-[#374151]'
                      }`}
                      aria-label={`Toggle availability for ${item.title}. Currently ${
                        item.isAvailable ? 'Available within 5km' : 'Hidden from feed'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                          item.isAvailable ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-[9px] font-semibold mt-1 text-neutral-400">
                      {item.isAvailable ? 'ON: in 5 km' : 'OFF: Hidden'}
                    </span>
                  </div>
                </div>

                {/* Status and Action Buttons */}
                <div className="mt-3 pt-2.5 border-t border-[#232733] flex items-center justify-between text-xs">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      item.status === 'completed'
                        ? 'bg-blue-900/60 text-blue-300'
                        : item.isAvailable
                        ? 'bg-[#12281e] text-[#2ee59d]'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {item.status === 'completed'
                      ? 'Collected'
                      : item.isAvailable
                      ? 'Live on Feed'
                      : 'Draft / Paused'}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Mark Collected */}
                    {item.status === 'active' && (
                      <button
                        onClick={() => onMarkCollected(item.id)}
                        className="px-2.5 py-1 rounded-lg bg-[#1e2330] hover:bg-[#252c3d] text-neutral-300 hover:text-white text-[11px] font-medium flex items-center gap-1 transition-colors"
                        title="Mark food as successfully picked up"
                      >
                        <CheckCircle className="w-3 h-3 text-[#2ee59d]" />
                        <span>Collected</span>
                      </button>
                    )}

                    {/* Edit */}
                    <button
                      onClick={() => onEditDonation(item)}
                      className="p-1.5 rounded-lg bg-[#1e2330] hover:bg-[#252c3d] text-neutral-300 hover:text-white transition-colors"
                      aria-label={`Edit ${item.title}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="p-1.5 rounded-lg bg-[#2b181b] hover:bg-[#381e22] text-red-400 transition-colors"
                      aria-label={`Delete ${item.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Delete Confirmation Box */}
                {deleteConfirmId === item.id && (
                  <div className="mt-2 p-2.5 rounded-xl bg-[#261517] border border-red-500/40 text-xs text-red-200 flex items-center justify-between gap-2 animate-in fade-in">
                    <span>Delete this listing permanently from database?</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onDeleteDonation(item.id);
                          setDeleteConfirmId(null);
                        }}
                        className="px-2.5 py-1 rounded-md bg-red-600 text-white font-bold text-[10px]"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1 rounded-md bg-neutral-800 text-neutral-300 text-[10px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
