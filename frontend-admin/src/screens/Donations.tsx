import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Package,
  RefreshCw,
  Search,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Donation {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
  };
  itemType: {
    _id: string;
    name: string;
  };
  title: string;
  description: string;
  photos: string[];
  duration: number;
  preferredContactMethod: string;
  status: "Pending" | "Accepted" | "Rejected";
  createdAt: string;
  updatedAt: string;
}

const USERS_PER_PAGE = 10;

export default function DonationManagement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    accepted: 0,
    pending: 0,
    rejected: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchData = async (page = currentPage) => {
    setLoading(true);
    setError(null);
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) throw new Error("Token not found");

    try {
      const response = await axios.get(
        `https://lms-backend1-q5ah.onrender.com/api/admin/donations?page=${page}&limit=${USERS_PER_PAGE}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data: Donation[] = response.data.data;
      setDonations(data);
      console.log("pagination", response.data);
      setTotalPages(
        response.data.totalPages || response.data.pagination?.totalPages || 1
      );

      setStats({
        total: data.length,
        accepted: data.filter((d) => d.status === "Accepted").length,
        pending: data.filter((d) => d.status === "Pending").length,
        rejected: data.filter((d) => d.status === "Rejected").length,
      });

      toast.success("Donations fetched successfully");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch donations.";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDonations = useMemo(() => {
    return donations
      .filter((donation) => {
        if (filters.status === "all") return true;
        return donation.status === filters.status;
      })
      .filter((donation) => {
        const search = searchTerm.toLowerCase();
        return (
          donation.userId?.fullName?.toLowerCase().includes(search) ||
          donation.title.toLowerCase().includes(search) ||
          donation.userId.email.toLowerCase().includes(search)
        );
      });
  }, [donations, searchTerm, filters]);

  const handleUpdateStatus = async (
    donationId: string,
    status: "Accepted" | "Rejected"
  ) => {
    const accessToken = localStorage.getItem("accessToken");
    const promise = axios.put(
      `https://lms-backend1-q5ah.onrender.com/api/admin/donations/${donationId}/status`,
      { status },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    toast.promise(promise, {
      loading: `Updating status to ${status}...`,
      success: (response) => {
        setDonations((prevDonations) =>
          prevDonations.map((d) =>
            d._id === donationId ? { ...d, status: status } : d
          )
        );
        return "Status updated successfully!";
      },
      error: (err) => err.response?.data?.message || "Failed to update status.",
    });
    fetchData();
  };

  const getStatusBadge = (status: Donation["status"]) => {
    switch (status) {
      case "Accepted":
        return (
          <Badge variant="default" className="bg-emerald-500 text-white">
            <CheckCircle className="mr-2 h-4 w-4" /> Accepted
          </Badge>
        );
      case "Pending":
        return (
          <Badge variant="secondary">
            <Clock className="mr-2 h-4 w-4" /> Pending
          </Badge>
        );
      case "Rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-2 h-4 w-4" /> Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getDonationType = (donation: Donation) => {
    return donation.duration === 0 || !donation.duration
      ? "Giveaway"
      : "Duration-based";
  };

  const getDurationDisplay = (donation: Donation) => {
    if (donation.duration === 0 || !donation.duration) {
      return "Permanent";
    }
    return `${donation.duration} days`;
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
              Loading Donations
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
            Error Loading Donations
          </h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-8">
        {/* header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Donation Details
          </h1>
          <p className="text-muted-foreground">
            View and manage donation request details.
          </p>
        </div>

        {/* stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Donations
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          {/* Accepted */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.accepted}</div>
            </CardContent>
          </Card>
          {/* Pending */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          {/* Rejected */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Search Section */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by donor, email, or title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Accepted">Accepted</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/*  */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donated By</TableHead>
                  <TableHead>Item Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Donation Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDonations.map((donation) => (
                  <TableRow key={donation._id}>
                    <TableCell>
                      <div className="font-medium">
                        {donation?.userId?.fullName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {donation?.userId?.email}
                      </div>
                    </TableCell>
                    <TableCell>{donation.title}</TableCell>
                    <TableCell>{donation.itemType.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getDonationType(donation)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getDurationDisplay(donation)}</TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(donation.status)}
                    </TableCell>
                    <TableCell>
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-emerald-600"
                            onClick={() =>
                              handleUpdateStatus(donation._id, "Accepted")
                            }
                            disabled={donation.status !== "Pending"}
                          >
                            <ThumbsUp className="mr-2 h-4 w-4" />
                            <span>Accept</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                              handleUpdateStatus(donation._id, "Rejected")
                            }
                            disabled={donation.status !== "Pending"}
                          >
                            <ThumbsDown className="mr-2 h-4 w-4" />
                            <span>Reject</span>
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
    </div>
  );
}
