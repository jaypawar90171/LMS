require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.development') });
const mongoose = require('mongoose');
const config = require('../config/config');
const { seedPermissions } = require('../seeders/permissions.seeder');

async function runPermissionSeeder() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    await seedPermissions();
    
    console.log('✅ Permissions seeded successfully!');
  } catch (error) {
    console.error('Error seeding permissions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

runPermissionSeeder();