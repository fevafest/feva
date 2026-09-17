require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const connectDB = require('../config/db');
const User = require('../models/User');

/**
 * Creates (or promotes) exactly one superadmin account, without touching any
 * other data in the database. Unlike seed.js, this is safe to run against a
 * real/production database — it never deletes anything, and it's idempotent
 * (running it twice just confirms the account already exists).
 *
 * Configure via env vars if you want different values:
 *   SEED_ADMIN_EMAIL, SEED_ADMIN_PHONE, SEED_ADMIN_NAME
 */

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@fevafest.co.ke';
const ADMIN_PHONE = process.env.SEED_ADMIN_PHONE || '0700000000';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'FEVA FEST Admin';

function generatePassword() {
  const random = crypto.randomBytes(9).toString('base64').replace(/[+/=]/g, '');
  return `${random}Aa1!`;
}

async function run() {
  await connectDB();

  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

  if (existing) {
    if (existing.role === 'admin' && existing.isSuperAdmin) {
      console.log(`Superadmin already exists: ${ADMIN_EMAIL}. No changes made.`);
    } else {
      existing.role = 'admin';
      existing.isSuperAdmin = true;
      await existing.save();
      console.log(`Existing account ${ADMIN_EMAIL} promoted to superadmin.`);
    }
  } else {
    const password = generatePassword();
    await User.create({
      fullName: ADMIN_NAME,
      email: ADMIN_EMAIL,
      phoneNumber: ADMIN_PHONE,
      password,
      role: 'admin',
      isSuperAdmin: true,
    });

    console.log('Superadmin account created:');
    console.log(`  Email:    ${ADMIN_EMAIL}`);
    console.log(`  Phone:    ${ADMIN_PHONE}`);
    console.log(`  Password: ${password}`);
    console.log('  Log in and change this password immediately from Admin -> Settings.');
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seeding superadmin failed:', err.message);
  process.exit(1);
});
