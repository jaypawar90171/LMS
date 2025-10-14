export interface UserReportFilters {
  roleId?: string;
  status?: string;
  hasOverdue?: string;
}

export interface UserReportItem {
  userId: string;
  userName: string;
  userEmail: string;
  employeeId?: string;
  phoneNumber?: string;
  roleName: string;
  totalItemsIssued: number;
  itemsOverdue: number;
  totalOverdueItems: number;
  avgDaysOverdue: number;
  lastIssuedDate?: string;
  joinDate: string;
  status: "active" | "inactive";
}