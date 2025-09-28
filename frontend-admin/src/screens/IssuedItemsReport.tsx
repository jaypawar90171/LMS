"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  RefreshCw,
  Package,
  Printer,
  ArrowRightLeft,
  CheckCircle,
  PackageOpen,
} from "lucide-react";
import { InventoryVisuals } from "@/components/InventoryVisuals";

interface ReportItem {
  user: string;
  item: string;
  issueDate: string;
  returnDate: string;
  status: "Issued" | "Returned";
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
      const response = await axios.get(
        "http://localhost:3000/api/admin/reports/issued",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setData(response.data.report || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrint = async () => {
    const promise = axios.get(
      "http://localhost:3000/api/admin/reports/issued/pdf",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        responseType: "blob",
      }
    );

    toast.promise(promise, {
      loading: "Generating PDF...",
      success: (response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "Issued-items.pdf");
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        return "PDF downloaded successfully!";
      },
      error: "Failed to download PDF.",
    });
  };

  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return { total: 0, issued: 0, returned: 0, mostIssued: "N/A" };
    }
    const issued = data.filter((d) => d.status === "Issued").length;
    const returned = data.length - issued;

    const itemCounts = data.reduce((acc, curr) => {
      acc[curr.item] = (acc[curr.item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostIssued =
      Object.keys(itemCounts).length > 0
        ? Object.keys(itemCounts).reduce((a, b) =>
            itemCounts[a] > itemCounts[b] ? a : b
          )
        : "N/A";

    return { total: data.length, issued, returned, mostIssued };
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-muted mx-auto"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Loading Report Data
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Inventory Issue/Return Report
            </h1>
            <p className="text-muted-foreground">
              View analytics and detailed transaction records.
            </p>
          </div>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Report (PDF)
          </Button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Transactions
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Currently Issued
                </p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.issued}
                </p>
              </div>
              <PackageOpen className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Items Returned
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.returned}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Most Frequent Item
                </p>
                <p className="text-2xl font-bold truncate">
                  {stats.mostIssued}
                </p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <InventoryVisuals data={data} />

        {/* Table section */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Return Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length > 0 ? (
                    data.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {row.user}
                        </TableCell>
                        <TableCell>{row.item}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusBadgeColor(row.status)}
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.issueDate}</TableCell>
                        <TableCell>{row.returnDate}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No transaction records found.
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
