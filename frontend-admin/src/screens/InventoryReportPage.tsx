"use client";

import React, { useState, useEffect, useMemo, FC } from "react";
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
  BookCopy,
  CheckCircle,
  Boxes,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Interface for Inventory Data
interface InventoryItem {
  id: string;
  title: string;
  category: string;
  author: string;
  availability: "Available" | "Issued";
  acquisitionDate: string;
}

// Visuals Component for this specific report
const InventoryReportVisuals: FC<{ data: InventoryItem[] }> = ({ data }) => {
  const availabilityData = useMemo(() => {
    const available = data.filter((d) => d.availability === "Available").length;
    return {
      labels: ["Available", "Issued"],
      datasets: [
        {
          data: [available, data.length - available],
          backgroundColor: ["#10B981", "#F59E0B"],
          borderWidth: 1,
        },
      ],
    };
  }, [data]);

  const categoryData = useMemo(() => {
    const counts = data.reduce((acc, { category }) => {
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return {
      labels: Object.keys(counts),
      datasets: [
        {
          label: "Items per Category",
          data: Object.values(counts),
          backgroundColor: "#3B82F6",
        },
      ],
    };
  }, [data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Item Availability</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex justify-center items-center">
          <Doughnut
            data={availabilityData}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Items by Category</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex justify-center items-center">
          <Bar
            data={categoryData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

// Main Page Component
const InventoryReportPage = () => {
  const [data, setData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        "http://localhost:3000/api/admin/reports/inventory",
        { headers: { Authorization: `Bearer ${accessToken}` } }
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
      "http://localhost:3000/api/admin/reports/inventory/pdf",
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
        link.setAttribute("download", "Inventory_Report.pdf");
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
    if (!data || data.length === 0)
      return { total: 0, available: 0, issued: 0, categories: 0 };
    const available = data.filter((d) => d.availability === "Available").length;
    const categories = new Set(data.map((d) => d.category)).size;
    return {
      total: data.length,
      available,
      issued: data.length - available,
      categories,
    };
  }, [data]);

  const availabilityBadgeColor = (status: string) => {
    return status === "Available"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : "bg-amber-100 text-amber-800 border-amber-200";
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
              Full Inventory Report
            </h1>
            <p className="text-muted-foreground">
              A complete overview of all items in the system.
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
                  Total Items
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Items Available
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.available}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Items Issued
                </p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.issued}
                </p>
              </div>
              <BookCopy className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Categories
                </p>
                <p className="text-2xl font-bold">{stats.categories}</p>
              </div>
              <Boxes className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Visuals */}
        <InventoryReportVisuals data={data} />

        {/* Table Section */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Author/Brand</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Acquisition Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length > 0 ? (
                    data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.title}
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.author}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={availabilityBadgeColor(
                              item.availability
                            )}
                          >
                            {item.availability}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(item.acquisitionDate).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No inventory items found.
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

export default InventoryReportPage;
