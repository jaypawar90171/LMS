import User from "./models/user.model";
import Role from "./models/role.model";
import Activity from "./models/activity.model";
import Category from "./models/category.model";
import Donation from "./models/donation.model";
import Fine from "./models/fine.model";
import ItemRequest from "./models/itemRequest.model";
import { Permission } from "./models/permission.model";
import Setting from "./models/setting.model";
import Queue from "./models/queue.model";
import IssuedIetm from "./models/issuedItem.model";
import InventoryItem from "./models/item.model";
import Notification from "./models/notofication.modal";
import mongoose from "mongoose";
import connect from "./config/db";
import IssuedItem from "./models/issuedItem.model";

// A list of the permission keys we need to find.
const permissionKeys = [
  // Authentication & Core Permissions
  "canLoginAdmin",
  "canChangeOwnPassword",
  "canResetOwnPassword",

  // Dashboard & Navigation
  "canViewDashboard",
  "canViewSideNavigation",

  // User Management Permissions
  "canViewUser",
  "canCreateUser",
  "canEditUser",
  "canDeactivateUser",
  "canResetUserPassword",
  "canUnlockUser",
  "canViewRoles",
  "canCreateRole",
  "canEditRolePermissions",
  "canDeleteRole",

  // Inventory Management Permissions
  "canViewItem",
  "canCreateItem",
  "canEditItem",
  "canDeleteItem",
  "canManageCopies",
  "canPrintBarcode",
  "canUpdateItemStatus",
  "canViewCategories",
  "canCreateCategory",
  "canEditCategory",
  "canDeleteCategory",

  // Library Operations Permissions - Issue, Return & Extension
  "canIssueItem",
  "canReturnItem",
  "canExtendPeriod",

  // Library Operations Permissions - Queue Management
  "canViewQueue",
  "canAllocateItem",
  "canRemoveFromQueue",

  // Library Operations Permissions - Reminder Management
  "canConfigureReminders",
  "canSendReminders",

  // Library Operations Permissions - Fine Management
  "canViewFines",
  "canRecordFinePayment",
  "canWaiveFine",
  "canEditFine",
  "canAddManualFine",

  // Reports Module Permissions
  "canViewDefaulterReport",
  "canViewQueueReport",
  "canViewAllocationReport",
  "canViewFineReport",
  "canViewInventoryReport",
  "canViewActivityLog",
  "canExportReports",

  // Settings Module Permissions
  "canConfigureGeneralSettings",
  "canConfigureBorrowingLimits",
  "canConfigureFineRates",
  "canConfigureNotificationChannels",
  "canConfigureSystemRestrictions",
  "canViewAuditLog",

  // Employee Exit Process Permissions
  "canValidateEmployeeExit",

  // Mobile-App-Facing Admin Permissions
  "canViewIssueRequests",
  "canApproveIssueRequest",
  "canViewDonationInterests",
  "canApproveDonationInterest",
  "canViewItemAcquisitionRequests",
  "canProcessItemAcquisitionRequests",

  // Data & Bulk Operations Permissions
  "canImportData",
  "canExportData",
  "canPerformBulkActions",

  // Advanced Administrative Permissions
  "canManageSystemHealth",
  "canManageAPIIntegrations",
  "canBypassValidation",
  "canImpersonateUser",
  "canManageDatabase",
  "canConfigureThemes",
  "canManageLicense",
];

