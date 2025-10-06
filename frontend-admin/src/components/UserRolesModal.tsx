import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { User, Role, Permission } from "@/interfaces/user.interface";
import { ShieldCheck, KeyRound, UserCheck } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";

interface UserRolesModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User | null;
  allRoles: Role[];
  onSuccess: () => void;
}

export const UserRolesModal = ({
  isOpen,
  onOpenChange,
  user,
  allRoles,
  onSuccess,
}: UserRolesModalProps) => {
  const [additionalPermissions, setAdditionalPermissions] = useState<string[]>(
    []
  );
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/admin/permissions`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );
        console.log("Fetched permissions:", response.data);
        setAllPermissions(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
        toast.error("Could not load permissions");
      }
    };

    fetchPermissions();
  }, []);

  useEffect(() => {
    if (user) {
      const userDirectPermissionKeys =
        user.permissions?.map((p) => p.permissionKey) || [];
      setAdditionalPermissions(userDirectPermissionKeys);
    }
  }, [user]);

  if (!user) return null;

  const handlePermissionChange = (permissionKey: string, checked: boolean) => {
    if (checked) {
      setAdditionalPermissions((prev) => [...prev, permissionKey]);
    } else {
      setAdditionalPermissions((prev) =>
        prev.filter((key) => key !== permissionKey)
      );
    }
  };

  const handleSaveChanges = async () => {
    toast.promise(
      axios.put(
        `http://localhost:3000/api/admin/users/${user._id}`,
        { permissions: additionalPermissions },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      ),
      {
        loading: "Updating permissions...",
        success: () => {
          onSuccess();
          onOpenChange(false);
          return "User permissions updated successfully.";
        },
        error: "Failed to update permissions.",
      }
    );
  };

  const userRoleIds = user.roles.map((role) => role._id);
  const userFullRoles = allRoles.filter((role) =>
    userRoleIds.includes(role._id)
  );

  const rolePermissionKeysSet = new Set(
    user.roles.flatMap(
      (role) => role.permissions?.map((p) => p.permissionKey) || []
    )
  );

  const directPermissionObjects = allPermissions.filter(
    (p) => !rolePermissionKeysSet.has(p.permissionKey)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Manage Roles & Permissions
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Complete role assignment and permission overview for {user.fullName}{" "}
            (@{user.username})
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {/* Assigned Roles Section (displays roles the user has) */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Assigned Roles</h3>
            {user.roles.length > 0 ? (
              user.roles.map((role) => (
                <div key={role._id} className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground capitalize">
                      {role.roleName}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {role.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No roles assigned to this user.
              </p>
            )}
          </div>

          <Separator className="my-6" />

          {/* Permissions Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-medium text-foreground">
                  User Permissions
                </h3>
                <p className="text-sm text-muted-foreground">
                  A checkmark indicates a permission the user has, either
                  directly or via a role.
                </p>
              </div>
            </div>

            <ScrollArea className="h-48 rounded-md border p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CHANGED: Loop over ALL available permissions */}
                {allPermissions.map((permission) => {
                  // ADDED: Logic to determine the state of each checkbox
                  const isInherited = rolePermissionKeysSet.has(
                    permission.permissionKey
                  );
                  const isDirectlyAssigned = additionalPermissions.includes(
                    permission.permissionKey
                  );

                  return (
                    <div
                      key={permission._id}
                      className="flex items-start space-x-3"
                    >
                      <Checkbox
                        id={`perm-${permission._id}`}
                        // CHANGED: A permission is checked if inherited OR directly assigned
                        checked={isInherited || isDirectlyAssigned}
                        // ADDED: A permission is disabled if it's inherited from a role
                        disabled={isInherited}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(
                            permission.permissionKey,
                            !!checked
                          )
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={`perm-${permission._id}`}
                          className={`font-medium ${
                            isInherited ? "text-muted-foreground" : ""
                          }`}
                        >
                          {permission.permissionKey}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                        {isInherited && (
                          <p className="text-xs text-primary/80">
                            (Inherited from role)
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
