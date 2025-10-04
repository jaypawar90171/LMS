"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
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
import { User, Role } from "@/interfaces/user.interface";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import { Country, State, City } from "country-state-city";
import { IState, ICity } from "country-state-city";
import type { CountryCode } from "libphonenumber-js";
import { ScrollArea } from "./ui/scroll-area";

export interface Permission {
  _id: string;
  permissionKey: string;
  description: string;
}

const generatePassword = () => {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

interface UserFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  mode: "add" | "edit";
  userData: User | null;
  allRoles: Role[];
  onSuccess: () => void;
}

const userFormSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters."),
    username: z.string().min(3, "Username must be at least 3 characters."),
    email: z.string().email("Invalid email address."),
    password: z.string().optional(),
    phoneNumber: z
      .string()
      .refine((value) => (value ? isValidPhoneNumber(value) : true), {
        message: "Invalid phone number for the selected country.",
      })
      .optional(),
    dateOfBirth: z.string().optional(),
    address: z
      .object({
        street: z.string().optional(),
        country: z.string().min(1, "Country is required."),
        state: z.string().min(1, "State/District is required."),
        city: z.string().min(1, "City is required."),
        postalCode: z.string().optional(),
      })
      .optional(),
    relationshipType: z.enum(["Employee", "Family Member"], {
      message: "Relationship type is required.",
    }),
    employeeId: z.string().optional(),
    associatedEmployeeId: z.string().optional(),
    roles: z.array(z.string()).min(1, "At least one role must be selected."),
    permissions: z.array(z.string()).optional(),
    status: z.enum(["Active", "Inactive", "Locked"]),
    passwordResetRequired: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.relationshipType === "Employee") return !!data.employeeId;
      return true;
    },
    {
      message: "Employee ID is required for this relationship type.",
      path: ["employeeId"],
    }
  )
  .refine(
    (data) => {
      if (data.relationshipType === "Family Member")
        return !!data.associatedEmployeeId;
      return true;
    },
    {
      message: "An associated employee must be selected for family members.",
      path: ["associatedEmployeeId"],
    }
  );

type UserFormData = z.infer<typeof userFormSchema>;

