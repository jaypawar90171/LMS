"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import FineDetailsModal from "@/components/FineDetailsModal";
import { FineFormModal } from "@/components/FineFormModal";
import { Fine, User, Item } from "@/interfaces/fines";

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
  Edit,
  RefreshCw,
  ArrowUpDown,
  FileWarning,
  Scale,
  CreditCard,
  BadgeCheck,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PaymentData {
  amountPaid: number;
  paymentMethod: PaymentMethod;
  referenceId?: string;
  notes?: string;
}

interface WaiverData {
  waiverReason: string;
}

export const FineReasons = ["Overdue", "Damaged"] as const;
export const FineStatuses = ["Outstanding", "Paid", "Waived"] as const;
export const PaymentMethods = ["Cash", "Card"] as const;

export type FineReason = (typeof FineReasons)[number];
export type FineStatus = (typeof FineStatuses)[number];
export type PaymentMethod = (typeof PaymentMethods)[number];

interface FilterState {
  status: string;
  reason: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

const statusBadgeColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "outstanding":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "waived":
      return "bg-slate-50 text-slate-700 border-slate-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const FinesManagement = () => {
  const [fines, setFines] = useState<Fine[]>([]);
  const [filteredFines, setFilteredFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    reason: "all",
    sortBy: "dateIncurred",
    sortOrder: "desc",
  });
  const [stats, setStats] = useState({
    totalFines: 0,
    totalIncurred: 0,
    totalOutstanding: 0,
    paidFines: 0,
  });

  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editFine, setEditFine] = useState<Fine | null>(null);

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] =
    useState(false);
  const [isWaiveFineModalOpen, setIsWaiveFineModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    amountPaid: 0,
    paymentMethod: "Cash",
    referenceId: "",
    notes: "",
  });
  const [waiverData, setWaiverData] = useState<WaiverData>({
    waiverReason: "",
  });

  const Navigate = useNavigate();

  const fetchFines = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        setError("No access token found. Please log in.");
        setLoading(false);
        return;
      }
      const response = await axios.get(
        "http://localhost:3000/api/admin/fines",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const finesData = Array.isArray(response.data.fines)
        ? response.data.fines
        : [];
      setFines(finesData);
      console.log(finesData);

      // Calculate statistics
      const totalFines = finesData.length;
      const totalIncurred = finesData.reduce(
        (sum: any, fine: any) => sum + fine.amountIncurred,
        0
      );
      const totalOutstanding = finesData.reduce(
        (sum: any, fine: any) => sum + fine.outstandingAmount,
        0
      );
      const paidFines = finesData.filter(
        (fine: any) => fine.status === "Paid"
      ).length;

      setStats({
        totalFines,
        totalIncurred,
        totalOutstanding,
        paidFines,
      });
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to fetch fines");
      console.error("Error fetching fines:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  useEffect(() => {
    let filtered = [...fines];

    // Search filter
    if (search) {
      const lowercasedSearch = search.toLowerCase();
      filtered = filtered.filter(
        (fine) =>
          fine.userId?.username.toLowerCase().includes(lowercasedSearch) ||
          fine.userId?.email.toLowerCase().includes(lowercasedSearch) ||
          fine.itemId?.title.toLowerCase().includes(lowercasedSearch) ||
          fine.reason.toLowerCase().includes(lowercasedSearch)
      );
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(
        (fine) => fine.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Reason filter
    if (filters.reason !== "all") {
      filtered = filtered.filter(
        (fine) => fine.reason.toLowerCase() === filters.reason.toLowerCase()
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case "dateIncurred":
          aValue = new Date(a.dateIncurred).getTime();
          bValue = new Date(b.dateIncurred).getTime();
          break;
        case "outstandingAmount":
          aValue = a.outstandingAmount;
          bValue = b.outstandingAmount;
          break;
        case "status":
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        default:
          aValue = new Date(a.dateIncurred).getTime();
          bValue = new Date(b.dateIncurred).getTime();
      }

      if (aValue < bValue) return filters.sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredFines(filtered);
  }, [fines, search, filters]);

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
      reason: "all",
      sortBy: "dateIncurred",
      sortOrder: "desc",
    });
  };

  const getUniqueReasons = () => {
    const reasons = fines.map((fine) => fine.reason);
    return [...new Set(reasons)];
  };

  const handleDeleteFine = async () => {
    const fineId = selectedFine?._id;

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast.error("No access token found. Please log in.");
        return;
      }

      toast.promise(
        axios.delete(`http://localhost:3000/api/admin/fines/${fineId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
        {
          loading: "Deleting fine...",
          success: () => {
            setIsDeleteModalOpen(false);
            setSelectedFine(null);
            fetchFines();
            return "Fine deleted successfully.";
          },
          error: (err) =>
            err.response?.data?.message || "Failed to delete fine.",
        }
      );
    } catch (error: any) {
      console.log(error.message);
    }
  };

  const fetchUsersAndItems = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) return;

      const [usersRes, itemsRes] = await Promise.all([
        axios.get("http://localhost:3000/api/admin/users", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        axios.get("http://localhost:3000/api/admin/inventory/items", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      setAllUsers(usersRes.data.users || []);
      setAllItems(itemsRes.data.inventoryItems || []);
      // console.log(itemsRes.data.inventoryItems);
    } catch (err) {
      console.error("Error fetching users/items:", err);
    }
  };

  useEffect(() => {
    fetchUsersAndItems();
  }, []);

  const handleRecordPayment = async () => {
    if (!selectedFine) return;

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast.error("No access token found. Please log in.");
        return;
      }

      toast.promise(
        axios.post(
          `http://localhost:3000/api/admin/fines/${selectedFine._id}/record-payment`,
          paymentData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        ),
        {
          loading: "Recording payment...",
          success: () => {
            setIsRecordPaymentModalOpen(false);
            setSelectedFine(null);
            setPaymentData({
              amountPaid: 0,
              paymentMethod: "Cash",
              referenceId: "",
              notes: "",
            });
            fetchFines();
            return `Payment of ₹${paymentData.amountPaid} recorded successfully.`;
          },
          error: (err) =>
            err.response?.data?.message || "Failed to record payment.",
        }
      );
    } catch (error: any) {
      console.log(error.message);
    }
  };

  const handleWaiveFine = async () => {
    if (!selectedFine) return;

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast.error("No access token found. Please log in.");
        return;
      }

      toast.promise(
        axios.post(
          `http://localhost:3000/api/admin/fines/${selectedFine._id}/waive`,
          waiverData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        ),
        {
          loading: "Waiving fine...",
          success: () => {
            setIsWaiveFineModalOpen(false);
            setSelectedFine(null);
            setWaiverData({ waiverReason: "" });
            fetchFines();
            return "Fine waived successfully.";
          },
          error: (err) =>
            err.response?.data?.message || "Failed to waive fine.",
        }
      );
    } catch (error: any) {
      console.log(error.message);
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
              Loading Fines Data
            </h3>
            <p className="text-muted-foreground">
              Fetching your latest records...
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
                <FileWarning className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Error Loading Fines
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-amber-50 p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">
              Fines Management
            </h1>
            <p className="text-muted-foreground">
              Track and manage all user fines and payments
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => {
                setFormMode("add");
                setEditFine(null);
                setIsFormModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Fine
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Fines
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalFines}
                  </p>
                </div>
                <Scale className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Outstanding
                  </p>
                  <p className="text-2xl font-bold text-rose-600">
                    ₹{stats.totalOutstanding.toFixed(2)}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-rose-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Incurred
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    ₹{stats.totalIncurred.toFixed(2)}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Paid Fines
                  </p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {stats.paidFines}
                  </p>
                </div>
                <BadgeCheck className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by User ID, Item ID, Reason..."
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
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Outstanding">Outstanding</SelectItem>
                    <SelectItem value="Waived">Waived</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.reason}
                  onValueChange={(value) => handleFilterChange("reason", value)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reasons</SelectItem>
                    {getUniqueReasons().map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => handleFilterChange("sortBy", value)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dateIncurred">Date Incurred</SelectItem>
                    <SelectItem value="outstandingAmount">
                      Outstanding Amt
                    </SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={toggleSortOrder}>
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  {filters.sortOrder === "asc" ? "Oldest" : "Newest"}
                </Button>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fines Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">
                      User ID / Item ID
                    </TableHead>
                    <TableHead className="font-semibold">Reason</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">
                      Date Incurred
                    </TableHead>
                    <TableHead className="font-semibold">
                      Date Settled
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFines.map((fine) => (
                    <TableRow key={fine._id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {/* Display username or email if userId exists, otherwise show 'N/A' */}
                            {fine.userId?.username ||
                              fine.userId?.email ||
                              "N/A"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {/* Display item title if it exists */}
                            {fine.itemId?.title
                              ? `Item: ${fine.itemId.title}`
                              : "Item: N/A"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>{fine.reason}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusBadgeColor(fine.status)}
                        >
                          {fine.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            ₹{fine.outstandingAmount.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            of ₹{fine.amountIncurred.toFixed(2)}
                          </span>
                          {fine.amountPaid > 0 && (
                            <span className="text-xs text-emerald-600">
                              Paid: ₹{fine.amountPaid.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(fine.dateIncurred).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {fine.dateSettled
                          ? new Date(fine.dateSettled).toLocaleDateString()
                          : "-"}
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
                              onClick={() => {
                                setSelectedFine(fine);
                                setIsModalOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {fine.status === "Outstanding" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedFine(fine);
                                  setPaymentData({
                                    amountPaid: fine.outstandingAmount,
                                    paymentMethod: "Cash",
                                    referenceId: "",
                                    notes: "",
                                  });
                                  setIsRecordPaymentModalOpen(true);
                                }}
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Record Payment
                              </DropdownMenuItem>
                            )}
                            {fine.status === "Outstanding" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedFine(fine);
                                  setWaiverData({ waiverReason: "" });
                                  setIsWaiveFineModalOpen(true);
                                }}
                              >
                                <BadgeCheck className="h-4 w-4 mr-2" />
                                Waive Fine
                              </DropdownMenuItem>
                            )}
                            {fine.status === "Outstanding" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setFormMode("edit");
                                  setEditFine(fine);
                                  setIsFormModalOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Fine
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedFine(fine);
                                setIsDeleteModalOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Fine
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredFines.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="space-y-2">
                          <FileWarning className="h-12 w-12 text-muted-foreground mx-auto" />
                          <p className="text-muted-foreground">
                            No fines found matching your criteria.
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

      <FineDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        fine={selectedFine}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDeleteFine}
        itemName={selectedFine?._id ?? ""}
      />

      <FineFormModal
        isOpen={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        mode={formMode}
        fineData={editFine}
        allUsers={allUsers}
        allItems={allItems}
        onSuccess={() => fetchFines()}
      />

      {/* Record Payment Modal */}
      <Dialog
        open={isRecordPaymentModalOpen}
        onOpenChange={setIsRecordPaymentModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amountPaid">Amount Paid</Label>
              <Input
                id="amountPaid"
                type="number"
                value={paymentData.amountPaid}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    amountPaid: parseFloat(e.target.value) || 0,
                  })
                }
                max={selectedFine?.outstandingAmount}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Outstanding: ₹{selectedFine?.outstandingAmount.toFixed(2)}
              </p>
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={paymentData.paymentMethod}
                onValueChange={(value: PaymentMethod) =>
                  setPaymentData({ ...paymentData, paymentMethod: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Online Transfer">
                    Online Transfer
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="referenceId">Reference ID (Optional)</Label>
              <Input
                id="referenceId"
                value={paymentData.referenceId}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    referenceId: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={paymentData.notes}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    notes: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRecordPaymentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRecordPayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Waive Fine Modal */}
      <Dialog
        open={isWaiveFineModalOpen}
        onOpenChange={setIsWaiveFineModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Waive Fine</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="waiverReason">Reason for Waiver *</Label>
              <Textarea
                id="waiverReason"
                value={waiverData.waiverReason}
                onChange={(e) =>
                  setWaiverData({
                    waiverReason: e.target.value,
                  })
                }
                placeholder="Enter reason for waiving this fine..."
                required
              />
            </div>
            {selectedFine && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  You are about to waive a fine of ₹
                  {selectedFine.outstandingAmount.toFixed(2)} for{" "}
                  {selectedFine.userId?.username || "user"}.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsWaiveFineModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleWaiveFine}
              disabled={!waiverData.waiverReason.trim()}
            >
              Waive Fine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinesManagement;
