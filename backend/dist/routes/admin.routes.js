"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_1 = require("../config/upload");
const authorize_1 = require("../middleware/authorize");
const router = (0, express_1.Router)();
/* ========================= AUTH ========================= */
router.post("/auth/login", admin_controller_1.loginController);
router.post("/auth/forgot-password", admin_controller_1.forgotPassswordController);
router.get("/auth/reset-password/:id/:token", admin_controller_1.verifyResetPasswordController);
router.post("/auth/reset-password/:id/:token", admin_controller_1.resetPasswordController);
router.get("/auth/logout", auth_middleware_1.authUser, admin_controller_1.logoutController);
/* ========================= USERS ========================= */
router.put("/users/:userId/status", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canEditUser", "canDeactivateUser"]), admin_controller_1.updateUserStatusController);
router.get("/users", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewUser"]), admin_controller_1.getAllUsersController);
router.post("/users", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canCreateUser"]), admin_controller_1.createUserController);
router.get("/users/:userId", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewUser"]), admin_controller_1.getUserDetailsController);
router.put("/users/:userId", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canEditUser"]), admin_controller_1.updateUserController);
router.put("/users/:userId/reset-password", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canResetUserPassword"]), admin_controller_1.forcePasswordResetController);
router.delete("/users/:userId", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canDeactivateUser"]), admin_controller_1.deleteUserController);
/* ========================= ROLES ========================= */
router.get("/roles", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewRoles"]), admin_controller_1.fetchRolesController);
router.post("/roles", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canCreateRole"]), admin_controller_1.createRoleController);
router.put("/roles/:roleId", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canEditRolePermissions"]), admin_controller_1.updateRoleController);
router.delete("/roles/:roleId", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canDeleteRole"]), admin_controller_1.deleteRoleController);
router.get("/permissions", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewRoles"]), admin_controller_1.fetchAllPermissionsController);
/* ========================= DASHBOARD ========================= */
router.get("/dashboard/summary", auth_middleware_1.authUser, 
// authorize(["canViewDashboard"]),
admin_controller_1.getDashboardSummaryController);
/* ========================= INVENTORY ========================= */
router.get("/inventory/items", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewItem"]), admin_controller_1.fetchInventoryItemsController);
router.post("/inventory/items", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canCreateItem"]), upload_1.upload.single("mediaUrl"), admin_controller_1.createInventoryItemsController);
router.get("/inventory/items/:itemId", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewItem"]), admin_controller_1.fetchSpecificItemController);
router.put("/inventory/items/:itemId", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canEditItem"]), admin_controller_1.updateItemController);
router.delete("/inventory/items/:itemId", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canDeleteItem"]), admin_controller_1.deleteItemController);
router.get("/issue-requests/pending", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewIssueRequests"]), admin_controller_1.getPendingIssueRequestsController);
router.post("/issue-item", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canIssueItem"]), admin_controller_1.issueItemController);
router.put("/issue-requests/:requestId/approve", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canApproveIssueRequest"]), admin_controller_1.approveIssueRequestController);
router.put("/issue-requests/:requestId/reject", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canApproveIssueRequest"]), admin_controller_1.rejectIssueRequestController);
router.post("/issued-items/:issuedItemId/extend", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canExtendPeriod"]), admin_controller_1.extendPeriodController);
router.post("/issued-items/mark-as-return/:itemId", auth_middleware_1.authUser, admin_controller_1.returnItemController);
/* ========================= NEW ITEM REQUEST ========================= */
router.get("/requested-items", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewItemAcquisitionRequests"]), admin_controller_1.getAllRequestedItemsController);
router.put("/requested-items/:requestId/approve", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canProcessItemAcquisitionRequests"]), admin_controller_1.approveRequestedItemController);
router.put("/requested-items/:requestId/reject", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canProcessItemAcquisitionRequests"]), admin_controller_1.rejectRequestedItemController);
router.delete("/requested-items/:requestId", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canProcessItemAcquisitionRequests"]), admin_controller_1.deleteRequestedItemController);
/* ========================= CATEGORIES ========================= */
router.get("/inventory/categories", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewCategories"]), admin_controller_1.getCategoriesController);
router.get("/inventory/categories/:id", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewCategories"]), admin_controller_1.getCategoryByIdController);
router.post("/inventory/categories", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canCreateCategory"]), admin_controller_1.createCategoryController);
router.put("/inventory/categories/:id", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canEditCategory"]), admin_controller_1.updateCategoryController);
router.delete("/inventory/categories/:id", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canDeleteCategory"]), admin_controller_1.deleteCategoryController);
/* ========================= FINES ========================= */
router.get("/fines", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewFines"]), admin_controller_1.getAllFinesController);
router.get("/fines/:userId", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewFines"]), admin_controller_1.fetchUserFinesController);
router.post("/fines", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canAddManualFine"]), admin_controller_1.createFinesController);
router.put("/fines/:fineId", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canEditFine"]), admin_controller_1.updateFineController);
router.delete("/fines/:fineId", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canEditFine"]), admin_controller_1.deleteFinesController);
router.post("/fines/:fineId/record-payment", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canRecordFinePayment"]), admin_controller_1.recordPaymentController);
router.post("/fines/:fineId/waive", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canWaiveFine"]), admin_controller_1.waiveFineController);
/* ========================= REPORTS ========================= */
router.get("/reports/inventory", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewInventoryReport"]), admin_controller_1.getInventoryReportController);
router.get("/reports/fines", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewFineReport"]), admin_controller_1.getFinesReportController);
router.get("/reports/issued", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewAllocationReport"]), admin_controller_1.getIssuedReportController);
router.get("/reports/inventory/pdf", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewInventoryReport", "canExportReports"]), admin_controller_1.getInventoryReportPDF);
router.get("/reports/fines/pdf", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewFineReport", "canExportReports"]), admin_controller_1.getFinesReportPDF);
router.get("/reports/issued/pdf", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewAllocationReport", "canExportReports"]), admin_controller_1.getIssuedItemsReportPDF);
router.get("/analytics/queues", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewQueueReport"]), admin_controller_1.getQueueAnalyticsController);
router.get("/analytics/queues/export", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewQueueReport", "canExportReports"]), admin_controller_1.exportQueueAnalyticsController);
router.get("/reports/issued/export", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewAllocationReport", "canExportReports"]), admin_controller_1.exportIssuedItemsController);
router.get("/reports/defaulters", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewDefaulterReport"]), admin_controller_1.getDefaulterReportController);
router.post("/reports/defaulters/send-reminder", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canSendReminders"]), admin_controller_1.sendReminderController);
router.get("/reports/defaulters/export", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewDefaulterReport", "canExportReports"]), admin_controller_1.exportDefaulterReportController);
router.get("/reports/all-users", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewUser"]), admin_controller_1.getAllUsersReportController);
router.get("/reports/all-users/export", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewUser", "canExportReports"]), admin_controller_1.exportAllUsersReportController);
/* ========================= SETTINGS ========================= */
router.get("/settings/system-restrictions", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canConfigureSystemRestrictions"]), admin_controller_1.getSystemRestrictionsController);
router.put("/settings/system-restrictions", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canConfigureNotificationChannels"]), admin_controller_1.updateSystemRestrictionsController);
router.get("/settings/notification-templates", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canConfigureNotificationChannels"]), admin_controller_1.getNotificationTemplatesController);
router.post("/settings/notofication-templates", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canConfigureNotificationChannels"]), admin_controller_1.addNotoficationTemplateController);
router.put("/settings/notification-templates/:templateKey", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canConfigureNotificationChannels"]), admin_controller_1.updateNotificationTemplateController);
router.get("/settings/profile/:userId", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewUser"]), admin_controller_1.getAdminProfileController);
router.put("/settings/profile/:userId", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canEditUser"]), upload_1.upload.single("profile"), admin_controller_1.updateAdminController);
router.put("/settings/profile/password-reset/:userId", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canResetUserPassword"]), admin_controller_1.resetPasswordAdminController);
router.put("/settings/profile/password/:userId", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canChangeOwnPassword"]), admin_controller_1.updateAdminPasswordController);
/* ========================= BARCODE ========================= */
router.get("/barcode/generate", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canPrintBarcode"]), admin_controller_1.generateBarcodeController);
router.get("/barcode/download/:itemId", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canPrintBarcode"]), admin_controller_1.downloadBarcodeController);
router.get("/barcode/download-batch/:itemId", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canPrintBarcode"]), admin_controller_1.downloadBatchBarcodeController);
router.get("/barcode/lookup/:scannedCode", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewItem"]), admin_controller_1.getItemByScannedBarcodeController);
/* ========================= DONATIONS ========================= */
router.get("/donations", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewDonationInterests"]), admin_controller_1.getAllDonationsController);
router.put("/donations/:donationId/status", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canApproveDonationInterest"]), admin_controller_1.updateDonationStatusController);
/* ========================= QUEUE ========================= */
router.get("/inventory/items/:itemId/view-queue", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewQueue"]), admin_controller_1.viewQueueController);
router.post("/inventory/items/queue/:queueId/issue", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canAllocateItem"]), admin_controller_1.issueItemFromQueueController);
router.put("/inventory/items/queue/:queueId/remove-user", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canRemoveFromQueue"]), admin_controller_1.removeUserFromQueueController);
router.post("/inventory/items/:itemId/process-return", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canReturnItem"]), admin_controller_1.processReturnController);
router.post("/queue/:itemId/respond", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewQueue"]), admin_controller_1.userResponseController);
router.post("/queue/check-expired", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canConfigureReminders"]), admin_controller_1.checkExpiredNotificationsController);
router.get("/inventory/queues", auth_middleware_1.authUser, (0, authorize_1.authorize)(["canViewQueue"]), admin_controller_1.getAllQueuesController);
/* ========================= Notifications ========================= */
router.get("/notifications", auth_middleware_1.authUser, admin_controller_1.getNotificationsController);
router.patch("/notifications/:notificationId/read", auth_middleware_1.authUser, admin_controller_1.markAsReadController);
router.patch("/notifications/mark-all-read", auth_middleware_1.authUser, admin_controller_1.markAllAsReadController);
router.delete("/notifications/:notificationId", auth_middleware_1.authUser, admin_controller_1.deleteNotificationController);
exports.default = router;
