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
  addNotoficationTemplateController,
  fetchAllPermissionsController,
  recordPaymentController,
  waiveFineController,
  createCategoryController,
  getCategoryByIdController,
  getPendingIssueRequestsController,
  issueItemController,
  approveIssueRequestController,
  rejectIssueRequestController,
  extendPeriodController,
  processReturnController,
  userResponseController,
  checkExpiredNotificationsController,
  getAllQueuesController,
  getQueueAnalyticsController,
  exportQueueAnalyticsController,
  exportIssuedItemsController,
  getDefaulterReportController,
  sendReminderController,
  exportDefaulterReportController,
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
  deleteNotificationController,
  getAllUsersReportController,
  exportAllUsersReportController,
  approveRequestedItemController,
  rejectRequestedItemController,
  deleteRequestedItemController,
  getAllRequestedItemsController,
  downloadBatchBarcodeController,
  getItemByScannedBarcodeController,
} from "../controllers/admin.controller";
import { authorize } from "../middleware/authorize";
import { authUser } from "../middleware/auth.middleware";
import multer from "multer";
import { upload } from "../config/upload";
import {
  exportAllUsersReport,
  fetchAllPermissionsService,
} from "../services/admin.service";

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

router.put("/users/:userId", authUser, updateUserController);

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

router.get("/permissions", authUser, fetchAllPermissionsController);

/* ========================= DASHBOARD ========================= */
router.get(
  "/dashboard/summary",
  authUser,
  // authorize([
  //   "admin:viewAllUsers",
  //   "admin:viewAllItems",
  //   "admin:viewAllRentals",
  // ]),
  getDashboardSummaryController
);

/* ========================= INVENTORY ========================= */
router.get(
  "/inventory/items",
  authUser,
  // authorize(["admin:viewAllItems"]),
  fetchInventoryItemsController
);

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
  // authorize(["admin:viewAllItems"]),
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

router.get(
  "/issue-requests/pending",
  authUser,
  getPendingIssueRequestsController
);

router.post("/issue-item", authUser, issueItemController);

router.put(
  "/issue-requests/:requestId/approve",
  authUser,
  approveIssueRequestController
);

router.put(
  "/issue-requests/:requestId/reject",
  authUser,
  rejectIssueRequestController
);

router.post(
  "/issued-items/:issuedItemId/extend",
  authUser,
  extendPeriodController
);

/* ========================= NEW ITEM REQUEST ========================= */
router.get("/requested-items", authUser, getAllRequestedItemsController);

router.put(
  "/requested-items/:requestId/approve",
  authUser,
  approveRequestedItemController
);

router.put(
  "/requested-items/:requestId/reject",
  authUser,
  rejectRequestedItemController
);

router.delete(
  "/requested-items/:requestId",
  authUser,
  deleteRequestedItemController
);

/* ========================= CATEGORIES ========================= */
router.get(
  "/inventory/categories",
  authUser,
  // authorize(["admin:viewAllItems"]),
  getCategoriesController
);

router.get("/inventory/categories/:id", authUser, getCategoryByIdController);

router.post(
  "/inventory/categories",
  authUser,
  // authorize(["admin:addCategory"]),
  createCategoryController
);

router.put(
  "/inventory/categories/:id",
  authUser,
  // authorize(["admin:editCategory"]),
  updateCategoryController
);

router.delete(
  "/inventory/categories/:id",
  authUser,
  // authorize(["admin:deleteCategory"]),
  deleteCategoryController
);

/* ========================= FINES ========================= */
router.get(
  "/fines",
  authUser,
  // authorize(["admin:viewAllRentals"]),
  getAllFinesController
);

