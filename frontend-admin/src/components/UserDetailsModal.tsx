import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User } from "../screens/UserManagement";

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const DetailField = ({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) => (
  <div>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className="text-foreground">{value || "N/A"}</p>
  </div>
);

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  if (!user) return null;

  const userType = user.employeeId
    ? "Employee"
    : user.associatedEmployeeId
    ? "Family Member"
    : "Standard";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">User Profile</DialogTitle>
          <DialogDescription>
            Detailed information for {user.fullName}.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Profile & Main Info */}
          <div className="md:col-span-1 flex flex-col items-center text-center">
            <img
              src={
                user.profile ||
                `https://api.dicebear.com/8.x/initials/svg?seed=${user.fullName}`
              }
              alt="Profile"
              className="h-24 w-24 rounded-full mb-4 bg-muted"
            />
            <h2 className="text-xl font-semibold">{user.fullName}</h2>
            <p className="text-muted-foreground">@{user.username}</p>
            <Badge variant="secondary" className="mt-2">
              {userType}
            </Badge>
            {user.employeeId && (
              <p className="text-sm text-muted-foreground mt-1">
                ID: {user.employeeId}
              </p>
            )}
          </div>

          {/* Column 2 & 3: Details */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <DetailField
              label="Status"
              value={
                <Badge
                  variant={user.status === "Active" ? "default" : "destructive"}
                >
                  {user.status}
                </Badge>
              }
            />
            <DetailField label="Email" value={user.email} />
            <DetailField label="Phone Number" value={user.phoneNumber} />
            <DetailField label="Address" value={user.address} />
            <DetailField
              label="Date of Birth"
              value={
                user.dateOfBirth
                  ? new Date(user.dateOfBirth).toLocaleDateString()
                  : "N/A"
              }
            />

            <DetailField
              label="Role"
              value={
                user.roles
                  ?.map((role: any) =>
                    typeof role === "string" ? role : role.roleName
                  )
                  .join(", ") || "No role assigned"
              }
            />

            <DetailField
              label="Last Login"
              value={
                user.lastLogin
                  ? new Date(user.lastLogin).toLocaleString()
                  : "N/A"
              }
            />
            <DetailField
              label="Joined On"
              value={new Date(user.createdAt).toLocaleDateString()}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
