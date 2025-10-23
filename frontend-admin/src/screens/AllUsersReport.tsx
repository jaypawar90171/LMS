import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Filter,
  Download,
  Send,
  Eye,
  RefreshCw,
  User,
  Phone,
  Mail,
  AlertCircle,
  Package,
  Users,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface UserReportItem {
  userId: string;
  userName: string;
  userEmail: string;
  employeeId?: string;
  phoneNumber?: string;
  roleName: string;
  totalItemsIssued: number;
  itemsOverdue: number;
  totalOverdueItems: number;
  avgDaysOverdue: number;
  lastIssuedDate?: string;
  joinDate: string;
  status: "active" | "inactive";
}

interface Role {
  _id: string;
  roleName: string;
}

const AllUsersReport = () => {
  const [data, setData] = useState<UserReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [hasOverdueFilter, setHasOverdueFilter] = useState<string>("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const params: Record<string, string> = {};
      if (selectedRole && selectedRole !== "all") {
        params.roleId = selectedRole;
      }
      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (hasOverdueFilter && hasOverdueFilter !== "all") {
        params.hasOverdue = hasOverdueFilter;
      }

      console.log("Fetching all users report with params:", params);

      const response = await axios.get(
        "http://localhost:3000/api/admin/reports/all-users",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params,
        }
      );

      console.log("Received all users data:", response.data);

      if (response.data && Array.isArray(response.data.data)) {
        setData(response.data.data);
      } else {
        setData([]);
      }
    } catch (error: any) {
      console.error("Error fetching all users report:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch users report"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        "http://localhost:3000/api/admin/roles",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setRoles(response.data.data || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
      setRoles([]);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRoles();
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const params: any = {};

      if (selectedRole && selectedRole !== "all") {
        params.roleId = selectedRole;
      }
      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (hasOverdueFilter && hasOverdueFilter !== "all") {
        params.hasOverdue = hasOverdueFilter;
      }

      const response = await axios.get(
        "http://localhost:3000/api/admin/reports/all-users/export",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params,
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `all-users-report-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("CSV exported successfully!");
    } catch (error: any) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV.");
    } finally {
      setExporting(false);
    }
  };

  const maskPhoneNumber = (phone: string) => {
    if (!phone) return "-";
    return `*******${phone.slice(-3)}`;
  };

  const handleApplyFilters = () => {
    fetchData();
  };

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const getOverdueBadge = (count: number) => {
    if (count === 0) {
      return <Badge variant="outline">None</Badge>;
    } else if (count <= 2) {
      return <Badge className="bg-yellow-100 text-yellow-800">{count}</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">{count}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-muted border-t-primary mx-auto"></div>
          <p className="text-lg text-gray-500">Loading users report...</p>
        </div>
      </div>
    );
  }

  // Calculate summary statistics
  const totalUsers = data.length;
  const totalItemsIssued = data.reduce(
    (sum, user) => sum + user.totalItemsIssued,
    0
  );
  const totalOverdueItems = data.reduce(
    (sum, user) => sum + user.totalOverdueItems,
    0
  );
  const usersWithOverdue = data.filter((user) => user.itemsOverdue > 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              All Users Report
            </h1>
            <p className="text-muted-foreground">
              Comprehensive overview of all users and their issued items
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleExportCSV} disabled={exporting}>
              <Download className="h-4 w-4 mr-2" />
              {exporting ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Role Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">User Role</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role._id} value={role._id}>
                        {role.roleName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Overdue Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Overdue Items</label>
                <Select
                  value={hasOverdueFilter}
                  onValueChange={setHasOverdueFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="true">Has Overdue</SelectItem>
                    <SelectItem value="false">No Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button onClick={handleApplyFilters} className="ml-auto">
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold">{totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Items Issued
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {totalItemsIssued}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Overdue Items
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {totalOverdueItems}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Users with Overdue
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {usersWithOverdue}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Users List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Information</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Items Statistics</TableHead>
                    <TableHead>Overdue Items</TableHead>
                    <TableHead>Avg. Days Overdue</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length > 0 ? (
                    data.map((user) => (
                      <TableRow key={user.userId}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{user.userName}</p>
                            <p className="text-sm text-muted-foreground">
                              {user.employeeId || "No ID"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Joined:{" "}
                              {format(new Date(user.joinDate), "MMM dd, yyyy")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.roleName}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Package className="h-3 w-3" />
                              <span className="text-sm">
                                Total: <strong>{user.totalItemsIssued}</strong>
                              </span>
                            </div>
                            {user.lastIssuedDate && (
                              <p className="text-xs text-muted-foreground">
                                Last:{" "}
                                {format(
                                  new Date(user.lastIssuedDate),
                                  "MMM dd, yyyy"
                                )}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getOverdueBadge(user.itemsOverdue)}
                        </TableCell>
                        <TableCell>
                          {user.avgDaysOverdue > 0 ? (
                            <span className="text-red-600 font-medium">
                              {user.avgDaysOverdue} days
                            </span>
                          ) : (
                            <span className="text-green-600">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              <span className="text-sm">{user.userEmail}</span>
                            </div>
                            {user.phoneNumber && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                <span className="text-sm">
                                  {maskPhoneNumber(user.phoneNumber)}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {user.itemsOverdue > 0 && (
                              <Button size="sm" variant="destructive">
                                <Send className="h-4 w-4 mr-1" />
                                Remind
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Users className="h-8 w-8 mb-2" />
                          <p>No users found with current filters.</p>
                          <p className="text-sm mt-2">
                            Try adjusting your filters or check if there are any
                            users in the system.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AllUsersReport;
