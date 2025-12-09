const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const {
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  validateResetTokenValidation,
  validate,
} = require("../middleware/validation.middleware");
const { protect } = require("../middleware/auth.middleware");
const csrf = require("csurf");

// CSRF protection for state-changing operations
const csrfProtection = csrf({
  cookie: { httpOnly: true, secure: process.env.NODE_ENV === "production" },
});

// Login route
router.post(
  "/login",
  // csrfProtection,
  loginValidation,
  validate,
  authController.login
);

// Forgot password route
router.post(
  "/forgot-password",
  csrfProtection,
  forgotPasswordValidation,
  validate,
  authController.forgotPassword
);

// Validate reset token route
router.get(
  "/validate-reset-token",
  validateResetTokenValidation,
  validate,
  authController.validateResetToken
);

// Reset password route
router.post(
  "/reset-password",
  csrfProtection,
  resetPasswordValidation,
  validate,
  authController.resetPassword
);

// Logout route
router.post("/logout", protect, csrfProtection, authController.logout);

module.exports = router;