async function seedDatabase() {
  //1. Inserting a user
  // const roles = await Role.find({
  //   roleName: { $in: ["superAdmin", "Admin", "librarian", "user"] },
  // });
  // const roleMap = roles.reduce((acc: any, role: any) => {
  //   acc[role.roleName] = role._id;
  //   return acc;
  // }, {});
  // const users = [
  //   {
  //     fullName: "Super Admin",
  //     email: "superadmin@example.com",
  //     username: "superadmin",
  //     password: "securePassword123",
  //     roles: [roleMap["superAdmin"]],
  //   },
  //   {
  //     fullName: "Admin",
  //     email: "admin@example.com",
  //     username: "admin",
  //     password: "securePassword123",
  //     roles: [roleMap["Admin"]],
  //   },
  //   {
  //     fullName: "Librarian",
  //     email: "librarian@example.com",
  //     username: "librarian",
  //     password: "securePassword123",
  //     roles: [roleMap["librarian"]],
  //   },
  //   {
  //     fullName: "Jane Doe",
  //     email: "jane.doe@example.com",
  //     username: "janedoe",
  //     password: "securePassword123",
  //     roles: [roleMap["user"]],
  //   },
  // ];
  // for (const userData of users) {
  //   const user = new User(userData);
  //   await user.save();
  // }
  // console.log("Initial users inserted successfully.");
  // 1. First, insert all permissions
  // await Permission.insertMany(
  //   permissionKeys.map((permissionKey) => ({
  //     permissionKey,
  //     description: `Permission to ${permissionKey
  //       .replace("can", "")
  //       .replace(/([A-Z])/g, " $1")
  //       .toLowerCase()}`,
  //   }))
  // );
  // console.log("Permissions inserted successfully.");
  // // 2. Then, fetch the inserted permissions to get their IDs
  // const permissions = await Permission.find({
  //   permissionKey: { $in: permissionKeys },
  // });
  // const permissionMap = permissions.reduce((acc: any, perm: any) => {
  //   acc[perm.permissionKey] = perm._id;
  //   return acc;
  // }, {});
  // // Get all permission IDs for Super Admin
  // const allPermissionIds = permissions.map((perm) => perm._id);
  // // 3. Now insert roles with the permission IDs
  // await Role.insertMany([
  //   {
  //     roleName: "superAdmin",
  //     description:
  //       "The top-level administrator with full access to all system features and the ability to manage other roles.",
  //     permissions: allPermissionIds, // All 69 permissions
  //     immutable: true,
  //   },
  //   {
  //     roleName: "Admin",
  //     description:
  //       "Administrator role with extensive system access. Manages all operations except core system configuration.",
  //     permissions: [
  //       // User Management (All except role management)
  //       permissionMap["canViewUser"],
  //       permissionMap["canCreateUser"],
  //       permissionMap["canEditUser"],
  //       permissionMap["canDeactivateUser"],
  //       permissionMap["canResetUserPassword"],
  //       permissionMap["canUnlockUser"],
  //       permissionMap["canViewRoles"],
  //       // Inventory Management (All)
  //       permissionMap["canViewItem"],
  //       permissionMap["canCreateItem"],
  //       permissionMap["canEditItem"],
  //       permissionMap["canDeleteItem"],
  //       permissionMap["canManageCopies"],
  //       permissionMap["canPrintBarcode"],
  //       permissionMap["canUpdateItemStatus"],
  //       permissionMap["canViewCategories"],
  //       permissionMap["canCreateCategory"],
  //       permissionMap["canEditCategory"],
  //       permissionMap["canDeleteCategory"],
  //       // Library Operations (All)
  //       permissionMap["canIssueItem"],
  //       permissionMap["canReturnItem"],
  //       permissionMap["canExtendPeriod"],
  //       permissionMap["canViewQueue"],
  //       permissionMap["canAllocateItem"],
  //       permissionMap["canRemoveFromQueue"],
  //       permissionMap["canConfigureReminders"],
  //       permissionMap["canSendReminders"],
  //       permissionMap["canViewFines"],
  //       permissionMap["canRecordFinePayment"],
  //       permissionMap["canWaiveFine"],
  //       permissionMap["canEditFine"],
  //       permissionMap["canAddManualFine"],
  //       permissionMap["canValidateEmployeeExit"],
  //       // Reports (All)
  //       permissionMap["canViewDefaulterReport"],
  //       permissionMap["canViewQueueReport"],
  //       permissionMap["canViewAllocationReport"],
  //       permissionMap["canViewFineReport"],
  //       permissionMap["canViewInventoryReport"],
  //       permissionMap["canViewActivityLog"],
  //       permissionMap["canExportReports"],
  //       // Mobile-App-Facing (All)
  //       permissionMap["canViewIssueRequests"],
  //       permissionMap["canApproveIssueRequest"],
  //       permissionMap["canViewDonationInterests"],
  //       permissionMap["canApproveDonationInterest"],
  //       permissionMap["canViewItemAcquisitionRequests"],
  //       permissionMap["canProcessItemAcquisitionRequests"],
  //       // Data & Bulk Operations
  //       permissionMap["canImportData"],
  //       permissionMap["canExportData"],
  //       permissionMap["canPerformBulkActions"],
  //       // Settings (Limited - no core system settings)
  //       permissionMap["canConfigureBorrowingLimits"],
  //       permissionMap["canConfigureFineRates"],
  //       permissionMap["canConfigureNotificationChannels"],
  //       permissionMap["canViewAuditLog"],
  //     ],
  //     immutable: true,
  //   },
  //   {
  //     roleName: "librarian",
  //     description:
  //       "Responsible for daily library operations, user interactions, and routine tasks.",
  //     permissions: [
  //       // User Management (View only)
  //       permissionMap["canViewUser"],
  //       permissionMap["canViewRoles"],
  //       // Inventory Management (View and basic operations)
  //       permissionMap["canViewItem"],
  //       permissionMap["canCreateItem"],
  //       permissionMap["canEditItem"],
  //       permissionMap["canManageCopies"],
  //       permissionMap["canPrintBarcode"],
  //       permissionMap["canUpdateItemStatus"],
  //       permissionMap["canViewCategories"],
  //       permissionMap["canCreateCategory"],
  //       permissionMap["canEditCategory"],
  //       // Library Operations (Core daily tasks)
  //       permissionMap["canIssueItem"],
  //       permissionMap["canReturnItem"],
  //       permissionMap["canExtendPeriod"],
  //       permissionMap["canViewQueue"],
  //       permissionMap["canAllocateItem"],
  //       permissionMap["canRemoveFromQueue"],
  //       permissionMap["canSendReminders"],
  //       permissionMap["canViewFines"],
  //       permissionMap["canRecordFinePayment"],
  //       permissionMap["canValidateEmployeeExit"],
  //       // Reports (View only)
  //       permissionMap["canViewDefaulterReport"],
  //       permissionMap["canViewQueueReport"],
  //       permissionMap["canViewAllocationReport"],
  //       permissionMap["canViewFineReport"],
  //       permissionMap["canViewInventoryReport"],
  //       permissionMap["canExportReports"],
  //       // Mobile-App-Facing (All)
  //       permissionMap["canViewIssueRequests"],
  //       permissionMap["canApproveIssueRequest"],
  //       permissionMap["canViewDonationInterests"],
  //       permissionMap["canApproveDonationInterest"],
  //       permissionMap["canViewItemAcquisitionRequests"],
  //       permissionMap["canProcessItemAcquisitionRequests"],
  //     ],
  //     immutable: true,
  //   },
  //   {
  //     roleName: "employee",
  //     description:
  //       "An employee role with access to manage their own tasks and view relevant resources.",
  //     permissions: [
  //       // Basic user permissions for mobile app access
  //       permissionMap["canLoginAdmin"], // If they need admin panel access
  //       permissionMap["canChangeOwnPassword"],
  //       permissionMap["canResetOwnPassword"],
  //       permissionMap["canViewDashboard"], // Limited dashboard view
  //     ],
  //     immutable: true,
  //   },
  //   {
  //     roleName: "family",
  //     description:
  //       "A family role with access to manage family-related resources and view relevant information.",
  //     permissions: [
  //       // Basic user permissions for mobile app access
  //       permissionMap["canLoginAdmin"], // If they need admin panel access
  //       permissionMap["canChangeOwnPassword"],
  //       permissionMap["canResetOwnPassword"],
  //       permissionMap["canViewDashboard"], // Limited dashboard view
  //     ],
  //     immutable: true,
  //   },
  // ]);
  // console.log("Roles inserted successfully.");
  // //4. Inserting a Category
  // await Category.insertMany([
  //   {
  //     name: "Books",
  //     description: "Items that are physical books or publications.",
  //   },
  //   {
  //     name: "Electronics",
  //     description:
  //       "Electronic devices and accessories, such as headphones, tablets, and chargers.",
  //   },
  //   {
  //     name: "Tools",
  //     description:
  //       "Equipment and instruments used for building, repair, or maintenance.",
  //   },
  //   {
  //     name: "Furniture",
  //     description:
  //       "Items like chairs, tables, and other household furnishings.",
  //   },
  //   {
  //     name: "Toys",
  //     description: "Items for recreation, play, or amusement.",
  //   },
  //   {
  //     name: "Clothes",
  //     description: "Apparel and accessories for personal use.",
  //   },
  //   {
  //     name: "Sports Equipment",
  //     description: "Gear and tools for athletic activities and games.",
  //   },
  //   {
  //     name: "Kitchen Accessories",
  //     description:
  //       "Appliances and tools used for cooking and food preparation.",
  //   },
  // ]);
  // console.log("Categories inserted successfully.");
  // // 5. Inventory Items
  // const categories = await Category.find({
  //   name: {
  //     $in: [
  //       "Books",
  //       "Electronics",
  //       "Tools",
  //       "Furniture",
  //       "Toys",
  //       "Clothes",
  //       "Sports Equipment",
  //       "Kitchen Accessories",
  //     ],
  //   },
  // });
  // const categoryMap = categories.reduce((acc: any, cat: any) => {
  //   acc[cat.name] = cat._id;
  //   return acc;
  // }, {});
  // await InventoryItem.insertMany([
  //   {
  //     title: "The Alchemist",
  //     authorOrCreator: "Paulo Coelho",
  //     isbnOrIdentifier: "978-0062315007",
  //     description:
  //       "A novel about a young shepherd boy who travels from Spain to the Egyptian desert in search of treasure.",
  //     publisherOrManufacturer: "HarperOne",
  //     publicationYear: 1988,
  //     price: new mongoose.Types.Decimal128("12.99"),
  //     quantity: 5,
  //     availableCopies: 5,
  //     categoryId: categoryMap["Books"],
  //     barcode: "BOOK-001",
  //     defaultReturnPeriod: 30,
  //     mediaUrl: "https://example.com/images/alchemist.jpg",
  //     status: "Available",
  //   },
  //   {
  //     title: "Wireless Headphones",
  //     authorOrCreator: "Sony",
  //     isbnOrIdentifier: "B09V3T7N2F",
  //     description:
  //       "Noise-cancelling over-ear headphones with long battery life.",
  //     publisherOrManufacturer: "Sony",
  //     publicationYear: 2024,
  //     price: new mongoose.Types.Decimal128("199.99"),
  //     quantity: 3,
  //     availableCopies: 3,
  //     categoryId: categoryMap["Electronics"],
  //     barcode: "ELEC-001",
  //     defaultReturnPeriod: 14,
  //     mediaUrl: "https://example.com/images/headphones.jpg",
  //     status: "Available",
  //   },
  //   {
  //     title: "Cordless Drill",
  //     authorOrCreator: "DeWalt",
  //     isbnOrIdentifier: "DCD771C2",
  //     description: "20V MAX Cordless Drill/Driver Kit.",
  //     publisherOrManufacturer: "DeWalt",
  //     publicationYear: 2023,
  //     price: new mongoose.Types.Decimal128("125.00"),
  //     quantity: 2,
  //     availableCopies: 2,
  //     categoryId: categoryMap["Tools"],
  //     barcode: "TOOL-001",
  //     defaultReturnPeriod: 7,
  //     mediaUrl: "https://example.com/images/drill.jpg",
  //     status: "Available",
  //   },
  //   {
  //     title: "Office Chair",
  //     authorOrCreator: "Herman Miller",
  //     isbnOrIdentifier: "EMBODY-CHAIR",
  //     description: "Ergonomic chair designed for long hours of work.",
  //     publisherOrManufacturer: "Herman Miller",
  //     publicationYear: 2021,
  //     price: new mongoose.Types.Decimal128("1499.00"),
  //     quantity: 1,
  //     availableCopies: 1,
  //     categoryId: categoryMap["Furniture"],
  //     barcode: "FURN-001",
  //     defaultReturnPeriod: 90,
  //     mediaUrl: "https://example.com/images/chair.jpg",
  //     status: "Available",
  //   },
  //   {
  //     title: "LEGO City Set",
  //     authorOrCreator: "LEGO",
  //     isbnOrIdentifier: "60287",
  //     description: "Police Patrol Boat building set with mini-figures.",
  //     publisherOrManufacturer: "LEGO",
  //     publicationYear: 2023,
  //     price: new mongoose.Types.Decimal128("29.99"),
  //     quantity: 10,
  //     availableCopies: 10,
  //     categoryId: categoryMap["Toys"],
  //     barcode: "TOY-001",
  //     defaultReturnPeriod: 10,
  //     mediaUrl: "https://example.com/images/lego.jpg",
  //     status: "Available",
  //   },
  //   {
  //     title: "Winter Jacket",
  //     authorOrCreator: "The North Face",
  //     isbnOrIdentifier: "NF0A3K26-V3B",
  //     description: "Men's waterproof winter jacket, size Medium.",
  //     publisherOrManufacturer: "The North Face",
  //     publicationYear: 2022,
  //     price: new mongoose.Types.Decimal128("250.00"),
  //     quantity: 2,
  //     availableCopies: 2,
  //     categoryId: categoryMap["Clothes"],
  //     barcode: "CLTH-001",
  //     defaultReturnPeriod: 30,
  //     mediaUrl: "https://example.com/images/jacket.jpg",
  //     status: "Available",
  //   },
  //   {
  //     title: "Yoga Mat",
  //     authorOrCreator: "Gaiam",
  //     isbnOrIdentifier: "614820",
  //     description: "Extra thick, non-slip yoga mat for comfort and stability.",
  //     publisherOrManufacturer: "Gaiam",
  //     publicationYear: 2024,
  //     price: new mongoose.Types.Decimal128("35.50"),
  //     quantity: 4,
  //     availableCopies: 4,
  //     categoryId: categoryMap["Sports Equipment"],
  //     barcode: "SPRT-001",
  //     defaultReturnPeriod: 15,
  //     mediaUrl: "https://example.com/images/yogamat.jpg",
  //     status: "Available",
  //   },
  //   {
  //     title: "Stand Mixer",
  //     authorOrCreator: "KitchenAid",
  //     isbnOrIdentifier: "KSM150PSER",
  //     description:
  //       "Artisan Series 5-quart tilt-head stand mixer in empire red.",
  //     publisherOrManufacturer: "KitchenAid",
  //     publicationYear: 2023,
  //     price: new mongoose.Types.Decimal128("450.00"),
  //     quantity: 1,
  //     availableCopies: 1,
  //     categoryId: categoryMap["Kitchen Accessories"],
  //     barcode: "KICH-001",
  //     defaultReturnPeriod: 20,
  //     mediaUrl: "https://example.com/images/mixer.jpg",
  //     status: "Available",
  //   },
  // ]);
  // console.log("Sample inventory items inserted successfully.");
  // // 6.Inserting the System Settings
  // await Setting.create({
  //   libraryName: "Central Library",
  //   contactEmail: "contact@centrallibrary.com",
  //   phoneNumber: "+91-9876543210",
  //   address: "123 Library Road, Anytown, 12345",
  //   operationalHours: "Monday - Saturday: 9:00 AM - 7:00 PM",
  //   borrowingLimits: {
  //     maxConcurrentIssuedItems: 5,
  //     maxConcurrentQueues: 3,
  //     maxPeriodExtensions: 2,
  //     extensionPeriodDays: 7,
  //   },
  //   fineRates: {
  //     overdueFineRatePerDay: 5,
  //     lostItemBaseFine: 500,
  //     damagedItemBaseFine: 250,
  //     fineGracePeriodDays: 3,
  //   },
  // });
  // console.log("System settings entry created successfully.");
  //7. Inserting Fines
  // const fines = [
  //   {
  //     userId: "68b5a4c91ebb4f744fbc1509",
  //     itemId: "68b1af1a8197b70dde91af3b",
  //     reason: "Overdue",
  //     amountIncurred: 100,
  //     amountPaid: 50,
  //     outstandingAmount: 50,
  //     paymentDetails: {
  //       paymentMethod: "Cash",
  //       transactionId: "TXN1001",
  //     },
  //     status: "Outstanding",
  //     managedByAdminId: "68b5a3dbb2499c66843c1469",
  //   },
  //   {
  //     userId: "68b5ea2b3bc30eb130e8bb17",
  //     itemId: "68b1af1a8197b70dde91af37",
  //     reason: "Damaged",
  //     amountIncurred: 250,
  //     amountPaid: 250,
  //     outstandingAmount: 0,
  //     paymentDetails: {
  //       paymentMethod: "Card",
  //       transactionId: "TXN1002",
  //     },
  //     status: "Paid",
  //     managedByAdminId: "68b5a3dbb2499c66843c1469",
  //     dateSettled: new Date(),
  //   },
  // ];
  // await Fine.insertMany(fines);
  // console.log("Fines seeded successfully!");
  //8. System Restrictions
  // const settings = [
  //   {
  //     libraryName: "Central City Library",
  //     contactEmail: "info@centrallibrary.org",
  //     phoneNumber: "+91-9876543210",
  //     address: "123 Library Street, Pune, India",
  //     operationalHours: "Mon-Sat: 9 AM - 7 PM",
  //     borrowingLimits: {
  //       maxConcurrentIssuedItems: 5,
  //       maxConcurrentQueues: 3,
  //       maxPeriodExtensions: 2,
  //       extensionPeriodDays: 7,
  //     },
  //     fineRates: {
  //       overdueFineRatePerDay: 5,
  //       lostItemBaseFine: 500,
  //       damagedItemBaseFine: 300,
  //       fineGracePeriodDays: 2,
  //     },
  //     notificationChannels: {
  //       email: {
  //         enabled: true,
  //         smtpServer: "smtp.gmail.com",
  //         port: 587,
  //         username: "noreply@centrallibrary.org",
  //         password: "securepassword123",
  //       },
  //       whatsapp: {
  //         enabled: true,
  //         provider: "Twilio",
  //         apiKey: "whatsapp-api-key-123",
  //         phoneNumber: "+919876543210",
  //       },
  //     },
  //     notificationTemplates: {
  //       bookIssued: {
  //         emailSubject: "Book Issued Successfully",
  //         emailBody:
  //           "Hello {{user}}, you have issued {{bookTitle}}. Return it by {{dueDate}}.",
  //         whatsappMessage:
  //           "Book '{{bookTitle}}' issued. Return by {{dueDate}}.",
  //       },
  //       bookOverdue: {
  //         emailSubject: "Overdue Book Reminder",
  //         emailBody:
  //           "Dear {{user}}, your book '{{bookTitle}}' is overdue. Fine applies: ₹{{fine}}.",
  //         whatsappMessage: "'{{bookTitle}}' is overdue. Please return ASAP.",
  //       },
  //       bookReturned: {
  //         emailSubject: "Book Returned Successfully",
  //         emailBody:
  //           "Hello {{user}}, you have returned '{{bookTitle}}'. Thank you!",
  //         whatsappMessage: "'{{bookTitle}}' returned successfully.",
  //       },
  //     },
  //   },
  // ];
  // await Setting.deleteMany();
  // await Setting.insertMany(settings);
  // console.log("Settings added successfully!");
  //9. Donations
  //   await Donation.insertMany([
  //   {
  //     userId: new mongoose.Types.ObjectId("64f8c0a4f1a2b1c3d4567890"),
  //     itemType: new mongoose.Types.ObjectId("64f8c1b9f1a2b1c3d4567891"),
  //     title: "Warm Winter Jacket",
  //     description: "A slightly used winter jacket, size L.",
  //     photos: "https://example.com/uploads/jacket.jpg",
  //     preferredContactMethod: "whatsApp",
  //     status: "Pending",
  //   },
  //   {
  //     userId: new mongoose.Types.ObjectId("64f8c0a4f1a2b1c3d4567892"),
  //     itemType: new mongoose.Types.ObjectId("64f8c1b9f1a2b1c3d4567893"),
  //     title: "Children's Story Books",
  //     description: "A collection of 20 illustrated children's books.",
  //     photos: "https://example.com/uploads/books.jpg",
  //     preferredContactMethod: "Email",
  //     status: "Accepted",
  //   },
  // ]);
  // console.log("Donations seeded");
  //10. Issued Items
  // const issuedItemsSeed = [
  //   {
  //     itemId: new mongoose.Types.ObjectId("68b1af1a8197b70dde91af39"),
  //     userId: new mongoose.Types.ObjectId("68b5a4c91ebb4f744fbc1509"),
  //     issuedDate: new Date("2025-09-01"),
  //     dueDate: new Date("2025-09-15"),
  //     issuedBy: new mongoose.Types.ObjectId("68b5a4c91ebb4f744fbc1509"), // Admin/Staff User ID
  //     returnedTo: null,
  //     returnDate: null,
  //     status: "Issued",
  //     extensionCount: 0,
  //     maxExtensionAllowed: 2,
  //     fineId: null,
  //   },
  //   {
  //     itemId: new mongoose.Types.ObjectId("68b1af1a8197b70dde91af3e"),
  //     userId: new mongoose.Types.ObjectId("68b5a4c91ebb4f744fbc1509"),
  //     issuedDate: new Date("2025-08-15"),
  //     dueDate: new Date("2025-08-30"),
  //     issuedBy: new mongoose.Types.ObjectId("68b5a4c91ebb4f744fbc1509"),
  //     returnedTo: new mongoose.Types.ObjectId("68b5a4c91ebb4f744fbc1509"),
  //     returnDate: new Date("2025-08-29"),
  //     status: "Returned",
  //     extensionCount: 1,
  //     maxExtensionAllowed: 2,
  //     fineId: null,
  //   },
  // ];
  // await IssuedItem.deleteMany({});
  // await IssuedItem.insertMany(issuedItemsSeed);
  // console.log("Issued items seeded successfully");
  // //11. requested items
  // const seedData = [
  //     {
  //       userId: new mongoose.Types.ObjectId("68b5a4c91ebb4f744fbc1509"),
  //       title: "Clean Code",
  //       authorOrCreator: "Robert C. Martin",
  //       itemType: new mongoose.Types.ObjectId("68b1ac31789a0550e05d7866"),
  //       reasonForRequest: "Important for learning software craftsmanship",
  //       status: "Pending",
  //     },
  //     {
  //       userId: new mongoose.Types.ObjectId("68b5a4c91ebb4f744fbc1509"),
  //       title: "Arduino Kit",
  //       authorOrCreator: "Arduino Team",
  //       itemType: new mongoose.Types.ObjectId("68b1ac31789a0550e05d7866"),
  //       reasonForRequest: "Required for IoT workshop project",
  //       status: "Approved",
  //     }
  //   ];
  //   await ItemRequest.deleteMany();
  //   await ItemRequest.insertMany(seedData);
  //   console.log("ItemRequests seeded successfully!");
  //12. queue
  // const queues = [
  //   {
  //     itemId: new mongoose.Types.ObjectId("68b1af1a8197b70dde91af3e"),
  //     queueMembers: [
  //       {
  //         userId: new mongoose.Types.ObjectId("68b5a4c91ebb4f744fbc1509"), // User ID
  //         position: 1,
  //         dateJoined: new Date("2025-09-01"),
  //       },
  //       {
  //         userId: new mongoose.Types.ObjectId("68b5ea2b3bc30eb130e8bb17"),
  //         position: 2,
  //         dateJoined: new Date("2025-09-02"),
  //       },
  //     ],
  //   },
  //   {
  //     itemId: new mongoose.Types.ObjectId("68b1af1a8197b70dde91af39"),
  //     queueMembers: [
  //       {
  //         userId: new mongoose.Types.ObjectId("68b5a4c91ebb4f744fbc1509"),
  //         position: 1,
  //         dateJoined: new Date("2025-09-03"),
  //       },
  //     ],
  //   },
  // ];
  // await Queue.insertMany(queues);
  // console.log("Queue data seeded successfully!");
}

(async () => {
  try {
    await connect();
    await seedDatabase();
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
})();
