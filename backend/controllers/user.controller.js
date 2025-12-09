const User = require('../models/user.model');
const Role = require('../models/role.model');
const Transaction = require('../models/transaction.model');
const Fine = require('../models/fine.model');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('../utils/email');
const NotificationService = require('../services/notification.service');

// Get all users with filtering, sorting, and pagination
exports.getUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 10, sortBy = 'fullName', sortOrder = 'asc' } = req.query;
    
    // Sanitize and validate inputs
    const allowedSortFields = ['fullName', 'email', 'employeeId', 'phoneNumber', 'status', 'createdAt'];
    const allowedStatuses = ['Active', 'Inactive', 'Locked', 'Pending'];
    const sanitizedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'fullName';
    const sanitizedSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'asc';
    
    // Build query
    const query = {};
    
    // Add search filter with sanitization
    if (search && typeof search === 'string') {
      const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { fullName: { $regex: sanitizedSearch, $options: 'i' } },
        { email: { $regex: sanitizedSearch, $options: 'i' } },
        { employeeId: { $regex: sanitizedSearch, $options: 'i' } },
        { phoneNumber: { $regex: sanitizedSearch, $options: 'i' } }
      ];
    }
    
    // Add role filter with validation
    if (role && typeof role === 'string') {
      const roleObj = await Role.findOne({ name: { $eq: role } });
      if (roleObj) {
        query.roles = roleObj._id;
      }
    }
    
    // Add status filter with validation
    if (status && allowedStatuses.includes(status)) {
      query.status = { $eq: status };
    }
    
    // Calculate pagination
    const skip = (Math.max(1, parseInt(page) || 1) - 1) * parseInt(limit);
    
    // Determine sort order
    const sort = {};
    sort[sanitizedSortBy] = sanitizedSortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination and sorting (optimized)
    const users = await User.find(query)
      .populate('roles', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: users.length,
      total: totalUsers,
      totalPages: Math.ceil(totalUsers / parseInt(limit)),
      currentPage: Math.max(1, parseInt(page) || 1),
      data: users.map(user => ({
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        employeeId: user.employeeId,
        phoneNumber: user.phoneNumber,
        relationshipType: user.relationshipType,
        roles: user.roles.map(role => role.name),
        status: user.status,
        approvalStatus: user.approvalStatus,
        lastLogin: user.lastLogin
      }))
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving users'
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('roles', 'name')
      .populate('employeeReference', 'fullName email');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        employeeId: user.employeeId,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        relationshipType: user.relationshipType,
        employeeReference: user.employeeReference ? {
          id: user.employeeReference._id,
          fullName: user.employeeReference.fullName,
          email: user.employeeReference.email
        } : null,
        roles: user.roles.map(role => ({
          id: role._id,
          name: role.name
        })),
        permissionOverrides: user.permissionOverrides || { granted: [], revoked: [] },
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user'
    });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  try {
    const {
      fullName,
      employeeId,
      email,
      phoneNumber,
      dateOfBirth,
      address,
      relationshipType,
      employeeReference,
      roles,
      permissionOverrides
    } = req.body;
    

    // Validate requesting user exists and has proper authorization
    const requestingUser = await User.findById(req.user._id);
    if (!requestingUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user session'
      });
    }
    
    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    // Check if employeeId already exists (if provided)
    if (employeeId) {
      const employeeIdExists = await User.findOne({ employeeId });
      if (employeeIdExists) {
        return res.status(409).json({
          success: false,
          message: 'Employee ID already exists'
        });
      }
    }
    
    // Validate employee reference for family members
    if (relationshipType === 'Family Member') {
      if (!employeeReference) {
        return res.status(400).json({
          success: false,
          message: 'Employee reference is required for family members'
        });
      }
      
      const employee = await User.findById(employeeReference);
      if (!employee || employee.relationshipType !== 'Employee' || employee.status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: 'Invalid employee reference. Must be an active employee.'
        });
      }
    }
    
    // Prevent creating multiple admin accounts
    if (roles && roles.length > 0) {
      const foundRoles = await Role.find({ _id: { $in: roles } });
      const superAdminRole = foundRoles.find(role => role.name === 'superAdmin');
      
      if (superAdminRole) {
        const existingAdmin = await User.findOne({
          roles: superAdminRole._id,
          status: { $ne: 'Inactive' }
        });
        
        if (existingAdmin) {
          return res.status(409).json({
            success: false,
            message: 'Admin account already exists. Only one admin is allowed.'
          });
        }
      }
    }
    
    // Validate roles and assign default employee role
    const roleIds = [];
    if (roles && roles.length > 0) {
      const foundRoles = await Role.find({ _id: { $in: roles } });
      if (foundRoles.length !== roles.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more roles not found'
        });
      }
      roleIds.push(...foundRoles.map(role => role._id));
    } else {
      // Assign default employee role (admin creates employees only)
      const defaultRole = await Role.findOne({ name: 'employee' });
      
      if (defaultRole) {
        roleIds.push(defaultRole._id);
      }
    }
    
    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    
    // Create user (admin creates employees only)
    const user = await User.create({
      fullName,
      employeeId,
      email,
      password: tempPassword, // Will be hashed by pre-save hook
      phoneNumber,
      dateOfBirth,
      address,
      relationshipType: 'Employee', // Admin can only create employees
      roles: roleIds,
      status: 'Active',
      requirePasswordChange: true, // Force password change on first login
      permissionOverrides: permissionOverrides || { granted: [], revoked: [] },
      createdBy: requestingUser._id
    });
    
    // Send welcome email with temporary password (async)
    setImmediate(() => {
      const message = `Welcome to the Library Management System! Email: ${email}, Temporary Password: ${tempPassword}. Please log in and change your password.`;
      sendEmail({
        email: user.email,
        subject: 'Welcome to Library Management System',
        message
      }).catch(console.error);
    });
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        tempPassword // Only returned once during creation
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const {
      fullName,
      employeeId,
      email,
      phoneNumber,
      dateOfBirth,
      address,
      relationshipType,
      employeeReference,
      roles,
      permissionOverrides
    } = req.body;
    
    // Find user
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if email already exists (if changed)
    if (email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }
    
    // Check if employeeId already exists (if changed and provided)
    if (employeeId && employeeId !== user.employeeId) {
      const employeeIdExists = await User.findOne({ employeeId });
      if (employeeIdExists) {
        return res.status(409).json({
          success: false,
          message: 'Employee ID already exists'
        });
      }
    }
    
    // Validate employee reference for family members
    if (relationshipType === 'Family Member') {
      if (!employeeReference) {
        return res.status(400).json({
          success: false,
          message: 'Employee reference is required for family members'
        });
      }
      
      const employee = await User.findById(employeeReference);
      if (!employee || employee.relationshipType !== 'Employee' || employee.status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: 'Invalid employee reference. Must be an active employee.'
        });
      }
    }
    
    // Validate roles
    const roleIds = [];
    if (roles && roles.length > 0) {
      const foundRoles = await Role.find({ _id: { $in: roles } });
      if (foundRoles.length !== roles.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more roles not found'
        });
      }
      roleIds.push(...foundRoles.map(role => role._id));
    }
    
    // Update user
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;
    user.address = address || user.address;
    
    // Only update relationship-specific fields if relationship type changes
    if (relationshipType && relationshipType !== user.relationshipType) {
      user.relationshipType = relationshipType;
      
      if (relationshipType === 'Employee') {
        user.employeeId = employeeId;
        user.employeeReference = undefined;
      } else if (relationshipType === 'Family Member') {
        user.employeeId = undefined;
        user.employeeReference = employeeReference;
      }
    } else {
      // Update fields based on current relationship type
      if (user.relationshipType === 'Employee' && employeeId) {
        user.employeeId = employeeId;
      } else if (user.relationshipType === 'Family Member' && employeeReference) {
        user.employeeReference = employeeReference;
      }
    }
    
    // Update roles if provided
    if (roles && roles.length > 0) {
      user.roles = roleIds;
    }
    
    // Update permission overrides if provided
    if (permissionOverrides) {
      user.permissionOverrides = permissionOverrides;
    }
    
    // Validate requesting user exists and has proper authorization
    const requestingUser = await User.findById(req.user._id);
    if (!requestingUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user session'
      });
    }
    
    user.updatedBy = requestingUser._id;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
};

