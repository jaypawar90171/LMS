const AutomatedFineService = require('../services/automated-fine.service');

// Manual trigger for automated fine processing (for testing/admin use)
exports.triggerAutomatedProcessing = async (req, res) => {
  try {
    const results = await AutomatedFineService.manualProcess();
    
    res.status(200).json({
      success: true,
      message: 'Automated processing completed',
      data: results
    });
  } catch (error) {
    console.error('Manual automated processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error running automated processing'
    });
  }
};

// Get automation status and configuration
exports.getAutomationStatus = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        gracePeriodDays: AutomatedFineService.GRACE_PERIOD_DAYS,
        dailyFineRate: AutomatedFineService.DAILY_FINE_RATE,
        schedules: {
          fineProcessing: '9:00 AM daily',
          dueDateReminders: '8:00 AM daily'
        },
        status: 'Active'
      }
    });
  } catch (error) {
    console.error('Get automation status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving automation status'
    });
  }
};