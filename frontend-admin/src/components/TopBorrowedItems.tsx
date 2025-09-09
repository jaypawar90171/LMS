import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Order {
  item: string;
  status: string;
}

interface TopBorrowedItemsProps {
  recentOrders: Order[];
  topN?: number;
}

const TopBorrowedItems: React.FC<TopBorrowedItemsProps> = ({
  recentOrders,
  topN = 5,
}) => {
  // Count borrow frequency for issued items only
  const borrowCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    recentOrders.forEach((o) => {
      if (o.status === "Issued") {
        counts[o.item] = (counts[o.item] || 0) + 1;
      }
    });
    return counts;
  }, [recentOrders]);

  // Sort items by count and take top N
  const sortedItems = useMemo(() => {
    const pairs = Object.entries(borrowCounts);
    pairs.sort((a, b) => b[1] - a[1]);
    return pairs.slice(0, topN);
  }, [borrowCounts, topN]);

  const labels = sortedItems.map(([item]) => item);
  const dataValues = sortedItems.map(([_, count]) => count);

  const data = {
    labels,
    datasets: [
      {
        label: "Times Borrowed",
        data: dataValues,
        backgroundColor: "rgba(59, 130, 246, 0.7)", // blue-500
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        title: { display: true, text: "Item" },
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        title: { display: true, text: "Times Borrowed" },
      },
    },
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-slate-800 mb-4 text-center">
        Top Borrowed Items
      </h3>
      <div className="flex justify-center items-center h-96">
        {labels.length > 0 ? (
          <Bar data={data} options={options} height={350} />
        ) : (
          <p className="text-gray-500">No borrowing data available.</p>
        )}
      </div>
    </div>
  );
};

export default TopBorrowedItems;
