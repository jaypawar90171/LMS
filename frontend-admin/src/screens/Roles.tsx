"use client";

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        "http://localhost:3000/api/admin/roles",
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
        `http://localhost:3000/api/admin/roles/${selectedRole._id}`,
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
          fetchData(); // Refresh the list
          return "Role deleted successfully.";
        },
        error: (err) => err.response?.data?.error || "Failed to delete role.",
      }
    );
  };

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
