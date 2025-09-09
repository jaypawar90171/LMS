import React, { useMemo } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Order {
  user: string;
  status: string;
}

interface ActiveUsersDistributionProps {
  recentOrders: Order[];
}

const ActiveUsersDistribution: React.FC<ActiveUsersDistributionProps> = ({
  recentOrders,
}) => {
  // Count number of active issued items per user
  const userCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    recentOrders.forEach((o) => {
      if (o.status === "Issued") {
        counts[o.user] = (counts[o.user] || 0) + 1;
      }
    });
    return counts;
  }, [recentOrders]);

  const labels = Object.keys(userCounts);
  const dataValues = Object.values(userCounts);

  // Generate colors for pie slices
  const colors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EF4444",
    "#6366F1",
    "#D97706",
    "#6B7280",
    "#22D3EE",
    "#EC4899",
  ];

  const backgroundColors = labels.map((_, i) => colors[i % colors.length]);

  const data = {
    labels,
    datasets: [
      {
        label: "Active Borrowings",
        data: dataValues,
        backgroundColor: backgroundColors,
        borderWidth: 1,
        borderColor: "#fff",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "right" as const },
      tooltip: { enabled: true },
    },
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-slate-800 mb-4 text-center">
        Active Users Borrowing Items
      </h3>
      <div className="flex justify-center items-center h-96">
        {" "}
        {/* h-96 = 24rem */}
        {labels.length > 0 ? (
          <Pie data={data} options={options} height={350} />
        ) : (
          <p className="text-gray-500">
            No active borrowing user data available.
          </p>
        )}
      </div>
    </div>
  );
};

export default ActiveUsersDistribution;
