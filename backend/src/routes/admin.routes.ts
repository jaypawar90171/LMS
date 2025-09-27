import { Router } from "express";
import {
  downloadBarcodeController,
  generateBarcodeController,
  getAdminProfileController,
  getAllDonationsController,
  getFinesReportController,
  getFinesReportPDF,
  getInventoryReportController,
  getInventoryReportPDF,
  getIssuedItemsReportPDF,
  getNotificationTemplatesController,
  getSystemRestrictionsController,
  loginController,
  resetPasswordAdminController,
  updateAdminController,
  updateAdminPasswordController,
  updateDonationStatusController,
  updateFineController,
  updateNotificationTemplateController,
  updateSystemRestrictionsController,
  forgotPassswordController,
  verifyResetPasswordController,
  resetPasswordController,
  logoutController,
  updateUserStatusController,
  getDashboardSummaryController,
  getAllUsersController,
  createUserController,
  getUserDetailsController,
  updateUserController,
  forcePasswordResetController,
  fetchRolesController,
  createRoleController,
  updateRoleController,
  deleteRoleController,
  fetchInventoryItemsController,
  createInventoryItemsController,
  fetchSpecificItemController,
  updateItemController,
  deleteItemController,
  getCategoriesController,
  createCatgoryController,
  updateCategoryController,
  deleteCategoryController,
  getAllFinesController,
  createFinesController,
  fetchUserFinesController,
  getIssuedReportController,
  viewQueueController,
  issueItemFromQueueController,
  removeUserFromQueueController,
  deleteUserController,
  deleteFinesController,
} from "../controllers/admin.controller";
import { authorize } from "../middleware/authorize";
import { authUser } from "../middleware/auth.middleware";
import multer from "multer";
const router = Router();

/* ========================= AUTH ========================= */
router.post("/auth/login", loginController);

router.post("/auth/forgot-password", forgotPassswordController);

router.get("/auth/reset-password/:id/:token", verifyResetPasswordController);

router.post("/auth/reset-password/:id/:token", resetPasswordController);

router.get("/auth/logout", authUser, logoutController);

/* ========================= USERS ========================= */
router.put(
  "/users/:userId/status",
  authUser,
  // authorize(["admin:manageUsers", "admin:approveUser"]),
  updateUserStatusController
);

router.get(
  "/users",
  authUser,
  // authorize(["admin:viewAllUsers"]),
  getAllUsersController
);

router.post(
  "/users",
  authUser,
  // authorize(["admin:manageUsers"]),
  createUserController
);

router.get(
  "/users/:userId",
  authUser,
  // authorize(["admin:viewAllUsers"]),
  getUserDetailsController
);

router.put(
  "/users/:userId",
  authUser,
  // authorize(["admin:manageUsers"]),
  updateUserController
);

router.put(
  "/users/:userId/reset-password",
  authUser,
  // authorize(["admin:manageUsers"]),
  forcePasswordResetController
);

router.delete(
  "/users/:userId",
  authUser,
  // authorize(["admin:manageUsers"]),
  deleteUserController
);

/* ========================= ROLES ========================= */
router.get(
  "/roles",
  authUser,
  // authorize(["admin:manageUsers"]),
  fetchRolesController
);

router.post(
  "/roles",
  authUser,
  // authorize(["admin:manageUsers"]),
  createRoleController
);

router.put(
  "/roles/:roleId",
  authUser,
  // authorize(["admin:manageUsers"]),
  updateRoleController
);

router.delete(
  "/roles/:roleId",
  authUser,
  // authorize(["admin:manageUsers"]),
  deleteRoleController
);

/* ========================= DASHBOARD ========================= */
router.get(
  "/dashboard/summary",
  authUser,
  authorize([
    "admin:viewAllUsers",
    "admin:viewAllItems",
    "admin:viewAllRentals",
  ]),
  getDashboardSummaryController
);

/* ========================= INVENTORY ========================= */
router.get(
  "/inventory/items",
  authUser,
  authorize(["admin:viewAllItems"]),
  fetchInventoryItemsController
);

const upload = multer({ dest: "uploads/" });
router.post(
  "/inventory/items",
  authUser,
  // authorize(["admin:manageItems"]),
  upload.single("mediaUrl"),
  createInventoryItemsController
);

router.get(
  "/inventory/items/:itemId",
  authUser,
  authorize(["admin:viewAllItems"]),
  fetchSpecificItemController
);

router.put(
  "/inventory/items/:itemId",
  authUser,
  // authorize(["admin:manageItems"]),
  updateItemController
);

