import { Types } from "mongoose";
import { permission } from "process";
import { z } from "zod";

export const registrationSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required."),
    email: z.string().email("Invalid email address.").trim().toLowerCase(),
    userName: z.string().trim().min(1, "Username is required........"),
    password: z.string().min(8, "Password must be at least 8 characters long."),
    role: z.enum(["employee", "familyMember"]),
    emp_id: z.string().optional(),
    ass_emp_id: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === "employee" && !data.emp_id) {
        return false;
      }
      if (data.role === "familyMember" && !data.ass_emp_id) {
        return false;
      }
      return true;
    },
    {
      message: "Conditional fields are required based on the role.",
      path: ["emp_id", "ass_emp_id"],
    }
  );

export const loginSchema = z.object({
  email: z.string().trim().min(1, "email is required"),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

export const createUserSchema = z.object({
  fullName: z.string().trim().min(1, "Atleast 1 character"),
  email: z.string().email("Invalid email address.").trim().toLowerCase(),
  userName: z.string().trim(),
  password: z.string().trim(),
  role: z.string().trim(),
  emp_id: z.string().trim(),
  ass_emp_id: z.string().trim().optional(),
});

export const RoleSchema = z.object({
  roleName: z.string().trim().min(2, "at least 2 characters"),
  description: z.string().trim().min(5, "at least 5 characters of description"),
  permissions: z.array(z.string().min(1, "Permission ID required")),
});

export const InventoryItemsSchema = z.object({
  title: z.string().trim().min(2, "At least 2 characters required"),
  authorOrCreator: z.string().trim().optional(),
  isbnOrIdentifier: z.string().trim().min(1, "ISBN/Identifier is required"),
  description: z.string().trim().optional(),
  publisherOrManufacturer: z.string().trim().optional(),
  publicationYear: z.number().int().min(0, "Invalid year").optional(),
  price: z.number().nonnegative("Price must be non-negative"),
  quantity: z.number().int().nonnegative("Quantity must be non-negative"),
  availableCopies: z
    .number()
    .int()
    .nonnegative("Available copies must be non-negative"),

  categoryId: z.string().min(1, "CategoryId is required"),
  subcategoryId: z.string().optional(),
  barcode: z.string().trim().min(1, "Barcode is required"),
  defaultReturnPeriod: z.number().int().optional(),
  mediaUrl: z.string().url("Invalid URL").optional(),
  status: z
    .enum(["Available", "Issued", "Lost", "Damaged"])
    .default("Available"),
});

export const InventoryItemsUpdateSchema = InventoryItemsSchema.partial();

export const CategorySchema = z.object({
  name: z.string().trim().min(2, "atleast 2 character"),
  description: z.string().trim(),
  defaultReturnPeriod: z
    .number()
    .int()
    .nonnegative("return period must be non-negative")
    .optional(),
});

export const CategoryUpdateSchema = CategorySchema.partial();

export const FineSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  itemId: z.string().min(1, "itemId is required"),
  reason: z.enum(["Overdue", "Damaged"], {
    message: "reason must be either 'Overdue' or 'Damaged'",
  }),
  amountIncurred: z.number().positive("amountIncurred must be greater than 0"),
  amountPaid: z
    .number()
    .min(0, "amountPaid cannot be negative")
    .optional()
    .default(0),
  outstandingAmount: z
    .number()
    .min(0, "outstandingAmount cannot be negative")
    .optional(),
  paymentDetails: z
    .object({
      paymentMethod: z.enum(["Cash", "Card"]).optional(),
      transactionId: z.string().trim().optional(),
    })
    .optional(),
  dateIncurred: z.date().optional(),
  dateSettled: z.date().nullable().optional(),
  status: z.enum(["Outstanding", "Paid"]).optional(),
  managedByAdminId: z.string().min(1, "managedByAdminId is required"),
});

export const FineUpdateSchema = FineSchema.partial();

export const SystemRestrictionsSchema = z.object({
  libraryName: z.string().min(2, "Library name must be at least 2 characters"),
  operationalHours: z.string().min(2, "Operational hours are required"),
  borrowingLimits: z.object({
    maxConcurrentIssuedItems: z.number().int().nonnegative().optional(),
    maxConcurrentQueues: z.number().int().nonnegative().optional(),
    maxPeriodExtensions: z.number().int().nonnegative().optional(),
    extensionPeriodDays: z.number().int().nonnegative().optional(),
  }).optional(),
  fineRates: z.object({
    overdueFineRatePerDay: z.number().nonnegative().optional(),
    lostItemBaseFine: z.number().nonnegative().optional(),
    damagedItemBaseFine: z.number().nonnegative().optional(),
    fineGracePeriodDays: z.number().nonnegative().optional(),
  }).optional(),
});

export const SystemRestrictionsUpdateSchema = SystemRestrictionsSchema.partial();
