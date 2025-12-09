/**
 * Database Migration Script for Library Management System
 * 
 * This script creates collections and indexes for MongoDB
 */

const mongoose = require('mongoose');
const config = require('../config/config');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    return mongoose.connection;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Create collections and indexes
const migrateDB = async () => {
  try {
    const db = await connectDB();

    // 1. Create users collection with indexes
    await db.createCollection('users');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ employeeId: 1 }, { sparse: true, unique: true });
    await db.collection('users').createIndex({ status: 1 });
    await db.collection('users').createIndex({ relationshipType: 1 });
    await db.collection('users').createIndex({ employeeReference: 1 });
    await db.collection('users').createIndex({ resetPasswordToken: 1 }, { sparse: true });

    // 2. Create roles collection with indexes
    await db.createCollection('roles');
    await db.collection('roles').createIndex({ name: 1 }, { unique: true });

    // 3. Create tokens collection with indexes
    await db.createCollection('tokens');
    await db.collection('tokens').createIndex({ userId: 1 });
    await db.collection('tokens').createIndex({ token: 1 }, { unique: true });
    await db.collection('tokens').createIndex({ expires: 1 }, { expireAfterSeconds: 0 });

    // 4. Create items collection with indexes
    await db.createCollection('items');
    await db.collection('items').createIndex({ title: 1 });
    await db.collection('items').createIndex({ barcode: 1 }, { unique: true });
    await db.collection('items').createIndex({ isbn: 1 }, { sparse: true });
    await db.collection('items').createIndex({ categoryId: 1 });
    await db.collection('items').createIndex({ subcategoryId: 1 });
    await db.collection('items').createIndex({ itemType: 1 });
    await db.collection('items').createIndex({ status: 1 });
    await db.collection('items').createIndex({ tags: 1 });

    // 5. Create itemCopies collection with indexes
    console.log('Setting up itemCopies collection...');
    await db.createCollection('itemCopies');
    await db.collection('itemCopies').createIndex({ itemId: 1 });
    await db.collection('itemCopies').createIndex({ barcode: 1 }, { unique: true });
    await db.collection('itemCopies').createIndex({ status: 1 });
    await db.collection('itemCopies').createIndex({ itemId: 1, copyNumber: 1 }, { unique: true });

    // 6. Create categories collection with indexes
    console.log('Setting up categories collection...');
    await db.createCollection('categories');
    await db.collection('categories').createIndex({ name: 1, parentCategoryId: 1 }, { unique: true });
    await db.collection('categories').createIndex({ parentCategoryId: 1 });

    // 7. Create transactions collection with indexes
    console.log('Setting up transactions collection...');
    await db.createCollection('transactions');
    await db.collection('transactions').createIndex({ userId: 1 });
    await db.collection('transactions').createIndex({ itemId: 1 });
    await db.collection('transactions').createIndex({ copyId: 1 });
    await db.collection('transactions').createIndex({ status: 1 });
    await db.collection('transactions').createIndex({ issueDate: 1 });
    await db.collection('transactions').createIndex({ dueDate: 1 });
    await db.collection('transactions').createIndex({ returnDate: 1 });

    // 8. Create fines collection with indexes
    console.log('Setting up fines collection...');
    await db.createCollection('fines');
    await db.collection('fines').createIndex({ userId: 1 });
    await db.collection('fines').createIndex({ itemId: 1 });
    await db.collection('fines').createIndex({ transactionId: 1 });
    await db.collection('fines').createIndex({ status: 1 });
    await db.collection('fines').createIndex({ reason: 1 });
    await db.collection('fines').createIndex({ dueDate: 1 });

    // 9. Create donations collection with indexes
    console.log('Setting up donations collection...');
    await db.createCollection('donations');
    await db.collection('donations').createIndex({ userId: 1 });
    await db.collection('donations').createIndex({ status: 1 });
    await db.collection('donations').createIndex({ reviewDate: 1 });

    // 10. Create reminders collection with indexes (for reminder rules)
    console.log('Setting up reminders collection...');
    await db.createCollection('reminders');
    await db.collection('reminders').createIndex({ eventTrigger: 1 });
    await db.collection('reminders').createIndex({ status: 1 });

    // 11. Create reminderTemplates collection with indexes
    console.log('Setting up reminderTemplates collection...');
    await db.createCollection('reminderTemplates');
    await db.collection('reminderTemplates').createIndex({ name: 1 }, { unique: true });
    await db.collection('reminderTemplates').createIndex({ type: 1 });

    // 12. Create queues collection with indexes (for item queues)
    console.log('Setting up queues collection...');
    await db.createCollection('queues');
    await db.collection('queues').createIndex({ itemId: 1 });
    await db.collection('queues').createIndex({ userId: 1 });
    await db.collection('queues').createIndex({ priority: 1 });
    await db.collection('queues').createIndex({ itemId: 1, userId: 1 }, { unique: true });

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
migrateDB();