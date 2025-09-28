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

// Register the necessary components for Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ReportItem {
  user: string;
  item: string;
  status: "Issued" | "Returned";
}

interface InventoryVisualsProps {
  data: ReportItem[];
}

export const InventoryVisuals: FC<InventoryVisualsProps> = ({ data }) => {
  // Memoized calculation for Status Distribution (Issued vs. Returned)
  const statusData = useMemo(() => {
    const issuedCount = data.filter((item) => item.status === "Issued").length;
    const returnedCount = data.length - issuedCount;
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
      acc[item] = (acc[item] || 0) + 1;
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
        acc[user] = (acc[user] || 0) + 1;
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

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Transaction Status</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex justify-center items-center">
          <Doughnut
            data={statusData}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            Top 5 Most Borrowed Items
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex justify-center items-center">
          <Bar
            data={topItemsData}
            options={{
              ...barOptions,
              indexAxis: "y" as const,
              maintainAspectRatio: false,
            }}
          />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-center">
            Top 5 Users (Currently Borrowing)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex justify-center items-center">
          <Bar
            data={topUsersData}
            options={{ ...barOptions, maintainAspectRatio: false }}
          />
        </CardContent>
      </Card>
    </div>
  );
};
