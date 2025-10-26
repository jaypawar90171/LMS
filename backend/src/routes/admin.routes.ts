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
  returnItemController,
} from "../controllers/admin.controller";
import { authUser } from "../middleware/auth.middleware";
import multer from "multer";
import { upload } from "../config/upload";
import {
  exportAllUsersReport,
  fetchAllPermissionsService,
} from "../services/admin.service";
import { authorize } from "../middleware/authorize";

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
  authorize(["canEditUser", "canDeactivateUser"]),
  updateUserStatusController
);

router.get(
  "/users",
  authUser,
  authorize(["canViewUser"]),
  getAllUsersController
);

router.post(
  "/users",
  authUser,
  authorize(["canCreateUser"]),
  createUserController
);

router.get(
  "/users/:userId",
  authUser,
  authorize(["canViewUser"]),
  getUserDetailsController
);

router.put(
  "/users/:userId",
  authUser,
  authorize(["canEditUser"]),
  updateUserController
);

router.put(
  "/users/:userId/reset-password",
  authUser,
  authorize(["canResetUserPassword"]),
  forcePasswordResetController
);

router.delete(
  "/users/:userId",
  authUser,
  authorize(["canDeactivateUser"]),
  deleteUserController
);

/* ========================= ROLES ========================= */
router.get(
  "/roles",
  authUser,
  authorize(["canViewRoles"]),
  fetchRolesController
);

router.post(
  "/roles",
  authUser,
  authorize(["canCreateRole"]),
  createRoleController
);

router.put(
  "/roles/:roleId",
  authUser,
  authorize(["canEditRolePermissions"]),
  updateRoleController
);

router.delete(
  "/roles/:roleId",
  authUser,
  authorize(["canDeleteRole"]),
  deleteRoleController
);

router.get(
  "/permissions",
  authUser,
  authorize(["canViewRoles"]),
  fetchAllPermissionsController
);

/* ========================= DASHBOARD ========================= */
router.get(
  "/dashboard/summary",
  authUser,
  // authorize(["canViewDashboard"]),
  getDashboardSummaryController
);

/* ========================= INVENTORY ========================= */
router.get(
  "/inventory/items",
  authUser,
  authorize(["canViewItem"]),
  fetchInventoryItemsController
);

router.post(
  "/inventory/items",
  authUser,
  authorize(["canCreateItem"]),
  upload.single("mediaUrl"),
  createInventoryItemsController
);

router.get(
  "/inventory/items/:itemId",
  authUser,
  authorize(["canViewItem"]),
  fetchSpecificItemController
);

router.put(
  "/inventory/items/:itemId",
  authUser,
  authorize(["canEditItem"]),
  updateItemController
);

router.delete(
  "/inventory/items/:itemId",
  authUser,
  authorize(["canDeleteItem"]),
  deleteItemController
);

router.get(
  "/issue-requests/pending",
  authUser,
  authorize(["canViewIssueRequests"]),
  getPendingIssueRequestsController
);

router.post(
  "/issue-item",
  authUser,
  authorize(["canIssueItem"]),
  issueItemController
);

router.put(
  "/issue-requests/:requestId/approve",
  authUser,
  authorize(["canApproveIssueRequest"]),
  approveIssueRequestController
);

router.put(
  "/issue-requests/:requestId/reject",
  authUser,
  authorize(["canApproveIssueRequest"]),
  rejectIssueRequestController
);

router.post(
  "/issued-items/:issuedItemId/extend",
  authUser,
  authorize(["canExtendPeriod"]),
  extendPeriodController
);

router.post("/issued-items/mark-as-return/:itemId", authUser, returnItemController);

/* ========================= NEW ITEM REQUEST ========================= */
router.get(
  "/requested-items",
  authUser,
  authorize(["canViewItemAcquisitionRequests"]),
  getAllRequestedItemsController
);

router.put(
  "/requested-items/:requestId/approve",
  authUser,
  authorize(["canProcessItemAcquisitionRequests"]),
  approveRequestedItemController
);

