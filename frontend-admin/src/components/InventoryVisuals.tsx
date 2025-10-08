"use client";

import React, { useMemo, FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface InventoryVisualsProps {
  data: ReportItem[];
}

export const InventoryVisuals: FC<InventoryVisualsProps> = ({ data }) => {
  // Memoized calculation for Status Distribution (Issued vs. Returned)
  const statusData = useMemo(() => {
    const issuedCount = data.filter((item) => item.status === "Issued").length;
    const returnedCount = data.filter(
      (item) => item.status === "Returned"
    ).length;
    return {
      labels: ["Issued", "Returned"],
      datasets: [
        {
          label: "Transaction Status",
          data: [issuedCount, returnedCount],
          backgroundColor: ["#F59E0B", "#10B981"], // Amber for Issued, Emerald for Returned
          borderColor: ["#FDE68A", "#A7F3D0"],
          borderWidth: 1,
        },
      ],
    };
  }, [data]);

  // Memoized calculation for Top 5 Most Borrowed Items
  const topItemsData = useMemo(() => {
    const itemCounts = data.reduce((acc, { item }) => {
      const itemTitle = item.title;
      acc[itemTitle] = (acc[itemTitle] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedItems = Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      labels: sortedItems.map(([label]) => label),
      datasets: [
        {
          label: "Total Borrows",
          data: sortedItems.map(([, count]) => count),
          backgroundColor: "#3B82F6", // Blue
        },
      ],
    };
  }, [data]);

  // Memoized calculation for Top 5 Most Active Users (with currently issued items)
  const topUsersData = useMemo(() => {
    const userCounts = data
      .filter((item) => item.status === "Issued")
      .reduce((acc, { user }) => {
        const userName = user.fullName;
        acc[userName] = (acc[userName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const sortedUsers = Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      labels: sortedUsers.map(([label]) => label),
      datasets: [
        {
          label: "Items Currently Issued",
          data: sortedUsers.map(([, count]) => count),
          backgroundColor: "#8B5CF6", // Violet
        },
      ],
    };
  }, [data]);

  // Memoized calculation for Monthly Issue Trends
  const monthlyTrendsData = useMemo(() => {
    const monthlyCounts = data.reduce((acc, { issuedDate }) => {
      const month = new Date(issuedDate).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedMonths = Object.entries(monthlyCounts)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-6); // Last 6 months

    return {
      labels: sortedMonths.map(([month]) => month),
      datasets: [
        {
          label: "Items Issued",
          data: sortedMonths.map(([, count]) => count),
          backgroundColor: "#EF4444", // Red
          borderColor: "#DC2626",
          borderWidth: 2,
        },
      ],
    };
  }, [data]);

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const horizontalBarOptions = {
    ...barOptions,
    indexAxis: "y" as const,
    maintainAspectRatio: false,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Transaction Status Doughnut Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Transaction Status</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex justify-center items-center">
          <Doughnut
            data={statusData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "bottom" as const,
                },
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Top 5 Most Borrowed Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            Top 5 Most Borrowed Items
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex justify-center items-center">
          <Bar data={topItemsData} options={horizontalBarOptions} />
        </CardContent>
      </Card>

      {/* Top 5 Active Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Top 5 Active Users</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex justify-center items-center">
          <Bar data={topUsersData} options={horizontalBarOptions} />
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Monthly Issue Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex justify-center items-center">
          <Bar
            data={monthlyTrendsData}
            options={{
              ...barOptions,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};
