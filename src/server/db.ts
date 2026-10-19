/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'feast.db');
export const db = new DatabaseSync(DB_PATH);

// Helper for secure password hashing
export function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, salt: string, storedHash: string) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

// Initialize tables and seed admin credentials
export function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      user_type TEXT NOT NULL DEFAULT 'Individual Resident',
      locality TEXT NOT NULL DEFAULT 'Downtown',
      role TEXT NOT NULL DEFAULT 'user',
      avatar_url TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // Donations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS donations (
      id TEXT PRIMARY KEY,
      donor_id TEXT NOT NULL,
      donor_name TEXT NOT NULL,
      donor_phone TEXT NOT NULL,
      donor_contact_method TEXT NOT NULL DEFAULT 'whatsapp',
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      dietary_type TEXT NOT NULL,
      quantity TEXT NOT NULL,
      estimated_servings INTEGER NOT NULL,
      prep_time TEXT,
      expiry_deadline TEXT NOT NULL,
      pickup_window TEXT NOT NULL,
      pickup_address TEXT NOT NULL,
      locality TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      location_verified INTEGER NOT NULL DEFAULT 1,
      location_discrepancy_meters INTEGER DEFAULT 0,
      image_url TEXT,
      pickup_instructions TEXT,
      safety_confirmed INTEGER NOT NULL DEFAULT 1,
      is_available INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (donor_id) REFERENCES users (id)
    )
  `);

  // Check if admin user exists; if not, seed admin
  const adminCheck = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@feast.org');
  if (!adminCheck) {
    const { hash, salt } = hashPassword('AdminPassword123!');
    const insertAdmin = db.prepare(`
      INSERT INTO users (id, email, password_hash, salt, name, phone, user_type, locality, role, avatar_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAdmin.run(
      'usr_admin_01',
      'admin@feast.org',
      hash,
      salt,
      'System Administrator (FEAST)',
      '+1 (800) 555-0199',
      'NGO / Charity',
      'Central Administration',
      'admin',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      new Date().toISOString()
    );
    console.log('[SQLite DB] Seeded admin user: admin@feast.org');
  }

  // Seed default community donor
  const userCheck = db.prepare('SELECT id FROM users WHERE email = ?').get('marcus.v@communityfeast.org');
  if (!userCheck) {
    const { hash, salt } = hashPassword('Donor123!');
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, salt, name, phone, user_type, locality, role, avatar_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertUser.run(
      'usr_me_01',
      'marcus.v@communityfeast.org',
      hash,
      salt,
      'Marcus Vance',
      '+1 (555) 234-5678',
      'Community Kitchen',
      'Central Arts District',
      'user',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      new Date().toISOString()
    );
  }

  // Check donations count
  const countRow = db.prepare('SELECT COUNT(*) as count FROM donations').get() as { count: number };
  if (countRow.count === 0) {
    // Seed initial donation
    const insertDonation = db.prepare(`
      INSERT INTO donations (
        id, donor_id, donor_name, donor_phone, donor_contact_method,
        title, description, category, dietary_type, quantity,
        estimated_servings, prep_time, expiry_deadline, pickup_window,
        pickup_address, locality, lat, lng, location_verified,
        location_discrepancy_meters, image_url, pickup_instructions,
        safety_confirmed, is_available, status, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    insertDonation.run(
      'food_01',
      'usr_me_01',
      'Marcus Vance (Hearth & Table)',
      '+1 (555) 234-5678',
      'whatsapp',
      'Surplus Vegetable Biryani & Raita (Fresh Trays)',
      '3 large stainless pans of freshly prepared fragrant vegetable biryani with cucumber raita from lunchtime banquet.',
      'Cooked Meals',
      'veg',
      '3 large trays (~15 kg)',
      25,
      'Today at 12:00 PM',
      new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      'Today 1:30 PM – 5:30 PM',
      '420 Grove St (near Opera Plaza)',
      'Civic Center / Hayes Valley',
      37.7781,
      -122.4215,
      1,
      45,
      'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80',
      'Pick up at side kitchen entrance, buzz Unit 102.',
      1,
      1,
      'active',
      new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      new Date(Date.now() - 1 * 3600 * 1000).toISOString()
    );

    insertDonation.run(
      'food_02',
      'usr_donor_02',
      'Elena Rostova (Golden Gate Bakery)',
      '+1 (555) 987-6543',
      'phone',
      'Assorted Artisan Baguettes, Brioche & Sourdough',
      'Freshly baked this morning at our artisanal ovens. Crusty baguettes, sourdough rounds, and sweet brioche buns.',
      'Bakery & Bread',
      'veg',
      '22 loaves + 15 pastries',
      35,
      'Today at 6:00 AM',
      new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
      'Today until 7:00 PM',
      '1028 Grant Ave',
      'Chinatown / North Beach border',
      37.7975,
      -122.4072,
      1,
      80,
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
      'Come directly to counter and mention F.E.A.S.T. food collection.',
      1,
      1,
      'active',
      new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      new Date(Date.now() - 4 * 3600 * 1000).toISOString()
    );

    insertDonation.run(
      'food_03',
      'usr_donor_03',
      'Chef Tariq (Oasis Mediterranean)',
      '+1 (555) 345-7890',
      'whatsapp',
      'Mediterranean Falafel, Hummus & Fresh Pita Boxes',
      'Crispy herb falafel patties, roasted garlic hummus, tahini dressing, and warm whole-wheat pitas.',
      'Cooked Meals',
      'vegan',
      '18 boxed portions',
      18,
      'Today at 1:15 PM',
      new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
      'Today 2:30 PM – 6:30 PM',
      '240 4th Street (near Yerba Buena)',
      'SoMa / Downtown',
      37.7842,
      -122.4031,
      1,
      60,
      'https://images.unsplash.com/photo-1540914124281-342587941389?auto=format&fit=crop&w=600&q=80',
      'Pick up at restaurant pickup window on Clementina alley.',
      1,
      1,
      'active',
      new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      new Date(Date.now() - 1 * 3600 * 1000).toISOString()
    );

    insertDonation.run(
      'food_04',
      'usr_donor_04',
      'Sarah Lin (Urban Greens Co-op)',
      '+1 (555) 456-7890',
      'sms',
      'Organic Crisp Apples, Mandarins & Ripe Bananas',
      'Unblemished fresh surplus fruit crates from morning delivery. Perfect for shelters and families.',
      'Fresh Produce',
      'vegan',
      '4 wooden crates (~25 kg total)',
      40,
      'Harvested yesterday',
      new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      'Today 10:00 AM – 8:00 PM',
      '550 Valencia St',
      'Mission District',
      37.7645,
      -122.4221,
      1,
      30,
      'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80',
      'Ask for grocery manager in the loading bay.',
      1,
      1,
      'active',
      new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      new Date(Date.now() - 3 * 3600 * 1000).toISOString()
    );

    console.log('[SQLite DB] Seeded initial donations.');
  }

  console.log(`[SQLite DB] Initialized database at ${DB_PATH}`);
}
