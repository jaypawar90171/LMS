/**
 * MongoDB Schema Validation for Library Management System
 * 
 * This script defines JSON Schema validation rules for MongoDB collections
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

// Define schema validation rules
const setupSchemaValidation = async () => {
  try {
    const db = await connectDB();

    // 1. Users collection validation
    await db.command({
      collMod: 'users',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['fullName', 'email', 'password', 'relationshipType', 'status'],
          properties: {
            fullName: {
              bsonType: 'string',
              minLength: 3,
              maxLength: 100
            },
            email: {
              bsonType: 'string',
              pattern: '^\\S+@\\S+\\.\\S+$'
            },
            password: {
              bsonType: 'string'
            },
            employeeId: {
              bsonType: ['string', 'null'],
              minLength: 3,
              maxLength: 20
            },
            phoneNumber: {
              bsonType: ['string', 'null']
            },
            dateOfBirth: {
              bsonType: ['date', 'null']
            },
            address: {
              bsonType: ['string', 'null']
            },
            relationshipType: {
              enum: ['Employee', 'Family Member']
            },
            status: {
              enum: ['Active', 'Inactive', 'Locked']
            }
          }
        }
      },
      validationLevel: 'moderate'
    });

    // 2. Roles collection validation
    await db.command({
      collMod: 'roles',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'permissions'],
          properties: {
            name: {
              bsonType: 'string',
              minLength: 3,
              maxLength: 50
            },
            description: {
              bsonType: ['string', 'null']
            },
            permissions: {
              bsonType: 'array',
              items: {
                bsonType: 'string'
              }
            }
          }
        }
      },
      validationLevel: 'moderate'
    });

    // 3. Items collection validation
    await db.command({
      collMod: 'items',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['title', 'price', 'quantity', 'categoryId', 'itemType', 'status', 'barcode'],
          properties: {
            title: {
              bsonType: 'string',
              minLength: 1
            },
            author: {
              bsonType: ['string', 'null']
            },
            isbn: {
              bsonType: ['string', 'null']
            },
            description: {
              bsonType: ['string', 'null']
            },
            publisher: {
              bsonType: ['string', 'null']
            },
            publicationYear: {
              bsonType: ['int', 'null']
            },
            price: {
              bsonType: 'number',
              minimum: 0
            },
            quantity: {
              bsonType: 'int',
              minimum: 1
            },
            availableCopies: {
              bsonType: 'int',
              minimum: 0
            },
            itemType: {
              enum: ['Book', 'Course', 'Toy']
            },
            status: {
              enum: ['Available', 'Issued', 'Misplaced', 'Under Repair', 'Lost', 'Donation Pending']
            },
            barcode: {
              bsonType: 'string'
            },
            defaultReturnPeriod: {
              bsonType: 'int',
              minimum: 1
            }
          }
        }
      },
      validationLevel: 'moderate'
    });

    // 4. Categories collection validation
    await db.command({
      collMod: 'categories',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name'],
          properties: {
            name: {
              bsonType: 'string',
              minLength: 1
            },
            description: {
              bsonType: ['string', 'null']
            },
            parentCategoryId: {
              bsonType: ['objectId', 'null']
            },
            defaultReturnPeriod: {
              bsonType: 'int',
              minimum: 1
            }
          }
        }
      },
      validationLevel: 'moderate'
    });

    // 5. Transactions collection validation
    await db.command({
      collMod: 'transactions',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['userId', 'itemId', 'issueDate', 'dueDate', 'status'],
          properties: {
            userId: {
              bsonType: 'objectId'
            },
            itemId: {
              bsonType: 'objectId'
            },
            copyId: {
              bsonType: ['objectId', 'null']
            },
            issueDate: {
              bsonType: 'date'
            },
            dueDate: {
              bsonType: 'date'
            },
            returnDate: {
              bsonType: ['date', 'null']
            },
            status: {
              enum: ['Pending', 'Issued', 'Returned', 'Overdue']
            },
            returnCondition: {
              bsonType: ['string', 'null'],
              enum: ['Good', 'Damaged', 'Lost', '']
            }
          }
        }
      },
      validationLevel: 'moderate'
    });

    process.exit(0);
  } catch (error) {
    console.error('Schema validation setup failed:', error);
    process.exit(1);
  }
};

// Run schema validation setup
setupSchemaValidation();