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
} from "lucide-react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
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
import { useNavigate } from "react-router-dom";

interface item {
  _id: string;
  title: string;
  status: string;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
}

interface QueueMember {
  userId: User;
  position: number;
  dateJoined: string;
}

interface queueInterface {
  _id: string;
  itemId: item;
  queueMembers: QueueMember[];
  createdAt: string;
  updatedAt: string;
}

const QueuePage = () => {
  const location = useLocation();
  const itemId = location.state?.itemId;

  const [queueItem, setQueueItems] = useState<queueInterface | null>(null);
  const [search, setSearch] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast.error("No access token found. Please log in again.");
        return;
      }

      const response = await axios.get(
        `http://localhost:3000/api/admin/inventory/items/${itemId}/view-queue`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setQueueItems(response.data.donation[0]);
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
        `http://localhost:3000/api/admin/inventory/items/queue/${queueItem._id}/issue`,
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
      // toast.error("Failed to allocate item.");
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
        `http://localhost:3000/api/admin/inventory/items/queue/${queueItem._id}/remove-user`,
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
      // toast.error("Failed to remove user.");
      setIsDeleteModalOpen(false);
    }
  };

  // Conditionally render a loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-500">Loading queue data...</p>
      </div>
    );
  }

  // Handle the case where the queue is not found
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
            className="flex gap-2 cursor-pointer items-center"
            onClick={() => {
              navigate("/inventory");
            }}
          >
            <ArrowLeftToLine />
            <p className="text-md text-gray-600">Back</p>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Queue for {queueItem.itemId.title}{" "}
            <span className="text-sm font-medium text-muted-foreground">
              ({queueItem.itemId.status})
            </span>
          </h1>
          <p className="text-muted-foreground">
            Manage and organize your Queue
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-md text-blue-700">
                Total Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-blue-900">
                {queueItem.queueMembers.length ?? 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-md text-green-700">
                Item Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-green-900">
                {queueItem.itemId.status}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-md text-purple-700">
                Created At
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-purple-900">
                {new Date(queueItem.createdAt).toLocaleDateString()}
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
                  <TableHead>Date Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers && filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <TableRow key={member.userId._id}>
                      <TableCell>{member.position}</TableCell>
                      <TableCell>{member.userId.fullName}</TableCell>
                      <TableCell>{member.userId.email}</TableCell>
                      <TableCell>
                        {new Date(member.dateJoined).toLocaleDateString()}
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
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Allocate
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
                      colSpan={5}
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
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will allocate the item to the
              user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAllocate}>
              Continue
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
