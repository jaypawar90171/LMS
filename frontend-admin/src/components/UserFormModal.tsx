// src/components/UserFormModal.tsx
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import axios from "axios";
import { User, Role } from "@/interfaces/user.interface"; // Adjust path as needed

interface UserFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  mode: "add" | "edit";
  userData: User | null;
  allRoles: Role[];
  onSuccess: () => void;
}

const userFormSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  username: z.string().min(3, "Username must be at least 3 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().optional(),
  employeeId: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  role: z.string().min(1, "A role must be selected."),
  status: z.enum(["Active", "Inactive", "Locked"]),
  passwordResetRequired: z.boolean(),
});

type UserFormData = z.infer<typeof userFormSchema>;

export const UserFormModal = ({
  isOpen,
  onOpenChange,
  mode,
  userData,
  allRoles,
  onSuccess,
}: UserFormModalProps) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues:
      mode === "edit" && userData
        ? {
            ...userData,
            role: userData.roles[0]?.roleName || "",
            address: userData.address || {},
          }
        : {
            fullName: "",
            username: "",
            email: "",
            password: "",
            employeeId: "",
            phoneNumber: "",
            address: {
              street: "",
              city: "",
              state: "",
              postalCode: "",
              country: "",
            },
            role: "",
            status: "Inactive",
            passwordResetRequired: true,
          },
  });

  const onSubmit = async (data: UserFormData) => {
    const payload: any = {
      fullName: data.fullName,
      userName: data.username, // Corrected key to match backend
      email: data.email,
      role: data.role,
      status: data.status,
      passwordResetRequired: data.passwordResetRequired,
      phoneNumber: data.phoneNumber,
      address: data.address,
    };

    if (data.role.toLowerCase() === "employee" && data.employeeId) {
      payload.emp_id = data.employeeId;
    }

    const apiEndpoint =
      mode === "add"
        ? `http://localhost:3000/api/admin/users`
        : `http://localhost:3000/api/admin/users/${userData?._id}`;

    const apiMethod = mode === "add" ? axios.post : axios.put;

    if (mode === "add" && data.password) {
      payload.password = data.password;
    }

    toast.promise(
      apiMethod(apiEndpoint, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      {
        loading: `${mode === "add" ? "Creating" : "Updating"} user...`,
        success: () => {
          onSuccess();
          onOpenChange(false);
          return `User ${mode === "add" ? "created" : "updated"} successfully!`;
        },
        error: (err) =>
          err.response?.data?.error ||
          `Failed to ${mode === "add" ? "create" : "update"} user.`,
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New User" : "Edit User"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Fill in the details to create a new user."
              : `Editing details for ${userData?.fullName}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="core" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="core">Core Info</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="roles">Roles & Status</TabsTrigger>
            </TabsList>

            <TabsContent value="core" className="space-y-4 py-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" {...register("fullName")} />
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.fullName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input id="username" {...register("username")} />
                {errors.username && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.username.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
              {mode === "add" && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              )}
              <div>
                <Label htmlFor="employeeId">Employee ID (if applicable)</Label>
                <Input id="employeeId" {...register("employeeId")} />
              </div>
            </TabsContent>

            <TabsContent
              value="contact"
              className="grid grid-cols-2 gap-4 py-4"
            >
              <div className="col-span-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" {...register("phoneNumber")} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="street">Street Address</Label>
                <Input id="street" {...register("address.street")} />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register("address.city")} />
              </div>
              <div>
                <Label htmlFor="state">State / Province</Label>
                <Input id="state" {...register("address.state")} />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input id="postalCode" {...register("address.postalCode")} />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input id="country" {...register("address.country")} />
              </div>
            </TabsContent>

            <TabsContent value="roles" className="space-y-4 py-4">
              <div>
                <Label>Role</Label>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {allRoles.map((role) => (
                          <SelectItem key={role._id} value={role.roleName}>
                            {role.roleName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.role && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.role.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Status</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Locked">Locked</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  control={control}
                  name="passwordResetRequired"
                  render={({ field }) => (
                    <Checkbox
                      id="passwordResetRequired"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="passwordResetRequired">
                  Require password reset on next login
                </Label>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {mode === "add" ? "Create User" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
