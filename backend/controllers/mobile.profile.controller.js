const User = require("../models/user.model");
const AuditLog = require("../models/auditLog.model");
const { uploadFile } = require("../config/upload");
const fs = require("fs");

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    // Get user from database with roles populated
    const user = await User.findById(req.user._id).populate(
      "roles",
      "name description"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return user profile
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        employeeId: user.employeeId,
        relationshipType: user.relationshipType,
        employeeReference: user.employeeReference,
        profileImage: user.profileImage?.url || null, 
        roles: user.roles.map((role) => ({
          id: role._id,
          name: role.name,
          description: role.description,
        })),
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving profile",
    });
  }
};

// Update profile picture
exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const filePath = req.file.path;
    const result = await uploadFile(filePath);

    //fetch user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.profileImage = {
      url: result.secure_url,
      publicId: result.public_id,
    };

    await user.save();

    if (!result) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkErr) {
        console.error(
          "Error deleting temp file after failed upload:",
          unlinkErr
        );
      }
      return res.status(500).json({
        success: false,
        message: "Failed to upload image to Cloudinary",
      });
    }

    try {
      fs.unlinkSync(filePath);
      console.log(`Successfully deleted temporary file: ${filePath}`);
    } catch (unlinkErr) {
      console.error(
        "Error deleting temporary file after successful upload:",
        unlinkErr
      );
    }

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    console.error("Image upload error:", error);

    if (req.file && req.file.path) {
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (cleanupErr) {
        console.error("Error during cleanup after upload error:", cleanupErr);
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || "Internal server error during upload",
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, address, dateOfBirth } = req.body;

    // Input validation
    if (fullName !== undefined) {
      if (
        typeof fullName !== "string" ||
        fullName.trim().length < 2 ||
        fullName.trim().length > 50
      ) {
        return res.status(400).json({
          success: false,
          message: "Full name must be between 2 and 50 characters",
        });
      }
    }

    if (phoneNumber !== undefined && phoneNumber !== "") {
      if (
        typeof phoneNumber !== "string" ||
        !/^\+?[\d\s-()]+$/.test(phoneNumber)
      ) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid phone number",
        });
      }
    }

    if (dateOfBirth !== undefined && dateOfBirth !== "") {
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime()) || dob >= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid date of birth in the past",
        });
      }
    }

    // Find user (only their own profile)
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update allowed fields only
    if (fullName !== undefined) {
      user.fullName = fullName;
    }

    if (phoneNumber !== undefined) {
      user.phoneNumber = phoneNumber;
    }

    if (address !== undefined) {
      // Handle both string and object address formats
      if (typeof address === "object") {
        // Convert object to string for storage
        const addressParts = [];
        if (address.street) addressParts.push(address.street);
        if (address.city) addressParts.push(address.city);
        if (address.state) addressParts.push(address.state);
        if (address.postalCode) addressParts.push(address.postalCode);
        if (address.country) addressParts.push(address.country);
        user.address = addressParts.join(", ");
      } else {
        user.address = address;
      }
    }

    if (dateOfBirth !== undefined) {
      user.dateOfBirth = dateOfBirth;
    }

    // Save user
    await user.save();

    // Log the update action
    await AuditLog.create({
      userId: user._id,
      actionType: "update",
      entityType: "user",
      entityId: user._id,
      details: { updatedFields: Object.keys(req.body) },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Return updated profile
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        employeeId: user.employeeId,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
    });
  }
};
