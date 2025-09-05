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

// A list of the permission keys we need to find.
const permissionKeys = [
  "admin:manageUsers",
  "admin:viewAllUsers",
  "admin:approveUser",
  "admin:rejectUser",
  "admin:blockUser",
  "admin:unblockUser",
  "admin:viewUserRequests",
  "admin:manageItems",
  "admin:viewAllItems",
  "admin:verifyItem",
  "admin:removeItem",
  "admin:addCategory",
  "admin:editCategory",
  "admin:deleteCategory",
  "admin:manageRentals",
  "admin:viewAllRentals",
  "admin:viewQueues",
  "admin:assignItemFromQueue",
  "admin:removeUserFromQueue",
  "admin:markRentalAsReturned",
  "user:viewProfile",
  "user:editProfile",
  "user:addProfilePicture",
  "user:browseItems",
  "user:viewItemDetails",
  "user:addItem",
  "user:requestRental",
  "user:joinQueue",
  "user:returnItem",
  "user:viewNotifications",
  "user:dismissNotification",
  "user:viewMyRequests",
  "user:makeNewItemRequest",
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

  // 2. Inserting a Role
  // const permissions = await Permission.find({
  //   permissionKey: { $in: permissionKeys },
  // });

  // const permissionMap = permissions.reduce((acc: any, perm: any) => {
  //   acc[perm.permissionKey] = perm._id;
  //   return acc;
  // }, {});

  // await Role.insertMany([
  //   {
  //     roleName: "superAdmin",
  //     description:
  //       "The top-level administrator with full access to all system features and the ability to manage other roles.",
  //     permissions: [
  //       permissionMap["admin:manageUsers"],
  //       permissionMap["admin:viewAllUsers"],
  //       permissionMap["admin:approveUser"],
  //       permissionMap["admin:rejectUser"],
  //       permissionMap["admin:blockUser"],
  //       permissionMap["admin:unblockUser"],
  //       permissionMap["admin:viewUserRequests"],
  //       permissionMap["admin:manageItems"],
  //       permissionMap["admin:viewAllItems"],
  //       permissionMap["admin:verifyItem"],
  //       permissionMap["admin:removeItem"],
  //       permissionMap["admin:addCategory"],
  //       permissionMap["admin:editCategory"],
  //       permissionMap["admin:deleteCategory"],
  //       permissionMap["admin:manageRentals"],
  //       permissionMap["admin:viewAllRentals"],
  //       permissionMap["admin:viewQueues"],
  //       permissionMap["admin:assignItemFromQueue"],
  //       permissionMap["admin:removeUserFromQueue"],
  //       permissionMap["admin:markRentalAsReturned"],
  //     ],
  //     immutable: true,
  //   },
  //   {
  //     roleName: "Admin",
  //     description:
  //       "Administrator role with full system access. Manages all users, items, and rentals.",
  //     permissions: [
  //       permissionMap["admin:manageUsers"],
  //       permissionMap["admin:manageItems"],
  //       permissionMap["admin:manageRentals"],
  //       permissionMap["admin:viewUserRequests"],
  //     ],
  //     immutable: true,
  //   },
  //   {
  //     roleName: "librarian",
  //     description:
  //       "A restricted admin role that can manage daily library operations but not sensitive user data.",
  //     permissions: [
  //       permissionMap["admin:viewAllUsers"],
  //       permissionMap["admin:viewAllItems"],
  //       permissionMap["admin:viewAllRentals"],
  //       permissionMap["admin:verifyItem"],
  //       permissionMap["admin:markRentalAsReturned"],
  //       permissionMap["admin:addCategory"],
  //     ],
  //     immutable: true,
  //   },
  //   {
  //     roleName: "employee",
  //     description:
  //       "An employee role with limited access to manage their own tasks and view relevant resources.",
  //     permissions: [
  //       permissionMap["user:viewProfile"],
  //       permissionMap["user:editProfile"],
  //       permissionMap["user:addProfilePicture"],
  //       permissionMap["user:browseItems"],
  //       permissionMap["user:viewItemDetails"],
  //       permissionMap["user:addItem"],
  //       permissionMap["user:requestRental"],
  //       permissionMap["user:joinQueue"],
  //       permissionMap["user:returnItem"],
  //       permissionMap["user:viewNotifications"],
  //       permissionMap["user:dismissNotification"],
  //       permissionMap["user:viewMyRequests"],
  //       permissionMap["user:makeNewItemRequest"],
  //     ],
  //     immutable: true,
  //   },
  //   {
  //     roleName: "family",
  //     description:
  //       "A family role with access to manage family-related resources and view relevant information.",
  //     permissions: [
  //       permissionMap["user:viewProfile"],
  //       permissionMap["user:editProfile"],
  //       permissionMap["user:addProfilePicture"],
  //       permissionMap["user:browseItems"],
  //       permissionMap["user:viewItemDetails"],
  //       permissionMap["user:addItem"],
  //       permissionMap["user:requestRental"],
  //       permissionMap["user:joinQueue"],
  //       permissionMap["user:returnItem"],
  //       permissionMap["user:viewNotifications"],
  //       permissionMap["user:dismissNotification"],
  //       permissionMap["user:viewMyRequests"],
  //       permissionMap["user:makeNewItemRequest"],
  //     ],
  //     immutable: true,
  //   },
  // ]);

  // console.log("Roles inserted successfully.");

  // //3. Inserting a permissions
  // await Permission.insertMany([
  //   {
  //     permissionKey: "admin:manageUsers",
  //     description: "A master permission to perform all user-related actions.",
  //   },
  //   {
  //     permissionKey: "admin:viewAllUsers",
  //     description:
  //       "Allows viewing a list of all users, including their status.",
  //   },
  //   {
  //     permissionKey: "admin:approveUser",
  //     description:
  //       "Allows changing a user's status from 'pending' to 'approved'.",
  //   },
  //   {
  //     permissionKey: "admin:rejectUser",
  //     description:
  //       "Allows changing a user's status from 'pending' to 'rejected'.",
  //   },
  //   {
  //     permissionKey: "admin:blockUser",
  //     description:
  //       "Allows changing a user's status to 'blocked', restricting their access.",
  //   },
  //   {
  //     permissionKey: "admin:unblockUser",
  //     description:
  //       "Allows changing a blocked user's status to 'approved' to restore their access.",
  //   },
  //   {
  //     permissionKey: "admin:viewUserRequests",
  //     description: "Allows viewing the history of all user-initiated requests.",
  //   },
  //   {
  //     permissionKey: "admin:manageItems",
  //     description: "A master permission for all item-related actions.",
  //   },
  //   {
  //     permissionKey: "admin:viewAllItems",
  //     description: "Allows viewing a list of all items in the system.",
  //   },
  //   {
  //     permissionKey: "admin:verifyItem",
  //     description:
  //       "Allows approving a new item submission, changing its status to 'available'.",
  //   },
  //   {
  //     permissionKey: "admin:removeItem",
  //     description: "Allows permanently removing an item from the system.",
  //   },
  //   {
  //     permissionKey: "admin:addCategory",
  //     description: "Allows creating a new item category.",
  //   },
  //   {
  //     permissionKey: "admin:editCategory",
  //     description: "Allows modifying an existing category.",
  //   },
  //   {
  //     permissionKey: "admin:deleteCategory",
  //     description: "Allows removing an existing category.",
  //   },
  //   {
  //     permissionKey: "admin:manageRentals",
  //     description:
  //       "A master permission for all rental and queue-related actions.",
  //   },
  //   {
  //     permissionKey: "admin:viewAllRentals",
  //     description:
  //       "Allows viewing all rental activity, including active, overdue, and returned items.",
  //   },
  //   {
  //     permissionKey: "admin:viewQueues",
  //     description:
  //       "Allows viewing the waiting list of users for a specific item.",
  //   },
  //   {
  //     permissionKey: "admin:assignItemFromQueue",
  //     description: "Allows assigning an item to the next user in the queue.",
  //   },
  //   {
  //     permissionKey: "admin:removeUserFromQueue",
  //     description: "Allows manually removing a user from an item's queue.",
  //   },
  //   {
  //     permissionKey: "admin:markRentalAsReturned",
  //     description: "Allows manually marking an item as returned.",
  //   },

  //   // User Permissions
  //   {
  //     permissionKey: "user:viewProfile",
  //     description: "Allows a user to view their own profile information.",
  //   },
  //   {
  //     permissionKey: "user:editProfile",
  //     description: "Allows a user to modify their own profile details.",
  //   },
  //   {
  //     permissionKey: "user:addProfilePicture",
  //     description: "Allows a user to add or change a profile picture.",
  //   },
  //   {
  //     permissionKey: "user:browseItems",
  //     description: "Allows a user to view all available items and categories.",
  //   },
  //   {
  //     permissionKey: "user:viewItemDetails",
  //     description:
  //       "Allows a user to view detailed information about a specific item.",
  //   },
  //   {
  //     permissionKey: "user:addItem",
  //     description:
  //       "Allows a user to add a new item to the library for admin review.",
  //   },
  //   {
  //     permissionKey: "user:requestRental",
  //     description: "Allows a user to submit a request to rent an item.",
  //   },
  //   {
  //     permissionKey: "user:joinQueue",
  //     description:
  //       "Allows a user to join the waiting list for a currently rented item.",
  //   },
  //   {
  //     permissionKey: "user:returnItem",
  //     description:
  //       "Allows a user to mark an item as returned on or before the due date.",
  //   },
  //   {
  //     permissionKey: "user:viewNotifications",
  //     description: "Allows a user to view a list of their own notifications.",
  //   },
  //   {
  //     permissionKey: "user:dismissNotification",
  //     description: "Allows a user to clear a notification from their list.",
  //   },
  //   {
  //     permissionKey: "user:viewMyRequests",
  //     description:
  //       "Allows a user to view the status of their submitted rental and item requests.",
  //   },
  //   {
  //     permissionKey: "user:makeNewItemRequest",
  //     description:
  //       "Allows a user to request for an item that is not listed in the library.",
  //   },
  // ]);

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
  const settings = [
      {
        libraryName: "Central City Library",
        contactEmail: "info@centrallibrary.org",
        phoneNumber: "+91-9876543210",
        address: "123 Library Street, Pune, India",
        operationalHours: "Mon-Sat: 9 AM - 7 PM",

        borrowingLimits: {
          maxConcurrentIssuedItems: 5,
          maxConcurrentQueues: 3,
          maxPeriodExtensions: 2,
          extensionPeriodDays: 7,
        },

        fineRates: {
          overdueFineRatePerDay: 5,
          lostItemBaseFine: 500,
          damagedItemBaseFine: 300,
          fineGracePeriodDays: 2,
        },

        notificationChannels: {
          email: {
            enabled: true,
            smtpServer: "smtp.gmail.com",
            port: 587,
            username: "noreply@centrallibrary.org",
            password: "securepassword123",
          },
          whatsapp: {
            enabled: true,
            provider: "Twilio",
            apiKey: "whatsapp-api-key-123",
            phoneNumber: "+919876543210",
          },
        },

        notificationTemplates: {
          bookIssued: {
            emailSubject: "Book Issued Successfully",
            emailBody: "Hello {{user}}, you have issued {{bookTitle}}. Return it by {{dueDate}}.",
            whatsappMessage: "Book '{{bookTitle}}' issued. Return by {{dueDate}}.",
          },
          bookOverdue: {
            emailSubject: "Overdue Book Reminder",
            emailBody: "Dear {{user}}, your book '{{bookTitle}}' is overdue. Fine applies: ₹{{fine}}.",
            whatsappMessage: "'{{bookTitle}}' is overdue. Please return ASAP.",
          },
          bookReturned: {
            emailSubject: "Book Returned Successfully",
            emailBody: "Hello {{user}}, you have returned '{{bookTitle}}'. Thank you!",
            whatsappMessage: "'{{bookTitle}}' returned successfully.",
          },
        },
      },
    ];

    await Setting.deleteMany(); 
    await Setting.insertMany(settings);

    console.log("Settings added successfully!");
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
