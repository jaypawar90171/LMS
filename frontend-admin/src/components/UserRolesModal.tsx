import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { User, Role } from "@/interfaces/user.interface"; 
import { ShieldCheck, Key } from "lucide-react";

interface UserRolesModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User | null;
  allRoles: Role[];
}

export const UserRolesModal = ({
  isOpen,
  onOpenChange,
  user,
  allRoles,
}: UserRolesModalProps) => {
  if (!user) return null;

  // Get the full details of the roles assigned to the user
  const userRoleIds = user.roles.map((role) => role._id);
  const userFullRoles = allRoles.filter((role) =>
    userRoleIds.includes(role._id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            User Roles & Permissions
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Complete role assignment and permission overview for {user.fullName}{" "}
            (@{user.username})
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 max-h-[70vh] overflow-y-auto">
          {userFullRoles.length > 0 ? (
            <div className="space-y-6">
              {userFullRoles.map((role, index) => (
                <div key={role._id} className="space-y-3">
                  {/* Role Header */}
                  <div className="flex items-start gap-3 pb-2">
                    <ShieldCheck className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-foreground capitalize tracking-wide">
                        {role.roleName}
                      </h3>
                      {role.description && (
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {role.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Permissions Section */}
                  <div className="ml-8 space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Key className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground uppercase tracking-wider">
                        Permissions
                      </span>
                    </div>

                    {role.permissions && role.permissions.length > 0 ? (
                      <div className="bg-muted/20 border border-border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {role.permissions.map((perm, permIndex) => (
                            <div
                              key={permIndex}
                              className="flex items-center gap-2 p-2 rounded-md bg-background border border-border/50"
                            >
                              <div className="w-2 h-2 bg-muted-foreground/40 rounded-full flex-shrink-0" />
                              <code className="text-xs font-mono text-foreground bg-muted/30 px-2 py-1 rounded">
                                {perm.permissionKey}
                              </code>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/10 border border-dashed border-border rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground italic">
                          No specific permissions assigned to this role
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Separator between roles */}
                  {index < userFullRoles.length - 1 && (
                    <Separator className="my-6" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <ShieldCheck className="w-12 h-12 text-muted-foreground/50 mx-auto" />
              <div>
                <p className="text-foreground font-medium">No Roles Assigned</p>
                <p className="text-sm text-muted-foreground">
                  This user currently has no roles assigned to their account.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
