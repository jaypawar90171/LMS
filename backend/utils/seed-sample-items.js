require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.development') });
const mongoose = require('mongoose');
const config = require('../config/config');
const Category = require('../models/category.model');
const Item = require('../models/item.model');

async function seedSampleItems() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    const categories = await Category.find({ isActive: true });
    if (categories.length === 0) {
      console.log('No categories found. Please run seed-categories.js first');
      return;
    }

    await Item.deleteMany({});
    console.log('Cleared existing items');

    const booksCategory = categories.find(cat => cat.name === 'Books & Literature');
    const electronicsCategory = categories.find(cat => cat.name === 'Electronics & Technology');
    const toysCategory = categories.find(cat => cat.name === 'Educational Toys');
    const sportsCategory = categories.find(cat => cat.name === 'Sports & Recreation');
    const artsCategory = categories.find(cat => cat.name === 'Arts & Crafts');
    const musicCategory = categories.find(cat => cat.name === 'Music & Audio');
    const toolsCategory = categories.find(cat => cat.name === 'Tools & Equipment');
    const homeCategory = categories.find(cat => cat.name === 'Home & Garden');

    const sampleItems = [
      // Books & Literature
      {
        title: 'The Great Gatsby',
        description: 'A classic American novel by F. Scott Fitzgerald',
        itemType: 'Book',
        typeSpecificFields: {
          author: 'F. Scott Fitzgerald',
          isbn: '978-0-7432-7356-5',
          publisher: 'Scribner',
          publicationYear: 1925,
          pages: 180
        },
        quantity: 3,
        availableCopies: 2,
        categoryId: booksCategory?._id,
        barcode: 'BOOK001',
        tags: ['classic', 'american literature', 'fiction'],
        condition: 'Good'
      },
      {
        title: 'JavaScript: The Complete Guide',
        description: 'Comprehensive guide to modern JavaScript programming',
        itemType: 'Book',
        typeSpecificFields: {
          author: 'Maximilian Schwarzmüller',
          isbn: '978-1-234-56789-0',
          publisher: 'Tech Books',
          publicationYear: 2023,
          pages: 850
        },
        quantity: 2,
        availableCopies: 2,
        categoryId: booksCategory?._id,
        barcode: 'BOOK002',
        tags: ['programming', 'javascript', 'web development'],
        condition: 'New'
      },

      // Electronics & Technology
      {
        title: 'MacBook Pro 13" M2',
        description: 'Apple MacBook Pro with M2 chip for development work',
        itemType: 'Shared',
        typeSpecificFields: {
          brand: 'Apple',
          model: 'MacBook Pro 13"',
          specifications: '16GB RAM, 512GB SSD, M2 Chip',
          serialNumber: 'MBP2023001'
        },
        quantity: 2,
        availableCopies: 1,
        categoryId: electronicsCategory?._id,
        barcode: 'ELEC001',
        tags: ['laptop', 'development', 'apple', 'computer'],
        condition: 'Like New',
        defaultReturnPeriod: 7
      },
      {
        title: 'Canon EOS R6 Camera',
        description: 'Professional mirrorless camera for photography',
        itemType: 'Shared',
        typeSpecificFields: {
          brand: 'Canon',
          model: 'EOS R6',
          specifications: '20.1MP, 4K Video, Image Stabilization',
          serialNumber: 'CAM2023001'
        },
        quantity: 1,
        availableCopies: 1,
        categoryId: electronicsCategory?._id,
        barcode: 'ELEC002',
        tags: ['camera', 'photography', 'professional', 'canon'],
        condition: 'Like New',
        defaultReturnPeriod: 3
      },
      {
        title: 'iPad Pro 12.9"',
        description: 'Apple iPad Pro for digital art and productivity',
        itemType: 'Shared',
        typeSpecificFields: {
          brand: 'Apple',
          model: 'iPad Pro 12.9"',
          specifications: '128GB, Wi-Fi, M2 Chip',
          serialNumber: 'IPD2023001'
        },
        quantity: 2,
        availableCopies: 2,
        categoryId: electronicsCategory?._id,
        barcode: 'ELEC003',
        tags: ['tablet', 'digital art', 'productivity', 'apple'],
        condition: 'New'
      },

      // Educational Toys
      {
        title: 'LEGO Mindstorms Robot Kit',
        description: 'Programmable robot building kit for STEM learning',
        itemType: 'Toy',
        typeSpecificFields: {
          brand: 'LEGO',
          model: 'Mindstorms EV3',
          ageRange: '10+ years',
          pieces: 601,
          theme: 'Robotics & Programming'
        },
        quantity: 3,
        availableCopies: 3,
        categoryId: toysCategory?._id,
        barcode: 'TOY001',
        tags: ['robotics', 'programming', 'stem', 'educational'],
        condition: 'Good'
      },
      {
        title: 'Arduino Starter Kit',
        description: 'Electronics prototyping platform for beginners',
        itemType: 'Toy',
        typeSpecificFields: {
          brand: 'Arduino',
          model: 'Uno R3 Starter Kit',
          ageRange: '12+ years',
          components: ['Arduino Uno', 'Breadboard', 'LEDs', 'Sensors']
        },
        quantity: 2,
        availableCopies: 2,
        categoryId: toysCategory?._id,
        barcode: 'TOY002',
        tags: ['electronics', 'programming', 'arduino', 'maker'],
        condition: 'New'
      },

      // Sports & Recreation
      {
        title: 'Chess Set - Tournament Edition',
        description: 'Professional wooden chess set with weighted pieces',
        itemType: 'Toy',
        typeSpecificFields: {
          brand: 'ChessMaster',
          material: 'Wood',
          ageRange: '8+ years'
        },
        quantity: 4,
        availableCopies: 4,
        categoryId: sportsCategory?._id,
        barcode: 'GAME001',
        tags: ['chess', 'strategy', 'board game', 'tournament'],
        condition: 'Good'
      },
      {
        title: 'Table Tennis Set',
        description: 'Complete table tennis set with paddles and balls',
        itemType: 'Shared',
        typeSpecificFields: {
          brand: 'SportsPro',
          components: ['2 Paddles', '6 Balls', 'Net', 'Posts'],
          material: 'Wood and Rubber'
        },
        quantity: 2,
        availableCopies: 2,
        categoryId: sportsCategory?._id,
        barcode: 'SPORT001',
        tags: ['table tennis', 'ping pong', 'sports', 'recreation'],
        condition: 'Good'
      },

      // Arts & Crafts
      {
        title: 'Professional Art Supply Kit',
        description: 'Complete art kit with paints, brushes, and canvas',
        itemType: 'Shared',
        typeSpecificFields: {
          brand: 'ArtMaster',
          components: ['Acrylic Paints', 'Brushes', 'Canvas', 'Palette']
        },
        quantity: 3,
        availableCopies: 3,
        categoryId: artsCategory?._id,
        barcode: 'ART001',
        tags: ['painting', 'art supplies', 'creative', 'acrylic'],
        condition: 'Good'
      },

      // Music & Audio
      {
        title: 'Yamaha Digital Piano',
        description: '88-key weighted digital piano with multiple voices',
        itemType: 'Shared',
        typeSpecificFields: {
          brand: 'Yamaha',
          model: 'P-125',
          keys: 88,
          voices: 24
        },
        quantity: 1,
        availableCopies: 1,
        categoryId: musicCategory?._id,
        barcode: 'MUSIC001',
        tags: ['piano', 'keyboard', 'music', 'yamaha'],
        condition: 'Good',
        defaultReturnPeriod: 7
      },

      // Tools & Equipment
      {
        title: 'Cordless Drill Set',
        description: 'Professional cordless drill with bits and accessories',
        itemType: 'Shared',
        typeSpecificFields: {
          brand: 'DeWalt',
          model: 'DCD771C2',
          voltage: '20V MAX'
        },
        quantity: 2,
        availableCopies: 2,
        categoryId: toolsCategory?._id,
        barcode: 'TOOL001',
        tags: ['drill', 'power tool', 'construction', 'dewalt'],
        condition: 'Good',
        defaultReturnPeriod: 3
      },

      // Home & Garden
      {
        title: 'Pressure Washer',
        description: 'Electric pressure washer for cleaning outdoor surfaces',
        itemType: 'Shared',
        typeSpecificFields: {
          brand: 'Karcher',
          model: 'K5 Premium',
          pressure: '2000 PSI'
        },
        quantity: 1,
        availableCopies: 1,
        categoryId: homeCategory?._id,
        barcode: 'HOME001',
        tags: ['pressure washer', 'cleaning', 'outdoor', 'karcher'],
        condition: 'Like New',
        defaultReturnPeriod: 2
      }
    ];

    const validItems = sampleItems.filter(item => item.categoryId);
    const createdItems = await Item.insertMany(validItems);
    console.log(`Created ${createdItems.length} diverse sample items`);

    console.log('\nCreated Items by Category:');
    for (const category of categories) {
      const categoryItems = createdItems.filter(item => 
        item.categoryId.toString() === category._id.toString()
      );
      if (categoryItems.length > 0) {
        console.log(`\n📁 ${category.name} (${categoryItems.length} items):`);
        categoryItems.forEach(item => {
          console.log(`  - ${item.title} (${item.availableCopies}/${item.quantity} available) - ${item.itemType}`);
        });
      }
    }

    console.log(`\n✅ Successfully seeded ${createdItems.length} items across multiple categories!`);

  } catch (error) {
    console.error('Error seeding items:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

seedSampleItems();