const mongoose = require('mongoose');
const Service = require('../models/service.model');
const User = require('../models/user.model');
require('dotenv').config();

async function initializeServices() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library-management');

    // Find any user to use as creator
    const anyUser = await User.findOne();
    
    // Default services
    const defaultServices = [
      {
        name: 'Extended Borrowing',
        description: 'Allows users to borrow items for extended periods beyond the standard borrowing time.',
        isActive: true,
        settings: {
          extendedDays: 14,
          maxExtensions: 2
        },
        createdBy: anyUser?._id
      },
      {
        name: 'Priority Reservations',
        description: 'Gives users priority access to reserved items, allowing them to skip the queue.',
        isActive: true,
        settings: {
          priorityLevel: 1,
          skipQueuePosition: true
        },
        createdBy: anyUser?._id
      }
    ];

    // Create services if they don't exist
    for (const serviceData of defaultServices) {
      const existingService = await Service.findOne({ name: serviceData.name });
      if (!existingService) {
        await Service.create(serviceData);
      } else {
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing services:', error);
    process.exit(1);
  }
}

initializeServices();