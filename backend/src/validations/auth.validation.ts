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
