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
} from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DefaulterItem {
  issuedItemId: string;
  userName: string;
  userEmail: string;
  employeeId?: string;
  phoneNumber?: string;
  roleName: string;
  itemTitle: string;
  barcode: string;
  issuedDate: string;
  dueDate: string;
  daysOverdue: number;
  categoryName: string;
  userId: string; 
  itemId: string; 
}

interface Category {
  _id: string;
  name: string;
}

interface Role {
  _id: string;
  roleName: string;
}

const DefaulterReport = () => {
  const [data, setData] = useState<DefaulterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  // Filters
  const [overdueSince, setOverdueSince] = useState<Date>();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const params: Record<string, string> = {};
      if (overdueSince) {
        params.overdueSince = format(overdueSince, "yyyy-MM-dd");
      }
      if (selectedCategory && selectedCategory !== "all") {
        params.categoryId = selectedCategory;
      }
      if (selectedRole && selectedRole !== "all") {
        params.roleId = selectedRole;
      }

      console.log("Fetching defaulters with params:", params);

      const response = await axios.get(
        "https://lms-backend1-q5ah.onrender.com/api/admin/reports/defaulters",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params,
        }
      );

      console.log("Received defaulters data:", response.data);

      if (response.data && Array.isArray(response.data.data)) {
        setData(response.data.data);
      } else {
        setData([]);
      }
    } catch (error: any) {
      console.error("Error fetching defaulter report:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch defaulter report"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        "https://lms-backend1-q5ah.onrender.com/api/admin/inventory/categories",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      // Map the response to use 'name' instead of 'categoryName'
      const categoriesData =
        response.data.data?.map((cat: any) => ({
          _id: cat._id,
          name: cat.name || cat.categoryName || "Unknown",
        })) || [];
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchRoles = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        "https://lms-backend1-q5ah.onrender.com/api/admin/roles",
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
    fetchCategories();
    fetchRoles();
  }, []);

  const handleSendReminder = async (defaulter: DefaulterItem) => {
    setSendingReminders((prev) => [...prev, defaulter.issuedItemId]);
    try {
      const accessToken = localStorage.getItem("accessToken");
      await axios.post(
        "https://lms-backend1-q5ah.onrender.com/api/admin/reports/defaulters/send-reminder",
        {
          issuedItemId: defaulter.issuedItemId,
          userId: defaulter.userId,
          itemId: defaulter.itemId,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      toast.success("Reminder sent successfully!");
    } catch (error: any) {
      console.error("Error sending reminder:", error);
      toast.error(error.response?.data?.message || "Failed to send reminder.");
    } finally {
      setSendingReminders((prev) =>
        prev.filter((id) => id !== defaulter.issuedItemId)
      );
    }
  };

  const handleExportCSV = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const params: any = {};

      if (overdueSince) {
        params.overdueSince = format(overdueSince, "yyyy-MM-dd");
      }
      if (selectedCategory && selectedCategory !== "all") {
        params.categoryId = selectedCategory;
      }
      if (selectedRole && selectedRole !== "all") {
        params.roleId = selectedRole;
      }

      const response = await axios.get(
        "https://lms-backend1-q5ah.onrender.com/api/admin/reports/defaulters/export",
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
        `defaulter-report-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("CSV exported successfully!");
    } catch (error: any) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV.");
    }
  };

  const maskPhoneNumber = (phone: string) => {
    if (!phone) return "-";
    return `*******${phone.slice(-3)}`;
  };

  const handleApplyFilters = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-muted border-t-primary mx-auto"></div>
          <p className="text-lg text-gray-500">Loading defaulter report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Defaulter User Report
            </h1>
            <p className="text-muted-foreground">
              Identify users with overdue items and send reminders
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
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
              {/* Overdue Since Date Picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Overdue Since</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !overdueSince && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {overdueSince
                        ? format(overdueSince, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={overdueSince}
                      onSelect={setOverdueSince}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Category Filter - FIXED */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Item Type</label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Role Filter - FIXED */}
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
                    Total Defaulters
                  </p>
                  <p className="text-2xl font-bold">{data.length}</p>
                </div>
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Avg. Days Overdue
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {data.length > 0
                      ? Math.round(
                          data.reduce(
                            (acc, item) => acc + item.daysOverdue,
                            0
                          ) / data.length
                        )
                      : 0}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Max Overdue
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {data.length > 0
                      ? Math.max(...data.map((item) => item.daysOverdue))
                      : 0}
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
                    Items Overdue
                  </p>
                  <p className="text-2xl font-bold">{data.length}</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Defaulter Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Defaulters List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Info</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Item Details</TableHead>
                    <TableHead>Issue/Due Date</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length > 0 ? (
                    data.map((item) => (
                      <TableRow key={item.issuedItemId}>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendReminder(item)} 
                              disabled={sendingReminders.includes(
                                item.issuedItemId
                              )}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              {sendingReminders.includes(item.issuedItemId)
                                ? "Sending..."
                                : "Remind"}
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <User className="h-8 w-8 mb-2" />
                          <p>No defaulters found with current filters.</p>
                          <p className="text-sm mt-2">
                            Try adjusting your filters or check if there are any
                            overdue items.
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

export default DefaulterReport;