router.delete(
  "/inventory/items/:itemId",
  authUser,
  // authorize(["admin:removeItem"]),
  deleteItemController
);

/* ========================= CATEGORIES ========================= */
router.get(
  "/inventory/categories",
  authUser,
  authorize(["admin:viewAllItems"]),
  getCategoriesController
);

router.post(
  "/inventory/categories",
  authUser,
  authorize(["admin:addCategory"]),
  createCatgoryController
);

router.put(
  "/inventory/categories/:categoryId",
  authUser,
  authorize(["admin:editCategory"]),
  updateCategoryController
);

router.delete(
  "/inventory/categories/:categoryId",
  authUser,
  authorize(["admin:deleteCategory"]),
  deleteCategoryController
);

/* ========================= FINES ========================= */
router.get(
  "/fines",
  authUser,
  authorize(["admin:viewAllRentals"]),
  getAllFinesController
);

router.get(
  "/fines/:userId",
  authUser,
  authorize(["admin:viewAllRentals"]),
  fetchUserFinesController
);

router.post(
  "/fines",
  authUser,
  // authorize(["admin:manageRentals"]),
  createFinesController
);

router.put(
  "/fines/:fineId",
  authUser,
  // authorize(["admin:manageRentals"]),
  updateFineController
);

router.delete("/fines/:fineId", 
  authUser, 
  // authorize(["admin:manageRentals"]), 
  deleteFinesController);

/* ========================= REPORTS ========================= */
router.get(
  "/reports/inventory",
  authUser,
  authorize(["admin:viewAllItems"]),
  getInventoryReportController
);

router.get(
  "/reports/fines",
  authUser,
  authorize(["admin:viewAllRentals"]),
  getFinesReportController
);

router.get(
  "/reports/issued",
  authUser,
  authorize(["admin:viewAllRentals"]),
  getIssuedReportController
);

router.get(
  "/reports/inventory/pdf",
  authUser,
  authorize(["admin:viewAllItems"]),
  getInventoryReportPDF
);

router.get(
  "/reports/fines/pdf",
  authUser,
  authorize(["admin:viewAllRentals"]),
  getFinesReportPDF
);

router.get(
  "/reports/issued/pdf",
  authUser,
  authorize(["admin:viewAllRentals"]),
  getIssuedItemsReportPDF
);

/* ========================= SETTINGS ========================= */
router.get(
  "/settings/system-restrictions",
  authUser,
  authorize(["admin:manageItems"]),
  getSystemRestrictionsController
);

router.put(
  "/settings/system-restrictions",
  authUser,
  authorize(["admin:manageItems"]),
  updateSystemRestrictionsController
);

router.get(
  "/settings/notification-templates",
  authUser,
  authorize(["admin:manageUsers"]),
  getNotificationTemplatesController
);

router.put(
  "/settings/notification-templates/:templateKey",
  authUser,
  authorize(["admin:manageUsers"]),
  updateNotificationTemplateController
);

router.get(
  "/settings/profile/:userId",
  authUser,
  authorize(["admin:viewAllUsers"]),
  getAdminProfileController
);

router.put(
  "/settings/profile/:userId",
  authUser,
  authorize(["admin:manageUsers"]),
  updateAdminController
);

router.put(
  "/settings/profile/password-reset/:userId",
  authUser,
  authorize(["admin:manageUsers"]),
  resetPasswordAdminController
);

router.put(
  "/settings/profile/password/:userId",
  authUser,
  authorize(["admin:manageUsers"]),
  updateAdminPasswordController
);

/* ========================= BARCODE ========================= */
router.get(
  "/barcode/generate",
  authUser,
  // authorize(["admin:manageItems"]),
  generateBarcodeController
);

router.get(
  "/barcode/download/:itemId",
  authUser,
  authorize(["admin:manageItems"]),
  downloadBarcodeController
);

/* ========================= DONATIONS ========================= */
router.get(
  "/donations",
  authUser,
  authorize(["admin:viewAllItems"]),
  getAllDonationsController
);

router.put(
  "/donations/:donationId/status",
  authUser,
  authorize(["admin:viewAllItems"]),
  updateDonationStatusController
);

/* ========================= QUEUE ========================= */
router.get(
  "/inventory/items/:itemId/view-queue",
  authUser,
  // authorize(["admin:viewQueues"]),
  viewQueueController
);

router.post(
  "/inventory/items/queue/:queueId/issue",
  authUser,
  issueItemFromQueueController
);

router.put(
  "/inventory/items/queue/:queueId/remove-user",
  authUser,
  // authorize(["admin:removeUserFromQueue"]),
  removeUserFromQueueController
);

export default router;
