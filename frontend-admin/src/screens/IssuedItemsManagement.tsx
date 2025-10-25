import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Eye,
  Calendar,
  Trash2,
  MoreHorizontal,
  User,
  BookOpen,
  Package,
  AlertTriangle,
  RefreshCw,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { IssuedItemDetailsModal } from "@/components/IssuedItemDetailsModal";
import { ExtendPeriodModal } from "@/components/ExtendPeriodModal";
import { IssuedItem } from "@/interfaces/issuedItem";

interface FilterState {
  status: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export default function IssuedItemsManagement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issuedItems, setIssuedItems] = useState<IssuedItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<IssuedItem[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    sortBy: "dueDate",
    sortOrder: "asc",
  });

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IssuedItem | null>(null);

  // Fetch issued items data
  useEffect(() => {
    const fetchIssuedItems = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(
          "http://localhost:3000/api/admin/reports/issued",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response) {
          throw new Error("Failed to fetch issued items");
        }

        const data = response.data.report;
        console.log(data);
        setIssuedItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchIssuedItems();
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = [...issuedItems];

    if (search) {
      filtered = filtered.filter(
        (item) =>
          item.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
          item.item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.item.authorOrCreator.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filters.status !== "all") {
      filtered = filtered.filter(
        (item) => item.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case "dueDate":
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
          break;
        case "user":
          aValue = a.user.fullName.toLowerCase();
          bValue = b.user.fullName.toLowerCase();
          break;
        case "title":
          aValue = a.item.title.toLowerCase();
          bValue = b.item.title.toLowerCase();
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
      }

      if (aValue < bValue) return filters.sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredItems(filtered);
  }, [issuedItems, search, filters]);

  // Statistics calculations
  const totalIssued = issuedItems.length;
  const currentlyIssued = issuedItems.filter(
    (item) => item.status === "Issued"
  ).length;
  const returnedItems = issuedItems.filter(
    (item) => item.status === "Returned"
  ).length;
  const overdueItems = issuedItems.filter((item) => {
    if (item.status === "Issued") {
      const dueDate = new Date(item.dueDate);
      const today = new Date();
      return dueDate < today;
    }
    return false;
  }).length;

  // Action handlers
  const handleViewDetails = (item: IssuedItem) => {
    setSelectedItem(item);
    setIsDetailsModalOpen(true);
  };

  const handleExtendPeriod = (item: IssuedItem) => {
    setSelectedItem(item);
    setIsExtendModalOpen(true);
  };

  const handleDeleteItem = (item: IssuedItem) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteItem = async () => {
    if (!selectedItem) return;
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(
        `http://localhost:3000/api/admin/issued-items/${selectedItem.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(
        `Issued record for "${selectedItem.item.title}" has been deleted.`
      );
      setIssuedItems((prev) =>
        prev.filter((item) => item.id !== selectedItem.id)
      );
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to delete the issued record."
      );
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
    }
  };

  const handleExtendSuccess = (updatedItem: IssuedItem) => {
    setIssuedItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    toast.success("Due date extended successfully!");
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSortOrder = () => {
    setFilters((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  const clearFilters = () => {
    setSearch("");
    setFilters({
      status: "all",
      sortBy: "dueDate",
      sortOrder: "asc",
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (dateString === "-") return "-";
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge style
  const getStatusBadge = (item: IssuedItem) => {
    const isOverdue =
      item.status === "Issued" && new Date(item.dueDate) < new Date();

    if (isOverdue) {
      return "bg-red-100 text-red-800 border-red-200";
    }

    switch (item.status) {
      case "Issued":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Returned":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusDisplay = (item: IssuedItem) => {
    const isOverdue =
      item.status === "Issued" && new Date(item.dueDate) < new Date();
    return isOverdue ? "Overdue" : item.status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-muted mx-auto"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Loading Issued Items
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
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <Package className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Error Loading Issued Items
                </h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">
            Issued Items Management
          </h1>
          <p className="text-muted-foreground">
            Manage issued items, track due dates, and handle extensions
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Issued
                  </p>
                  <p className="text-2xl font-bold">{totalIssued}</p>
                </div>
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Currently Issued
                  </p>
                  <p className="text-2xl font-bold">{currentlyIssued}</p>
                </div>
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Returned
                  </p>
                  <p className="text-2xl font-bold">{returnedItems}</p>
                </div>
                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Overdue
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {overdueItems}
                  </p>
                </div>
                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user, book title, or author..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="issued">Issued</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => handleFilterChange("sortBy", value)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dueDate">Due Date</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={toggleSortOrder}>
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  {filters.sortOrder === "asc" ? "A-Z" : "Z-A"}
                </Button>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table with Actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredItems.length} of {issuedItems.length} issued items
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">User</TableHead>
                    <TableHead className="font-semibold">Item</TableHead>
                    <TableHead className="font-semibold">Issued Date</TableHead>
                    <TableHead className="font-semibold">Due Date</TableHead>
                    <TableHead className="font-semibold">Return Date</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Extensions</TableHead>
                    <TableHead className="font-semibold text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const isOverdue =
                      item.status === "Issued" &&
                      new Date(item.dueDate) < new Date();

                    return (
                      <TableRow key={item.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">
                              {item.user.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">
                              {item.item.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              by {item.item.authorOrCreator}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(item.issuedDate)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isOverdue && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            <span
                              className={
                                isOverdue ? "text-red-600 font-medium" : ""
                              }
                            >
                              {formatDate(item.dueDate)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(item.returnDate)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusBadge(item)}
                          >
                            {getStatusDisplay(item)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="font-medium">
                              {item.extensionCount}
                            </span>
                            <span className="text-muted-foreground">
                              {" "}
                              / {item.maxExtensionAllowed}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(item)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleExtendPeriod(item)}
                                disabled={
                                  item.status === "Returned" ||
                                  item.extensionCount >=
                                    item.maxExtensionAllowed
                                }
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Extend Period
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteItem(item)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Record
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {}}>
                                <Eye className="h-4 w-4 mr-2" />
                                Mark as return
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="space-y-2">
                          <Package className="h-12 w-12 text-muted-foreground mx-auto" />
                          <p className="text-muted-foreground">
                            No issued items found matching your criteria
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                          >
                            Clear Filters
                          </Button>
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

      {/* Modals */}
      {selectedItem && (
        <>
          <IssuedItemDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            item={selectedItem}
          />

          <ExtendPeriodModal
            isOpen={isExtendModalOpen}
            onOpenChange={setIsExtendModalOpen}
            item={selectedItem}
            onSuccess={handleExtendSuccess}
          />

          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onOpenChange={setIsDeleteModalOpen}
            onConfirm={confirmDeleteItem}
            itemName={`issued record for "${selectedItem.item.title}" to ${selectedItem.user.fullName}`}
          />
        </>
      )}
    </div>
  );
}
