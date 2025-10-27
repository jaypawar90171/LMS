import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Trash2,
  Search,
  User,
  Package,
  Clock,
  AlertCircle,
  CheckCircle2,
  Ban,
  MoreHorizontal,
} from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RequestedItem {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    department?: string;
  };
  name: string;
  description: string;
  category: string;
  subCategory?: string;
  reason: string;
  quantity: number;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  processedAt?: string;
  processedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const RequestedItems = () => {
  const [requestedItems, setRequestedItems] = useState<RequestedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [categories, setCategories] = useState<string[]>([]);

  const fetchRequestedItems = async (page: number = 1) => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const params: any = {
        page,
        limit: pagination.limit,
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== "all") params.status = statusFilter;
      if (categoryFilter !== "all") params.category = categoryFilter;
      if (startDate) params.startDate = format(startDate, "yyyy-MM-dd");
      if (endDate) params.endDate = format(endDate, "yyyy-MM-dd");

      const response = await axios.get(
        "https://lms-backend1-q5ah.onrender.com/api/admin/requested-items",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params,
        }
      );

      if (response.data.success) {
        setRequestedItems(response.data.data.requests);
        setPagination(response.data.data.pagination);

        const uniqueCategories = [
          ...new Set(
            response.data.data.requests.map(
              (item: RequestedItem) => item.category
            )
          ),
        ] as string[];
        setCategories(uniqueCategories);
      }
    } catch (error: any) {
      console.error("Error fetching requested items:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch requested items"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestedItems();
  }, []);

  const handleApprove = async (itemId: string) => {
    setProcessingId(itemId);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.put(
        `https://lms-backend1-q5ah.onrender.com/api/admin/requested-items/${itemId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.data.success) {
        toast.success("Item request approved successfully");
        fetchRequestedItems(pagination.page);
      }
    } catch (error: any) {
      console.error("Error approving item:", error);
      toast.error(error.response?.data?.message || "Failed to approve item");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (itemId: string) => {
    setProcessingId(itemId);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.put(
        `https://lms-backend1-q5ah.onrender.com/api/admin/requested-items/${itemId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.data.success) {
        toast.success("Item request rejected successfully");
        fetchRequestedItems(pagination.page);
      }
    } catch (error: any) {
      console.error("Error rejecting item:", error);
      toast.error(error.response?.data?.message || "Failed to reject item");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this item request? This action cannot be undone."
      )
    ) {
      return;
    }

    setProcessingId(itemId);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.delete(
        `https://lms-backend1-q5ah.onrender.com/api/admin/requested-items/${itemId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.data.success) {
        toast.success("Item request deleted successfully");
        fetchRequestedItems(pagination.page);
      }
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast.error(error.response?.data?.message || "Failed to delete item");
    } finally {
      setProcessingId(null);
    }
  };

  const handleApplyFilters = () => {
    fetchRequestedItems(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setStartDate(undefined);
    setEndDate(undefined);
    fetchRequestedItems(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <Ban className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    return (
      <Badge variant="outline" className="capitalize">
        <Package className="h-3 w-3 mr-1" />
        {category}
      </Badge>
    );
  };

  if (loading && requestedItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-muted border-t-primary mx-auto"></div>
          <p className="text-lg text-gray-500">Loading requested items...</p>
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
              Requested Items Management
            </h1>
            <p className="text-muted-foreground">
              Review and manage all item requests from users
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => fetchRequestedItems()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by item name, description, or user..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
              <Button onClick={handleApplyFilters}>Apply Filters</Button>
            </div>
          </CardContent>
        </Card>

        {/* Requested Items Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Requested Items ({pagination.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Item Details</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestedItems.length > 0 ? (
                    requestedItems.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium flex items-center">
                              <User className="h-4 w-4 mr-2 text-muted-foreground" />
                              {item.userId.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.userId.email}
                            </div>
                            {item.userId.department && (
                              <div className="text-xs text-muted-foreground">
                                {item.userId.department}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {item.description}
                            </div>
                            {item.subCategory && (
                              <div className="text-xs text-muted-foreground">
                                Sub: {item.subCategory}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getCategoryBadge(item.category)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-lg">
                            {item.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p
                            className="text-sm line-clamp-2"
                            title={item.reason}
                          >
                            {item.reason}
                          </p>
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          {format(new Date(item.requestedAt), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {item.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(item._id)}
                                  disabled={processingId === item._id}
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                  {processingId === item._id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReject(item._id)}
                                  disabled={processingId === item._id}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  {processingId === item._id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                </Button>
                              </>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={processingId === item._id}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleDelete(item._id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Package className="h-8 w-8 mb-2" />
                          <p>No requested items found.</p>
                          <p className="text-sm">All requests are processed!</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} items
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={pagination.page === 1}
                    onClick={() => fetchRequestedItems(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => fetchRequestedItems(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RequestedItems;
