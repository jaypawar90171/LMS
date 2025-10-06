export interface IDefaulterListQuery {
  overdueSince?: string;
  itemCategory?: string;
  userRole?: string;
}

export interface IDefaulterReportItem {
  userName: string;
  identifier: string;
  itemTitle: string;
  barcode: string;
  issuedDate: string;
  dueDate: string;
  daysOverdue: number;
  contact: {
    email: string;
    phone: string;
  };
  userId: string;
  issuedItemId: string;
}
