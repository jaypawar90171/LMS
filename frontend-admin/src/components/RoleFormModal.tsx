"use client";

import React, { useEffect } from "react";
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
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner";
import axios from "axios";
import { ScrollArea } from "./ui/scroll-area";
import type { Role } from "@/interfaces/user.interface";

export interface Permission {
  _id?: string;
  permissionKey: string;
  description: string;
}

interface RoleFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  mode: "add" | "edit";
  roleData: Role | null;
  allPermissions: Permission[];
  onSuccess: () => void;
}

const roleFormSchema = z.object({
  roleName: z.string().min(2, "Role name must be at least 2 characters."),
  description: z.string().min(5, "Description must be at least 5 characters."),
  permissions: z
    .array(z.string())
    .min(1, "At least one permission must be selected."),
});

type RoleFormData = z.infer<typeof roleFormSchema>;

export const RoleFormModal = ({
  isOpen,
  onOpenChange,
  mode,
  roleData,
  allPermissions,
  onSuccess,
}: RoleFormModalProps) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<RoleFormData>();

  useEffect(() => {
    if (isOpen && mode === "edit" && roleData) {
      reset({
        roleName: roleData.roleName,
        description: roleData.description,
        permissions: roleData.permissions.map((p) => p.permissionKey),
      });
    } else if (isOpen && mode === "add") {
      reset({
        roleName: "",
        description: "",
        permissions: [],
      });
    }
  }, [isOpen, mode, roleData, reset]);

  const onSubmit = async (data: RoleFormData) => {
    const apiEndpoint =
      mode === "add"
        ? `https://lms-backend1-q5ah.onrender.com/api/admin/roles`
        : `https://lms-backend1-q5ah.onrender.com/api/admin/roles/${roleData?._id}`;

    const apiMethod = mode === "add" ? axios.post : axios.put;

    toast.promise(
      apiMethod(apiEndpoint, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      {
        loading: `${mode === "add" ? "Creating" : "Updating"} role...`,
        success: () => {
          onSuccess();
          onOpenChange(false);
          return `Role ${mode === "add" ? "created" : "updated"} successfully!`;
        },
        error: (err) =>
          err.response?.data?.error ||
          `Failed to ${mode === "add" ? "create" : "update"} role.`,
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New Role" : "Edit Role"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Define a new role and assign its permissions."
              : `Editing the "${roleData?.roleName}" role.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="roleName">Role Name</Label>
              <Input id="roleName" {...register("roleName")} />
              {errors.roleName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.roleName.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...register("description")} />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label>Permissions</Label>
            <Controller
              control={control}
              name="permissions"
              render={({ field }) => (
                <ScrollArea className="h-64 w-full rounded-md border p-4 mt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {allPermissions.map((permission) => (
                      <div
                        key={permission.permissionKey}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={permission.permissionKey}
                          checked={field.value?.includes(
                            permission.permissionKey
                          )}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([
                                  ...(field.value || []),
                                  permission.permissionKey,
                                ])
                              : field.onChange(
                                  (field.value || []).filter(
                                    (key) => key !== permission.permissionKey
                                  )
                                );
                          }}
                        />
                        <Label
                          htmlFor={permission.permissionKey}
                          className="font-mono text-sm leading-tight"
                        >
                          {permission.permissionKey}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            />
            {errors.permissions && (
              <p className="text-red-500 text-xs mt-1">
                {errors.permissions.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {mode === "add" ? "Create Role" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
