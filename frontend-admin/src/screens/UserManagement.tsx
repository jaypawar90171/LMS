import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  RefreshCw,
  MoreHorizontal,
  User as UserIcon,
  Edit,
  Trash2,
  BookOpen,
  Users,
  TrendingUp,
  Search,
  ArrowUpDown,
  Filter,
  Plus,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "axios";
import { UserDetailsModal } from "@/components/UserDetailsModal";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogModal } from "@/components/Dialog";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";

interface Role {
  _id: string;
  name: string;
}

interface NotificationPreference {
  email: boolean;
  whatsApp: boolean;
}

export interface User {
  _id: string;
  fullName: string;
  email: string;
  username: string;
  roles: Role[] | string[];
  status: "Active" | "Inactive" | "Locked";
  passwordResetRequired: boolean;
  rememberMe: boolean;
  createdAt: string;
  updatedAt: string;
  notificationPreference: NotificationPreference;
  employeeId?: string;
  associatedEmployeeId?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  lastLogin?: string;
  accountLockedUntil?: string;
  profile?: string;
}

const USERS_PER_PAGE = 10;

const UserManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    roles: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    userType: "all",
    sortBy: "fullName",
    sortOrder: "asc",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isAddUserModalOpen, setIsAddUserModelOpen] = useState(false);
  const [newUserRole, setNewUserRole] = useState("employee");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const fetchAllUsers = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        setError("No access token found. Please log in.");
        return;
      }

      const response = await axios.get(
        `http://localhost:3000/api/admin/users?page=${currentPage}&limit=${USERS_PER_PAGE}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch users.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, [currentPage]);

  useEffect(() => {
    if (users.length > 0) {
      const total = users.length;
      const active = users.filter((u) => u.status === "Active").length;
      const inactive = users.filter((u) => u.status !== "Active").length;

      const allRoles = users.flatMap((user) =>
        user.roles.map((role) => (typeof role === "string" ? role : role.name))
      );
      const uniqueRoles = new Set(allRoles.filter(Boolean));
      const rolesCount = uniqueRoles.size;

      setStats({ total, active, inactive, roles: rolesCount });
    }
  }, [users]);

  useEffect(() => {
    let result = [...users];

    // filter by status
    if (filters.status !== "all") {
      result = result.filter((u) => u.status === filters.status);
    }

    // filter by userType
    if (filters.userType !== "all") {
      result = result.filter((u) => {
        if (filters.userType === "Employee") return !!u.employeeId;
        if (filters.userType === "Family") return !!u.associatedEmployeeId;
        if (filters.userType === "Standard")
          return !u.employeeId && !u.associatedEmployeeId;
        return true;
      });
    }

    // search filter
    if (searchTerm.trim() !== "") {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          u.fullName.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower)
      );
    }

    // sorting
    if (filters.sortBy) {
      result = result.sort((a, b) => {
        const fieldA = a[filters.sortBy as keyof User];
        const fieldB = b[filters.sortBy as keyof User];

        if (typeof fieldA === "string" && typeof fieldB === "string") {
          return filters.sortOrder === "asc"
            ? fieldA.localeCompare(fieldB)
            : fieldB.localeCompare(fieldA);
        }

        if (typeof fieldA === "number" && typeof fieldB === "number") {
          return filters.sortOrder === "asc"
            ? fieldA - fieldB
            : fieldB - fieldA;
        }

        return 0;
      });
    }

    setFilteredUsers(result);
  }, [users, filters, searchTerm]);

  const handleAddSubmit = async (formData: Record<string, any>) => {
    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      userName: formData.username,
      password: formData.password,
      passwordResetRequired: formData.passwordResetRequired,
      role: formData.role,
      emp_id: formData.role === "employee" ? formData.Id : undefined,
      ass_emp_id: formData.role === "family" ? formData.Id : undefined,
    };

    try {
      const accessToken = localStorage.getItem("accessToken");
      await axios.post("http://localhost:3000/api/admin/users", payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success("User created successfully!");
      setIsAddUserModelOpen(false);
      fetchAllUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create user.");
    }
  };

  const generateRandomPassword = () => {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  };

  const addUserFormFields = [
    { type: "text" as const, name: "fullName", label: "Full Name" },
    { type: "text" as const, name: "email", label: "Email" },
    { type: "text" as const, name: "username", label: "Username" },
    {
      type: "text" as const,
      name: "password",
      label: "Password",
      renderAdornment: (formData: any, setFormData: any) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const newPassword = generateRandomPassword();
            setFormData({ ...formData, password: newPassword });
            toast.info("New password generated and copied to clipboard.");
            navigator.clipboard.writeText(newPassword);
          }}
        >
          <KeyRound className="h-4 w-4 mr-2" />
          Generate
        </Button>
      ),
    },
    {
      type: "checkbox" as const,
      name: "passwordResetRequired",
      label: "User must reset password on next login",
    },
    {
      type: "select" as const,
      name: "role",
      label: "Role",
      options: [
        { value: "employee", label: "Employee" },
        { value: "family", label: "Family Member" },
      ],
    },

    ...(newUserRole === "employee"
      ? [{ type: "text" as const, name: "Id", label: "Employee ID" }]
      : []),
    ...(newUserRole === "family"
      ? [
          {
            type: "text" as const,
            name: "Id",
            label: "Associated Employee's User ID",
          },
        ]
      : []),
  ];

  const handleEditOpen = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

//   const handleDeleteOpen = (user: User) => {
//     setSelectedUser(user);
//     setIsDeleteModalOpen(true);
//   };

//   const handleDeleteUser = async () => {
//     if (!selectedUser) {
//       toast.error("No user selected for deletion.");
//       return;
//     }
//     try {
//       const accessToken = localStorage.getItem("accessToken");
//       if (!accessToken) {
//         toast.error("No access token found");
//         return;
//       }
//       await axios.delete(
//         `http://localhost:3000/api/admin/users/${selectedUser._id}`,
//         { headers: { Authorization: `Bearer ${accessToken}` } }
//       );
//     } catch (error) {
//     } finally {
//       setSelectedUser(null);
//       setIsDeleteModalOpen(false);
//     }
//   };

  const handleEditUser = async () => {
    try {
    } catch (error) {}
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        {/* Loading Spinner */}
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-muted mx-auto"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Loading Users
            </h3>
            <p className="text-muted-foreground">
              Fetching your latest data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        {/* Error Card */}
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <Package className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Error Loading Users
                </h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button onClick={fetchAllUsers} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">
              User Management
            </h1>
            <p className="text-muted-foreground">
              View, manage, and edit user accounts.
            </p>
          </div>
          <div className="flex">
            <Button size="sm" onClick={() => setIsAddUserModelOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New User
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.total}
                  </p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Users
                  </p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {stats.active}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Inactive / Pending
                  </p>
                  <p className="text-2xl font-bold text-amber-600">
                    {stats.inactive}
                  </p>
                </div>
                <Users className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Distinct Roles
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.roles}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* 🔍 Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                {/* Status Filter */}
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Locked">Locked</SelectItem>
                  </SelectContent>
                </Select>

                {/* User Type Filter */}
                <Select
                  value={filters.userType}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, userType: value }))
                  }
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="User Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Employee">Employee</SelectItem>
                    <SelectItem value="Family">Family Member</SelectItem>
                    <SelectItem value="Standard">Standard</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort By */}
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, sortBy: value }))
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fullName">Name</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="createdAt">Created At</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort Order */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
                    }))
                  }
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  {filters.sortOrder === "asc" ? "A-Z" : "Z-A"}
                </Button>

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters({
                      status: "all",
                      userType: "all",
                      sortBy: "fullName",
                      sortOrder: "asc",
                    })
                  }
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            user.profile ||
                            `https://api.dicebear.com/8.x/initials/svg?seed=${user.fullName}`
                          }
                          alt="avatar"
                          className="h-10 w-10 rounded-full bg-muted"
                        />
                        <div>
                          <p className="font-semibold text-foreground">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.employeeId
                          ? "Employee"
                          : user.associatedEmployeeId
                          ? "Family Member"
                          : "Standard"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewProfile(user)}
                          >
                            <UserIcon className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditOpen(user)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {}}
                          >
                            <UserIcon className="h-4 w-4 mr-2" />
                            Force Password Reset
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="space-y-2">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto" />
                        <p className="text-muted-foreground">
                          No Users found matching your criteria
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFilters({
                              status: "all",
                              userType: "all",
                              sortBy: "fullName",
                              sortOrder: "asc",
                            });
                            setSearchTerm("");
                            setCurrentPage(1);
                          }}
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-4 py-2 text-sm">
                Page {currentPage} of {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Render the modal */}
      <UserDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
      />

      {/* Add New user */}
      {isAddUserModalOpen && (
        <DialogModal
          isOpen={isAddUserModalOpen}
          onOpenChange={setIsAddUserModelOpen}
          title="Add New User"
          description="Fill in the details for the new user."
          fields={addUserFormFields}
          defaultValues={{
            fullName: "",
            email: "",
            username: "",
            password: "",
            passwordResetRequired: true,
            role: newUserRole,
            Id: "",
          }}
          onSubmit={(formData) => {
            if (formData.role !== newUserRole) {
              setNewUserRole(formData.role);
            }
            handleAddSubmit(formData);
          }}
        />
      )}

      {/* Delete User */}
      {/* {isDeleteModalOpen && selectedUser && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          onConfirm={handleDeleteUser}
          itemName={selectedUser.fullName}
        />
      )} */}
    </div>
  );
};

export default UserManagementPage;
