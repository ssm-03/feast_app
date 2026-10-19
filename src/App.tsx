/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TabType, FoodDonation, UserProfile, ViewerLocation, AppTheme } from './types';
import { Coordinates, isWithinRadius } from './utils/geo';
import { dataService } from './services/storage';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { GlobalFeed } from './components/GlobalFeed/GlobalFeed';
import { DonateForm } from './components/Donate/DonateForm';
import { LocationVerification } from './components/Location/LocationVerification';
import { ProfilePage } from './components/Profile/ProfilePage';
import { ContactDonorModal } from './components/Modals/ContactDonorModal';
import { LocationPickerModal } from './components/Modals/LocationPickerModal';
import { GuidelinesModal } from './components/Modals/GuidelinesModal';
import { AuthModal } from './components/Modals/AuthModal';

const AUTH_STORAGE_KEY = 'feast_auth_status_v2';
const THEME_STORAGE_KEY = 'feast_theme_v2';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('global');

  // Authentication State: defaults to false (Guest) unless previously authenticated
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // App Theme State: defaults to charcoal, supports midnight, slate, emerald
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    try {
      return (localStorage.getItem(THEME_STORAGE_KEY) as AppTheme) || 'charcoal';
    } catch {
      return 'charcoal';
    }
  });

  // Core Data States
  const [donations, setDonations] = useState<FoodDonation[]>(() => dataService.getDonations());
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => dataService.getUserProfile());

  // Viewer Location (Initializes with default anchor, immediately prompts browser GPS on load)
  const [viewerLocation, setViewerLocation] = useState<ViewerLocation>({
    coords: { lat: 37.7749, lng: -122.4194 },
    name: 'SF (Civic Center)',
    isGpsVerified: false,
  });

  // Modals & Navigation Contexts
  const [contactDonation, setContactDonation] = useState<FoodDonation | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false);
  const [showGuidelines, setShowGuidelines] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authTargetTab, setAuthTargetTab] = useState<TabType | null>(null);
  const [editingDonation, setEditingDonation] = useState<FoodDonation | null>(null);

  // Address & Coords for Location Verification Tab
  const [verificationAddress, setVerificationAddress] = useState<string>('');
  const [verificationCoords, setVerificationCoords] = useState<Coordinates | undefined>(undefined);

  // 1. Mandatory Location Prompt on App Launch
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setViewerLocation({
            coords,
            name: 'Device GPS Location',
            isGpsVerified: true,
          });
        },
        (err) => {
          console.log('[FEAST_v2.0] Geolocation prompt response:', err.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // 2. Load and synchronize donations from SQLite backend if available
  useEffect(() => {
    fetch('/api/donations')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDonations(data);
        }
      })
      .catch(() => {
        // Fallback to local storage if offline
      });

    const unsubscribe = dataService.subscribe(() => {
      setDonations([...dataService.getDonations()]);
      setCurrentUser({ ...dataService.getUserProfile() });
    });
    return unsubscribe;
  }, []);

  // Theme changer with persistence
  const handleChangeTheme = (theme: AppTheme) => {
    setCurrentTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  };

  // Login handler
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    dataService.saveUserProfile(user);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    } catch {
      // ignore
    }

    // Navigate to pending tab if user was blocked
    if (authTargetTab) {
      setActiveTab(authTargetTab);
      setAuthTargetTab(null);
    }
  };

  // Sign out handler
  const handleSignOut = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
    setActiveTab('global');
  };

  // Intercept navigation for unauthenticated guest users
  const handleTabChange = (targetTab: TabType) => {
    // If not logged in and clicking Donate (form page) or Profile -> ask for login creds!
    if (!isAuthenticated && (targetTab === 'donate' || targetTab === 'profile')) {
      setAuthTargetTab(targetTab);
      setShowAuthModal(true);
      return;
    }

    setActiveTab(targetTab);
  };

  // Filter donations created by current user
  const userDonations = donations.filter((d) => d.donorId === currentUser.id);

  // Calculate nearby available count for bottom nav badge
  const nearbyActiveCount = donations.filter((d) => {
    if (!d.isAvailable || d.status !== 'active') return false;
    const deadline = new Date(d.expiryDeadline).getTime();
    if (deadline < Date.now()) return false;
    return isWithinRadius(
      d.coordinates.lat,
      d.coordinates.lng,
      viewerLocation.coords.lat,
      viewerLocation.coords.lng,
      5.0
    );
  }).length;

  // Handlers for donations
  const handleSaveDonation = (donation: FoodDonation) => {
    dataService.saveDonation(donation);
    setDonations([...dataService.getDonations()]);
    setEditingDonation(null);

    // Also push to SQLite API in background
    fetch('/api/donations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donation),
    }).catch(() => {});

    if (donation.isAvailable) {
      setActiveTab('global');
    } else {
      setActiveTab('profile');
    }
  };

  const handleToggleDonationAvailability = (id: string, isAvailable: boolean) => {
    dataService.toggleAvailability(id, isAvailable);
    setDonations([...dataService.getDonations()]);

    // Update SQLite database
    fetch(`/api/donations/${id}/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable }),
    }).catch(() => {});
  };

  const handleMarkCollected = (id: string) => {
    dataService.updateStatus(id, 'completed');
    setDonations([...dataService.getDonations()]);
  };

  const handleDeleteDonation = (id: string) => {
    dataService.deleteDonation(id);
    setDonations([...dataService.getDonations()]);
  };

  const handleEditDonation = (donation: FoodDonation) => {
    setEditingDonation(donation);
    setActiveTab('donate');
  };

  const handleNavigateToLocationVerification = (address: string, coords: Coordinates) => {
    setVerificationAddress(address);
    setVerificationCoords(coords);
    setActiveTab('location');
  };

  const handleConfirmVerifiedLocation = (coords: Coordinates, address: string) => {
    setVerificationCoords(coords);
    setVerificationAddress(address);
    setViewerLocation({
      coords,
      name: address.split(',')[0] || 'Verified Location',
      isGpsVerified: true,
    });
  };

  const handleResetData = () => {
    dataService.resetToInitial();
    setDonations([...dataService.getDonations()]);
    setCurrentUser({ ...dataService.getUserProfile() });
    setEditingDonation(null);
  };

  // Dynamic theme container styles
  const getThemeBg = () => {
    switch (currentTheme) {
      case 'midnight':
        return '#000000';
      case 'slate':
        return '#0a0f1d';
      case 'emerald':
        return '#03140e';
      case 'charcoal':
      default:
        return '#0d0f12';
    }
  };

  return (
    <div
      className={`min-h-screen flex justify-center text-neutral-100 theme-${currentTheme} transition-colors duration-300`}
      style={{ backgroundColor: currentTheme === 'midnight' ? '#000000' : '#07080a' }}
    >
      {/* Mobile-first frame */}
      <div
        className="w-full max-w-md min-h-screen flex flex-col relative sm:border-x sm:border-[#22252c] sm:shadow-2xl transition-colors duration-300"
        style={{ backgroundColor: getThemeBg() }}
      >
        {/* Fixed Header */}
        <Header
          viewerLocation={viewerLocation}
          isAuthenticated={isAuthenticated}
          currentUser={currentUser}
          onOpenLocationPicker={() => setShowLocationPicker(true)}
          onResetData={handleResetData}
          onOpenGuidelines={() => setShowGuidelines(true)}
          onOpenAuth={() => {
            setAuthTargetTab(null);
            setShowAuthModal(true);
          }}
          onSignOut={handleSignOut}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'global' && (
            <GlobalFeed
              viewerLocation={viewerLocation}
              donations={donations}
              onContactDonor={(donation) => setContactDonation(donation)}
              onOpenLocationPicker={() => setShowLocationPicker(true)}
              onGoToDonate={() => {
                if (!isAuthenticated) {
                  setAuthTargetTab('donate');
                  setShowAuthModal(true);
                  return;
                }
                setEditingDonation(null);
                setActiveTab('donate');
              }}
            />
          )}

          {activeTab === 'donate' && (
            <DonateForm
              currentUser={currentUser}
              viewerLocation={viewerLocation}
              editingDonation={editingDonation}
              onSaveDonation={handleSaveDonation}
              onCancelEdit={() => setEditingDonation(null)}
              onNavigateToLocationVerification={handleNavigateToLocationVerification}
            />
          )}

          {activeTab === 'location' && (
            <LocationVerification
              viewerLocation={viewerLocation}
              userDonations={userDonations}
              initialAddress={verificationAddress}
              initialCoords={verificationCoords}
              onConfirmVerifiedLocation={handleConfirmVerifiedLocation}
              onUpdateViewerLocation={(coords, name) =>
                setViewerLocation({ coords, name, isGpsVerified: true })
              }
            />
          )}

          {activeTab === 'profile' && (
            <ProfilePage
              user={currentUser}
              isAuthenticated={isAuthenticated}
              userDonations={userDonations}
              allDonations={donations}
              currentTheme={currentTheme}
              onChangeTheme={handleChangeTheme}
              onUpdateUser={(updated) => {
                dataService.saveUserProfile(updated);
                setCurrentUser(updated);
              }}
              onEditDonation={handleEditDonation}
              onToggleDonationAvailability={handleToggleDonationAvailability}
              onMarkCollected={handleMarkCollected}
              onDeleteDonation={handleDeleteDonation}
              onGoToDonate={() => {
                setEditingDonation(null);
                setActiveTab('donate');
              }}
              onOpenAuth={() => {
                setAuthTargetTab('profile');
                setShowAuthModal(true);
              }}
              onSignOut={handleSignOut}
            />
          )}
        </main>

        {/* Fixed 4-icon Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          nearbyCount={nearbyActiveCount}
        />

        {/* Modals */}
        <ContactDonorModal
          donation={contactDonation}
          onClose={() => setContactDonation(null)}
        />

        {showLocationPicker && (
          <LocationPickerModal
            currentLocation={viewerLocation}
            onSelectLocation={(loc) => setViewerLocation(loc)}
            onClose={() => setShowLocationPicker(false)}
          />
        )}

        {showGuidelines && (
          <GuidelinesModal onClose={() => setShowGuidelines(false)} />
        )}

        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onLoginSuccess={handleLoginSuccess}
            targetTabName={
              authTargetTab === 'donate'
                ? 'the Food Donation form'
                : authTargetTab === 'profile'
                ? 'your Donor Profile'
                : 'this section'
            }
          />
        )}
      </div>
    </div>
  );
}
