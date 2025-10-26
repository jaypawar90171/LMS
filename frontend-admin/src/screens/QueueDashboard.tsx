import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Clock,
  AlertCircle,
  ArrowRight,
  Search,
  Filter,
  TrendingUp,
} from "lucide-react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/Button";

interface QueueItem {
  _id: string;
  itemId: {
    _id: string;
    title: string;
    status: string;
    availableCopies: number;
    categoryId?: {
      name: string;
    };
  };
  queueMembers: Array<{
    userId: {
      _id: string;
      fullName: string;
      email: string;
    };
    position: number;
    status: string;
    dateJoined: string;
    notifiedAt?: string;
  }>;
  currentNotifiedUser?: {
    _id: string;
    fullName: string;
  };
  isProcessing: boolean;
  createdAt: string;
  updatedAt: string;
}

const QueueDashboard = () => {
  const navigate = useNavigate();
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); 

  const fetchAllQueues = async () => {
    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast.error("No access token found. Please log in again.");
        return;
      }

      
      const response = await axios.get(
        "http://localhost:3000/api/admin/inventory/queues",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setQueues(response.data.data || []);
    } catch (error: any) {
      console.error("Error fetching queues:", error);
      toast.error(error.response?.data?.message || "Failed to fetch queues.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllQueues();
  }, []);

  const filteredQueues = queues.filter((queue) => {
    const matchesSearch = queue.itemId.title
      .toLowerCase()
      .includes(search.toLowerCase());

    if (filter === "active") {
      return matchesSearch && queue.queueMembers.length > 0;
    } else if (filter === "processing") {
      return matchesSearch && queue.isProcessing;
    }

    return matchesSearch;
  });

  const getQueueStats = () => {
    const totalQueues = queues.length;
    const activeQueues = queues.filter((q) => q.queueMembers.length > 0).length;
    const processingQueues = queues.filter((q) => q.isProcessing).length;
    const totalWaitingUsers = queues.reduce(
      (sum, queue) => sum + queue.queueMembers.length,
      0
    );

    return { totalQueues, activeQueues, processingQueues, totalWaitingUsers };
  };

  const getStatusBadge = (queue: QueueItem) => {
    if (queue.isProcessing) {
      return (
        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
          <Clock className="h-3 w-3 inline mr-1" />
          Processing
        </span>
      );
    } else if (queue.queueMembers.length > 0) {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
          <Users className="h-3 w-3 inline mr-1" />
          Active
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
          Inactive
        </span>
      );
    }
  };

  const getUrgentQueues = () => {
    return queues.filter(
      (queue) =>
        queue.queueMembers.length >= 5 || 
        queue.isProcessing 
    );
  };

  const stats = getQueueStats();
  const urgentQueues = getUrgentQueues();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-500">Loading queue dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Queue Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage all item queues in one place
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-700 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Total Queues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-900">
                {stats.totalQueues}
              </p>
              <p className="text-xs text-gray-500">Items with queue system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-700 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Active Queues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-900">
                {stats.activeQueues}
              </p>
              <p className="text-xs text-gray-500">With waiting users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-700 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-900">
                {stats.processingQueues}
              </p>
              <p className="text-xs text-gray-500">Notifying users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-700 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Total Waiting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-900">
                {stats.totalWaitingUsers}
              </p>
              <p className="text-xs text-gray-500">Users in queues</p>
            </CardContent>
          </Card>
        </div>

        {/* Urgent Alerts */}
        {urgentQueues.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800 flex items-center text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                Attention Required ({urgentQueues.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {urgentQueues.slice(0, 3).map((queue) => (
                  <div
                    key={queue._id}
                    className="flex justify-between items-center p-2 bg-orange-100 rounded"
                  >
                    <div>
                      <p className="font-medium text-orange-900">
                        {queue.itemId.title}
                      </p>
                      <p className="text-xs text-orange-700">
                        {queue.queueMembers.length} users waiting •{" "}
                        {queue.isProcessing
                          ? "Processing notification"
                          : "Needs attention"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate("/queues", {
                          state: { itemId: queue.itemId._id },
                        })
                      }
                    >
                      Manage
                    </Button>
                  </div>
                ))}
                {urgentQueues.length > 3 && (
                  <p className="text-xs text-orange-600 text-center">
                    ... and {urgentQueues.length - 3} more queues need attention
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-xl px-3 py-2 w-full md:w-1/3">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <Input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm"
          >
            <option value="all">All Queues</option>
            <option value="active">Active Only</option>
            <option value="processing">Processing</option>
          </select>
          <Button variant="outline" onClick={fetchAllQueues}>
            Refresh
          </Button>
        </div>

        {/* Queues Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Queue Length</TableHead>
                  <TableHead>Current User</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQueues.length > 0 ? (
                  filteredQueues.map((queue) => (
                    <TableRow key={queue._id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{queue.itemId.title}</p>
                          <p className="text-xs text-gray-500">
                            {queue.itemId.availableCopies > 0
                              ? `${queue.itemId.availableCopies} available`
                              : "Out of stock"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(queue)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-500 mr-2" />
                          <span
                            className={
                              queue.queueMembers.length > 5
                                ? "font-medium text-orange-600"
                                : ""
                            }
                          >
                            {queue.queueMembers.length} users
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {queue.currentNotifiedUser ? (
                          <div>
                            <p className="text-sm font-medium">
                              {queue.currentNotifiedUser.fullName}
                            </p>
                            <p className="text-xs text-gray-500">
                              Notified user
                            </p>
                          </div>
                        ) : queue.queueMembers[0] ? (
                          <div>
                            <p className="text-sm font-medium">
                              {queue.queueMembers[0].userId.fullName}
                            </p>
                            <p className="text-xs text-gray-500">
                              Next in line
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(queue.updatedAt).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-gray-500">
                          {new Date(queue.updatedAt).toLocaleTimeString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() =>
                            navigate("/queues", {
                              state: { itemId: queue.itemId._id },
                            })
                          }
                        >
                          Manage Queue
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No queues found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {search || filter !== "all"
                          ? "Try changing your search or filter"
                          : "When items have waiting users, they'll appear here"}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QueueDashboard;
