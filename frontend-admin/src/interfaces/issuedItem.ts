export interface UserType {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
}

export interface ItemType {
  id: string;
  title: string;
  authorOrCreator: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  price: { $numberDecimal: string } | string;
  quantity: number;
  availableCopies: number;
}

export interface FineType {
  id: string;
  reason: string;
  amountIncurred: number;
  amountPaid: number;
  outstandingAmount: number;
}

export interface IssuedItem {
  id: string;
  status: "Issued" | "Returned" | "Overdue";
  user: UserType;
  item: ItemType;
  issuedBy: UserType;
  returnedTo: UserType | null;
  issuedDate: string;
  dueDate: string;
  returnDate: string;
  extensionCount: number;
  maxExtensionAllowed: number;
  fine: FineType | null;
  createdAt: string;
  updatedAt: string;
}