/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Coordinates } from '../utils/geo';

export type TabType = 'global' | 'donate' | 'location' | 'profile';

export type FoodCategory =
  | 'Cooked Meals'
  | 'Bakery & Bread'
  | 'Fresh Produce'
  | 'Packaged & Canned'
  | 'Dairy & Refrigerated'
  | 'Beverages'
  | 'Snacks & Desserts'
  | 'Catering Surplus';

export type DietaryType = 'veg' | 'non-veg' | 'vegan';

export type ContactMethod = 'whatsapp' | 'phone' | 'sms' | 'any';

export type DonationStatus = 'active' | 'completed' | 'cancelled';

export interface FoodDonation {
  id: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  donorEmail?: string;
  donorContactMethod: ContactMethod;
  title: string;
  description: string;
  category: FoodCategory;
  dietaryType: DietaryType;
  quantity: string;
  estimatedServings: number;
  prepTime?: string;
  expiryDeadline: string; // ISO date string
  pickupWindow: string; // e.g. "Today 2:00 PM - 6:00 PM"
  pickupAddress: string;
  locality: string; // e.g. "Mission District", "Downtown"
  coordinates: Coordinates;
  locationVerified: boolean;
  locationDiscrepancyMeters?: number;
  imageUrl?: string;
  pickupInstructions?: string;
  safetyConfirmed: boolean;
  isAvailable: boolean; // CORE TOGGLE: visible on global feed if true AND within 5km
  status: DonationStatus;
  createdAt: string;
  updatedAt: string;
}

export type AppTheme = 'charcoal' | 'midnight' | 'slate' | 'emerald';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  preferredContact: ContactMethod;
  locality: string;
  userType: 'Individual Resident' | 'Restaurant / Café' | 'Bakery' | 'Community Kitchen' | 'NGO / Charity' | 'Event Catering';
  role?: 'admin' | 'user';
  avatarUrl?: string;
  bio?: string;
}

export interface ViewerLocation {
  coords: Coordinates;
  name: string;
  isGpsVerified: boolean;
}
