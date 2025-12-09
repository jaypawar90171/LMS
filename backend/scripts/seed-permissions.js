const mongoose = require('mongoose');
const { seedPermissions } = require('../seeders/permissions.seeder');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library-management');
    console.log('Connected to MongoDB');
    
    await seedPermissions();
    console.log('Permissions seeded successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding permissions:', error);
    process.exit(1);
  }
};

seedData();