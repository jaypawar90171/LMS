const User = require('../models/user.model');
const Role = require('../models/role.model');

// Assign roles to multiple users
exports.assignRolesToUsers = async (req, res) => {
  try {
    const { roleId, userIds } = req.body;
    
    // Validate role
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Validate users
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more users not found'
      });
    }
    
    // Update users
    const updatePromises = users.map(async (user) => {
      // Check if user already has this role
      if (!user.roles.includes(role._id)) {
        user.roles.push(role._id);
        user.updatedBy = req.user._id;
        return user.save();
      }
      return user;
    });
    
    await Promise.all(updatePromises);
    
    res.status(200).json({
      success: true,
      message: `Role "${role.name}" assigned to ${users.length} users successfully`,
      data: {
        role: {
          id: role._id,
          name: role.name
        },
        assignedUsers: users.map(user => ({
          id: user._id,
          fullName: user.fullName,
          email: user.email
        }))
      }
    });
  } catch (error) {
    console.error('Assign roles to users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning roles to users'
    });
  }
};

// Remove roles from multiple users
exports.removeRolesFromUsers = async (req, res) => {
  try {
    const { roleId, userIds } = req.body;
    
    // Validate role
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Validate users
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more users not found'
      });
    }
    
    // Update users
    const updatePromises = users.map(async (user) => {
      // Remove role from user
      user.roles = user.roles.filter(r => !r.equals(role._id));
      
      // Ensure user has at least one role
      if (user.roles.length === 0) {
        // Assign default role based on relationship type
        const defaultRole = await Role.findOne({ 
          name: user.relationshipType === 'Employee' ? 'employee' : 'familyMember' 
        });
        
        if (defaultRole) {
          user.roles.push(defaultRole._id);
        }
      }
      
      user.updatedBy = req.user._id;
      return user.save();
    });
    
    await Promise.all(updatePromises);
    
    res.status(200).json({
      success: true,
      message: `Role "${role.name}" removed from users successfully`,
      data: {
        role: {
          id: role._id,
          name: role.name
        },
        affectedUsers: users.map(user => ({
          id: user._id,
          fullName: user.fullName,
          email: user.email
        }))
      }
    });
  } catch (error) {
    console.error('Remove roles from users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing roles from users'
    });
  }
};

// Get users by role
exports.getUsersByRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Validate role
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Find users with this role
    const users = await User.find({ roles: roleId })
      .select('_id fullName email employeeId phoneNumber status')
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const totalUsers = await User.countDocuments({ roles: roleId });
    
    res.status(200).json({
      success: true,
      count: users.length,
      total: totalUsers,
      totalPages: Math.ceil(totalUsers / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        role: {
          id: role._id,
          name: role.name,
          description: role.description
        },
        users: users.map(user => ({
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          employeeId: user.employeeId,
          phoneNumber: user.phoneNumber,
          status: user.status
        }))
      }
    });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving users by role'
    });
  }
};