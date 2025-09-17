// src/components/UserProfileModal.tsx

"use client";

import type React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import type { User } from "@/interfaces/user.interface"; // Adjust path as needed
import { Mail, Phone, MapPin, Calendar, Hash, KeyRound } from "lucide-react";

interface UserProfileModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User | null;
}

// A reusable component for displaying a piece of user data
const DetailItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 p-2">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
};

export const UserProfileModal = ({
  isOpen,
  onOpenChange,
  user,
}: UserProfileModalProps) => {
  if (!user) return null;

  // Formats the address object into a single, readable string
  const fullAddress = user.address
    ? [
        user.address.street,
        user.address.city,
        user.address.state,
        user.address.postalCode,
        user.address.country,
      ]
        .filter(Boolean)
        .join(", ")
    : "No address provided";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* === HEADER SECTION === */}
        <DialogHeader className="relative pb-4 border-b">
          <div className="flex items-center gap-6 p-2">
            <Avatar className="h-20 w-20 border-2 border-primary/20">
              <AvatarImage
                src={
                  user.profile ||
                  `https://api.dicebear.com/8.x/initials/svg?seed=${user.fullName}`
                }
                alt={user.fullName}
              />
              <AvatarFallback className="text-xl font-bold">
                {user.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold text-foreground">
                {user.fullName}
              </DialogTitle>
              <DialogDescription className="text-md text-muted-foreground mb-2">
                @{user.username}
              </DialogDescription>
              <div className="flex items-center gap-2">
                <Badge
                  variant={user.status === "Active" ? "default" : "outline"}
                  className={
                    user.status === "Active"
                      ? "bg-emerald-500/20 text-emerald-700 font-semibold"
                      : "text-slate-600"
                  }
                >
                  {user.status}
                </Badge>
                {user.roles.map((role) => (
                  <Badge key={role._id} variant="secondary">
                    {role.roleName}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* === DETAILS SECTION === */}
        <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-md">
                <Mail size={18} className="text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <DetailItem
                icon={<Mail size={16} />}
                label="Email Address"
                value={user.email}
              />
              <DetailItem
                icon={<Phone size={16} />}
                label="Phone Number"
                value={user.phoneNumber}
              />
              <DetailItem
                icon={<MapPin size={16} />}
                label="Address"
                value={fullAddress}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-md">
                <Hash size={18} className="text-primary" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <DetailItem
                icon={<Hash size={16} />}
                label="Employee ID"
                value={user.employeeId}
              />
              <DetailItem
                icon={<Calendar size={16} />}
                label="Member Since"
                value={new Date(user.createdAt).toLocaleDateString()}
              />
              {/* [REPLACED] Mock data with real data from your user object */}
              <DetailItem
                icon={<KeyRound size={16} />}
                label="Password Reset Required"
                value={user.passwordResetRequired ? "Yes" : "No"}
              />
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