router.put(
  "/requested-items/:requestId/reject",
  authUser,
  authorize(["canProcessItemAcquisitionRequests"]),
  rejectRequestedItemController
);

router.delete(
  "/requested-items/:requestId",
  authUser,
  authorize(["canProcessItemAcquisitionRequests"]),
  deleteRequestedItemController
);

/* ========================= CATEGORIES ========================= */
router.get(
  "/inventory/categories",
  authUser,
  authorize(["canViewCategories"]),
  getCategoriesController
);

router.get(
  "/inventory/categories/:id",
  authUser,
  authorize(["canViewCategories"]),
  getCategoryByIdController
);

router.post(
  "/inventory/categories",
  authUser,
  authorize(["canCreateCategory"]),
  createCategoryController
);

router.put(
  "/inventory/categories/:id",
  authUser,
  authorize(["canEditCategory"]),
  updateCategoryController
);

router.delete(
  "/inventory/categories/:id",
  authUser,
  authorize(["canDeleteCategory"]),
  deleteCategoryController
);

/* ========================= FINES ========================= */
router.get(
  "/fines",
  authUser,
  authorize(["canViewFines"]),
  getAllFinesController
);

router.get(
  "/fines/:userId",
  authUser,
  authorize(["canViewFines"]),
  fetchUserFinesController
);

router.post(
  "/fines",
  authUser,
  authorize(["canAddManualFine"]),
  createFinesController
);

router.put(
  "/fines/:fineId",
  authUser,
  authorize(["canEditFine"]),
  updateFineController
);

router.delete(
  "/fines/:fineId",
  authUser,
  authorize(["canEditFine"]),
  deleteFinesController
);

router.post(
  "/fines/:fineId/record-payment",
  authUser,
  authorize(["canRecordFinePayment"]),
  recordPaymentController
);

router.post(
  "/fines/:fineId/waive",
  authUser,
  authorize(["canWaiveFine"]),
  waiveFineController
);

/* ========================= REPORTS ========================= */
router.get(
  "/reports/inventory",
  authUser,
  authorize(["canViewInventoryReport"]),
  getInventoryReportController
);

router.get(
  "/reports/fines",
  authUser,
  authorize(["canViewFineReport"]),
  getFinesReportController
);

router.get(
  "/reports/issued",
  authUser,
  authorize(["canViewAllocationReport"]),
  getIssuedReportController
);

router.get(
  "/reports/inventory/pdf",
  authUser,
  authorize(["canViewInventoryReport", "canExportReports"]),
  getInventoryReportPDF
);

router.get(
  "/reports/fines/pdf",
  authUser,
  authorize(["canViewFineReport", "canExportReports"]),
  getFinesReportPDF
);

router.get(
  "/reports/issued/pdf",
  authUser,
  authorize(["canViewAllocationReport", "canExportReports"]),
  getIssuedItemsReportPDF
);

router.get(
  "/analytics/queues",
  authUser,
  authorize(["canViewQueueReport"]),
  getQueueAnalyticsController
);

router.get(
  "/analytics/queues/export",
  authUser,
  authorize(["canViewQueueReport", "canExportReports"]),
  exportQueueAnalyticsController
);

router.get(
  "/reports/issued/export",
  authUser,
  authorize(["canViewAllocationReport", "canExportReports"]),
  exportIssuedItemsController
);

router.get(
  "/reports/defaulters",
  authUser,
  authorize(["canViewDefaulterReport"]),
  getDefaulterReportController
);

router.post(
  "/reports/defaulters/send-reminder",
  authUser,
  authorize(["canSendReminders"]),
  sendReminderController
);

router.get(
  "/reports/defaulters/export",
  authUser,
  authorize(["canViewDefaulterReport", "canExportReports"]),
  exportDefaulterReportController
);

router.get(
  "/reports/all-users",
  authUser,
  authorize(["canViewUser"]),
  getAllUsersReportController
);

