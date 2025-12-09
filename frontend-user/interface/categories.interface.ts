export interface IParentCategory {
  _id: string;
  name: string;
}

export interface ICategory {
  _id: string;
  name: string;
  description: string;
  parentCategoryId: IParentCategory | null;
  defaultReturnPeriod: number;
  createdAt: string;
  updatedAt: string;
  categoryType: "parent" | "subcategory";
  parentCategoryName: string | null;
}

export interface IItem {
  _id: string;
  title: string;
  itemType: string;
  availableCopies: number;
  typeSpecificFields?: Record<string, any>;
  condition: string;
}