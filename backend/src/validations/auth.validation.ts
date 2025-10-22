import { Types } from "mongoose";
import { permission } from "process";
import { z } from "zod";

export const registrationSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required."),
    email: z.string().email("Invalid email address.").trim().toLowerCase(),
    userName: z.string().trim().min(1, "Username is required"),
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
  rememberMe: z.boolean(),
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

export const createUserSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required"),
    email: z.string().email("Invalid email address.").trim().toLowerCase(),
    userName: z.string().trim().min(1, "Username is required"),
    password: z.string().trim().min(1, "Password is required"),
    role: z.string().trim(),
    emp_id: z.string().trim().optional(),
    ass_emp_id: z.string().trim().optional(),
    passwordResetRequired: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // Check for Employee role
    if (data.role === "employee" && !data.emp_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Employee ID is required for the Employee role.",
        path: ["emp_id"],
      });
    }
    // Check for Family Member role
    if (data.role === "family" && !data.ass_emp_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The main Employee's User ID must be provided.",
        path: ["ass_emp_id"],
      });
    }
  });

export const updateUserSchema = createUserSchema.partial();

export const RoleSchema = z.object({
  roleName: z.string().trim().min(2, "at least 2 characters"),
  description: z.string().trim().min(5, "at least 5 characters of description"),
  permissions: z.array(z.string().min(1, "Permission ID required")),
});

export const InventoryItemsSchema = z.object({
  title: z.string().trim().min(2, "At least 2 characters required"),
  authorOrCreator: z.string().trim().optional(),
  isbnOrIdentifier: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z
      .string()
      .trim()
      .min(1, "ISBN/Identifier must not be empty if provided")
      .optional()
  ),
  description: z.string().trim().optional(),
  publisherOrManufacturer: z.string().trim().optional(),
  publicationYear: z.coerce.number().int().min(0, "Invalid year").optional(),
  price: z.coerce.number().nonnegative("Price must be non-negative"),
  quantity: z.coerce
    .number()
    .int()
    .nonnegative("Quantity must be non-negative"),
  availableCopies: z.coerce
    .number()
    .int()
    .nonnegative("Available copies must be non-negative"),

  categoryId: z.string().min(1, "CategoryId is required"),
  subcategoryId: z.string().optional(),
  barcode: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().trim().min(1, "Barcode must not be empty if provided").optional()
  ),
  defaultReturnPeriod: z.coerce.number().int().optional(),
  mediaUrl: z.string().optional(),
  status: z
    .enum(["Available", "Issued", "Lost", "Damaged"])
    .default("Available"),
  size: z.enum(["XS", "S", "M", "L", "XL", "XXL"]).optional(),
  color: z.string().optional(),
  genderType: z.enum(["Men", "Women", "Unisex", "Kids"]).optional(),
  warrantyPeriod: z.string().optional(),
  features: z.array(z.string()).optional(),
  dimensions: z.string().optional(),
  usageType: z.string().optional(),
  usage: z.string().optional(),
  ageGroup: z.enum(["0-3", "4-7", "8-12", "13+"]).optional(),
  powerSource: z.string().optional(),
});

export const InventoryItemsUpdateSchema = InventoryItemsSchema.partial();

export const CategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Category name too long"),
  description: z
    .string()
    .max(500, "Description too long")
    .optional()
    .default(""),
  parentCategoryId: z.string().optional().nullable().default(null),
  defaultReturnPeriod: z.number().int().min(1).max(365).optional().default(20),
});

export type CategoryInput = z.infer<typeof CategorySchema>;

export const CategoryUpdateSchema = CategorySchema.partial();

export const FineSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  itemId: z.string().min(1, "itemId is required"),
  reason: z.enum(["Overdue", "Damaged", "Lost item"], {
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
    .array(
      z.object({
        paymentMethod: z.enum(["Cash", "Card", "Online Transfer"]),
        transactionId: z.string().trim().optional(),
        notes: z.string().trim().optional(),
      })
    )
    .optional()
    .default([]),
  dateIncurred: z.date().optional(),
  dateSettled: z.date().nullable().optional(),
  status: z.enum(["Outstanding", "Paid"]).optional(),
});

export const FineUpdateSchema = FineSchema.partial();

export const SystemRestrictionsSchema = z.object({
  libraryName: z.string().min(2, "Library name must be at least 2 characters"),
  operationalHours: z.string().min(2, "Operational hours are required"),
  borrowingLimits: z
    .object({
      maxConcurrentIssuedItems: z.number().int().nonnegative().optional(),
      maxConcurrentQueues: z.number().int().nonnegative().optional(),
      maxPeriodExtensions: z.number().int().nonnegative().optional(),
      extensionPeriodDays: z.number().int().nonnegative().optional(),
    })
    .optional(),
  fineRates: z
    .object({
      overdueFineRatePerDay: z.number().nonnegative().optional(),
      lostItemBaseFine: z.number().nonnegative().optional(),
      damagedItemBaseFine: z.number().nonnegative().optional(),
      fineGracePeriodDays: z.number().nonnegative().optional(),
    })
    .optional(),
});

export const SystemRestrictionsUpdateSchema =
  SystemRestrictionsSchema.partial();

export const itemRequestSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  title: z.string().min(1, "Title is required").trim(),
  authorOrCreator: z.string().trim().optional(),
  itemType: z.string().min(1, "Item type (Category ID) is required"),
  reasonForRequest: z.string().min(1, "Reason is required").trim(),
  status: z.enum(["Pending", "Approved", "Rejected"]).default("Pending"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const itemRequestUpdateSchema = itemRequestSchema.partial();
