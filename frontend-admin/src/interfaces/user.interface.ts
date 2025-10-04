export interface Permission {
  _id: string;
  permissionKey: string;
  description: string;
}

export interface Role {
  _id: string;
  roleName: string;
  description: string;
  permissions: Permission[];
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface User {
  _id: string;
  fullName: string;
  email: string;
  username: string;
  roles: Role[];
  permissions?: Permission[];
  associatedEmployeeId?: string;
  status: "Active" | "Inactive" | "Locked";
  passwordResetRequired: boolean;
  createdAt: string;
  updatedAt: string;
  employeeId?: string;
  phoneNumber?: string;
  address?: Address;
  profile?: string;
  dateOfBirth?: string;
  lastLogin?: string;
  accountLockedUntil?: string;
  notificationPreference?: {
    email: boolean;
    whatsApp: boolean;
  };
  rememberMe?: boolean;
}
