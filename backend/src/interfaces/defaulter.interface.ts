export interface DefaulterFilters {
  overdueSince?: string;
  categoryId?: string;
  roleId?: string;
}

export interface DefaulterItem {
  issuedItemId: string;
  userName: string;
  userEmail: string;
  employeeId?: string;
  phoneNumber?: string;
  roleName: string;
  itemTitle: string;
  barcode: string;
  issuedDate: string;
  dueDate: string;
  daysOverdue: number;
  categoryName: string;
}