const mongoose = require('mongoose');
const config = require('../config/config');
const Transaction = require('../models/transaction.model');

async function updateTransactionIds() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);

    // Get all transactions without transactionId
    const transactions = await Transaction.find({ 
      $or: [
        { transactionId: { $exists: false } },
        { transactionId: null },
        { transactionId: '' }
      ]
    }).sort({ createdAt: 1 });


    const year = new Date().getFullYear();
    
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      const transactionNumber = i + 1;
      const transactionId = `TXN${year}${String(transactionNumber).padStart(6, '0')}`;
      
      await Transaction.findByIdAndUpdate(transaction._id, {
        transactionId: transactionId
      });
      
    }

    process.exit(0);
  } catch (error) {
    console.error('Error updating transaction IDs:', error);
    process.exit(1);
  }
}

updateTransactionIds();