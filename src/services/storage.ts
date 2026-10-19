/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FoodDonation, UserProfile, DonationStatus } from '../types';
import { INITIAL_DONATIONS, DEFAULT_USER } from '../data/mockDonations';
import { isExpired } from '../utils/geo';

const STORAGE_KEY_DONATIONS = 'feast_app_donations_v1';
const STORAGE_KEY_USER = 'feast_app_user_v1';
const EVENT_NAME = 'feast_data_updated';

class DataService {
  private getStoredDonations(): FoodDonation[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DONATIONS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    // initialize with initial donations
    this.persistDonations(INITIAL_DONATIONS);
    return INITIAL_DONATIONS;
  }

  private persistDonations(donations: FoodDonation[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_DONATIONS, JSON.stringify(donations));
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: donations }));
    }
  }

  public getDonations(): FoodDonation[] {
    return this.getStoredDonations();
  }

  public getDonationById(id: string): FoodDonation | undefined {
    return this.getStoredDonations().find((d) => d.id === id);
  }

  /**
   * Returns active, available, and non-expired donations eligible for the Global feed
   */
  public getEligibleDonations(): FoodDonation[] {
    const all = this.getStoredDonations();
    return all.filter((d) => {
      // Must have isAvailable = true
      if (!d.isAvailable) return false;
      // Must be status = 'active'
      if (d.status !== 'active') return false;
      // Must not be expired
      if (isExpired(d.expiryDeadline)) return false;
      return true;
    });
  }

  public getUserDonations(userId: string): FoodDonation[] {
    return this.getStoredDonations().filter((d) => d.donorId === userId);
  }

  public saveDonation(donation: FoodDonation): void {
    const list = this.getStoredDonations();
    const existingIndex = list.findIndex((d) => d.id === donation.id);
    if (existingIndex >= 0) {
      list[existingIndex] = {
        ...donation,
        updatedAt: new Date().toISOString(),
      };
    } else {
      list.unshift({
        ...donation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    this.persistDonations(list);
  }

  /**
   * The core availability toggle:
   * When turned OFF, removes the donation immediately from the Global feed.
   * When turned ON, makes it eligible to appear to viewers within 5 km.
   */
  public toggleAvailability(id: string, isAvailable: boolean): FoodDonation | null {
    const list = this.getStoredDonations();
    const target = list.find((d) => d.id === id);
    if (!target) return null;

    target.isAvailable = isAvailable;
    target.updatedAt = new Date().toISOString();
    this.persistDonations(list);
    return target;
  }

  public updateStatus(id: string, status: DonationStatus): void {
    const list = this.getStoredDonations();
    const target = list.find((d) => d.id === id);
    if (target) {
      target.status = status;
      if (status === 'completed' || status === 'cancelled') {
        target.isAvailable = false; // completed donations cease to be available
      }
      target.updatedAt = new Date().toISOString();
      this.persistDonations(list);
    }
  }

  public deleteDonation(id: string): void {
    const list = this.getStoredDonations().filter((d) => d.id !== id);
    this.persistDonations(list);
  }

  public getUserProfile(): UserProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return DEFAULT_USER;
  }

  public saveUserProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }

  public getImpactMetrics(userId?: string) {
    const donations = this.getStoredDonations();
    const userDonations = userId
      ? donations.filter((d) => d.donorId === userId)
      : donations;

    const totalDonations = userDonations.length;
    const activeAvailable = userDonations.filter((d) => d.isAvailable && d.status === 'active').length;
    const completed = userDonations.filter((d) => d.status === 'completed').length;
    const peopleServed = userDonations.reduce((sum, d) => sum + (d.estimatedServings || 0), 0);
    // Rough estimate: ~0.45 kg per meal serving
    const estimatedKgSaved = Math.round(peopleServed * 0.45);

    return {
      totalDonations,
      activeAvailable,
      completed,
      peopleServed,
      estimatedKgSaved,
    };
  }

  public resetToInitial(): void {
    this.persistDonations(INITIAL_DONATIONS);
    this.saveUserProfile(DEFAULT_USER);
  }

  public subscribe(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const listener = () => callback();
    window.addEventListener(EVENT_NAME, listener);
    window.addEventListener('storage', listener);
    return () => {
      window.removeEventListener(EVENT_NAME, listener);
      window.removeEventListener('storage', listener);
    };
  }
}

export const dataService = new DataService();
