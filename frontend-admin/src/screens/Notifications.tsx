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
import {
  Calendar,
  Filter,
  RefreshCw,
  CheckCircle,
  CheckCheck,
  Trash2,
  Bell,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  User,
} from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAtom } from "jotai";
import { userAtom } from "@/state/userAtom";
import { unreadNotificationsCountAtom } from "@/state/notificationAtom";

interface Notification {
  _id: string;
  title: string;
  message: {
    content: string;
  };
  level: "Info" | "Success" | "Warning" | "Danger";
  type: string;
  read: boolean;
  recipientId: {
    _id: string;
    fullName: string;
    email: string;
  };
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const Notifications = () => {
  const [user] = useAtom(userAtom);
  const [_, setUnreadCount] = useAtom(unreadNotificationsCountAtom);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<
    Notification[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Filters
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<string>("all");

  // Filter notifications for current user
  const filterNotificationsForUser = (notifications: Notification[]) => {
    if (!user) return [];
    return notifications.filter(
      (notification) => notification.recipientId._id === user._id
    );
  };

  // Apply all filters
  const applyAllFilters = (notifications: Notification[]) => {
    let filtered = filterNotificationsForUser(notifications);

    // Date filter
    if (startDate) {
      filtered = filtered.filter(
        (notification) => new Date(notification.createdAt) >= startDate
      );
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (notification) => new Date(notification.createdAt) <= endOfDay
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (notification) => notification.type === typeFilter
      );
    }

    // Level filter
    if (levelFilter !== "all") {
      filtered = filtered.filter(
        (notification) => notification.level === levelFilter
      );
    }

    // Read status filter
    if (readFilter !== "all") {
      const readStatus = readFilter === "read";
      filtered = filtered.filter(
        (notification) => notification.read === readStatus
      );
    }

    return filtered;
  };

  const fetchNotifications = async (page: number = 1) => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const params: any = {
        page,
        limit: pagination.limit,
      };

      if (startDate) params.startDate = format(startDate, "yyyy-MM-dd");
      if (endDate) params.endDate = format(endDate, "yyyy-MM-dd");
      if (typeFilter !== "all") params.type = typeFilter;
      if (levelFilter !== "all") params.level = levelFilter;
      if (readFilter !== "all") params.read = readFilter === "read";

      const response = await axios.get(
        "http://localhost:3000/api/admin/notifications",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params,
        }
      );

