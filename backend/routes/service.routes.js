const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const serviceController = require("../controllers/service.controller");
const csrf = require("csurf");

// CSRF protection for state-changing operations
const csrfProtection = csrf({
  cookie: { httpOnly: true, secure: process.env.NODE_ENV === "production" },
});

// Service management routes with permission-based access
router.get("/", protect, serviceController.getServices);

router.post(
  "/",
  protect,
  // authorize("canManageServices"),
  // csrfProtection,
  serviceController.createService
);

// User service assignment routes
router.post(
  "/assign",
  // protect,
  // authorize("canAssignServices"),
  // csrfProtection,
  serviceController.assignServiceToUser
);

router.put(
  "/:serviceId",
  protect,
  // authorize("canManageServices"),
  // csrfProtection,
  serviceController.updateService
);

router.get(
  "/user/:userId",
  protect,
  authorize("canViewUserServices"),
  serviceController.getUserServices
);
router.get(
  "/all-assignments",
  protect,
  authorize("canViewUserServices"),
  async (req, res) => {
    try {
      const UserService = require("../models/userService.model");
      const assignments = await UserService.find()
        .populate("userId", "fullName email")
        .populate("serviceId", "name description")
        .populate("grantedBy", "fullName")
        .sort({ grantedDate: -1 });
      res.status(200).json({ success: true, data: assignments });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "Error fetching service assignments",
        });
    }
  }
);

router.get(
  "/users",
  protect,
  authorize("canAssignServices"),
  async (req, res) => {
    try {
      const User = require("../models/user.model");
      const users = await User.find({ status: "Active" }).select(
        "fullName email"
      );
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching users" });
    }
  }
);
router.put(
  "/suspend/:userServiceId",
  protect,
  authorize("canManageUserServices"),
  csrfProtection,
  serviceController.suspendUserService
);
router.put(
  "/reactivate/:userServiceId",
  protect,
  authorize("canManageUserServices"),
  csrfProtection,
  serviceController.reactivateUserService
);
router.delete(
  "/:userServiceId",
  protect,
  authorize("canManageServices"),
  csrfProtection,
  serviceController.removeUserService
);

module.exports = router;
