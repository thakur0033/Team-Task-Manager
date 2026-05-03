/**
 * Seed Script — Creates default Admin accounts
 * Run: node seed.js
 *
 * Default Admins:
 *  1. admin@test.com  /  123456
 *  2. admin2@test.com /  admin@1234
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const admins = [
  {
    name: 'Admin',
    email: 'admin@test.com',
    password: '123456',
    role: 'Admin',
  },
  {
    name: 'Admin 2',
    email: 'admin2@test.com',
    password: 'admin@1234',
    role: 'Admin',
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    for (const admin of admins) {
      const existing = await User.findOne({ email: admin.email });
      if (existing) {
        console.log(`⚠️  Admin already exists: ${admin.email} — skipping`);
        continue;
      }
      await User.create(admin); // password is auto-hashed via pre-save hook
      console.log(`✅ Admin created: ${admin.email}  |  password: ${admin.password}`);
    }

    console.log('\n🎉 Seeding complete!');
    console.log('─────────────────────────────────────');
    console.log('  Email            | Password');
    console.log('─────────────────────────────────────');
    console.log('  admin@test.com   | 123456');
    console.log('  admin2@test.com  | admin@1234');
    console.log('─────────────────────────────────────');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seed();