      if (response.data.success) {
        const allNotifications = response.data.data;
        setAllNotifications(allNotifications);

        // Apply filters including user filter
        const userNotifications = applyAllFilters(allNotifications);
        setFilteredNotifications(userNotifications);

        // Update pagination with filtered count
        setPagination({
          ...response.data.pagination,
          total: userNotifications.length,
          pages: Math.ceil(userNotifications.length / pagination.limit),
        });
      }
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch notifications"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Re-filter when user changes or filters change
  useEffect(() => {
    if (allNotifications.length > 0) {
      const userNotifications = applyAllFilters(allNotifications);
      setFilteredNotifications(userNotifications);
      setPagination((prev) => ({
        ...prev,
        total: userNotifications.length,
        pages: Math.ceil(userNotifications.length / prev.limit),
      }));
    }
  }, [
    user,
    startDate,
    endDate,
    typeFilter,
    levelFilter,
    readFilter,
    allNotifications,
  ]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      await axios.patch(
        `http://localhost:3000/api/admin/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      setAllNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );

      setUnreadCount((prev) => prev - 1);

      toast.success("Notification marked as read");
    } catch (error: any) {
      console.error("Error marking as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      await axios.patch(
        "http://localhost:3000/api/admin/notifications/mark-all-read",
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      setAllNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );

      setUnreadCount(0);

      toast.success("All notifications marked as read");
    } catch (error: any) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    try {
      const accessToken = localStorage.getItem("accessToken");
      await axios.delete(
        `http://localhost:3000/api/admin/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      setAllNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId)
      );

      toast.success("Notification deleted successfully");
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "Success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "Warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "Danger":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const baseClasses = "flex items-center gap-1";
    switch (level) {
      case "Success":
        return (
          <Badge className={`${baseClasses} bg-emerald-100 text-emerald-800`}>
            {getLevelIcon(level)} Success
          </Badge>
        );
      case "Warning":
        return (
          <Badge className={`${baseClasses} bg-amber-100 text-amber-800`}>
            {getLevelIcon(level)} Warning
          </Badge>
        );
      case "Danger":
        return (
          <Badge className={`${baseClasses} bg-red-100 text-red-800`}>
            {getLevelIcon(level)} Danger
          </Badge>
        );
      default:
        return (
          <Badge className={`${baseClasses} bg-blue-100 text-blue-800`}>
            {getLevelIcon(level)} Info
          </Badge>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    const typeMap: { [key: string]: string } = {
      user_registered: "User Registered",
      item_requested: "Item Requested",
      donation_submitted: "Donation Submitted",
      item_overdue: "Item Overdue",
      system_alert: "System Alert",
    };

    return <Badge variant="outline">{typeMap[type] || type}</Badge>;
  };

  const handleApplyFilters = () => {
    fetchNotifications(1);
  };

  const handleClearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setTypeFilter("all");
    setLevelFilter("all");
    setReadFilter("all");
    fetchNotifications(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-muted border-t-primary mx-auto"></div>
          <p className="text-lg text-gray-500">Loading notifications...</p>
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
              My Notifications
            </h1>
            <p className="text-muted-foreground">
              View and manage your notifications
            </p>
            {user && (
              <div className="flex items-center gap-2 mt-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {user.fullName} ({user.email})
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => fetchNotifications()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                      {startDate ? format(startDate, "PPP") : "Pick start date"}
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
                      {endDate ? format(endDate, "PPP") : "Pick end date"}
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

              {/* Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="user_registered">
                      User Registered
                    </SelectItem>
                    <SelectItem value="item_requested">
                      Item Requested
                    </SelectItem>
                    <SelectItem value="donation_submitted">
                      Donation Submitted
                    </SelectItem>
                    <SelectItem value="item_overdue">Item Overdue</SelectItem>
                    <SelectItem value="system_alert">System Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Level Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Level</label>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="Info">Info</SelectItem>
                    <SelectItem value="Success">Success</SelectItem>
                    <SelectItem value="Warning">Warning</SelectItem>
                    <SelectItem value="Danger">Danger</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Read Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={readFilter} onValueChange={setReadFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                  </SelectContent>
                </Select>
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

        {/* Notifications Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              My Notifications ({filteredNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => (
                      <TableRow
                        key={notification._id}
                        className={cn(!notification.read && "bg-blue-50")}
                      >
                        <TableCell>
                          {notification.read ? (
                            <Badge variant="outline" className="bg-gray-100">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Read
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-blue-500">
                              <Bell className="h-3 w-3 mr-1" />
                              Unread
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {getLevelBadge(notification.level)}
                        </TableCell>
                        <TableCell>{getTypeBadge(notification.type)}</TableCell>
                        <TableCell className="font-medium">
                          {notification.title}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p
                            className="truncate"
                            title={notification.message.content}
                          >
                            {notification.message.content}
                          </p>
                        </TableCell>
                        <TableCell>
                          {format(
                            new Date(notification.createdAt),
                            "MMM dd, yyyy HH:mm"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!notification.read && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleMarkAsRead(notification._id)
                                }
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleDeleteNotification(notification._id)
                              }
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Bell className="h-8 w-8 mb-2" />
                          <p>No notifications found.</p>
                          <p className="text-sm">You're all caught up!</p>
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
                  of {pagination.total} notifications
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={pagination.page === 1}
                    onClick={() => fetchNotifications(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => fetchNotifications(pagination.page + 1)}
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

export default Notifications;
