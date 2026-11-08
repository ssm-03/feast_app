/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { FoodDonation, UserProfile } from '../types';
import { INITIAL_DONATIONS } from '../data/mockDonations';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Custom database ID from firebase-applet-config.json
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error handling conforming strictly to FirestoreErrorInfo
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot and seed demo data if empty
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase Firestore] Connected successfully to database:', firebaseConfig.firestoreDatabaseId);
    seedInitialFirestoreData();
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    } else {
      console.warn('[Firebase Firestore] Initial ping result:', error);
    }
    return false;
  }
}

export async function seedInitialFirestoreData() {
  try {
    const snap = await getDocs(collection(db, 'donations'));
    if (snap.empty) {
      console.log('[Firebase] Seeding initial donations into Firestore...');
      for (const item of INITIAL_DONATIONS) {
        await saveDonationToFirestore(item);
      }
      console.log('[Firebase] Seeded', INITIAL_DONATIONS.length, 'donations.');
    }
  } catch (err) {
    console.warn('[Firebase] Seed check skipped:', err);
  }
}

// Real-time listener for donations collection
export function subscribeToFirestoreDonations(
  onData: (donations: FoodDonation[]) => void,
  onError?: (err: any) => void
) {
  const collRef = collection(db, 'donations');
  return onSnapshot(
    collRef,
    (snapshot) => {
      const items: FoodDonation[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          donorId: data.donorId,
          donorName: data.donorName,
          donorPhone: data.donorPhone,
          donorContactMethod: data.donorContactMethod || 'whatsapp',
          title: data.title,
          description: data.description,
          category: data.category,
          dietaryType: data.dietaryType,
          quantity: data.quantity,
          estimatedServings: data.estimatedServings,
          prepTime: data.prepTime,
          expiryDeadline: data.expiryDeadline,
          pickupWindow: data.pickupWindow,
          pickupAddress: data.pickupAddress,
          locality: data.locality,
          coordinates: { lat: data.lat, lng: data.lng },
          locationVerified: Boolean(data.locationVerified),
          locationDiscrepancyMeters: data.locationDiscrepancyMeters || 0,
          imageUrl: data.imageUrl,
          pickupInstructions: data.pickupInstructions,
          safetyConfirmed: Boolean(data.safetyConfirmed),
          isAvailable: Boolean(data.isAvailable),
          status: data.status || 'active',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt || data.createdAt,
        });
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'donations');
      if (onError) onError(error);
    }
  );
}

// Save or create donation in Firestore
export async function saveDonationToFirestore(donation: FoodDonation) {
  const path = `donations/${donation.id}`;
  try {
    const payload = {
      id: donation.id,
      donorId: donation.donorId,
      donorName: donation.donorName,
      donorPhone: donation.donorPhone,
      donorContactMethod: donation.donorContactMethod,
      title: donation.title,
      description: donation.description,
      category: donation.category,
      dietaryType: donation.dietaryType,
      quantity: donation.quantity,
      estimatedServings: donation.estimatedServings,
      prepTime: donation.prepTime || '',
      expiryDeadline: donation.expiryDeadline,
      pickupWindow: donation.pickupWindow,
      pickupAddress: donation.pickupAddress,
      locality: donation.locality,
      lat: donation.coordinates.lat,
      lng: donation.coordinates.lng,
      locationVerified: donation.locationVerified,
      locationDiscrepancyMeters: donation.locationDiscrepancyMeters || 0,
      imageUrl: donation.imageUrl || '',
      pickupInstructions: donation.pickupInstructions || '',
      safetyConfirmed: donation.safetyConfirmed,
      isAvailable: donation.isAvailable,
      status: donation.status,
      createdAt: donation.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'donations', donation.id), payload, { merge: true });
    return true;
  } catch (error) {
    console.warn(`[Firebase] saveDonationToFirestore failed for ${path}:`, error);
    return false;
  }
}

// Toggle availability in Firestore
export async function updateDonationAvailabilityInFirestore(id: string, isAvailable: boolean) {
  const path = `donations/${id}`;
  try {
    await setDoc(
      doc(db, 'donations', id),
      {
        isAvailable,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.warn(`[Firebase] updateDonationAvailability failed for ${path}:`, error);
    return false;
  }
}

// Delete donation in Firestore
export async function deleteDonationFromFirestore(id: string) {
  const path = `donations/${id}`;
  try {
    await deleteDoc(doc(db, 'donations', id));
    return true;
  } catch (error) {
    console.warn(`[Firebase] deleteDonationFromFirestore failed for ${path}:`, error);
    return false;
  }
}

// Run initial connection test
testConnection();
