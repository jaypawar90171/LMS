const Fine = require('../models/fine.model');
const Transaction = require('../models/transaction.model');
const Item = require('../models/item.model');
const User = require('../models/user.model');

/**
 * Service for fine calculations and automated fine generation
 */
class FineService {
  /**
   * Calculate fine amount for overdue items
   * @param {Date} dueDate - The due date of the item
   * @param {Date} returnDate - The return date of the item
   * @param {Number} fineRate - The daily fine rate (default: 1)
   * @param {Number} gracePeriodDays - Grace period in days (default: 2)
   * @returns {Number} The calculated fine amount
   */
  static calculateOverdueFine(dueDate, returnDate, fineRate = 1, gracePeriodDays = 2) {
    // Calculate days overdue
    const due = new Date(dueDate);
    const returned = new Date(returnDate || new Date());
    
    // If not overdue, return 0
    if (returned <= due) {
      return 0;
    }
    
    // Calculate days difference
    const diffTime = Math.abs(returned - due);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Apply grace period
    const chargeableDays = Math.max(0, diffDays - gracePeriodDays);
    
    // Calculate fine amount
    return chargeableDays * fineRate;
  }
  
  /**
   * Calculate fine amount for damaged items
   * @param {Number} itemPrice - The price of the item
   * @param {String} damageLevel - The level of damage (minor, moderate, severe)
   * @returns {Number} The calculated fine amount
   */
  static calculateDamageFine(itemPrice, damageLevel = 'moderate') {
    // Define damage multipliers
    const damageMultipliers = {
      minor: 0.25, // 25% of item price
      moderate: 0.5, // 50% of item price
      severe: 0.75 // 75% of item price
    };
    
    const multiplier = damageMultipliers[damageLevel.toLowerCase()] || damageMultipliers.moderate;
    return itemPrice * multiplier;
  }
  
  /**
   * Calculate fine amount for lost items
   * @param {Number} itemPrice - The price of the item
   * @param {Number} processingFee - Additional processing fee (default: 5)
   * @returns {Number} The calculated fine amount
   */
  static calculateLostItemFine(itemPrice, processingFee = 5) {
    // Lost item fine is the full price plus processing fee
    return itemPrice + processingFee;
  }
  
  /**
   * Check for overdue items and generate fines
   * @param {String} adminUserId - The ID of the admin user generating the fines
   * @returns {Promise<Object>} Result of the operation
   */
  static async generateOverdueFines(adminUserId) {
    try {
      // Find all overdue transactions without fines
      const overdueTransactions = await Transaction.find({
        dueDate: { $lt: new Date() },
        returnDate: null,
        status: { $in: ['Issued', 'Overdue'] }
      })
      .populate('userId')
      .populate('itemId')
      .populate('copyId');
      
      if (overdueTransactions.length === 0) {
        return {
          success: true,
          message: 'No overdue items found',
          count: 0
        };
      }
      
      let finesCreated = 0;
      
      // Process each overdue transaction
      for (const transaction of overdueTransactions) {
        // Check if fine already exists for this transaction
        const existingFine = await Fine.findOne({
          transactionId: transaction._id,
          reason: 'Overdue'
        });
        
        if (existingFine) {
          continue; // Skip if fine already exists
        }
        
        // Update transaction status to overdue
        if (transaction.status !== 'Overdue') {
          transaction.status = 'Overdue';
          await transaction.save();
        }
        
        // Calculate fine amount
        const fineAmount = this.calculateOverdueFine(
          transaction.dueDate,
          new Date()
        );
        
        if (fineAmount <= 0) {
          continue; // Skip if no fine amount
        }
        
        // Create fine
        await Fine.create({
          userId: transaction.userId._id,
          itemId: transaction.itemId._id,
          transactionId: transaction._id,
          amount: fineAmount,
          reason: 'Overdue',
          status: 'Outstanding',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Due in 14 days
          notes: `Automatic fine for overdue item. Due date: ${transaction.dueDate.toISOString().split('T')[0]}`,
          createdBy: adminUserId
        });
        
        finesCreated++;
      }
      
      return {
        success: true,
        message: `Generated ${finesCreated} overdue fines`,
        count: finesCreated
      };
    } catch (error) {
      console.error('Generate overdue fines error:', error);
      return {
        success: false,
        message: 'Error generating overdue fines',
        error: error.message
      };
    }
  }
  
  /**
   * Get fine statistics
   * @returns {Promise<Object>} Fine statistics
   */
  static async getFineStatistics() {
    try {
      // Get all fines
      const fines = await Fine.find();
      
      // Calculate statistics
      const totalFines = fines.length;
      const totalAmount = fines.reduce((sum, fine) => sum + fine.amount, 0);
      
      const outstandingFines = fines.filter(fine => 
        fine.status === 'Outstanding' || fine.status === 'Partial Paid'
      );
      const outstandingAmount = outstandingFines.reduce((sum, fine) => {
        if (fine.status === 'Outstanding') {
          return sum + fine.amount;
        } else {
          const paidAmount = fine.payments.reduce((pSum, payment) => pSum + payment.amount, 0);
          return sum + (fine.amount - paidAmount);
        }
      }, 0);
      
      const paidFines = fines.filter(fine => fine.status === 'Paid');
      const paidAmount = paidFines.reduce((sum, fine) => sum + fine.amount, 0);
      
      const waivedFines = fines.filter(fine => fine.status === 'Waived');
      const waivedAmount = waivedFines.reduce((sum, fine) => sum + fine.amount, 0);
      
      // Get fines by reason
      const finesByReason = {
        Overdue: fines.filter(fine => fine.reason === 'Overdue').length,
        Damaged: fines.filter(fine => fine.reason === 'Damaged').length,
        Lost: fines.filter(fine => fine.reason === 'Lost').length,
        Manual: fines.filter(fine => fine.reason === 'Manual').length
      };
      
      // Get top users with most fines
      const userFines = {};
      for (const fine of fines) {
        const userId = fine.userId.toString();
        if (!userFines[userId]) {
          userFines[userId] = {
            count: 0,
            amount: 0
          };
        }
        userFines[userId].count++;
        userFines[userId].amount += fine.amount;
      }
      
      const topUsers = await Promise.all(
        Object.entries(userFines)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5)
          .map(async ([userId, data]) => {
            const user = await User.findById(userId).select('fullName email');
            return {
              user: user ? {
                id: user._id,
                name: user.fullName,
                email: user.email
              } : { id: userId, name: 'Unknown User' },
              fineCount: data.count,
              totalAmount: data.amount
            };
          })
      );
      
      return {
        success: true,
        data: {
          totalFines,
          totalAmount,
          outstandingFines: outstandingFines.length,
          outstandingAmount,
          paidFines: paidFines.length,
          paidAmount,
          waivedFines: waivedFines.length,
          waivedAmount,
          collectionRate: totalFines > 0 ? (paidFines.length / totalFines) * 100 : 0,
          finesByReason,
          topUsers
        }
      };
    } catch (error) {
      console.error('Get fine statistics error:', error);
      return {
        success: false,
        message: 'Error retrieving fine statistics',
        error: error.message
      };
    }
  }
}

module.exports = FineService;