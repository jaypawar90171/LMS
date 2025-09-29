// src/components/UserProfileModal.tsx

"use client";

import type React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import type { User } from "@/interfaces/user.interface";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
  KeyRound,
  Shield,
} from "lucide-react";

interface UserProfileModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User | null;
}

// Reusable row for user detail
const DetailRow = ({
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
    <div className="flex items-center gap-3 py-2 border-b last:border-none">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground truncate">{value}</span>
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
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden rounded-2xl shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 h-full">
          {/* === LEFT SIDEBAR === */}
          <div className="bg-[radial-gradient(circle,rgba(238,174,202,1)_0%,rgba(148,187,233,1)_100%)] p-6 flex flex-col items-center justify-center">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
              <AvatarImage
                src={
                  user.profile ||
                  `https://api.dicebear.com/8.x/initials/svg?seed=${user.fullName}`
                }
                alt={user.fullName}
              />
              <AvatarFallback className="text-2xl font-bold">
                {user.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-2xl font-bold">{user.fullName}</h2>
            <p className="text-sm opacity-90">@{user.username}</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <Badge
                variant={user.status === "Active" ? "default" : "outline"}
                className={`px-2 py-1 rounded-full ${
                  user.status === "Active"
                    ? "bg-white text-primary font-semibold"
                    : "bg-transparent border-white text-white"
                }`}
              >
                {user.status}
              </Badge>
              {user.roles.map((role) => (
                <Badge
                  key={role._id}
                  variant="secondary"
                  className="bg-white/20 border border-white/30 text-white px-2 py-1 rounded-full"
                >
                  {role.roleName}
                </Badge>
              ))}
            </div>
          </div>

          {/* === RIGHT SECTION === */}
          <div className="col-span-2 p-6">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-xl font-bold text-foreground">
                User Information
              </DialogTitle>
            </DialogHeader>

            {/* CONTACT INFO */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <Shield size={16} /> Contact Information
              </h3>
              <div className="bg-muted/30 rounded-lg p-3 divide-y">
                <DetailRow
                  icon={<Mail size={16} />}
                  label="Email"
                  value={user.email}
                />
                <DetailRow
                  icon={<Phone size={16} />}
                  label="Phone"
                  value={user.phoneNumber}
                />
                <DetailRow
                  icon={<MapPin size={16} />}
                  label="Address"
                  value={fullAddress}
                />
              </div>
            </div>

            {/* ACCOUNT INFO */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <Shield size={16} /> Account Details
              </h3>
              <div className="bg-muted/30 rounded-lg p-3 divide-y">
                <DetailRow
                  icon={<Hash size={16} />}
                  label="Employee ID"
                  value={user.employeeId}
                />
                <DetailRow
                  icon={<Calendar size={16} />}
                  label="Member Since"
                  value={new Date(user.createdAt).toLocaleDateString()}
                />
                <DetailRow
                  icon={<KeyRound size={16} />}
                  label="Password Reset Required"
                  value={user.passwordResetRequired ? "Yes" : "No"}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
