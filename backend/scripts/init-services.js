const mongoose = require('mongoose');
const Service = require('../models/service.model');
const User = require('../models/user.model');
require('dotenv').config({ path: '.env.development' });

async function initializeServices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Find an admin user to set as creator
    const adminUser = await User.findOne({ 
      roles: { $exists: true, $ne: [] } 
    });

    if (!adminUser) {
      return;
    }

    // Create Extended Borrowing service
    const extendedBorrowingExists = await Service.findOne({ name: 'Extended Borrowing' });
    if (!extendedBorrowingExists) {
      await Service.create({
        name: 'Extended Borrowing',
        description: 'Allows users to extend their borrowing period beyond the standard duration',
        isActive: true,
        settings: {
          extendedDays: 14, // Additional 14 days
          maxExtensions: 2  // Maximum 2 extensions per item
        },
        createdBy: adminUser._id
      });
    } else {
      console.log('Extended Borrowing service already exists');
    }

    // Create Priority Reservations service
    const priorityReservationsExists = await Service.findOne({ name: 'Priority Reservations' });
    if (!priorityReservationsExists) {
      await Service.create({
        name: 'Priority Reservations',
        description: 'Allows users to make priority reservations and skip queue positions',
        isActive: true,
        settings: {
          priorityLevel: 1,      // Higher priority level
          skipQueuePosition: true // Can skip queue
        },
        createdBy: adminUser._id
      });
    } else {
      console.log('Priority Reservations service already exists');
    }

  } catch (error) {
    console.error('Error initializing services:', error);
  } finally {
    await mongoose.disconnect();
  }
}

initializeServices();