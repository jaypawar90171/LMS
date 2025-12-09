const Service = require('../models/service.model');
const UserService = require('../models/userService.model');
const User = require('../models/user.model');

// Get all services
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find()
      .populate('createdBy', 'fullName')
      .populate('updatedBy', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving services'
    });
  }
};

// Create service
exports.createService = async (req, res) => {
  try {
    const { name, description, settings } = req.body;

    // Check if service already exists
    const existingService = await Service.findOne({ name });
    if (existingService) {
      return res.status(409).json({
        success: false,
        message: 'Service with this name already exists'
      });
    }

    const service = await Service.create({
      name,
      description,
      settings: settings || {},
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating service'
    });
  }
};

// Assign service to user
exports.assignServiceToUser = async (req, res) => {
  try {
    const { userId, serviceId, expiryDate, maxUsage, notes } = req.body;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    if (!service.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Service is not active'
      });
    }

    // Check if user already has this service
    const existingAssignment = await UserService.findOne({ userId, serviceId });
    if (existingAssignment) {
      return res.status(409).json({
        success: false,
        message: 'User already has this service assigned'
      });
    }

    const userService = await UserService.create({
      userId,
      serviceId,
      grantedBy: req.user._id,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      maxUsage: maxUsage || null,
      notes
    });

    await userService.populate([
      { path: 'userId', select: 'fullName email' },
      { path: 'serviceId', select: 'name description' },
      { path: 'grantedBy', select: 'fullName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Service assigned to user successfully',
      data: userService
    });
  } catch (error) {
    console.error('Assign service error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning service to user'
    });
  }
};

// Update service
exports.updateService = async (req, res) => {
  try {
    const { description, settings, isActive } = req.body;

    const service = await Service.findById(req.params.serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    service.description = description || service.description;
    service.settings = { ...service.settings, ...settings };
    service.isActive = isActive !== undefined ? isActive : service.isActive;
    service.updatedBy = req.user._id;

    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating service'
    });
  }
};

// Get user services
exports.getUserServices = async (req, res) => {
  try {
    const { userId } = req.params;

    const userServices = await UserService.find({ userId })
      .populate('serviceId', 'name description settings')
      .populate('grantedBy', 'fullName')
      .populate('suspendedBy', 'fullName')
      .sort({ grantedDate: -1 });

    res.status(200).json({
      success: true,
      count: userServices.length,
      data: userServices
    });
  } catch (error) {
    console.error('Get user services error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user services'
    });
  }
};

// Suspend user service
exports.suspendUserService = async (req, res) => {
  try {
    const { userServiceId } = req.params;
    const { reason } = req.body;

    const userService = await UserService.findById(userServiceId);
    if (!userService) {
      return res.status(404).json({
        success: false,
        message: 'User service assignment not found'
      });
    }

    userService.status = 'Suspended';
    userService.suspendedBy = req.user._id;
    userService.suspendedDate = new Date();
    userService.suspensionReason = reason;

    await userService.save();

    res.status(200).json({
      success: true,
      message: 'Service suspended successfully',
      data: userService
    });
  } catch (error) {
    console.error('Suspend service error:', error);
    res.status(500).json({
      success: false,
      message: 'Error suspending service'
    });
  }
};

// Reactivate user service
exports.reactivateUserService = async (req, res) => {
  try {
    const { userServiceId } = req.params;

    const userService = await UserService.findById(userServiceId);
    if (!userService) {
      return res.status(404).json({
        success: false,
        message: 'User service assignment not found'
      });
    }

    userService.status = 'Active';
    userService.suspendedBy = null;
    userService.suspendedDate = null;
    userService.suspensionReason = null;

    await userService.save();

    res.status(200).json({
      success: true,
      message: 'Service reactivated successfully',
      data: userService
    });
  } catch (error) {
    console.error('Reactivate service error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reactivating service'
    });
  }
};

// Remove user service
exports.removeUserService = async (req, res) => {
  try {
    const { userServiceId } = req.params;

    const userService = await UserService.findById(userServiceId);
    if (!userService) {
      return res.status(404).json({
        success: false,
        message: 'User service assignment not found'
      });
    }

    await userService.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Service removed from user successfully'
    });
  } catch (error) {
    console.error('Remove service error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing service from user'
    });
  }
};