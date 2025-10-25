"use client";

import type React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import TopBorrowedItems from "../components/TopBorrowedItems";
import ActiveUsersDistribution from "../components/ActiveUsersDistribution";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, Search } from "lucide-react";

const DashboardPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState({
    totalItems: 0,
    activeUsers: 0,
    overdueItems: 0,
    categories: 0,
    recentActivity: [],
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");

  const filteredActivities = dashboardData.recentActivity.filter(
    (activity: any) => {
      const matchesSearch =
        activity.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.action?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        activityFilter === "all" || activity.type === activityFilter;
      return matchesSearch && matchesFilter;
    }
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");

        if (!accessToken) {
          setError("No access token found. Please log in.");
          setLoading(false);
          return;
        }

        const result = await axios.get(
          "http://localhost:3000/api/admin/dashboard/summary",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setDashboardData(result.data);
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Failed to fetch dashboard data."
        );
        console.error("Error fetching summary:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    {
      title: "Total Items",
      value: dashboardData.totalItems,
      change: "+12%",
      trend: "up",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      icon: (
        <svg
          className="h-6 w-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
    },
    {
      title: "Active Users",
      value: dashboardData.activeUsers,
      change: "+8%",
      trend: "up",
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
      icon: (
        <svg
          className="h-6 w-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
      ),
    },
    {
      title: "Overdue Items",
      value: dashboardData.overdueItems,
      change: "-3%",
      trend: "down",
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
      icon: (
        <svg
          className="h-6 w-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: "Categories",
      value: dashboardData.categories,
      change: "+5%",
      trend: "up",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      icon: (
        <svg
          className="h-6 w-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
    },
  ];

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
              Loading Dashboard
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
            Error Loading Dashboard
          </h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto">
        {/* header` */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
            Welcome back!
          </h2>
          <p className="text-lg text-gray-600 font-medium">
            Here's what's happening with your business today.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group relative bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* Background gradient overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
              ></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`p-2 ${stat.bgColor} ${stat.textColor} rounded-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    {stat.icon}
                  </div>
                  <div
                    className={`flex items-center text-md font-semibold ${
                      stat.trend === "up" ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    <svg
                      className={`h-3 w-3 mr-1 ${
                        stat.trend === "up" ? "rotate-0" : "rotate-180"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 17l9.2-9.2M17 17V7H7"
                      />
                    </svg>
                    {stat.change}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-slate-900 transition-colors">
                    {stat.value.toLocaleString()}
                  </h3>
                  <p className="text-gray-600 text-md font-medium">
                    {stat.title}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
            <TopBorrowedItems recentOrders={dashboardData.recentOrders} />
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
            <ActiveUsersDistribution
              recentOrders={dashboardData.recentOrders}
            />
          </div>

          {/* Recent Activities */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Recent Activity
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {filteredActivities.length} activities found
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
                  />
                </div>
              </div>
            </div>

            {/* Activity List with Scrollbar */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-hide">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors duration-200 group"
                  >
                    <div
                      className={`p-2 rounded-full flex-shrink-0 ${
                        activity.type === "user"
                          ? "bg-blue-100"
                          : activity.type === "item"
                          ? "bg-emerald-100"
                          : activity.type === "system"
                          ? "bg-purple-100"
                          : activity.type === "borrow"
                          ? "bg-amber-100"
                          : activity.type === "return"
                          ? "bg-green-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <div
                        className={`h-2 w-2 rounded-full ${
                          activity.type === "user"
                            ? "bg-blue-600"
                            : activity.type === "item"
                            ? "bg-emerald-600"
                            : activity.type === "system"
                            ? "bg-purple-600"
                            : activity.type === "borrow"
                            ? "bg-amber-600"
                            : activity.type === "return"
                            ? "bg-green-600"
                            : "bg-gray-600"
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 font-medium">
                        <span className="font-bold text-blue-600">
                          {activity.user}
                        </span>{" "}
                        {activity.action}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {activity.date}
                        </span>
                        {activity.type && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              activity.type === "user"
                                ? "bg-blue-50 text-blue-700"
                                : activity.type === "item"
                                ? "bg-emerald-50 text-emerald-700"
                                : activity.type === "system"
                                ? "bg-purple-50 text-purple-700"
                                : activity.type === "borrow"
                                ? "bg-amber-50 text-amber-700"
                                : activity.type === "return"
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-50 text-gray-700"
                            }`}
                          >
                            {activity.type}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                      <button
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="h-6 w-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm mb-2">
                    No activities found
                  </p>
                  <p className="text-gray-400 text-xs">
                    {searchTerm || activityFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "Activities will appear here as they happen"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <Card className="mt-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50">
          {/* Header */}
          <CardHeader className="px-8 py-6 bg-white from-slate-50 to-blue-50 border-b border-gray-100 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="">
                <CardTitle className="text-2xl font-bold text-slate-800">
                  Recent Orders
                </CardTitle>
                <CardDescription className="text-gray-600 text-sm font-medium">
                  Latest borrowing and return activities
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          {/* Table Content */}
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.recentOrders.length > 0 ? (
                  dashboardData.recentOrders.map(
                    (order: any, index: number) => (
                      <TableRow key={index} className="hover:bg-slate-50">
                        <TableCell className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={
                                order.avatarUrl ||
                                `https://api.dicebear.com/8.x/initials/svg?seed=${order.user}`
                              }
                            />
                            <AvatarFallback>
                              {order.user
                                ?.split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-slate-800">
                            {order.user}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">
                          {order.item}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                              order.status === "Returned"
                                ? "bg-emerald-100 text-emerald-700"
                                : order.status === "Issued"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-600 font-medium">
                          {order.issuedDate}
                        </TableCell>
                      </TableRow>
                    )
                  )
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10">
                      <h4 className="text-lg font-semibold text-gray-700 mb-2">
                        No Orders Yet
                      </h4>
                      <p className="text-gray-500 text-sm">
                        Recent borrowing and return activities will appear here
                        once recorded in the system.
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

export default DashboardPage;
