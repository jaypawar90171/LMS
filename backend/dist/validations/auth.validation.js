"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemRequestUpdateSchema = exports.itemRequestSchema = exports.SystemRestrictionsUpdateSchema = exports.SystemRestrictionsSchema = exports.FineUpdateSchema = exports.FineSchema = exports.CategoryUpdateSchema = exports.CategorySchema = exports.InventoryItemsUpdateSchema = exports.InventoryItemsSchema = exports.RoleSchema = exports.updateUserSchema = exports.createUserSchema = exports.loginSchema = exports.registrationSchema = void 0;
const zod_1 = require("zod");
exports.registrationSchema = zod_1.z
    .object({
    fullName: zod_1.z.string().trim().min(1, "Full name is required."),
    email: zod_1.z.string().email("Invalid email address.").trim().toLowerCase(),
    userName: zod_1.z.string().trim().min(1, "Username is required"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters long."),
    role: zod_1.z.enum(["employee", "familyMember"]),
    emp_id: zod_1.z.string().optional(),
    ass_emp_id: zod_1.z.string().optional(),
})
    .refine((data) => {
    if (data.role === "employee" && !data.emp_id) {
        return false;
    }
    if (data.role === "familyMember" && !data.ass_emp_id) {
        return false;
    }
    return true;
}, {
    message: "Conditional fields are required based on the role.",
    path: ["emp_id", "ass_emp_id"],
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().min(1, "email is required"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters long."),
    rememberMe: zod_1.z.boolean(),
});
// export const createUserSchema = z.object({
//   fullName: z.string().trim().min(1, "Atleast 1 character"),
//   email: z.string().email("Invalid email address.").trim().toLowerCase(),
//   userName: z.string().trim(),
//   password: z.string().trim(),
//   role: z.string().trim(),
//   emp_id: z.string().trim(),
//   ass_emp_id: z.string().trim().optional(),
// });
exports.createUserSchema = zod_1.z
    .object({
    fullName: zod_1.z.string().trim().min(1, "Full name is required"),
    email: zod_1.z.string().email("Invalid email address.").trim().toLowerCase(),
    userName: zod_1.z.string().trim().min(1, "Username is required"),
    password: zod_1.z.string().trim().min(1, "Password is required"),
    role: zod_1.z.string().trim(),
    emp_id: zod_1.z.string().trim().optional(),
    ass_emp_id: zod_1.z.string().trim().optional(),
    passwordResetRequired: zod_1.z.boolean().optional(),
})
    .superRefine((data, ctx) => {
    // Check for Employee role
    if (data.role === "employee" && !data.emp_id) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: "Employee ID is required for the Employee role.",
            path: ["emp_id"],
        });
    }
    // Check for Family Member role
    if (data.role === "family" && !data.ass_emp_id) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: "The main Employee's User ID must be provided.",
            path: ["ass_emp_id"],
        });
    }
});
exports.updateUserSchema = exports.createUserSchema.partial();
exports.RoleSchema = zod_1.z.object({
    roleName: zod_1.z.string().trim().min(2, "at least 2 characters"),
    description: zod_1.z.string().trim().min(5, "at least 5 characters of description"),
    permissions: zod_1.z.array(zod_1.z.string().min(1, "Permission ID required")),
});
exports.InventoryItemsSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(2, "At least 2 characters required"),
    authorOrCreator: zod_1.z.string().trim().optional(),
    isbnOrIdentifier: zod_1.z.preprocess((val) => (val === "" ? undefined : val), zod_1.z
        .string()
        .trim()
        .min(1, "ISBN/Identifier must not be empty if provided")
        .optional()),
    description: zod_1.z.string().trim().optional(),
    publisherOrManufacturer: zod_1.z.string().trim().optional(),
    publicationYear: zod_1.z.coerce.number().int().min(0, "Invalid year").optional(),
    price: zod_1.z.coerce.number().nonnegative("Price must be non-negative"),
    quantity: zod_1.z.coerce
        .number()
        .int()
        .nonnegative("Quantity must be non-negative"),
    availableCopies: zod_1.z.coerce
        .number()
        .int()
        .nonnegative("Available copies must be non-negative"),
    categoryId: zod_1.z.string().min(1, "CategoryId is required"),
    subcategoryId: zod_1.z.string().optional(),
    barcode: zod_1.z.preprocess((val) => (val === "" ? undefined : val), zod_1.z.string().trim().min(1, "Barcode must not be empty if provided").optional()),
    defaultReturnPeriod: zod_1.z.coerce.number().int().optional(),
    mediaUrl: zod_1.z.string().optional(),
    status: zod_1.z
        .enum(["Available", "Issued", "Lost", "Damaged"])
        .default("Available"),
    size: zod_1.z.enum(["XS", "S", "M", "L", "XL", "XXL"]).optional(),
    color: zod_1.z.string().optional(),
    genderType: zod_1.z.enum(["Men", "Women", "Unisex", "Kids"]).optional(),
    warrantyPeriod: zod_1.z.string().optional(),
    features: zod_1.z.array(zod_1.z.string()).optional(),
    dimensions: zod_1.z.string().optional(),
    usageType: zod_1.z.string().optional(),
    usage: zod_1.z.string().optional(),
    ageGroup: zod_1.z.enum(["0-3", "4-7", "8-12", "13+"]).optional(),
    powerSource: zod_1.z.string().optional(),
});
exports.InventoryItemsUpdateSchema = exports.InventoryItemsSchema.partial();
exports.CategorySchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, "Category name is required")
        .max(100, "Category name too long"),
    description: zod_1.z
        .string()
        .max(500, "Description too long")
        .optional()
        .default(""),
    parentCategoryId: zod_1.z.string().optional().nullable().default(null),
    defaultReturnPeriod: zod_1.z.number().int().min(1).max(365).optional().default(20),
});
exports.CategoryUpdateSchema = exports.CategorySchema.partial();
exports.FineSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, "userId is required"),
    itemId: zod_1.z.string().min(1, "itemId is required"),
    reason: zod_1.z.enum(["Overdue", "Damaged", "Lost item"], {
        message: "reason must be either 'Overdue' or 'Damaged'",
    }),
    amountIncurred: zod_1.z.number().positive("amountIncurred must be greater than 0"),
    amountPaid: zod_1.z
        .number()
        .min(0, "amountPaid cannot be negative")
        .optional()
        .default(0),
    outstandingAmount: zod_1.z
        .number()
        .min(0, "outstandingAmount cannot be negative")
        .optional(),
    paymentDetails: zod_1.z
        .array(zod_1.z.object({
        paymentMethod: zod_1.z.enum(["Cash", "Card", "Online Transfer"]),
        transactionId: zod_1.z.string().trim().optional(),
        notes: zod_1.z.string().trim().optional(),
    }))
        .optional()
        .default([]),
    dateIncurred: zod_1.z.date().optional(),
    dateSettled: zod_1.z.date().nullable().optional(),
    status: zod_1.z.enum(["Outstanding", "Paid"]).optional(),
});
exports.FineUpdateSchema = exports.FineSchema.partial();
exports.SystemRestrictionsSchema = zod_1.z.object({
    libraryName: zod_1.z.string().min(2, "Library name must be at least 2 characters"),
    operationalHours: zod_1.z.string().min(2, "Operational hours are required"),
    borrowingLimits: zod_1.z
        .object({
        maxConcurrentIssuedItems: zod_1.z.number().int().nonnegative().optional(),
        maxConcurrentQueues: zod_1.z.number().int().nonnegative().optional(),
        maxPeriodExtensions: zod_1.z.number().int().nonnegative().optional(),
        extensionPeriodDays: zod_1.z.number().int().nonnegative().optional(),
    })
        .optional(),
    fineRates: zod_1.z
        .object({
        overdueFineRatePerDay: zod_1.z.number().nonnegative().optional(),
        lostItemBaseFine: zod_1.z.number().nonnegative().optional(),
        damagedItemBaseFine: zod_1.z.number().nonnegative().optional(),
        fineGracePeriodDays: zod_1.z.number().nonnegative().optional(),
    })
        .optional(),
});
exports.SystemRestrictionsUpdateSchema = exports.SystemRestrictionsSchema.partial();
exports.itemRequestSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, "User ID is required"),
    title: zod_1.z.string().min(1, "Title is required").trim(),
    authorOrCreator: zod_1.z.string().trim().optional(),
    itemType: zod_1.z.string().min(1, "Item type (Category ID) is required"),
    reasonForRequest: zod_1.z.string().min(1, "Reason is required").trim(),
    status: zod_1.z.enum(["Pending", "Approved", "Rejected"]).default("Pending"),
    createdAt: zod_1.z.date().optional(),
    updatedAt: zod_1.z.date().optional(),
});
exports.itemRequestUpdateSchema = exports.itemRequestSchema.partial();
