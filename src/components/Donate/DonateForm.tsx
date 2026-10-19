/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  MapPin,
  Clock,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Camera,
  Image as ImageIcon,
  Navigation,
  Info,
} from 'lucide-react';
import {
  FoodDonation,
  UserProfile,
  FoodCategory,
  DietaryType,
  ContactMethod,
  ViewerLocation,
} from '../../types';
import { PRESET_FOOD_PHOTOS } from '../../data/mockDonations';
import { verifyLocationMatch, Coordinates } from '../../utils/geo';

interface DonateFormProps {
  currentUser: UserProfile;
  viewerLocation: ViewerLocation;
  editingDonation: FoodDonation | null;
  onSaveDonation: (donation: FoodDonation) => void;
  onCancelEdit?: () => void;
  onNavigateToLocationVerification: (address: string, coords: Coordinates) => void;
}

const CATEGORIES: FoodCategory[] = [
  'Cooked Meals',
  'Bakery & Bread',
  'Fresh Produce',
  'Packaged & Canned',
  'Dairy & Refrigerated',
  'Beverages',
  'Snacks & Desserts',
  'Catering Surplus',
];

export const DonateForm: React.FC<DonateFormProps> = ({
  currentUser,
  viewerLocation,
  editingDonation,
  onSaveDonation,
  onCancelEdit,
  onNavigateToLocationVerification,
}) => {
  // Essential Core Toggle
  const [isAvailable, setIsAvailable] = useState<boolean>(
    editingDonation ? editingDonation.isAvailable : true
  );

  // Form Fields
  const [title, setTitle] = useState(editingDonation?.title || '');
  const [description, setDescription] = useState(editingDonation?.description || '');
  const [category, setCategory] = useState<FoodCategory>(
    editingDonation?.category || 'Cooked Meals'
  );
  const [dietaryType, setDietaryType] = useState<DietaryType>(
    editingDonation?.dietaryType || 'veg'
  );
  const [quantity, setQuantity] = useState(editingDonation?.quantity || '');
  const [servings, setServings] = useState<number>(editingDonation?.estimatedServings || 8);
  const [prepTime, setPrepTime] = useState(
    editingDonation?.prepTime || 'Today, freshly prepared'
  );

  // Default safe-consumption deadline: 6 hours from now
  const defaultDeadline = new Date(Date.now() + 6 * 3600 * 1000)
    .toISOString()
    .slice(0, 16);
  const [expiryDeadline, setExpiryDeadline] = useState(
    editingDonation?.expiryDeadline
      ? new Date(editingDonation.expiryDeadline).toISOString().slice(0, 16)
      : defaultDeadline
  );
  const [pickupWindow, setPickupWindow] = useState(
    editingDonation?.pickupWindow || 'Today 2:00 PM – 6:00 PM'
  );
  const [pickupAddress, setPickupAddress] = useState(
    editingDonation?.pickupAddress || '350 Mission St (Lobby / Concierge)'
  );
  const [locality, setLocality] = useState(
    editingDonation?.locality || currentUser.locality || 'Downtown Central'
  );
  const [coordinates, setCoordinates] = useState<Coordinates>(
    editingDonation?.coordinates || viewerLocation.coords
  );
  const [imageUrl, setImageUrl] = useState(
    editingDonation?.imageUrl || PRESET_FOOD_PHOTOS[0].url
  );
  const [pickupInstructions, setPickupInstructions] = useState(
    editingDonation?.pickupInstructions ||
      'Please bring clean containers or bags. Contact upon arrival.'
  );
  const [safetyConfirmed, setSafetyConfirmed] = useState(
    editingDonation ? editingDonation.safetyConfirmed : false
  );

  // Contact Info (prefilled from profile)
  const [donorName, setDonorName] = useState(
    editingDonation?.donorName || currentUser.name
  );
  const [donorPhone, setDonorPhone] = useState(
    editingDonation?.donorPhone || currentUser.phone
  );
  const [contactMethod, setContactMethod] = useState<ContactMethod>(
    editingDonation?.donorContactMethod || currentUser.preferredContact
  );

  // Feedback & Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [locationVerification, setLocationVerification] = useState(
    verifyLocationMatch(coordinates, viewerLocation.coords)
  );

  useEffect(() => {
    setLocationVerification(verifyLocationMatch(coordinates, viewerLocation.coords));
  }, [coordinates, viewerLocation.coords]);

  const handleUseCurrentGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newCoords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setCoordinates(newCoords);
          setFeedbackToast('Pickup coordinates updated to your current device GPS position.');
        },
        () => {
          // Fallback to viewerLocation coords
          setCoordinates(viewerLocation.coords);
          setFeedbackToast('Using verified viewer coordinates.');
        }
      );
    } else {
      setCoordinates(viewerLocation.coords);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Food title is required';
    if (!description.trim()) errs.description = 'Please describe the food items';
    if (!quantity.trim()) errs.quantity = 'Quantity and unit required (e.g. 5 boxes)';
    if (!servings || servings < 1) errs.servings = 'Must serve at least 1 person';
    if (!pickupAddress.trim()) errs.pickupAddress = 'Pickup address is required';
    if (!locality.trim()) errs.locality = 'Neighbourhood/locality is required';
    if (!donorName.trim()) errs.donorName = 'Donor name is required';
    if (!donorPhone.trim()) errs.donorPhone = 'Contact phone number is required';
    if (!safetyConfirmed)
      errs.safetyConfirmed = 'You must confirm the food safety and handling pledge';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      setFeedbackToast('Please fill all required fields marked in red.');
      return;
    }

    const donation: FoodDonation = {
      id: editingDonation?.id || `food_${Date.now()}`,
      donorId: currentUser.id,
      donorName,
      donorPhone,
      donorContactMethod: contactMethod,
      title: title.trim(),
      description: description.trim(),
      category,
      dietaryType,
      quantity: quantity.trim(),
      estimatedServings: Number(servings),
      prepTime: prepTime.trim(),
      expiryDeadline: new Date(expiryDeadline).toISOString(),
      pickupWindow: pickupWindow.trim(),
      pickupAddress: pickupAddress.trim(),
      locality: locality.trim(),
      coordinates,
      locationVerified: locationVerification.status === 'verified',
      locationDiscrepancyMeters: locationVerification.distanceMeters,
      imageUrl,
      pickupInstructions: pickupInstructions.trim(),
      safetyConfirmed: true,
      isAvailable, // CORE FEATURE
      status: 'active',
      createdAt: editingDonation?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveDonation(donation);

    const message = isAvailable
      ? 'Donation saved! It is now ACTIVE and visible to people within a 5 km radius.'
      : 'Donation saved as a DRAFT. It is currently hidden from the Global feed.';
    setFeedbackToast(message);
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto p-4 pb-28 text-left overflow-y-auto">
      {/* Edit banner if modifying existing */}
      {editingDonation && (
        <div className="mb-4 p-3 rounded-2xl bg-[#1e2330] border border-[#2ee59d]/40 flex items-center justify-between">
          <div className="text-xs">
            <span className="font-bold text-[#2ee59d]">Editing Donation</span>
            <p className="text-neutral-400 text-[11px] truncate">{editingDonation.title}</p>
          </div>
          {onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-xs text-neutral-400 hover:text-white underline"
            >
              Cancel Edit
            </button>
          )}
        </div>
      )}

      {/* Page Title */}
      <div className="mb-4">
        <h1 className="text-xl font-extrabold text-white font-heading">
          {editingDonation ? 'Update Food Donation' : 'Register Surplus Food'}
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Provide accurate details to share wholesome food with nearby people in need.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ESSENTIAL CORE AVAILABILITY TOGGLE (Highly prominent near top) */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-200 ${
            isAvailable
              ? 'bg-[#12281e] border-[#2ee59d]/60 shadow-[0_0_20px_rgba(46,229,157,0.15)]'
              : 'bg-[#1b1e26] border-[#2b303d]'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2ee59d]">
                Core Availability Control
              </span>
              <label
                htmlFor="availability-toggle"
                className="block text-sm font-bold text-white mt-0.5 cursor-pointer font-heading"
              >
                Make this donation available to nearby people
              </label>
              <p className="text-xs text-neutral-300 mt-1 leading-snug">
                {isAvailable
                  ? 'ON: Visible to individuals & NGOs within 5 km of pickup coordinates.'
                  : 'OFF: Hidden immediately from the Global feed.'}
              </p>
            </div>

            {/* Custom accessible toggle switch */}
            <button
              type="button"
              id="availability-toggle"
              role="switch"
              aria-checked={isAvailable}
              onClick={() => {
                const nextState = !isAvailable;
                setIsAvailable(nextState);
                setFeedbackToast(
                  nextState
                    ? 'Availability set to ON. Food will be visible within 5 km upon saving.'
                    : 'Availability set to OFF. Food will be hidden from the Global feed.'
                );
              }}
              className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2ee59d] ${
                isAvailable ? 'bg-[#2ee59d]' : 'bg-[#374151]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-black shadow-md ring-0 transition duration-200 ease-in-out ${
                  isAvailable ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Feedback Toast */}
        {feedbackToast && (
          <div className="p-3 rounded-xl bg-[#18221c] border border-[#2ee59d]/50 text-xs text-[#2ee59d] flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackToast(null)}
              className="text-neutral-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Section: Food Details */}
        <div className="p-4 rounded-2xl bg-[#181b22] border border-[#272b35] space-y-3.5">
          <h2 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#2ee59d]" />
            <span>Food Description & Classification</span>
          </h2>

          {/* Food Title */}
          <div>
            <label htmlFor="food-title" className="block text-xs font-semibold text-neutral-200 mb-1">
              Food Title / Name <span className="text-red-400">*</span>
            </label>
            <input
              id="food-title"
              type="text"
              placeholder="e.g. Fresh Vegetable Biryani & Raita (3 large pans)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#121418] border border-[#272b35] text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[#2ee59d]"
            />
            {errors.title && <p className="text-[11px] text-red-400 mt-1">{errors.title}</p>}
          </div>

          {/* Food Description */}
          <div>
            <label htmlFor="food-desc" className="block text-xs font-semibold text-neutral-200 mb-1">
              Detailed Description <span className="text-red-400">*</span>
            </label>
            <textarea
              id="food-desc"
              rows={2}
              placeholder="Describe dishes, ingredients, packaging, hygiene precautions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#121418] border border-[#272b35] text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[#2ee59d]"
            />
            {errors.description && (
              <p className="text-[11px] text-red-400 mt-1">{errors.description}</p>
            )}
          </div>

          {/* Category & Diet Classification */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="food-category" className="block text-xs font-semibold text-neutral-200 mb-1">
                Category
              </label>
              <select
                id="food-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full px-2.5 py-2 rounded-xl bg-[#121418] border border-[#272b35] text-white text-xs focus:outline-none focus:border-[#2ee59d]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-200 mb-1">
                Dietary Classification
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['veg', 'vegan', 'non-veg'] as DietaryType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDietaryType(type)}
                    className={`py-1.5 text-[10px] font-semibold rounded-lg capitalize transition-colors ${
                      dietaryType === type
                        ? 'bg-[#2ee59d] text-black'
                        : 'bg-[#121418] text-neutral-400 border border-[#272b35]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quantity & Servings */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="food-qty" className="block text-xs font-semibold text-neutral-200 mb-1">
                Quantity with Unit <span className="text-red-400">*</span>
              </label>
              <input
                id="food-qty"
                type="text"
                placeholder="e.g. 4 trays (~12 kg)"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#121418] border border-[#272b35] text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[#2ee59d]"
              />
              {errors.quantity && (
                <p className="text-[11px] text-red-400 mt-1">{errors.quantity}</p>
              )}
            </div>

            <div>
              <label htmlFor="food-servings" className="block text-xs font-semibold text-neutral-200 mb-1">
                Serves (Approx. People) <span className="text-red-400">*</span>
              </label>
              <input
                id="food-servings"
                type="number"
                min={1}
                max={500}
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#121418] border border-[#272b35] text-white text-xs focus:outline-none focus:border-[#2ee59d]"
              />
              {errors.servings && (
                <p className="text-[11px] text-red-400 mt-1">{errors.servings}</p>
              )}
            </div>
          </div>

          {/* Photo Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-200">
                Food Photo (Recommended)
              </label>
              <button
                type="button"
                onClick={() => setShowPhotoPicker(!showPhotoPicker)}
                className="text-[11px] text-[#2ee59d] hover:underline flex items-center gap-1"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{showPhotoPicker ? 'Hide Presets' : 'Choose Preset / Change'}</span>
              </button>
            </div>

            {imageUrl && (
              <div className="relative w-full h-28 rounded-xl overflow-hidden border border-[#272b35] mb-2">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 text-[10px] hover:bg-black"
                >
                  ✕
                </button>
              </div>
            )}

            {showPhotoPicker && (
              <div className="p-2.5 rounded-xl bg-[#121418] border border-[#272b35] grid grid-cols-4 gap-2 mb-2">
                {PRESET_FOOD_PHOTOS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setImageUrl(preset.url);
                      setShowPhotoPicker(false);
                    }}
                    className={`relative rounded-lg overflow-hidden h-14 border transition-transform hover:scale-105 ${
                      imageUrl === preset.url
                        ? 'border-[#2ee59d] ring-1 ring-[#2ee59d]'
                        : 'border-[#272b35]'
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section: Timing & Safe Consumption */}
        <div className="p-4 rounded-2xl bg-[#181b22] border border-[#272b35] space-y-3.5">
          <h2 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#2ee59d]" />
            <span>Preparation & Safe-Consumption Window</span>
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="prep-time" className="block text-xs font-semibold text-neutral-200 mb-1">
                Prepared Time
              </label>
              <input
                id="prep-time"
                type="text"
                placeholder="e.g. Today 12:30 PM"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#121418] border border-[#272b35] text-white text-xs focus:outline-none focus:border-[#2ee59d]"
              />
            </div>

            <div>
              <label htmlFor="pickup-window" className="block text-xs font-semibold text-neutral-200 mb-1">
                Pickup Window
              </label>
              <input
                id="pickup-window"
                type="text"
                placeholder="e.g. Today 2:00 PM – 6:00 PM"
                value={pickupWindow}
                onChange={(e) => setPickupWindow(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#121418] border border-[#272b35] text-white text-xs focus:outline-none focus:border-[#2ee59d]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="expiry-deadline" className="block text-xs font-semibold text-neutral-200 mb-1">
              Safe-Consumption Deadline (Auto-expires after this) <span className="text-red-400">*</span>
            </label>
            <input
              id="expiry-deadline"
              type="datetime-local"
              value={expiryDeadline}
              onChange={(e) => setExpiryDeadline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#121418] border border-[#272b35] text-white text-xs focus:outline-none focus:border-[#2ee59d]"
            />
            <p className="text-[11px] text-neutral-400 mt-1">
              The listing will automatically disappear once this time passes to ensure perishables are safe.
            </p>
          </div>
        </div>

        {/* Section: Pickup Location & GPS Verification */}
        <div className="p-4 rounded-2xl bg-[#181b22] border border-[#272b35] space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#2ee59d]" />
              <span>Pickup Location & GPS Verification</span>
            </h2>
            <button
              type="button"
              onClick={handleUseCurrentGps}
              className="text-[11px] text-[#2ee59d] hover:underline flex items-center gap-1"
            >
              <Navigation className="w-3 h-3" />
              <span>Use Current GPS</span>
            </button>
          </div>

          <div>
            <label htmlFor="pickup-address" className="block text-xs font-semibold text-neutral-200 mb-1">
              Pickup Address <span className="text-red-400">*</span>
            </label>
            <input
              id="pickup-address"
              type="text"
              placeholder="e.g. 420 Grove St (Side Kitchen entrance)"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#121418] border border-[#272b35] text-white text-xs focus:outline-none focus:border-[#2ee59d]"
            />
            {errors.pickupAddress && (
              <p className="text-[11px] text-red-400 mt-1">{errors.pickupAddress}</p>
            )}
          </div>

          <div>
            <label htmlFor="pickup-locality" className="block text-xs font-semibold text-neutral-200 mb-1">
              Neighbourhood / Locality (Shown Publicly) <span className="text-red-400">*</span>
            </label>
            <input
              id="pickup-locality"
              type="text"
              placeholder="e.g. Hayes Valley / Civic Center"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#121418] border border-[#272b35] text-white text-xs focus:outline-none focus:border-[#2ee59d]"
            />
            {errors.locality && (
              <p className="text-[11px] text-red-400 mt-1">{errors.locality}</p>
            )}
          </div>

          {/* Location Verification Status Pill */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs ${
              locationVerification.status === 'verified'
                ? 'bg-[#12241b] border-[#2ee59d]/50 text-[#2ee59d]'
                : locationVerification.status === 'mismatch'
                ? 'bg-[#291e14] border-amber-500/50 text-amber-300'
                : 'bg-[#1c1f26] border-[#272b35] text-neutral-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {locationVerification.status === 'verified' ? (
                <ShieldCheck className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span className="font-medium text-[11px]">
                {locationVerification.status === 'verified'
                  ? `GPS & Address Match (${locationVerification.distanceMeters}m discrepancy)`
                  : locationVerification.status === 'mismatch'
                  ? `Location Mismatch (${locationVerification.distanceMeters}m difference)`
                  : 'Location Unverified'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onNavigateToLocationVerification(pickupAddress, coordinates)}
              className="text-[11px] font-bold underline hover:opacity-80"
            >
              Verify on Map
            </button>
          </div>

          <div>
            <label htmlFor="pickup-instructions" className="block text-xs font-semibold text-neutral-200 mb-1">
              Pickup Instructions (Packaging, parking, buzzer...)
            </label>
            <textarea
              id="pickup-instructions"
              rows={2}
              placeholder="e.g. Ring buzzer 4B, pickup at service entrance on rear lane."
              value={pickupInstructions}
              onChange={(e) => setPickupInstructions(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#121418] border border-[#272b35] text-white text-xs focus:outline-none focus:border-[#2ee59d]"
            />
          </div>
        </div>

        {/* Section: Donor Contact Details */}
        <div className="p-4 rounded-2xl bg-[#181b22] border border-[#272b35] space-y-3.5">
          <h2 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#2ee59d]" />
            <span>Donor Contact Preferences</span>
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="donor-name" className="block text-xs font-semibold text-neutral-200 mb-1">
                Donor / Organization Name <span className="text-red-400">*</span>
              </label>
              <input
                id="donor-name"
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#121418] border border-[#272b35] text-white text-xs focus:outline-none focus:border-[#2ee59d]"
              />
              {errors.donorName && (
                <p className="text-[11px] text-red-400 mt-1">{errors.donorName}</p>
              )}
            </div>

            <div>
              <label htmlFor="donor-phone" className="block text-xs font-semibold text-neutral-200 mb-1">
                Contact Phone <span className="text-red-400">*</span>
              </label>
              <input
                id="donor-phone"
                type="text"
                value={donorPhone}
                onChange={(e) => setDonorPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#121418] border border-[#272b35] text-white text-xs focus:outline-none focus:border-[#2ee59d]"
              />
              {errors.donorPhone && (
                <p className="text-[11px] text-red-400 mt-1">{errors.donorPhone}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-200 mb-1">
              Preferred Contact Channel
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['whatsapp', 'phone', 'sms'] as ContactMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setContactMethod(method)}
                  className={`py-1.5 text-xs font-semibold rounded-xl capitalize transition-colors ${
                    contactMethod === method
                      ? 'bg-[#2ee59d] text-black'
                      : 'bg-[#121418] text-neutral-400 border border-[#272b35]'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section: Food Safety Pledge */}
        <div className="p-4 rounded-2xl bg-[#181b22] border border-[#272b35] space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={safetyConfirmed}
              onChange={(e) => setSafetyConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#272b35] text-[#2ee59d] focus:ring-[#2ee59d]"
            />
            <div className="text-xs text-neutral-300">
              <span className="font-semibold text-white">Food Safety Declaration: </span>
              I confirm that this food is freshly prepared or stored under appropriate temperature conditions, handled hygienically, and is safe for immediate human consumption.
            </div>
          </label>
          {errors.safetyConfirmed && (
            <p className="text-[11px] text-red-400 pl-7">{errors.safetyConfirmed}</p>
          )}
        </div>

        {/* Submit Actions */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-[#2ee59d] hover:bg-[#28d48f] active:scale-[0.98] text-black font-bold text-sm tracking-wide transition-all shadow-[0_4px_20px_rgba(46,229,157,0.3)] flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {editingDonation
                ? 'Update Food Donation'
                : isAvailable
                ? 'Publish & Make Available (5 km)'
                : 'Save as Inactive Draft'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
