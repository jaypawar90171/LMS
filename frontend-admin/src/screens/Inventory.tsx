"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ItemDetailsModal from "@/components/ItemDetailsModal";
import { ItemFormModal } from "@/components/ItemFormModal";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  Trash2,
  Clock,
  Package,
  BookOpen,
  Users,
  TrendingUp,
  ArrowUpDown,
  Download,
  RefreshCw,
  Edit,
  List,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { DialogModal } from "@/components/Dialog";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { useNavigate } from "react-router-dom";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface InventoryItem {
  _id: string;
  title: string;
  authorOrCreator: string;
  categoryId: {
    _id: string;
    name: string;
  };
  quantity: number;
  availableCopies: number;
  isbnOrIdentifier?: string;
  publicationYear?: number;
  description?: string;
  publisherOrManufacturer?: string;
  defaultReturnPeriod?: number;
  status?: string;
  barcode?: string;
}

interface FilterState {
  category: string;
  availability: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

const categoryBadgeColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case "tools":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "toys":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "furniture":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "kitchen accessories":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "books":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "clothes":
      return "bg-blue-100 text-blue-600 border-blue-200";
    case "electronics":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "sports equipment":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const Inventory = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    category: "all",
    availability: "all",
    sortBy: "title",
    sortOrder: "asc",
  });
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [stats, setStats] = useState({
    totalItems: 0,
    availableItems: 0,
    unavailableItems: 0,
    totalCategories: 0,
  });
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const Navigate = useNavigate();
  const USERS_PER_PAGE = 10;

  const fetchInventoryItems = async (page: number) => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        setError("No access token found. Please log in.");
        setLoading(false);
        return;
      }
      const [inventoryResponse, categoriesResponse] = await Promise.all([
        axios.get(
          `http://localhost:3000/api/admin/inventory/items?page=${page}&limit=${USERS_PER_PAGE}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        ),
        axios.get("http://localhost:3000/api/admin/inventory/categories", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      ]);

      setTotalPages(inventoryResponse.data.pagination.totalPages);

      const items = Array.isArray(inventoryResponse.data.inventoryItems)
        ? inventoryResponse.data.inventoryItems
        : [];
      setInventoryItems(items);

      const uniqueCategories = Array.isArray(categoriesResponse.data.data)
        ? categoriesResponse.data.data
        : [];
      setCategories(uniqueCategories);

      const totalItems = items.length;
      const availableItems = items.filter(
        (item: any) => item.availableCopies > 0
      ).length;
      const unavailableItems = totalItems - availableItems;

      setStats({
        totalItems,
        availableItems,
        unavailableItems,
        totalCategories: uniqueCategories.length,
      });
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Failed to fetch inventory items"
      );
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryItems(currentPage);
  }, [currentPage]);

  useEffect(() => {
    let filtered = [...inventoryItems];

    if (search) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.authorOrCreator?.toLowerCase().includes(search.toLowerCase()) ||
          item.categoryId?.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filters.category !== "all") {
      filtered = filtered.filter(
        (item) =>
          item.categoryId?.name.toLowerCase() === filters.category.toLowerCase()
      );
    }

    if (filters.availability !== "all") {
      if (filters.availability === "available") {
        filtered = filtered.filter((item) => item.availableCopies > 0);
      } else if (filters.availability === "unavailable") {
        filtered = filtered.filter((item) => item.availableCopies === 0);
      }
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "author":
          aValue = a.authorOrCreator?.toLowerCase() || "";
          bValue = b.authorOrCreator?.toLowerCase() || "";
          break;
        case "category":
          aValue = a.categoryId?.name.toLowerCase();
          bValue = b.categoryId?.name.toLowerCase();
          break;
        case "availability":
          aValue = a.availableCopies;
          bValue = b.availableCopies;
          break;
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }

      if (aValue < bValue) return filters.sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredItems(filtered);
  }, [inventoryItems, search, filters]);

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
      category: "all",
      availability: "all",
      sortBy: "title",
      sortOrder: "asc",
    });
  };

  const handleViewDetails = async (itemId: string) => {
    setIsDetailsModalOpen(true);
    setModalLoading(true);
    setModalError(null);
    setSelectedItem(null);

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        setModalError("No access token found. Please log in.");
        return;
      }
      const response = await axios.get(
        `http://localhost:3000/api/admin/inventory/items/${itemId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setSelectedItem(response.data.item);
    } catch (err: any) {
      setModalError(
        err.response?.data?.message || "Failed to fetch item details."
      );
      console.error("Error fetching item details:", err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleDeleteItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteItem = async () => {
    if (!selectedItem) return;
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast.error("No access token found. Please log in again.");
        return;
      }

      await axios.delete(
        `http://localhost:3000/api/admin/inventory/items/${selectedItem._id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      toast.success(`${selectedItem.title} has been deleted.`);
      fetchInventoryItems(currentPage);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to delete the item."
      );
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
    }
  };

  const handleSubmit = async (formData: Record<string, any>) => {
    if (!selectedItem) return;

    const categoryObject = categories.find(
      (cat) => cat._id === formData.categoryId
    );

    const dataToSend = {
      title: formData.title,
      authorOrCreator: formData.authorOrCreator,
      description: formData.description,
      quantity: Number(formData.quantity),
      availableCopies: Number(formData.availableCopies),
      categoryId: formData.categoryId,
      status: formData.status,
    };

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast.error("No access token found. Please log in again.");
        return;
      }

      await axios.put(
        `http://localhost:3000/api/admin/inventory/items/${selectedItem._id}`,
        dataToSend,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      toast.success("Item has been updated");
      fetchInventoryItems(currentPage);
    } catch (error: any) {
      console.error("Error in updating the item:", error);
      toast.error(error.response?.data?.message || "Failed to update item.");
    } finally {
      setIsEditModalOpen(false);
      setSelectedItem(null);
    }
  };

  const handleAddSubmit = async (formData: Record<string, any>) => {
    const dataToSend = new FormData();

    for (const key in formData) {
      if (formData[key] instanceof File) {
        dataToSend.append(key, formData[key]);
      } else {
        dataToSend.append(key, String(formData[key]));
      }
    }

    let barcode = "";
    try {
      const result = await axios.get(
        "http://localhost:3000/api/admin/barcode/generate",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      barcode = result.data.barcode;
      dataToSend.append("barcode", barcode);
    } catch (error) {
      console.error("Error generating barcode:", error);
    }

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast.error("No access token found. Please log in again.");
        return;
      }

      await axios.post(
        "http://localhost:3000/api/admin/inventory/items",
        dataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      toast.success("New item added successfully.");
      fetchInventoryItems(currentPage);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add new item.");
    } finally {
      setIsAddItemModalOpen(false);
    }
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
              Loading Inventory
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
                  Error Loading Inventory
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">
              Inventory Management
            </h1>
            <p className="text-muted-foreground">
              Manage your library collection and track availability
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                Navigate("/categories");
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Manage Categories
            </Button>
            <Button variant="outline" size="sm">
              <Clock className="h-4 w-4 mr-2" />
              Return Requests
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View Requests
            </Button>
            <Button size="sm" onClick={() => setIsAddItemModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Item
            </Button>
          </div>
        </div>
        {/* stattistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Items
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalItems}
                  </p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Available
                  </p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {stats.availableItems}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Unavailable
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.unavailableItems}
                  </p>
                </div>
                <Users className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Categories
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalCategories}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items, authors, or categories..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={filters.category}
                  onValueChange={(value) =>
                    handleFilterChange("category", value)
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.availability}
                  onValueChange={(value) =>
                    handleFilterChange("availability", value)
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => handleFilterChange("sortBy", value)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="author">Author</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="availability">Availability</SelectItem>
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

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredItems.length} of {inventoryItems.length} items
          </p>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Title</TableHead>
                    <TableHead className="font-semibold">
                      Author/Publisher
                    </TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">
                      Availability
                    </TableHead>
                    <TableHead className="font-semibold">Copies</TableHead>
                    <TableHead className="font-semibold text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item, idx) => (
                    <TableRow
                      key={item._id || idx}
                      className="hover:bg-muted/30"
                    >
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">
                            {item.title}
                          </p>
                          {item.isbnOrIdentifier && (
                            <p className="text-xs text-muted-foreground">
                              ISBN: {item.isbnOrIdentifier}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-foreground">
                          {item.authorOrCreator ||
                            item.publisherOrManufacturer ||
                            "N/A"}
                        </p>
                        {item.publicationYear && (
                          <p className="text-xs text-muted-foreground">
                            {item.publicationYear}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={categoryBadgeColor(
                            item.categoryId?.name || ""
                          )}
                        >
                          {item.categoryId?.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              item.availableCopies > 0
                                ? "bg-emerald-500"
                                : "bg-red-500"
                            }`}
                          />
                          <span
                            className={`font-medium ${
                              item.availableCopies > 0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {item.availableCopies > 0
                              ? "Available"
                              : "Unavailable"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">
                            {item.availableCopies}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            / {item.quantity || 0}
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
                              onClick={() => handleViewDetails(item._id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditItem(item)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Item
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteItem(item)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                Navigate("/queues", {
                                  state: { itemId: item._id },
                                });
                              }}
                            >
                              <List className="h-4 w-4 mr-2" />
                              View Queue
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="space-y-2">
                          <Package className="h-12 w-12 text-muted-foreground mx-auto" />
                          <p className="text-muted-foreground">
                            No items found matching your criteria
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

      {isDetailsModalOpen && selectedItem && (
        <ItemDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          itemData={selectedItem}
          loading={modalLoading}
          error={modalError}
        />
      )}

      <ItemFormModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        mode="edit"
        itemData={selectedItem}
        categories={categories}
        onSuccess={() => {
          fetchInventoryItems(currentPage);
        }}
      />

      {isDeleteModalOpen && selectedItem && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          onConfirm={confirmDeleteItem}
          itemName={selectedItem.title}
        />
      )}

      <ItemFormModal
        isOpen={isAddItemModalOpen}
        onOpenChange={setIsAddItemModalOpen}
        mode="add"
        itemData={null}
        categories={categories}
        onSuccess={() => {
          fetchInventoryItems(currentPage);
        }}
      />
    </div>
  );
};

export default Inventory;