router.get(
  "/reports/all-users/export",
  authUser,
  authorize(["canViewUser", "canExportReports"]),
  exportAllUsersReportController
);

/* ========================= SETTINGS ========================= */
router.get(
  "/settings/system-restrictions",
  authUser,
  authorize(["canConfigureSystemRestrictions"]),
  getSystemRestrictionsController
);

router.put(
  "/settings/system-restrictions",
  authUser,
  authorize(["canConfigureNotificationChannels"]),
  updateSystemRestrictionsController
);

router.get(
  "/settings/notification-templates",
  authUser,
  authorize(["canConfigureNotificationChannels"]),
  getNotificationTemplatesController
);

router.post(
  "/settings/notofication-templates",
  authUser,
  authorize(["canConfigureNotificationChannels"]),
  addNotoficationTemplateController
);

router.put(
  "/settings/notification-templates/:templateKey",
  authUser,
  authorize(["canConfigureNotificationChannels"]),
  updateNotificationTemplateController
);

router.get(
  "/settings/profile/:userId",
  authUser,
  authorize(["canViewUser"]),
  getAdminProfileController
);

router.put(
  "/settings/profile/:userId",
  authUser,
  authorize(["canEditUser"]),
  upload.single("profile"),
  updateAdminController
);

router.put(
  "/settings/profile/password-reset/:userId",
  authUser,
  authorize(["canResetUserPassword"]),
  resetPasswordAdminController
);

router.put(
  "/settings/profile/password/:userId",
  authUser,
  authorize(["canChangeOwnPassword"]),
  updateAdminPasswordController
);

/* ========================= BARCODE ========================= */
router.get(
  "/barcode/generate",
  authUser,
  authorize(["canPrintBarcode"]),
  generateBarcodeController
);

router.get(
  "/barcode/download/:itemId",
  authUser,
  authorize(["canPrintBarcode"]),
  downloadBarcodeController
);

router.get(
  "/barcode/download-batch/:itemId",
  authUser,
  authorize(["canPrintBarcode"]),
  downloadBatchBarcodeController
);

router.get(
  "/barcode/lookup/:scannedCode",
  authUser,
  authorize(["canViewItem"]),
  getItemByScannedBarcodeController
);

/* ========================= DONATIONS ========================= */
router.get(
  "/donations",
  authUser,
  authorize(["canViewDonationInterests"]),
  getAllDonationsController
);

router.put(
  "/donations/:donationId/status",
  authUser,
  authorize(["canApproveDonationInterest"]),
  updateDonationStatusController
);

/* ========================= QUEUE ========================= */
router.get(
  "/inventory/items/:itemId/view-queue",
  authUser,
  authorize(["canViewQueue"]),
  viewQueueController
);

router.post(
  "/inventory/items/queue/:queueId/issue",
  authUser,
  authorize(["canAllocateItem"]),
  issueItemFromQueueController
);

router.put(
  "/inventory/items/queue/:queueId/remove-user",
  authUser,
  authorize(["canRemoveFromQueue"]),
  removeUserFromQueueController
);

router.post(
  "/inventory/items/:itemId/process-return",
  authUser,
  authorize(["canReturnItem"]),
  processReturnController
);

router.post(
  "/queue/:itemId/respond",
  authUser,
  authorize(["canViewQueue"]),
  userResponseController
);

router.post(
  "/queue/check-expired",
  authUser,
  authorize(["canConfigureReminders"]),
  checkExpiredNotificationsController
);

router.get(
  "/inventory/queues",
  authUser,
  authorize(["canViewQueue"]),
  getAllQueuesController
);

/* ========================= Notifications ========================= */
router.get(
  "/notifications",
  authUser,
  getNotificationsController
);

router.patch(
  "/notifications/:notificationId/read",
  authUser,
  markAsReadController
);

router.patch(
  "/notifications/mark-all-read",
  authUser,
  markAllAsReadController
);

router.delete(
  "/notifications/:notificationId",
  authUser,
  deleteNotificationController
);

export default router;
