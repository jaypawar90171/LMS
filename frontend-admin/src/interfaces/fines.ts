export interface User {
  _id: string;
  username: string;
  email: string;
}
export interface Item {
  _id: string;
  title: string;
}
export interface Fine {
  _id: string;
  userId: User;
  itemId: Item;
  reason: "Overdue" | "Damaged";
  amountIncurred: number;
  amountPaid: number;
  outstandingAmount: number;
  dateIncurred: string;
  dateSettled?: string | null;
  status: "Outstanding" | "Paid" | "Waived";
  managedByAdminId: string;
  paymentDetails?: {
    paymentMethod: string;
    transactionId: string;
  };
  createdAt: string;
  updatedAt: string;
}
