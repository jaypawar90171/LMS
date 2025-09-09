import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

interface Order {
  status: string;
  issuedDate: string; 
  item: string;
  user: string;
}

interface AnalyticsOverviewProps {
  recentOrders: Order[];
  days?: number; 
}

const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({
  recentOrders,
  days = 30,
}) => {
  const today = new Date();

  // Helper to format date string YYYY-MM-DD
  const formatDate = (date: Date) => date.toISOString().slice(0, 10);

  // Generate last N days date labels array
  const labels = useMemo(() => {
    const arr = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      arr.push(formatDate(d));
    }
    return arr;
  }, [days, today]);

  // Count issued and returned items for each date label
  const dataCounts = useMemo(() => {
    const issuedCounts: Record<string, number> = {};
    const returnedCounts: Record<string, number> = {};

    labels.forEach((date) => {
      issuedCounts[date] = 0;
      returnedCounts[date] = 0;
    });

    recentOrders.forEach((order) => {
      const date = order.issuedDate;
      if (labels.includes(date)) {
        if (order.status === "Issued") {
          issuedCounts[date]++;
        } else if (order.status === "Returned") {
          returnedCounts[date]++;
        }
      }
    });

    return {
      issuedCounts: labels.map((date) => issuedCounts[date]),
      returnedCounts: labels.map((date) => returnedCounts[date]),
    };
  }, [recentOrders, labels]);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Items Issued",
        data: dataCounts.issuedCounts,
        borderColor: "rgba(59, 130, 246, 1)", // blue-500
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        fill: true,
        tension: 0.3,
      },
      {
        label: "Items Returned",
        data: dataCounts.returnedCounts,
        borderColor: "rgba(16, 185, 129, 1)", // emerald-500
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    stacked: false,
    plugins: {
      legend: { position: "top" as const },
      tooltip: { enabled: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        title: {
          display: true,
          text: "Number of Items",
        },
      },
      x: {
        title: {
          display: true,
          text: "Date",
        },
      },
    },
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-slate-800 mb-4">
        Issued vs Returned Items (Last {days} Days)
      </h3>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default AnalyticsOverview;