export const UserFormModal = ({
  isOpen,
  onOpenChange,
  mode,
  userData,
  allRoles,
  onSuccess,
}: UserFormModalProps) => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [permissionsVisible, setPermissionsVisible] = useState<boolean>(false);
  const [fetchedPermissions, setFetchedPermissions] = useState<Permission[]>(
    []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      if (isOpen) {
        try {
          const response = await axios.get(
            `http://localhost:3000/api/admin/permissions`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              },
            }
          );
          if (response.data && response.data.data) {
            setFetchedPermissions(response.data.data);
          }
        } catch (error) {
          console.error("Failed to fetch permissions:", error);
          toast.error("Could not load permissions.");
        }
      }
    };

    fetchPermissions();
  }, [isOpen]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    reset,
    setValue,
    getValues,
    trigger,
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    mode: "onChange",
  });

  const relationshipType = useWatch({ control, name: "relationshipType" });
  const selectedCountry = useWatch({ control, name: "address.country" });
  const selectedState = useWatch({ control, name: "address.state" });

  // Update states when country changes
  useEffect(() => {
    if (selectedCountry) {
      const countryStates = State.getStatesOfCountry(selectedCountry) || [];
      setStates(countryStates);

      // Clear state and city if they're no longer valid
      const currentState = getValues("address.state");
      if (
        currentState &&
        !countryStates.find((s) => s.isoCode === currentState)
      ) {
        setValue("address.state", "");
        setValue("address.city", "");
      }
    } else {
      setStates([]);
      setCities([]);
    }
  }, [selectedCountry, setValue, getValues]);

  // Update cities when state changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      const stateCities =
        City.getCitiesOfState(selectedCountry, selectedState) || [];
      setCities(stateCities);

      // Clear city if it's no longer valid
      const currentCity = getValues("address.city");
      if (currentCity && !stateCities.find((c) => c.name === currentCity)) {
        setValue("address.city", "");
      }
    } else {
      setCities([]);
    }
  }, [selectedCountry, selectedState, setValue, getValues]);

  // Fetch employees for family members
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/admin/users?role=Employee`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );
        const validEmployees =
          response.data.users?.filter(
            (emp: User) => emp.employeeId || emp._id
          ) || [];
        setEmployees(validEmployees);
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast.error("Failed to fetch employees list.");
      }
    };

    if (isOpen && relationshipType === "Family Member") {
      fetchEmployees();
    }
  }, [isOpen, relationshipType]);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && userData) {
        // Edit Mode - Pre-populate form with user data
        const isEmployee = userData.roles?.some(
          (r) => r.roleName === "Employee"
        );
        const isFamily = userData.roles?.some(
          (r) => r.roleName === "Family Member"
        );
        const relationship = isEmployee
          ? "Employee"
          : isFamily
          ? "Family Member"
          : "Employee"; // Default to Employee

        // Pre-populate geographic data
        if (userData.address?.country) {
          const countryStates =
            State.getStatesOfCountry(userData.address.country) || [];
          setStates(countryStates);

          if (userData.address.state) {
            const stateCities =
              City.getCitiesOfState(
                userData.address.country,
                userData.address.state
              ) || [];
            setCities(stateCities);
          }
        }

        const formData = {
          fullName: userData.fullName || "",
          username: userData.username || "",
          email: userData.email || "",
          password: "", // Don't include password in edit mode
          phoneNumber: userData.phoneNumber || "",
          dateOfBirth: userData.dateOfBirth
            ? new Date(userData.dateOfBirth).toISOString().split("T")[0]
            : "",
          address: {
            street: userData.address?.street || "",
            country: userData.address?.country || "",
            state: userData.address?.state || "",
            city: userData.address?.city || "",
            postalCode: userData.address?.postalCode || "",
          },
          relationshipType: relationship as "Employee" | "Family Member",
          employeeId: userData.employeeId || "",
          associatedEmployeeId: userData.associatedEmployeeId || "",
          roles: userData.roles?.map((r) => r.roleName) || [],
          permissions: userData.permissions?.map((p) => p.permissionKey) || [],
          status: userData.status || "Inactive",
          passwordResetRequired: userData.passwordResetRequired || false,
        };

        console.log("Resetting form with data:", formData);
        reset(formData);
      } else {
        // Add Mode - Set up empty form with generated password
        const newPassword = generatePassword();
        const formData = {
          fullName: "",
          username: "",
          email: "",
          password: newPassword,
          phoneNumber: "",
          dateOfBirth: "",
          address: {
            street: "",
            country: "",
            state: "",
            city: "",
            postalCode: "",
          },
          relationshipType: "Employee" as const,
          employeeId: "",
          associatedEmployeeId: "",
          roles: [],
          permissions: [],
          status: "Inactive" as const,
          passwordResetRequired: true,
        };

        console.log("Resetting form for add mode with password:", newPassword);
        reset(formData);
      }
    } else {
      // Clear geographic data when modal closes
      setStates([]);
      setCities([]);
      setPermissionsVisible(false);
      setIsSubmitting(false);
    }
  }, [isOpen, mode, userData, reset]);

  // SIMPLIFIED SUBMISSION - This is the key fix
  const onSubmit = async (data: UserFormData) => {
    console.log("🚀 FORM SUBMISSION STARTED - Mode:", mode);

    if (isSubmitting) {
      console.log("❌ Already submitting, returning early");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("📦 Form data received:", data);

      // Validate form first
      const isValid = await trigger();
      if (!isValid) {
        toast.error("Please fix form errors before submitting.");
        setIsSubmitting(false);
        return;
      }

      // Map role names to role IDs
      const roleIds = data.roles
        .map((roleName) => {
          const role = allRoles.find((r) => r.roleName === roleName);
          return role?._id;
        })
        .filter(Boolean);

      console.log("🎯 Mapped role IDs:", roleIds);

      // Prepare payload - SIMPLIFIED
      const payload: any = {
        fullName: data.fullName,
        username: data.username,
        email: data.email,
        status: data.status,
        passwordResetRequired: data.passwordResetRequired,
        phoneNumber: data.phoneNumber,
        address: data.address,
        dateOfBirth: data.dateOfBirth,
        assignedRoles: roleIds,
        permissions: data.permissions || [],
        relationshipType: data.relationshipType,
        employeeId: data.employeeId,
        associatedEmployeeId: data.associatedEmployeeId,
      };

      // Only include password in add mode
      if (mode === "add" && data.password) {
        payload.password = data.password;
      }

      console.log("📤 Final payload:", payload);

      // Use different approach for API call
      let response;

      if (mode === "add") {
        response = await axios.post(
          `http://localhost:3000/api/admin/users`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        response = await axios.put(
          `http://localhost:3000/api/admin/users/${userData?._id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              "Content-Type": "application/json",
            },
          }
        );
      }

      console.log("✅ API Response:", response.data);

      toast.success(
        `User ${mode === "add" ? "created" : "updated"} successfully!`
      );

      // Refresh data and close modal
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("❌ Submission error:", error);

      let errorMessage = `Failed to ${
        mode === "add" ? "create" : "update"
      } user`;

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct form submission handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🎯 Form submit event triggered");

    // Use handleSubmit directly
    handleSubmit(onSubmit)(e);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            User Management &gt; {mode === "add" ? "Add New User" : "Edit User"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Fill in the details to create a new user."
              : `Editing details for ${userData?.fullName}`}
          </DialogDescription>
        </DialogHeader>

        {/* Use proper form wrapper */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Tabs defaultValue="core" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="core">Core Info</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="roles">Roles & Status</TabsTrigger>
            </TabsList>

            {/* Core Info Tab */}
            <TabsContent value="core" className="space-y-4 py-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  {...register("fullName")}
                  placeholder="Enter full name"
                />
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.fullName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  {...register("username")}
                  placeholder="Enter username"
                />
                {errors.username && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.username.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="Enter email address"
                  disabled={mode === "edit"}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
              {mode === "add" && (
                <div>
                  <Label htmlFor="password">Generated Password</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="password"
                      type="text"
                      readOnly
                      {...register("password")}
                      className="flex-grow bg-muted"
                      placeholder="Password will be generated automatically"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const password = getValues("password");
                        if (password) {
                          navigator.clipboard.writeText(password);
                          toast.success("Password copied to clipboard!");
                        }
                      }}
                    >
                      Copy
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const newPassword = generatePassword();
                        setValue("password", newPassword);
                        toast.success("New password generated!");
                      }}
                    >
                      Regenerate
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-4 py-4">
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Controller
                  name="phoneNumber"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      id="phoneNumber"
                      placeholder="Enter phone number"
                      international
                      defaultCountry={(selectedCountry as CountryCode) || "US"}
                      countryCallingCodeEditable={false}
                      className="input flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    />
                  )}
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register("dateOfBirth")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Controller
                    name="address.country"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setValue("address.state", "");
                          setValue("address.city", "");
                        }}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                        <SelectContent>
                          {Country.getAllCountries().map((country) => (
                            <SelectItem
                              key={country.isoCode}
                              value={country.isoCode}
                            >
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.address?.country && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.address.country.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="state">State / District *</Label>
                  <Controller
                    name="address.state"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setValue("address.city", "");
                        }}
                        value={field.value}
                        disabled={!selectedCountry}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select State/District" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((state) => (
                            <SelectItem
                              key={state.isoCode}
                              value={state.isoCode}
                            >
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.address?.state && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.address.state.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Controller
                    name="address.city"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedState}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select City" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city.name} value={city.name}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.address?.city && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.address.city.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    {...register("address.postalCode")}
                    placeholder="Enter postal code"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  {...register("address.street")}
                  placeholder="e.g., A-14 Aditi Residency"
                />
              </div>
            </TabsContent>

            {/* Roles & Status Tab */}
            <TabsContent value="roles" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Relationship Type *</Label>
                <Controller
                  control={control}
                  name="relationshipType"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Employee">Employee</SelectItem>
                        <SelectItem value="Family Member">
                          Family Member
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.relationshipType && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.relationshipType.message}
                  </p>
                )}
              </div>

              {relationshipType === "Employee" && (
                <div>
                  <Label htmlFor="employeeId">Employee ID *</Label>
                  <Input
                    id="employeeId"
                    {...register("employeeId")}
                    placeholder="Enter employee ID"
                  />
                  {errors.employeeId && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.employeeId.message}
                    </p>
                  )}
                </div>
              )}

              {relationshipType === "Family Member" && (
                <div>
                  <Label>Select Associated Employee *</Label>
                  <Controller
                    control={control}
                    name="associatedEmployeeId"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an employee..." />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem
                              key={emp._id}
                              value={emp.employeeId || emp._id}
                            >
                              {emp.fullName} ({emp.employeeId || "No ID"})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.associatedEmployeeId && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.associatedEmployeeId.message}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Assigned Roles *</Label>
                <Controller
                  name="roles"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2 rounded-md border p-4">
                      {allRoles.map((role) => (
                        <div key={role._id} className="flex items-center gap-2">
                          <Checkbox
                            id={role._id}
                            checked={field.value?.includes(role.roleName)}
                            onCheckedChange={(checked) => {
                              const currentValues = field.value || [];
                              const newValues = checked
                                ? [...currentValues, role.roleName]
                                : currentValues.filter(
                                    (value) => value !== role.roleName
                                  );
                              field.onChange(newValues);
                            }}
                          />
                          <Label htmlFor={role._id} className="text-sm">
                            {role.roleName}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                />
                {errors.roles && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.roles.message}
                  </p>
                )}
              </div>

              {/* Permissions Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Additional Permissions</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPermissionsVisible(!permissionsVisible);
                    }}
                  >
                    {permissionsVisible ? "Hide" : "Show"} Permissions
                  </Button>
                </div>

                {permissionsVisible && (
                  <Controller
                    control={control}
                    name="permissions"
                    render={({ field }) => (
                      <ScrollArea className="h-48 w-full rounded-md border p-4">
                        <div className="space-y-2">
                          {fetchedPermissions.map((permission) => (
                            <div
                              key={permission._id}
                              className="flex items-start space-x-2 hover:bg-gray-50 p-2 rounded"
                            >
                              <Checkbox
                                id={permission._id}
                                checked={field.value?.includes(
                                  permission.permissionKey
                                )}
                                onCheckedChange={(checked) => {
                                  const currentPermissions = field.value || [];
                                  const newPermissions = checked
                                    ? [
                                        ...currentPermissions,
                                        permission.permissionKey,
                                      ]
                                    : currentPermissions.filter(
                                        (key) =>
                                          key !== permission.permissionKey
                                      );
                                  field.onChange(newPermissions);
                                }}
                              />
                              <div className="grid gap-1.5 leading-none">
                                <Label
                                  htmlFor={permission._id}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {permission.permissionKey}
                                </Label>
                                {permission.description && (
                                  <p className="text-xs text-muted-foreground">
                                    {permission.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  />
                )}
              </div>

              <div>
                <Label>Status</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
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
                <Label htmlFor="passwordResetRequired" className="text-sm">
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Processing..."
                : mode === "add"
                ? "Create User"
                : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
