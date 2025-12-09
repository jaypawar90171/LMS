import api from "../constants/api";

export const dashboardService = {
  getDashboardData: async (userId: string) => {
    try {
      const [transactionsRes, queuesRes, itemsRes] =
        await Promise.all([
          api.get("/api/mobile/transactions"),
          api.get("/api/mobile/queue"),
          api.get("/api/mobile/items/new-arrivals"),
        ]);

      const transactions = transactionsRes.data?.data || [];
      const queues = queuesRes.data?.data || [];
      const newArrivals = itemsRes.data?.data || [];

      // Calculate overdue logic manually
      const today = new Date();

      const userTransactions = transactions.filter(
        (t: any) => t.userId === userId || t.userId?._id === userId
      );

      const active = userTransactions.filter(
        (t: any) => t.status === "Issued" || t.status === "Overdue"
      );

      const overdueTransactions = active.filter((t: any) => {
        return new Date(t.dueDate) < today;
      });

      const issuedTransactions = active.filter((t: any) => {
        return new Date(t.dueDate) >= today;
      });


      return {
        data: {
          issuedTransactions: issuedTransactions,
          overdueTransactions: overdueTransactions,
          queuedItems: queues, 
          newArrivals: newArrivals,
        },
      };
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      throw error;
    }
  },
};