router.get(
  "/fines/:userId",
  authUser,
  // authorize(["admin:viewAllRentals"]),
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

router.delete(
  "/fines/:fineId",
  authUser,
  // authorize(["admin:manageRentals"]),
  deleteFinesController
);

router.post("/fines/:fineId/record-payment", authUser, recordPaymentController);

router.post("/fines/:fineId/waive", authUser, waiveFineController);

/* ========================= REPORTS ========================= */
router.get(
  "/reports/inventory",
  authUser,
  // authorize(["admin:viewAllItems"]),
  getInventoryReportController
);

router.get(
  "/reports/fines",
  authUser,
  // authorize(["admin:viewAllRentals"]),
  getFinesReportController
);

router.get(
  "/reports/issued",
  authUser,
  // authorize(["admin:viewAllRentals"]),
  getIssuedReportController
);

router.get(
  "/reports/inventory/pdf",
  authUser,
  // authorize(["admin:viewAllItems"]),
  getInventoryReportPDF
);

router.get(
  "/reports/fines/pdf",
  authUser,
  // authorize(["admin:viewAllRentals"]),
  getFinesReportPDF
);

router.get(
  "/reports/issued/pdf",
  authUser,
  // authorize(["admin:viewAllRentals"]),
  getIssuedItemsReportPDF
);

router.get("/analytics/queues", authUser, getQueueAnalyticsController);

router.get(
  "/analytics/queues/export",
  authUser,
  exportQueueAnalyticsController
);

router.get("/reports/issued/export", authUser, exportIssuedItemsController);

router.get("/reports/defaulters", authUser, getDefaulterReportController);

router.post(
  "/reports/defaulters/send-reminder",
  authUser,
  sendReminderController
);

router.get(
  "/reports/defaulters/export",
  authUser,
  exportDefaulterReportController
);

router.get("/reports/all-users", authUser, getAllUsersReportController);

router.get(
  "/reports/all-users/export",
  authUser,
  exportAllUsersReportController
);

/* ========================= SETTINGS ========================= */
router.get(
  "/settings/system-restrictions",
  authUser,
  // authorize(["admin:manageItems"]),
  getSystemRestrictionsController
);

router.put(
  "/settings/system-restrictions",
  authUser,
  // authorize(["admin:manageItems"]),
  updateSystemRestrictionsController
);

router.get(
  "/settings/notification-templates",
  authUser,
  // authorize(["admin:manageUsers"]),
  getNotificationTemplatesController
);

router.post(
  "/settings/notofication-templates",
  addNotoficationTemplateController
);

router.put(
  "/settings/notification-templates/:templateKey",
  authUser,
  // authorize(["admin:manageUsers"]),
  updateNotificationTemplateController
);

router.get(
  "/settings/profile/:userId",
  // authUser,
  // authorize(["admin:viewAllUsers"]),
  getAdminProfileController
);

router.put(
  "/settings/profile/:userId",
  authUser,
  // authorize(["admin:manageUsers"]),
  upload.single("profile"),
  updateAdminController
);

router.put(
  "/settings/profile/password-reset/:userId",
  authUser,
  // authorize(["admin:manageUsers"]),
  resetPasswordAdminController
);

router.put(
  "/settings/profile/password/:userId",
  authUser,
  // authorize(["admin:manageUsers"]),
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
  // authorize(["admin:manageItems"]),
  downloadBarcodeController
);

router.get(
  "/barcode/download-batch/:itemId",
  authUser,
  downloadBatchBarcodeController
);

router.get(
  "/barcode/lookup/:scannedCode",
  authUser,
  getItemByScannedBarcodeController
);

/* ========================= DONATIONS ========================= */
router.get(
  "/donations",
  authUser,
  // authorize(["admin:viewAllItems"]),
  getAllDonationsController
);

router.put(
  "/donations/:donationId/status",
  authUser,
  // authorize(["admin:viewAllItems"]),
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

router.post(
  "/inventory/items/:itemId/process-return",
  authUser,
  processReturnController
);

router.post("/queue/:itemId/respond", authUser, userResponseController);

router.post(
  "/queue/check-expired",
  authUser,
  checkExpiredNotificationsController
);

router.get("/inventory/queues", authUser, getAllQueuesController);

/* ========================= Notifications ========================= */
router.get("/notifications", authUser, getNotificationsController);

router.patch(
  "/notifications/:notificationId/read",
  authUser,
  markAsReadController
);

router.patch("/notifications/mark-all-read", authUser, markAllAsReadController);

router.delete(
  "/notifications/:notificationId",
  authUser,
  deleteNotificationController
);

export default router;
