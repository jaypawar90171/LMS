const mongoose = require('mongoose');
require('dotenv').config();

const addIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library-management');

    const db = mongoose.connection.db;

    // User collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ phoneNumber: 1 });
    await db.collection('users').createIndex({ status: 1 });
    await db.collection('users').createIndex({ roles: 1 });

    // Request collection indexes
    await db.collection('requests').createIndex({ userId: 1 });
    await db.collection('requests').createIndex({ status: 1 });
    await db.collection('requests').createIndex({ userId: 1, status: 1 });

    // ItemRequest collection indexes
    await db.collection('itemrequests').createIndex({ requestedBy: 1 });
    await db.collection('itemrequests').createIndex({ status: 1 });

    // Transaction collection indexes
    await db.collection('transactions').createIndex({ userId: 1 });
    await db.collection('transactions').createIndex({ status: 1 });
    await db.collection('transactions').createIndex({ userId: 1, returnDate: 1 });

    // Notification collection indexes
    await db.collection('notifications').createIndex({ userId: 1 });
    await db.collection('notifications').createIndex({ read: 1 });
    await db.collection('notifications').createIndex({ userId: 1, read: 1 });

    process.exit(0);
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
};

addIndexes();