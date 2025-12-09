require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.development') });
const mongoose = require('mongoose');
const config = require('../config/config');
const Category = require('../models/category.model');

async function seedCategories() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories - Creating generic categories for all item types...');

    // Create comprehensive categories for all item types
    const categories = [
      {
        name: 'Books & Literature',
        description: 'Books, novels, textbooks, and written materials',
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Electronics & Technology',
        description: 'Laptops, tablets, cameras, and electronic devices',
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'Educational Toys',
        description: 'Learning toys, puzzles, and educational games',
        isActive: true,
        sortOrder: 3
      },
      {
        name: 'Sports & Recreation',
        description: 'Sports equipment, games, and recreational items',
        isActive: true,
        sortOrder: 4
      },
      {
        name: 'Arts & Crafts',
        description: 'Art supplies, craft materials, and creative tools',
        isActive: true,
        sortOrder: 5
      },
      {
        name: 'Music & Audio',
        description: 'Musical instruments, audio equipment, and music resources',
        isActive: true,
        sortOrder: 6
      },
      {
        name: 'Tools & Equipment',
        description: 'Tools, machinery, and professional equipment',
        isActive: true,
        sortOrder: 7
      },
      {
        name: 'Home & Garden',
        description: 'Home appliances, gardening tools, and household items',
        isActive: true,
        sortOrder: 8
      }
    ];

    const createdCategories = await Category.insertMany(categories);
    console.log(`Created ${createdCategories.length} categories`);

    // Create comprehensive subcategories
    const subcategories = [
      // Books & Literature subcategories
      {
        name: 'Fiction',
        description: 'Novels, short stories, and fictional works',
        parentCategoryId: createdCategories[0]._id,
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Non-Fiction',
        description: 'Educational, biographical, and factual books',
        parentCategoryId: createdCategories[0]._id,
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'Textbooks',
        description: 'Academic and educational textbooks',
        parentCategoryId: createdCategories[0]._id,
        isActive: true,
        sortOrder: 3
      },
      // Electronics & Technology subcategories
      {
        name: 'Computers & Laptops',
        description: 'Desktop computers, laptops, and accessories',
        parentCategoryId: createdCategories[1]._id,
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Mobile Devices',
        description: 'Smartphones, tablets, and mobile accessories',
        parentCategoryId: createdCategories[1]._id,
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'Audio/Video Equipment',
        description: 'Cameras, projectors, and AV equipment',
        parentCategoryId: createdCategories[1]._id,
        isActive: true,
        sortOrder: 3
      },
      // Educational Toys subcategories
      {
        name: 'STEM Toys',
        description: 'Science, technology, engineering, and math toys',
        parentCategoryId: createdCategories[2]._id,
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Building Blocks',
        description: 'LEGO, blocks, and construction toys',
        parentCategoryId: createdCategories[2]._id,
        isActive: true,
        sortOrder: 2
      },
      // Sports & Recreation subcategories
      {
        name: 'Indoor Games',
        description: 'Board games, card games, and indoor activities',
        parentCategoryId: createdCategories[3]._id,
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Outdoor Equipment',
        description: 'Sports equipment and outdoor gear',
        parentCategoryId: createdCategories[3]._id,
        isActive: true,
        sortOrder: 2
      }
    ];

    const createdSubcategories = await Category.insertMany(subcategories);
    console.log(`Created ${createdSubcategories.length} subcategories`);

    console.log('\n✅ Generic categories seeded successfully!');
    
    // List all categories with hierarchy
    const allCategories = await Category.find({}).populate('parentCategoryId');
    console.log('\nCategory Hierarchy:');
    
    // Show parent categories first
    const parentCategories = allCategories.filter(cat => !cat.parentCategoryId);
    parentCategories.forEach(parent => {
      console.log(`📁 ${parent.name} - ${parent.description}`);
      
      // Show subcategories under each parent
      const subcats = allCategories.filter(cat => cat.parentCategoryId && cat.parentCategoryId._id.toString() === parent._id.toString());
      subcats.forEach(sub => {
        console.log(`  └── ${sub.name} - ${sub.description}`);
      });
    });
    
    console.log('\n💡 You can now add more subcategories via the Categories UI!');

  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

seedCategories();