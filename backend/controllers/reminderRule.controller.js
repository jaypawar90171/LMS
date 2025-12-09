const ReminderRule = require('../models/reminderRule.model');
const ReminderTemplate = require('../models/reminderTemplate.model');

// Get all reminder rules
exports.getReminderRules = async (req, res) => {
  try {
    const rules = await ReminderRule.find()
      .populate('templateId', 'name subject type')
      .populate('createdBy', 'fullName')
      .populate('updatedBy', 'fullName')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: rules.length,
      data: rules
    });
  } catch (error) {
    console.error('Get reminder rules error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving reminder rules'
    });
  }
};

// Get reminder rule by ID
exports.getReminderRuleById = async (req, res) => {
  try {
    const rule = await ReminderRule.findById(req.params.ruleId)
      .populate('templateId')
      .populate('createdBy', 'fullName')
      .populate('updatedBy', 'fullName');
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Reminder rule not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Get reminder rule by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving reminder rule'
    });
  }
};

// Create new reminder rule
exports.createReminderRule = async (req, res) => {
  try {
    const { name, eventTrigger, timing, medium, templateId, status } = req.body;
    
    // Validate template
    const template = await ReminderTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    // Check if template type matches event trigger
    if (template.type !== eventTrigger && template.type !== 'General') {
      return res.status(400).json({
        success: false,
        message: `Template type (${template.type}) does not match event trigger (${eventTrigger})`
      });
    }
    
    // Create rule
    const rule = await ReminderRule.create({
      name,
      eventTrigger,
      timing,
      medium,
      templateId,
      status: status || 'Active',
      createdBy: req.user._id
    });
    
    res.status(201).json({
      success: true,
      message: 'Reminder rule created successfully',
      data: rule
    });
  } catch (error) {
    console.error('Create reminder rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating reminder rule'
    });
  }
};

// Update reminder rule
exports.updateReminderRule = async (req, res) => {
  try {
    const { name, eventTrigger, timing, medium, templateId, status } = req.body;
    
    // Find rule
    const rule = await ReminderRule.findById(req.params.ruleId);
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Reminder rule not found'
      });
    }
    
    // Validate template if changed
    if (templateId && templateId !== rule.templateId.toString()) {
      const template = await ReminderTemplate.findById(templateId);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }
      
      // Check if template type matches event trigger
      const triggerToCheck = eventTrigger || rule.eventTrigger;
      if (template.type !== triggerToCheck && template.type !== 'General') {
        return res.status(400).json({
          success: false,
          message: `Template type (${template.type}) does not match event trigger (${triggerToCheck})`
        });
      }
    }
    
    // Update rule
    rule.name = name || rule.name;
    rule.eventTrigger = eventTrigger || rule.eventTrigger;
    
    if (timing) {
      rule.timing = {
        value: timing.value !== undefined ? timing.value : rule.timing.value,
        unit: timing.unit || rule.timing.unit
      };
    }
    
    if (medium) {
      rule.medium = medium;
    }
    
    if (templateId) {
      rule.templateId = templateId;
    }
    
    if (status) {
      rule.status = status;
    }
    
    rule.updatedBy = req.user._id;
    
    await rule.save();
    
    res.status(200).json({
      success: true,
      message: 'Reminder rule updated successfully',
      data: rule
    });
  } catch (error) {
    console.error('Update reminder rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating reminder rule'
    });
  }
};

// Delete reminder rule
exports.deleteReminderRule = async (req, res) => {
  try {
    // Find rule
    const rule = await ReminderRule.findById(req.params.ruleId);
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Reminder rule not found'
      });
    }
    
    // Delete rule
    await rule.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Reminder rule deleted successfully'
    });
  } catch (error) {
    console.error('Delete reminder rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting reminder rule'
    });
  }
};