import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import { MoreHorizontal, Plus, Trash2, Edit } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

import { RoleFormModal, Permission } from "@/components/RoleFormModal"; // No changes needed here
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import type { Role } from "@/interfaces/user.interface"; // Adjust path if needed

const RolesManagementPage = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
    const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        "https://lms-backend1-q5ah.onrender.com/api/admin/roles",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const fetchedRoles = response.data.roles;
      setRoles(fetchedRoles);
      const superAdminRole = fetchedRoles.find(
        (role: Role) => role.roleName === "superAdmin"
      );

      if (superAdminRole && superAdminRole.permissions) {
        setAllPermissions(superAdminRole.permissions);
      } else {
        toast.error(
          "Could not find superAdmin role to determine permissions list."
        );
      }
    } catch (error) {
      toast.error("Failed to fetch roles and permissions.");
      setError("Error in getting roles")
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenFormModal = (
    mode: "add" | "edit",
    role: Role | null = null
  ) => {
    setFormMode(mode);
    setSelectedRole(role);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    toast.promise(
      axios.delete(
        `https://lms-backend1-q5ah.onrender.com/api/admin/roles/${selectedRole._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      ),
      {
        loading: "Deleting role...",
        success: () => {
          setIsDeleteModalOpen(false);
          setSelectedRole(null);
          fetchData(); 
          return "Role deleted successfully.";
        },
        error: (err) => err.response?.data?.error || "Failed to delete role.",
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
              Loading Roles
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
      <div className="flex justify-center items-center h-screen">
        <div className="text-center p-8 bg-red-50 rounded-xl border border-red-200">
          <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Roles
          </h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">
            User Management
          </h1>
          <p className="text-muted-foreground">
            View, create, and manage all user accounts.
          </p>
        </div>
        <Button onClick={() => handleOpenFormModal("add")}>
          <Plus className="mr-2 h-4 w-4" /> Add New Role
        </Button>
      </div>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    Loading roles...
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role._id}>
                    <TableCell className="font-semibold capitalize">
                      {role.roleName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {role.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {role.permissions.length} Permissions
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
                            onClick={() => handleOpenFormModal("edit", role)}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleOpenDeleteModal(role)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isFormModalOpen && (
        <RoleFormModal
          isOpen={isFormModalOpen}
          onOpenChange={setIsFormModalOpen}
          mode={formMode}
          roleData={selectedRole}
          allPermissions={allPermissions}
          onSuccess={fetchData}
        />
      )}
      {isDeleteModalOpen && selectedRole && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          onConfirm={handleDeleteRole}
          itemName={selectedRole.roleName}
        />
      )}
    </div>
  );
};

export default RolesManagementPage;
