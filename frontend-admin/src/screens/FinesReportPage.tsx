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
  FileWarning,
  CircleDollarSign,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Interfaces for Fines Data
interface FineDetails {
  user: string;
  item: string;
  fineAmount: string;
  status: "Paid" | "Outstanding";
  date: string;
}
interface FineSummary {
  totalFines: number | null;
  paidFines: number | null;
  outstandingFines: number | null;
}

// Visuals Component for this specific report
const FinesReportVisuals: FC<{ data: FineDetails[] }> = ({ data }) => {
  const statusData = useMemo(() => {
    const paid = data.filter((d) => d.status === "Paid").length;
    return {
      labels: ["Paid", "Outstanding"],
      datasets: [
        {
          data: [paid, data.length - paid],
          backgroundColor: ["#10B981", "#EF4444"],
          borderWidth: 1,
        },
      ],
    };
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Fine Status Distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-80 flex justify-center items-center">
        <Doughnut
          data={statusData}
          options={{ responsive: true, maintainAspectRatio: false }}
        />
      </CardContent>
    </Card>
  );
};

// Main Page Component
const FinesReportPage = () => {
  const [details, setDetails] = useState<FineDetails[]>([]);
  const [summary, setSummary] = useState<FineSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        "http://localhost:3000/api/admin/reports/fines",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setDetails(response.data.details || []);
      setSummary(response.data.summary || null);
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
      "http://localhost:3000/api/admin/reports/fines/pdf",
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
        link.setAttribute("download", "Fines_Report.pdf");
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        return "PDF downloaded successfully!";
      },
      error: "Failed to download PDF.",
    });
  };

  const statusBadgeColor = (status: string) => {
    return status === "Paid"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : "bg-red-100 text-red-800 border-red-200";
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
            <h1 className="text-3xl font-bold text-foreground">Fines Report</h1>
            <p className="text-muted-foreground">
              An overview of all financial penalties.
            </p>
          </div>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Report (PDF)
          </Button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Fines Value
                </p>
                <p className="text-2xl font-bold">
                  ${summary?.totalFines ?? "0.00"}
                </p>
              </div>
              <CircleDollarSign className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Paid
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  ${summary?.paidFines ?? "0.00"}
                </p>
              </div>
              <ShieldCheck className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Outstanding
                </p>
                <p className="text-2xl font-bold text-red-600">
                  ${summary?.outstandingFines ?? "0.00"}
                </p>
              </div>
              <ShieldAlert className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Visuals */}
        <FinesReportVisuals data={details} />

        {/* Table Section */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Fine Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.length > 0 ? (
                    details.map((fine, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {fine.user}
                        </TableCell>
                        <TableCell>{fine.item}</TableCell>
                        <TableCell>{fine.fineAmount}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusBadgeColor(fine.status)}
                          >
                            {fine.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(fine.date).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No fine records found.
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

export default FinesReportPage;
