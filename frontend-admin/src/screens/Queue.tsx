// QueuePage.tsx - Updated version
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeftToLine,
  CheckCircle,
  Filter,
  MoreHorizontal,
  Search,
  Trash2,
  Bell,
  Clock,
} from "lucide-react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";

interface Item {
  _id: string;
  title: string;
  status: string;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
}

interface QueueMember {
  userId: User;
  position: number;
  dateJoined: string;
  notifiedAt?: string;
  notificationExpires?: string;
  status: "waiting" | "notified" | "skipped" | "issued";
}

interface QueueInterface {
  _id: string;
  itemId: Item;
  queueMembers: QueueMember[];
  currentNotifiedUser?: User;
  isProcessing: boolean;
  createdAt: string;
  updatedAt: string;
}

const QueuePage = () => {
  const location = useLocation();
  const itemId = location.state?.itemId;
  const navigate = useNavigate();

  const [queueItem, setQueueItem] = useState<QueueInterface | null>(null);
  const [search, setSearch] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isNotifyAlertOpen, setIsNotifyAlertOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast.error("No access token found. Please log in again.");
        return;
      }

      const response = await axios.get(
        `https://lms-backend1-q5ah.onrender.com/api/admin/inventory/items/${itemId}/view-queue`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setQueueItem(response.data.donation[0] || null);
    } catch (error: any) {
      console.error("Error fetching Queue Members:", error);
      toast.error(error.response?.data?.message || "Failed to fetch Queue.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (itemId) {
      fetchQueue();
    }
  }, [itemId]);

  const filteredMembers = queueItem?.queueMembers?.filter((m) =>
    m.userId?.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAlert = (id: string) => {
    setSelectedUserId(id);
    setIsAlertOpen(true);
  };

  const handleNotifyUser = (id: string) => {
    setSelectedUserId(id);
    setIsNotifyAlertOpen(true);
  };

  const handleDeleteAlert = (id: string) => {
    setSelectedUserId(id);
    setIsDeleteModalOpen(true);
  };

  const handleAllocate = async () => {
    if (!selectedUserId || !queueItem?._id) {
      toast.error("User or queue not selected.");
      return;
    }

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast.error("No access token found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `https://lms-backend1-q5ah.onrender.com/api/admin/inventory/items/queue/${queueItem._id}/issue`,
        {
          userId: selectedUserId,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      toast.success(response.data.message || "Item allocated successfully!");
      setIsAlertOpen(false);
      fetchQueue();
    } catch (error: any) {
      console.error("Error allocating item:", error);
      toast.error(error.response?.data?.message || "Failed to allocate item.");
    }
  };

  const handleProcessReturn = async () => {
    if (!itemId) {
      toast.error("Item ID not found.");
      return;
    }

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast.error("No access token found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `https://lms-backend1-q5ah.onrender.com/api/admin/inventory/items/${itemId}/process-return`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      toast.success(response.data.message || "Return processed successfully!");
      setIsNotifyAlertOpen(false);
      fetchQueue();
    } catch (error: any) {
      console.error("Error processing return:", error);
      toast.error(error.response?.data?.message || "Failed to process return.");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserId || !queueItem?._id) {
      toast.error("User or queue not selected.");
      return;
    }

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast.error("No access token found. Please log in again.");
        return;
      }

      const response = await axios.put(
        `https://lms-backend1-q5ah.onrender.com/api/admin/inventory/items/queue/${queueItem._id}/remove-user`,
        {
          userId: selectedUserId,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      toast.success(response.data.message || "User removed successfully!");
      fetchQueue();
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      console.error("Error in removing user:", error);
      toast.error(error.response?.data?.message || "Failed to remove user.");
      setIsDeleteModalOpen(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      waiting: { color: "bg-yellow-100 text-yellow-800", label: "Waiting" },
      notified: { color: "bg-blue-100 text-blue-800", label: "Notified" },
      skipped: { color: "bg-gray-100 text-gray-800", label: "Skipped" },
      issued: { color: "bg-green-100 text-green-800", label: "Issued" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.waiting;

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-500">Loading queue data...</p>
      </div>
    );
  }

  if (!queueItem) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-500">No queue found for this item.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div>
          <div
            className="flex gap-2 cursor-pointer items-center mb-4"
            onClick={() => navigate("/queue-dashboard")}
          >
            <ArrowLeftToLine className="h-4 w-4" />
            <p className="text-md text-gray-600">Back</p>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Queue for {queueItem.itemId.title}{" "}
                <span className="text-sm font-medium text-muted-foreground">
                  ({queueItem.itemId.status})
                </span>
              </h1>
              <p className="text-muted-foreground">
                Manage and organize your queue
              </p>
            </div>
            <Button
              onClick={handleProcessReturn}
              disabled={
                queueItem.isProcessing || queueItem.queueMembers.length === 0
              }
            >
              <Bell className="h-4 w-4 mr-2" />
              Process Next User
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-700">
                Total Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-900">
                {queueItem.queueMembers.length ?? 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-700">Waiting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-900">
                {
                  queueItem.queueMembers.filter((m) => m.status === "waiting")
                    .length
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-700">
                Notified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-900">
                {
                  queueItem.queueMembers.filter((m) => m.status === "notified")
                    .length
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-700">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-purple-900">
                {queueItem.isProcessing ? "Processing" : "Idle"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-xl px-3 py-2 w-full md:w-1/3">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <Input
              type="text"
              placeholder="Search by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Queue Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>User Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Joined</TableHead>
                  <TableHead>Notified At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers && filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <TableRow key={member.userId._id}>
                      <TableCell className="font-medium">
                        {member.position}
                        {member.position === 1 && queueItem.isProcessing && (
                          <Clock className="h-3 w-3 ml-1 text-orange-500 inline" />
                        )}
                      </TableCell>
                      <TableCell>{member.userId.fullName}</TableCell>
                      <TableCell>{member.userId.email}</TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell>
                        {new Date(member.dateJoined).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {member.notifiedAt
                          ? new Date(member.notifiedAt).toLocaleDateString()
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
                              onClick={() => handleOpenAlert(member.userId._id)}
                              disabled={member.status === "issued"}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Allocate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleNotifyUser(member.userId._id)
                              }
                              disabled={member.status !== "waiting"}
                            >
                              <Bell className="h-4 w-4 mr-2" />
                              Notify
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleDeleteAlert(member.userId._id)
                              }
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No members in queue
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Allocate Item Dialog */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Allocate Item</AlertDialogTitle>
            <AlertDialogDescription>
              This will allocate the item to the selected user immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAllocate}>
              Allocate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Process Return Dialog */}
      <AlertDialog open={isNotifyAlertOpen} onOpenChange={setIsNotifyAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Process Item Return</AlertDialogTitle>
            <AlertDialogDescription>
              This will notify the next user in queue that the item is
              available. They will have 24 hours to respond.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleProcessReturn}>
              Notify Next User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDeleteUser}
        itemName={
          filteredMembers?.find((m) => m.userId._id === selectedUserId)?.userId
            .fullName || "User"
        }
      />
    </div>
  );
};

export default QueuePage;