// Update user status (activate/deactivate)
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate requesting user exists and has proper authorization
    const requestingUser = await User.findById(req.user._id);
    if (!requestingUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user session'
      });
    }
    
    // Validate status
    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Active or Inactive.'
      });
    }
    
    // Find user
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // If deactivating an employee, check for outstanding items and fines
    if (status === 'Inactive' && user.relationshipType === 'Employee' && user.status === 'Active') {
      // Check for outstanding items
      const outstandingItems = await Transaction.countDocuments({
        userId: user._id,
        returnDate: null
      });
      
      // Check for outstanding fines
      const outstandingFines = await Fine.countDocuments({
        userId: user._id,
        status: 'Outstanding'
      });
      
      if (outstandingItems > 0 || outstandingFines > 0) {
        return res.status(409).json({
          success: false,
          message: `Cannot deactivate user. User has ${outstandingItems} outstanding items and ${outstandingFines} unpaid fines.`
        });
      }
    }
    
    // Update status
    user.status = status;
    user.updatedBy = requestingUser._id;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `User ${status === 'Active' ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user._id,
        fullName: user.fullName,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status'
    });
  }
};

// Reset user password (admin-initiated)
exports.resetUserPassword = async (req, res) => {
  try {
    // Validate requesting user exists and has proper authorization
    const requestingUser = await User.findById(req.user._id);
    if (!requestingUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user session'
      });
    }
    
    // Find user
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    
    // Update user password
    user.password = tempPassword; // Will be hashed by pre-save hook
    user.requirePasswordChange = true; // Force password change on next login
    user.updatedBy = requestingUser._id;
    
    await user.save();
    
    // Send password reset email (async)
    setImmediate(() => {
      const message = `Your password has been reset. New temporary password: ${tempPassword}. Please log in and change your password.`;
      sendEmail({
        email: user.email,
        subject: 'Password Reset Notification',
        message
      }).catch(console.error);
    });
    
    res.status(200).json({
      success: true,
      message: 'User password reset successfully',
      data: {
        id: user._id,
        fullName: user.fullName,
        tempPassword // Only returned once during reset
      }
    });
  } catch (error) {
    console.error('Reset user password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting user password'
    });
  }
};

// Get pending user approvals
exports.getPendingApprovals = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const currentUser = await User.findById(req.user._id).populate('roles');
    const isAdminOrSuperAdmin = currentUser.roles.some(role => 
      ['admin', 'superAdmin'].includes(role.name)
    );
    
    if (!isAdminOrSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const skip = (Math.max(1, parseInt(page) || 1) - 1) * parseInt(limit);
    
    const pendingUsers = await User.find({ approvalStatus: 'Pending' })
      .populate('roles', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const totalPending = await User.countDocuments({ approvalStatus: 'Pending' });
    
    res.status(200).json({
      success: true,
      count: pendingUsers.length,
      total: totalPending,
      totalPages: Math.ceil(totalPending / parseInt(limit)),
      currentPage: Math.max(1, parseInt(page) || 1),
      data: pendingUsers.map(user => ({
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        employeeId: user.employeeId,
        phoneNumber: user.phoneNumber,
        relationshipType: user.relationshipType,
        approvalStatus: user.approvalStatus,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving pending approvals'
    });
  }
};

// Approve user account
exports.approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate requesting user exists and has proper authorization
    const requestingUser = await User.findById(req.user._id).populate('roles');
    if (!requestingUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user session'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.approvalStatus !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'User account is not pending approval'
      });
    }
    
    user.approvalStatus = 'Approved';
    user.status = 'Active';
    user.approvedBy = requestingUser._id;
    user.approvedAt = new Date();
    
    await user.save();

    // Send in-app notification (async)
    setImmediate(() => {
      NotificationService.sendNotification({
        userId: user._id,
        title: 'Account Approved',
        message: 'Congratulations! Your account has been approved. You can now access the library system.',
        type: 'UserApproval',
        entityType: 'User',
        entityId: user._id
      }).catch(console.error);
    });
    
    const message = `
      Congratulations! Your account has been approved.
      
      You can now log in to the Library Management System using your credentials.
      
      Welcome to the team!
    `;
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'Account Approved - Library Management System',
        message
      });
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
    }
    
    res.status(200).json({
      success: true,
      message: 'User account approved successfully',
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        approvalStatus: user.approvalStatus,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving user account'
    });
  }
};

// Reject user account
exports.rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    // Validate requesting user exists and has proper authorization
    const requestingUser = await User.findById(req.user._id).populate('roles');
    if (!requestingUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user session'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.approvalStatus !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'User account is not pending approval'
      });
    }
    
    user.approvalStatus = 'Rejected';
    user.status = 'Inactive';
    user.rejectionReason = reason;
    user.approvedBy = requestingUser._id;
    user.approvedAt = new Date();
    
    await user.save();

    // Send in-app notification (async)
    setImmediate(() => {
      NotificationService.sendNotification({
        userId: user._id,
        title: 'Account Rejected',
        message: `Your account registration has been rejected. ${reason ? `Reason: ${reason}` : 'Please contact the administrator for more information.'}`,
        type: 'System',
        entityType: 'User',
        entityId: user._id
      }).catch(console.error);
    });
    
    const message = `
      We regret to inform you that your account registration has been rejected.
      
      ${reason ? `Reason: ${reason}` : ''}
      
      If you believe this is an error, please contact the administrator.
    `;
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'Account Registration Rejected - Library Management System',
        message
      });
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
    }
    
    res.status(200).json({
      success: true,
      message: 'User account rejected successfully',
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        approvalStatus: user.approvalStatus,
        rejectionReason: user.rejectionReason
      }
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting user account'
    });
  }
};

// Check phone number uniqueness
exports.checkPhoneUniqueness = async (req, res) => {
  try {
    const { phone, excludeId } = req.query;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    const query = { phoneNumber: phone };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const existingUser = await User.findOne(query);
    
    res.status(200).json({
      success: true,
      exists: !!existingUser
    });
  } catch (error) {
    console.error('Check phone uniqueness error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking phone uniqueness'
    });
  }
};

// Unlock user account
exports.unlockUserAccount = async (req, res) => {
  try {
    // Validate requesting user exists and has proper authorization
    const requestingUser = await User.findById(req.user._id);
    if (!requestingUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user session'
      });
    }
    
    // Find user
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if account is locked
    if (user.status !== 'Locked') {
      return res.status(400).json({
        success: false,
        message: 'User account is not locked'
      });
    }
    
    // Unlock account
    user.status = 'Active';
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.updatedBy = requestingUser._id;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'User account unlocked successfully',
      data: {
        id: user._id,
        fullName: user.fullName,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Unlock user account error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unlocking user account'
    });
  }
};

// Delete user permanently
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check for outstanding items and fines in parallel
    const [outstandingItems, outstandingFines] = await Promise.all([
      Transaction.countDocuments({
        userId: user._id,
        returnDate: null
      }),
      Fine.countDocuments({
        userId: user._id,
        status: 'Outstanding'
      })
    ]);
    
    if (outstandingItems > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete user. User has ${outstandingItems} outstanding items that must be returned first.`
      });
    }
    
    if (outstandingFines > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete user. User has ${outstandingFines} unpaid fines that must be resolved first.`
      });
    }
    
    // Store user info for response
    const deletedUserInfo = {
      id: user._id,
      fullName: user.fullName,
      email: user.email
    };
    
    // Delete user permanently
    await User.findByIdAndDelete(userId);
    
    res.status(200).json({
      success: true,
      message: 'User deleted permanently',
      data: deletedUserInfo
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
};