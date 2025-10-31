"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  Search,
  User,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  ArrowLeftToLine,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface User {
  _id: string;
  fullName: string;
  email: string;
  employeeId: string;
  role: string;
}

interface InventoryItem {
  _id: string;
  title: string;
  authorOrCreator: string;
  categoryId: {
    _id: string;
    name: string;
  };
  availableCopies: number;
  quantity: number;
}

interface IssueRequest {
  _id: string;
  userId: User;
  itemId: InventoryItem;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
}

const IssueManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<IssueRequest[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [searchUser, setSearchUser] = useState("");
  const [searchItem, setSearchItem] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingRequests();
    fetchUsers();
    fetchAvailableItems();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        "https://lms-backend1-q5ah.onrender.com/api/admin/issue-requests/pending",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setPendingRequests(response.data.requests);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      toast.error("Failed to fetch pending requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        "https://lms-backend1-q5ah.onrender.com/api/admin/users",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchAvailableItems = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        "https://lms-backend1-q5ah.onrender.com/api/admin/inventory/items?available=true",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setItems(response.data.inventoryItems || []);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const handleIssueItem = async () => {
    if (!selectedUser || !selectedItem) {
      toast.error("Please select both user and item");
      return;
    }

    setLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.post(
        "https://lms-backend1-q5ah.onrender.com/api/admin/issue-item",
        {
          userId: selectedUser,
          itemId: selectedItem,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      toast.success(response.data.message);
      setSelectedUser("");
      setSelectedItem("");
      fetchAvailableItems();
      fetchPendingRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to issue item");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.put(
        `https://lms-backend1-q5ah.onrender.com/api/admin/issue-requests/${requestId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      toast.success(response.data.message);
      fetchPendingRequests();
      fetchAvailableItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve request");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      await axios.put(
        `https://lms-backend1-q5ah.onrender.com/api/admin/issue-requests/${requestId}/reject`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      toast.success("Request rejected");
      fetchPendingRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject request");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchUser.toLowerCase()) ||
      user.employeeId.toLowerCase().includes(searchUser.toLowerCase()) ||
      user.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchItem.toLowerCase()) ||
      item.authorOrCreator.toLowerCase().includes(searchItem.toLowerCase())
  );

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
              Loading Pending Request
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
            Error Loading Issue Management Page
          </h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div
              className="flex gap-2 cursor-pointer items-center mb-4"
              onClick={() => navigate("/inventory")}
            >
              <ArrowLeftToLine className="h-4 w-4" />
              <p className="text-md text-gray-600">Back</p>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Issue Items</h1>
            <p className="text-muted-foreground">
              Manage item issuance and pending requests
            </p>
          </div>
        </div>

        {/* Quick Issue Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Quick Issue Item
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* User Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select User</label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users by name, ID, or email..."
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredUsers.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.fullName}</span>
                            <span className="text-xs text-muted-foreground">
                              {user.employeeId} • {user.email}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Item Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Item</label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items by title or author..."
                      value={searchItem}
                      onChange={(e) => setSearchItem(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedItem} onValueChange={setSelectedItem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an item" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredItems.map((item) => (
                        <SelectItem key={item._id} value={item._id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{item.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {item.authorOrCreator} • {item.availableCopies}{" "}
                              available
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button
              onClick={handleIssueItem}
              disabled={!selectedUser || !selectedItem || loading}
              className="w-full"
            >
              {loading ? "Issuing..." : "Issue Item"}
            </Button>
          </CardContent>
        </Card>

        {/* Pending Requests Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Issue Requests
            </h2>

            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending requests</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {request.userId.fullName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {request.userId.employeeId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {request.itemId.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {request.itemId.authorOrCreator}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Pending</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleApproveRequest(request._id)
                                }
                                className="text-emerald-600"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRejectRequest(request._id)}
                                className="text-destructive"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IssueManagement;
