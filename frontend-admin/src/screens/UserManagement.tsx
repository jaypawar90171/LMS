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
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  KeyRound,
  LockOpen,
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import axios from "axios";

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

import { UserFormModal } from "@/components/UserFormModal";
import { UserRolesModal } from "@/components/UserRolesModal";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { User, Role } from "@/interfaces/user.interface";
import { UserProfileModal } from "@/components/UserProfileModal";

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
    role: "all",
    sortBy: "fullName",
    sortOrder: "asc",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [allRoles, setAllRoles] = useState<Role[]>([]);

  const fetchAllUsers = async (page = currentPage) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken)
        throw new Error("No access token found. Please log in.");
      const response = await axios.get(
        `https://lms-backend1-q5ah.onrender.com/api/admin/users?page=${page}&limit=${USERS_PER_PAGE}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch users.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRoles = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        `https://lms-backend1-q5ah.onrender.com/api/admin/roles`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setAllRoles(response.data.roles);
    } catch (error) {
      toast.error("Failed to fetch roles.");
    }
  };

  useEffect(() => {
    fetchAllUsers(currentPage);
    fetchAllRoles();
  }, [currentPage]);

  useEffect(() => {
    if (users.length > 0) {
      const total = users.length;
      const active = users.filter((u) => u.status === "Active").length;
      const inactive = total - active;
      const uniqueRoles = new Set(
        users.flatMap((u) => u.roles.map((r) => r.roleName))
      );
      setStats({ total, active, inactive, roles: uniqueRoles.size });
    }
  }, [users]);

  useEffect(() => {
    let result = [...users];

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          u.fullName.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower) ||
          (u.employeeId && u.employeeId.toLowerCase().includes(lower)) ||
          (u.phoneNumber && u.phoneNumber.includes(lower))
      );
    }

    if (filters.status !== "all") {
      result = result.filter((u) => u.status === filters.status);
    }

    if (filters.role !== "all") {
      result = result.filter((u) =>
        u.roles.some((r) => r._id === filters.role)
      );
    }

    result.sort((a, b) => {
      const fieldA = a[filters.sortBy as keyof User] ?? "";
      const fieldB = b[filters.sortBy as keyof User] ?? "";

      if (filters.sortBy === "lastLogin") {
        const dateA =
          typeof fieldA === "string" || typeof fieldA === "number"
            ? new Date(fieldA).getTime()
            : 0;
        const dateB =
          typeof fieldB === "string" || typeof fieldB === "number"
            ? new Date(fieldB).getTime()
            : 0;
        return filters.sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }

      if (typeof fieldA === "string" && typeof fieldB === "string") {
        return filters.sortOrder === "asc"
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA);
      }
      return 0;
    });

    setFilteredUsers(result);
  }, [users, filters, searchTerm]);

  const handleOpenFormModal = (
    mode: "add" | "edit",
    user: User | null = null
  ) => {
    setFormMode(mode);
    setSelectedUser(user);
    setIsFormModalOpen(true);
  };

  const handleOpenRolesModal = (user: User) => {
    setSelectedUser(user);
    setIsRolesModalOpen(true);
  };

  const handleOpenDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleOpenProfileModal = (user: User) => {
    setSelectedUser(user);
    setIsProfileModalOpen(true);
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "Active" ? "Inactive" : "Active";
    console.log(newStatus);
    toast.promise(
      axios.put(
        `https://lms-backend1-q5ah.onrender.com/api/admin/users/${user._id}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      ),
      {
        loading: `Updating status to ${newStatus}...`,
        success: () => {
          fetchAllUsers(currentPage);
          return `User status updated to ${newStatus}.`;
        },
        error: "Failed to update user status.",
      }
    );
  };

  const handleSort = (column: keyof User) => {
    const isAsc = filters.sortBy === column && filters.sortOrder === "asc";
    setFilters({
      ...filters,
      sortBy: column,
      sortOrder: isAsc ? "desc" : "asc",
    });
  };

  const handleFormSuccess = async () => {
    console.log("Form submitted successfully, refreshing data...");
    await fetchAllUsers();
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    const accessToken = localStorage.getItem("accessToken");
    console.log(accessToken);
    if (!accessToken) {
      toast.error("No access token found. Please log in again.");
      return;
    }

    toast.promise(
      axios.delete(
        `https://lms-backend1-q5ah.onrender.com/api/admin/users/${selectedUser._id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      ),
      {
        loading: "Deleting user...",
        success: () => {
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
          fetchAllUsers(currentPage);
          return "User deleted successfully.";
        },
        error: (err) => err.response?.data?.message || "Failed to delete user.",
      }
    );
  };

  const handleResetPassword = async () => {
    console.log("Resetting password for user:", selectedUser);
    if (!selectedUser) return;

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("No access token found. Please log in again.");
      return;
    }

    toast.promise(
      axios.put(
        `https://lms-backend1-q5ah.onrender.com/api/admin/users/${selectedUser._id}/reset-password`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      ),
      {
        loading: "Sending password reset...",
        success: () => {
          setIsProfileModalOpen(false);
          setSelectedUser(null);
          return "Password reset successfully.";
        },
        error: (err) =>
          err.response?.data?.message || "Failed to reset password.",
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex justify-center items-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 mx-auto mb-6"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Loading User's Data
            </h3>
            <p className="text-gray-600 animate-pulse">
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
              <Button onClick={() => {}} variant="outline">
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
            <p className="text-sm text-muted-foreground">
              User Management &gt; Users List
            </p>
            <h1 className="text-3xl font-bold text-foreground">
              User Management
            </h1>
          </div>
          <Button size="sm" onClick={() => handleOpenFormModal("add")}>
            <Plus className="h-4 w-4 mr-2" />
            Add New User
          </Button>
        </div>

        {/* Statistics Cards */}
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
                    Inactive / Locked
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

        {/* Filter & Search Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by Name, Employee ID, Email, Phone Number"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
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
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Locked">Locked</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.role}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {allRoles.map((role) => (
                      <SelectItem key={role._id} value={role._id}>
                        {role.roleName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("fullName")}
                    >
                      Full Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("email")}>
                      Email
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Role(s)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("lastLogin")}
                    >
                      Last Login
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id} className="hover:bg-muted/30">
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {user?.employeeId?.slice(-8) || "N/A"}
                    </TableCell>
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
                    <TableCell>
                      <p className="text-sm text-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.phoneNumber || "No phone"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.slice(0, 2).map((role) => (
                          <Badge key={role._id} variant="secondary">
                            {role.roleName}
                          </Badge>
                        ))}
                        {user.roles.length > 2 && (
                          <Badge variant="outline">
                            +{user.roles.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === "Active"
                            ? "default"
                            : user.status === "Locked"
                            ? "destructive"
                            : "outline"
                        }
                        className={
                          user.status === "Active"
                            ? "bg-emerald-500/20 text-emerald-700"
                            : user.status === "Locked"
                            ? "bg-red-500/20 text-red-700"
                            : "text-slate-600"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleString()
                        : "N/A"}
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
                            onClick={() => handleOpenProfileModal(user)}
                          >
                            <UserIcon className="h-4 w-4 mr-2" /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenFormModal("edit", user)}
                          >
                            <Edit className="h-4 w-4 mr-2" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenRolesModal(user)}
                          >
                            <ShieldCheck className="h-4 w-4 mr-2" /> Manage
                            Roles
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              handleResetPassword();
                            }}
                          >
                            <KeyRound className="h-4 w-4 mr-2" /> Reset Password
                          </DropdownMenuItem>
                          {user.status === "Locked" && (
                            <DropdownMenuItem onClick={() => {}}>
                              <LockOpen className="h-4 w-4 mr-2" /> Unlock
                              Account
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.status === "Active" ? (
                              <ToggleLeft className="h-4 w-4 mr-2" />
                            ) : (
                              <ToggleRight className="h-4 w-4 mr-2" />
                            )}
                            {user.status === "Active"
                              ? "Deactivate"
                              : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleOpenDeleteModal(user)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
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

      {/* --- Modals --- */}
      {isFormModalOpen && (
        <UserFormModal
          isOpen={isFormModalOpen}
          onOpenChange={setIsFormModalOpen}
          mode={formMode}
          userData={selectedUser}
          allRoles={allRoles}
          onSuccess={() => fetchAllUsers(currentPage)}
        />
      )}

      {isRolesModalOpen && selectedUser && (
        <UserRolesModal
          isOpen={isRolesModalOpen}
          onOpenChange={setIsRolesModalOpen}
          user={selectedUser}
          allRoles={allRoles}
          onSuccess={() => {
            handleFormSuccess;
          }}
        />
      )}

      {isDeleteModalOpen && selectedUser && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          onConfirm={handleDeleteUser}
          itemName={selectedUser.fullName}
        />
      )}

      {isProfileModalOpen && selectedUser && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onOpenChange={setIsProfileModalOpen}
          user={selectedUser}
        />
      )}
    </div>
  );
};

export default UserManagementPage;
