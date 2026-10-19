/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { db, initDatabase, hashPassword, verifyPassword } from './src/server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
initDatabase();

const app = express();
const PORT = 3000;

app.use(express.json());

// ----------------------------------------------------
// Database & Authentication Endpoints
// ----------------------------------------------------

// 1. Health check & DB connection diagnostics
app.get('/api/health', (req: Request, res: Response) => {
  try {
    const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
    const donationCount = (db.prepare('SELECT COUNT(*) as c FROM donations').get() as { c: number }).c;
    const adminExists = !!db.prepare("SELECT email FROM users WHERE role = 'admin'").get();

    res.json({
      status: 'online',
      version: 'FEAST_v2.0',
      database: {
        type: 'SQLite (node:sqlite)',
        file: 'data/feast.db',
        connected: true,
        adminSeeded: adminExists,
        adminEmail: 'admin@feast.org',
        totalUsers: userCount,
        totalDonations: donationCount,
      },
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 2. Login endpoint (Supports Admin & Community Users)
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as any;
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const isValid = verifyPassword(password, user.salt, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      userType: user.user_type,
      locality: user.locality,
      role: user.role,
      avatarUrl: user.avatar_url,
      preferredContact: 'whatsapp',
    };

    res.json({
      success: true,
      user: safeUser,
      token: `feast_session_${user.id}_${Date.now()}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Sign Up / Register Endpoint
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, name, phone, userType, locality } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const newId = `usr_${Date.now()}`;
    const { hash, salt } = hashPassword(password);

    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, salt, name, phone, user_type, locality, role, avatar_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run(
      newId,
      email.toLowerCase().trim(),
      hash,
      salt,
      name.trim(),
      phone || '+1 (555) 000-0000',
      userType || 'Individual Resident',
      locality || 'Downtown',
      'user',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      new Date().toISOString()
    );

    const safeUser = {
      id: newId,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      phone: phone || '+1 (555) 000-0000',
      userType: userType || 'Individual Resident',
      locality: locality || 'Downtown',
      role: 'user',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      preferredContact: 'whatsapp',
    };

    res.status(201).json({
      success: true,
      user: safeUser,
      token: `feast_session_${newId}_${Date.now()}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Donations API
app.get('/api/donations', (req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM donations ORDER BY created_at DESC').all() as any[];
    const formatted = rows.map((r) => ({
      id: r.id,
      donorId: r.donor_id,
      donorName: r.donor_name,
      donorPhone: r.donor_phone,
      donorContactMethod: r.donor_contact_method,
      title: r.title,
      description: r.description,
      category: r.category,
      dietaryType: r.dietary_type,
      quantity: r.quantity,
      estimatedServings: r.estimated_servings,
      prepTime: r.prep_time,
      expiryDeadline: r.expiry_deadline,
      pickupWindow: r.pickup_window,
      pickupAddress: r.pickup_address,
      locality: r.locality,
      coordinates: { lat: r.lat, lng: r.lng },
      locationVerified: Boolean(r.location_verified),
      locationDiscrepancyMeters: r.location_discrepancy_meters,
      imageUrl: r.image_url,
      pickupInstructions: r.pickup_instructions,
      safetyConfirmed: Boolean(r.safety_confirmed),
      isAvailable: Boolean(r.is_available),
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Toggle availability endpoint
app.patch('/api/donations/:id/availability', (req: Request, res: Response) => {
  const { id } = req.params;
  const { isAvailable } = req.body;

  try {
    const updateStmt = db.prepare(`
      UPDATE donations
      SET is_available = ?, updated_at = ?
      WHERE id = ?
    `);
    updateStmt.run(isAvailable ? 1 : 0, new Date().toISOString(), id);

    res.json({ success: true, id, isAvailable });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// Start Full-Stack Server with Vite Middlewares in Dev
// ----------------------------------------------------
async function start() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FEAST_v2.0] Server running at http://0.0.0.0:${PORT}`);
  });
}

start();
