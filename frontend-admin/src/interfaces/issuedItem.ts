export interface IssuedItem {
  id: string;
  status: "Issued" | "Returned" | "Overdue";
  user: {
    id: string;
    fullName: string;
    email: string;
    roles: string[];
  };
  item: {
    id: string;
    title: string;
    authorOrCreator: string;
    description: string;
    categoryId: string;
    subcategoryId: string;
    price: { $numberDecimal: string } | string;
    quantity: number;
    availableCopies: number;
  };
  issuedBy: {
    id: string;
    fullName: string;
    email: string;
  };
  returnedTo: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  issuedDate: string;
  dueDate: string;
  returnDate: string;
  extensionCount: number;
  maxExtensionAllowed: number;
  fine: {
    id: string;
    reason: string;
    amountIncurred: number;
    amountPaid: number;
    outstandingAmount: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}
