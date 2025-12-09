/**
 * Script to initialize default reminder templates
 * 
 * Run with: node utils/init-reminder-templates.js
 */

require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const config = require('../config/config');
const ReminderTemplate = require('../models/reminderTemplate.model');
const ReminderRule = require('../models/reminderRule.model');
const User = require('../models/user.model');

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

// Initialize default reminder templates
const initReminderTemplates = async () => {
  try {
    
    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@library.com' });
    
    if (!adminUser) {
      throw new Error('Admin user not found. Please run init-db script first.');
    }
    
    // Read template files
    const dueDateTemplate = fs.readFileSync(
      path.join(__dirname, 'sample-templates', 'due-date-reminder.html'),
      'utf8'
    );
    
    const overdueTemplate = fs.readFileSync(
      path.join(__dirname, 'sample-templates', 'overdue-reminder.html'),
      'utf8'
    );
    
    // Create default templates
    const templates = [
      {
        name: 'Due Date Approaching Reminder',
        subject: 'Reminder: Your library item is due soon',
        content: dueDateTemplate,
        type: 'DueDateApproaching',
        variables: ['userName', 'itemTitle', 'itemBarcode', 'copyNumber', 'dueDate'],
        createdBy: adminUser._id
      },
      {
        name: 'Overdue Item Reminder',
        subject: 'OVERDUE: Please return your library item',
        content: overdueTemplate,
        type: 'ItemOverdue',
        variables: ['userName', 'itemTitle', 'itemBarcode', 'copyNumber', 'dueDate', 'daysOverdue'],
        createdBy: adminUser._id
      }
    ];
    
    // Check if templates already exist
    const existingTemplates = await ReminderTemplate.find({
      name: { $in: templates.map(t => t.name) }
    });
    
    if (existingTemplates.length > 0) {
      console.log(`${existingTemplates.length} templates already exist. Skipping...`);
    } else {
      // Insert templates
      const createdTemplates = await ReminderTemplate.insertMany(templates);
      console.log(`Created ${createdTemplates.length} default templates.`);
      
      // Create default rules
      const rules = [
        {
          name: 'Due Date Reminder - 2 Days Before',
          eventTrigger: 'DueDateApproaching',
          timing: {
            value: 2,
            unit: 'days'
          },
          medium: ['email'],
          templateId: createdTemplates.find(t => t.type === 'DueDateApproaching')._id,
          status: 'Active',
          createdBy: adminUser._id
        },
        {
          name: 'Overdue Item Reminder - 1 Day After',
          eventTrigger: 'ItemOverdue',
          timing: {
            value: 1,
            unit: 'days'
          },
          medium: ['email'],
          templateId: createdTemplates.find(t => t.type === 'ItemOverdue')._id,
          status: 'Active',
          createdBy: adminUser._id
        }
      ];
      
      const createdRules = await ReminderRule.insertMany(rules);
    }
    
    return true;
  } catch (error) {
    console.error('Initialization error:', error);
    return false;
  }
};

// Main function
const main = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize templates
    await initReminderTemplates();
    
    // Disconnect from database
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Script error:', error);
    
    // Ensure database connection is closed
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting from MongoDB:', disconnectError);
    }
    
    process.exit(1);
  }
};

// Run the script
main();