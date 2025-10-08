"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  RefreshCw,
  Package,
  Printer,
  ArrowRightLeft,
  CheckCircle,
  PackageOpen,
  Download,
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { InventoryVisuals } from "@/components/InventoryVisuals";

interface User {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
}

interface Item {
  id: string;
  title: string;
  authorOrCreator: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  price: { $numberDecimal: string };
  quantity: number;
  availableCopies: number;
}

interface ReportItem {
  id: string;
  status: "Issued" | "Returned";
  user: User;
  item: Item;
  issuedBy: User;
  returnedTo: User | null;
  issuedDate: string;
  dueDate: string;
  returnDate: string;
  extensionCount: number;
  maxExtensionAllowed: number;
  fine: any;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  report: ReportItem[];
}

const IssuedItemsReportPage = () => {
  const [data, setData] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch data from the backend
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get<ApiResponse>(
        "http://localhost:3000/api/admin/reports/issued",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setData(response.data.report || []);
    } catch (err: any) {
      console.error("Error fetching report:", err);
      setError(err.response?.data?.message || "Failed to fetch report data.");
      toast.error(
        err.response?.data?.message || "Failed to fetch report data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrint = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        "http://localhost:3000/api/admin/reports/issued/pdf",
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
      link.setAttribute("download", "issued-items-report.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("PDF exported successfully!");
    } catch (error: any) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF.");
    }
  };

  const exportToCSV = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        "http://localhost:3000/api/admin/reports/issued/export",
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
        `issued-items-report-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("CSV exported successfully!");
    } catch (error: any) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV.");
    }
  };

  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        total: 0,
        issued: 0,
        returned: 0,
        mostIssued: "N/A",
        overdue: 0,
        avgExtensions: 0,
      };
    }

    const issued = data.filter((d) => d.status === "Issued").length;
    const returned = data.filter((d) => d.status === "Returned").length;

    // Calculate overdue items (issued items where due date has passed)
    const today = new Date();
    const overdue = data.filter((d) => {
      if (d.status !== "Issued") return false;
      const dueDate = new Date(d.dueDate);
      return dueDate < today;
    }).length;

    // Calculate average extensions
    const avgExtensions =
      data.reduce((acc, curr) => acc + curr.extensionCount, 0) / data.length;

    const itemCounts = data.reduce((acc, curr) => {
      acc[curr.item.title] = (acc[curr.item.title] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostIssued =
      Object.keys(itemCounts).length > 0
        ? Object.keys(itemCounts).reduce((a, b) =>
            itemCounts[a] > itemCounts[b] ? a : b
          )
        : "N/A";

    return {
      total: data.length,
      issued,
      returned,
      mostIssued,
      overdue,
      avgExtensions: Math.round(avgExtensions * 10) / 10,
    };
  }, [data]);

  const statusBadgeColor = (status: string) => {
    switch (status) {
      case "Issued":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Returned":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-500">Loading report data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <Package className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Error Loading Report
                </h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button onClick={fetchData} variant="outline">
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
      <div className="container mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Inventory Issue/Return Report
            </h1>
            <p className="text-muted-foreground">
              View analytics and detailed transaction records
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-700 flex items-center">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              <p className="text-xs text-gray-500">
                All inventory transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-700 flex items-center">
                <PackageOpen className="h-4 w-4 mr-2" />
                Currently Issued
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-900">
                {stats.issued}
              </p>
              <p className="text-xs text-gray-500">
                {stats.overdue} overdue • {stats.avgExtensions} avg extensions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-emerald-700 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Items Returned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-900">
                {stats.returned}
              </p>
              <p className="text-xs text-gray-500">Successfully returned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-700 flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Most Frequent Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-900 truncate">
                {stats.mostIssued}
              </p>
              <p className="text-xs text-gray-500">Most requested item</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <InventoryVisuals data={data} />

        {/* Table section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaction Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Extensions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length > 0 ? (
                    data.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-medium text-sm">
                              {row.user.fullName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {row.user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {row.item.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {row.item.authorOrCreator}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusBadgeColor(row.status)}
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.issuedDate}</TableCell>
                        <TableCell>{row.dueDate}</TableCell>
                        <TableCell>{row.returnDate}</TableCell>
                        <TableCell>
                          <div className="text-center">
                            <span
                              className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${
                                row.extensionCount > 0
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {row.extensionCount}/{row.maxExtensionAllowed}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Package className="h-8 w-8 mb-2" />
                          <p>No transaction records found.</p>
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
    </div>
  );
};

export default IssuedItemsReportPage;
