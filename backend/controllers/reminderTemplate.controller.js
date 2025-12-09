const ReminderTemplate = require('../models/reminderTemplate.model');

// Get all templates
exports.getReminderTemplates = async (req, res) => {
  try {
    const templates = await ReminderTemplate.find()
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving templates'
    });
  }
};

// Create template
exports.createReminderTemplate = async (req, res) => {
  try {
    const { name, subject, content, type, variables } = req.body;
    
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    
    const template = await ReminderTemplate.create({
      name,
      subject,
      content,
      type,
      variables: variables || [],
      createdBy: req.user._id
    });
    
    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully'
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating template'
    });
  }
};

// Update template
exports.updateReminderTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, content, type, variables } = req.body;
    
    const template = await ReminderTemplate.findByIdAndUpdate(
      id,
      {
        name,
        subject,
        content,
        type,
        variables: variables || [],
        updatedBy: req.user?._id || null
      },
      { new: true }
    );
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: template,
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating template'
    });
  }
};

// Get template by ID
exports.getReminderTemplateById = async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = await ReminderTemplate.findById(templateId)
      .populate('createdBy', 'fullName');
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Get template by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving template'
    });
  }
};

// Delete template
exports.deleteReminderTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = await ReminderTemplate.findByIdAndDelete(templateId);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting template'
    });
  }
};

module.exports = {
  getReminderTemplates: exports.getReminderTemplates,
  getReminderTemplateById: exports.getReminderTemplateById,
  createReminderTemplate: exports.createReminderTemplate,
  updateReminderTemplate: exports.updateReminderTemplate,
  deleteReminderTemplate: exports.deleteReminderTemplate
};