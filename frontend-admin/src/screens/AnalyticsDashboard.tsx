// AnalyticsDashboard.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  Download,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { addDays, format, subDays } from "date-fns";

interface AnalyticsData {
  summary: {
    totalQueues: number;
    activeQueues: number;
    totalUsersWaiting: number;
    avgWaitTime: number;
    notificationResponseRate: number;
    avgQueueLength: number;
  };
  queueLengthDistribution: Array<{ length: string; count: number }>;
  popularItems: Array<{
    itemName: string;
    queueLength: number;
    totalRequests: number;
  }>;
  waitTimeAnalysis: Array<{ period: string; avgWaitTime: number }>;
  notificationPerformance: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  peakHours: Array<{ hour: string; queueJoins: number }>;
  categoryAnalysis: Array<{
    category: string;
    queueCount: number;
    avgWaitTime: number;
  }>;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast.error("No access token found. Please log in again.");
        return;
      }

      const params: any = {};
      if (dateRange?.from) {
        params.startDate = format(dateRange.from, "yyyy-MM-dd");
      }
      if (dateRange?.to) {
        params.endDate = format(dateRange.to, "yyyy-MM-dd");
      }

      const response = await axios.get(
        "http://localhost:3000/api/admin/analytics/queues",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params,
        }
      );
      setAnalyticsData(response.data.data);
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch analytics."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        "http://localhost:3000/api/admin/analytics/queues/export",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `queue-analytics-${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Report exported successfully!");
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report.");
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-500">Loading analytics...</p>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-500">No analytics data available.</p>
      </div>
    );
  }

  const { summary } = analyticsData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Queue Analytics
            </h1>
            <p className="text-muted-foreground">
              Insights and performance metrics for queue management
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={fetchAnalytics}>
              Refresh
            </Button>
            <Button onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-700 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Total Queues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-900">
                {summary.totalQueues}
              </p>
              <p className="text-xs text-gray-500">
                {summary.activeQueues} active •{" "}
                {summary.avgQueueLength.toFixed(1)} avg length
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-700 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Users Waiting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-900">
                {summary.totalUsersWaiting}
              </p>
              <p className="text-xs text-gray-500">Across all queues</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-700 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Avg Wait Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-900">
                {summary.avgWaitTime}d
              </p>
              <p className="text-xs text-gray-500">Average across queues</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-700 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Response Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-900">
                {summary.notificationResponseRate}%
              </p>
              <p className="text-xs text-gray-500">Notification acceptance</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="distribution" className="flex items-center">
              <PieChartIcon className="h-4 w-4 mr-2" />
              Distribution
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Queue Length Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Queue Length Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.queueLengthDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="length" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Most Popular Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Most Requested Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={analyticsData.popularItems.slice(0, 5)}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="itemName" width={80} />
                      <Tooltip />
                      <Bar dataKey="queueLength" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Wait Time Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Average Wait Time Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.waitTimeAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="avgWaitTime"
                        stroke="#8884d8"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Peak Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Queue Activity by Hour
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.peakHours}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="queueJoins" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Notification Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Notification Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.notificationPerformance}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percentage }) =>
                          `${status}: ${percentage}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analyticsData.notificationPerformance.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          )
                        )}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Queues by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.categoryAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="queueCount"
                        fill="#8884d8"
                        name="Queue Count"
                      />
                      <Line
                        yAxisId="right"
                        dataKey="avgWaitTime"
                        stroke="#ff7300"
                        name="Avg Wait (days)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 10 Longest Queues */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Longest Active Queues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.popularItems.slice(0, 10).map((item, index) => (
                  <div
                    key={item.itemName}
                    className="flex justify-between items-center p-2 border rounded"
                  >
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center mr-3">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{item.itemName}</p>
                        <p className="text-xs text-gray-500">
                          {item.totalRequests} total requests
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">
                        {item.queueLength} users
                      </p>
                      <p className="text-xs text-gray-500">in queue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Notification Response Rate</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${summary.notificationResponseRate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {summary.notificationResponseRate}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">Queue Utilization</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (summary.activeQueues / summary.totalQueues) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {(
                      (summary.activeQueues / summary.totalQueues) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">System Efficiency</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          100 - (summary.avgWaitTime / 30) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {Math.max(
                      0,
                      100 - (summary.avgWaitTime / 30) * 100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
