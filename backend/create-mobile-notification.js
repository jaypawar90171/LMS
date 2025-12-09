const mongoose = require('mongoose');
const Notification = require('./models/notification.model');
const User = require('./models/user.model');
require('dotenv').config();

async function createMobileNotification() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library-management');

    // Find any user first
    const mobileUser = await User.findOne({ 
      email: { $exists: true },
      status: 'Active'
    });
    
    if (!mobileUser) {
      const anyUser = await User.findOne({ email: { $exists: true } });
      if (!anyUser) {
        return;
      }
      
      // Create notification for any user
      const notification = await Notification.create({
        userId: anyUser._id,
        title: 'Request Approved',
        message: 'Your request for "Test Book" has been approved and is ready for pickup!',
        type: 'RequestReview',
        entityType: 'Request',
        data: { itemTitle: 'Test Book' }
      });
      
      return;
    }

    // Find the test user specifically
    const testUser = await User.findOne({ email: 'testuser@example.com' });
    if (!testUser) {
    }
    
    const targetUser = testUser || mobileUser;

    // Create a test notification for mobile user
    const notification = await Notification.create({
      userId: targetUser._id,
      title: 'Request Approved',
      message: 'Your request for "Test Book" has been approved and is ready for pickup!',
      type: 'RequestReview',
      entityType: 'Request',
      data: { itemTitle: 'Test Book' }
    });
    
    // Create another notification
    const notification2 = await Notification.create({
      userId: targetUser._id,
      title: 'Item Ready for Pickup',
      message: 'Your requested item "JavaScript Guide" is now available for pickup at the library.',
      type: 'ItemIssued',
      entityType: 'Transaction',
      data: { itemTitle: 'JavaScript Guide' }
    });


    // Verify it was created
    const count = await Notification.countDocuments({ userId: mobileUser._id });

    process.exit(0);
  } catch (error) {
    console.error('Failed to create notification:', error);
    process.exit(1);
  }
}

createMobileNotification();