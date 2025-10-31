import React, { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Edit,
  Trash2,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  ArrowLeftToLine,
} from "lucide-react";
import axios from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { toast } from "sonner";
import { DialogModal } from "@/components/Dialog";
import { Badge } from "@/components/ui/badge";

interface Category {
  _id: string;
  name: string;
  description: string;
  parentCategoryId: string | null;
  defaultReturnPeriod: number;
  children?: Category[];
  parentCategory?: {
    _id: string;
    name: string;
    description: string;
  } | null;
}

interface Permissions {
  canCreateCategory: boolean;
  canEditCategory: boolean;
  canDeleteCategory: boolean;
}

const CategoryPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedItem, setSelectedItem] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () =>{
      const saved = localStorage.getItem("expandedCategories");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
  );
  const [permissions] = useState<Permissions>({
    canCreateCategory: true,
    canEditCategory: true,
    canDeleteCategory: true,
  });

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`/inventory/categories?tree=true`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      const categoriesData = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
     
      localStorage.setItem("expandedCategories", JSON.stringify([...newSet]));
      return newSet;
    });
  };

 
  useEffect(() => {
    const expandParentCategories = (categories: Category[]) => {
      const parentIds = new Set<string>();

      const findParents = (cats: Category[]) => {
        cats.forEach((cat) => {
          if (cat.children && cat.children.length > 0) {
            parentIds.add(cat._id);
            findParents(cat.children);
          }
        });
      };

      findParents(categories);

      setExpandedCategories((prev) => {
        const newSet = new Set([...prev, ...parentIds]);
        localStorage.setItem("expandedCategories", JSON.stringify([...newSet]));
        return newSet;
      });
    };

    if (categories.length > 0) {
      expandParentCategories(categories);
    }
  }, [categories]); 

  const handleDelete = (category: Category) =>{
    const hasChildren = category.children && category.children.length > 0;
    if (hasChildren) {
      toast.error("Cannot delete category that has child categories");
      return;
    }

    setSelectedItem(category._id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteItem = async () => {
    if (!selectedItem) return;

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast.error("No access token found. Please log in again.");
        return;
      }

      await axios.delete(`/inventory/categories/${selectedItem}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const deletedCategory = findCategoryById(categories, selectedItem);
      toast.success(
        `${deletedCategory?.name || "Category"} has been deleted successfully.`
      );

      const response = await axios.get(`/inventory/categories?tree=true`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setCategories(response.data.data || []);

      setIsDeleteModalOpen(false);
      setSelectedItem("");
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete the category."
      );
    }
  };

  const findCategoryById = (
    categories: Category[],
    id: string
  ): Category | null => {
    for (const category of categories) {
      if (category._id === id) return category;
      if (category.children) {
        const found = findCategoryById(category.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleAddSubmit = async (formData: Record<string, any>) => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("No access token found. Please log in again.");
      return;
    }

    const payload = {
      name: formData.category,
      description: formData.description,
      parentCategoryId: parentCategory?._id || null,
      defaultReturnPeriod: parseInt(formData.defaultReturnPeriod) || 20,
    };

    try {
      const response = await axios.post(`/inventory/categories`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const newCategory: Category = response.data.category;

      if (newCategory && newCategory._id && newCategory.name) {
        const categoriesResponse = await axios.get(
          `/inventory/categories?tree=true`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setCategories(categoriesResponse.data.data || []);

       
        if (parentCategory) {
          setExpandedCategories((prev) => {
            const newSet = new Set(prev);
            newSet.add(parentCategory._id);
            localStorage.setItem(
              "expandedCategories",
              JSON.stringify([...newSet])
            );
            return newSet;
          });
        }

        toast.success("Category added successfully.");

        if (parentCategory) {
          setIsAddChildOpen(false);
          setParentCategory(null);
          setExpandedCategories((prev) =>
            new Set(prev).add(parentCategory._id)
          );
        } else {
          setIsAddCategoryOpen(false);
        }
      } else {
        console.error("Unexpected response:", response.data);
        toast.error("Invalid response from server, could not add category.");
      }
    } catch (error: any) {
      console.error("Error adding category:", error);

      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessage = validationErrors
          .map((err: any) => err.message)
          .join(", ");
        toast.error(`Validation error: ${errorMessage}`);
      } else {
        toast.error(error.response?.data?.message || "Failed to add category.");
      }
    } finally {
      setIsAddCategoryOpen(false);
      setIsAddChildOpen(false);
      setParentCategory(null);
    }
  };

  const handleEditItem = (category: Category) => {
    setCurrentItem(category);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (formData: Record<string, any>) => {
    if (!currentItem) return;

    const dataToSend = {
      name: formData.category,
      description: formData.description,
      defaultReturnPeriod:
        parseInt(formData.defaultReturnPeriod) ||
        currentItem.defaultReturnPeriod,
    };

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast.error("No access token found. Please log in again.");
        return;
      }

      const response = await axios.put(
        `/inventory/categories/${currentItem._id}`,
        dataToSend,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const updatedCategory: Category = response.data.category;

      const categoriesResponse = await axios.get(
        `/inventory/categories?tree=true`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setCategories(categoriesResponse.data.data || []);

      toast.success(`${updatedCategory.name} updated successfully.`);
      setIsEditModalOpen(false);
      setCurrentItem(null);
    } catch (error: any) {
      console.error("Error editing category:", error);

      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessage = validationErrors
          .map((err: any) => err.message)
          .join(", ");
        toast.error(`Validation error: ${errorMessage}`);
      } else {
        toast.error(
          error.response?.data?.message || "Failed to update the category."
        );
      }
    }
  };

  const handleAddChildCategory = (parentCategory: Category) => {
    setParentCategory(parentCategory);
    setIsAddChildOpen(true);
  };

  const flattenCategories = (categories: Category[]): Category[] => {
    let result: Category[] = [];
    categories.forEach((category) => {
      result.push(category);
      if (category.children) {
        result = result.concat(flattenCategories(category.children));
      }
    });
    return result;
  };

 
  const getFilteredCategories = () => {
    if (!search) return categories;

    const flatCategories = flattenCategories(categories);
    const filteredFlat = flatCategories.filter(
      (category) =>
        category.name.toLowerCase().includes(search.toLowerCase()) ||
        category.description.toLowerCase().includes(search.toLowerCase())
    );

   
    const rebuildTree = (
      categories: Category[],
      filteredIds: Set<string>
    ): Category[] => {
      return categories
        .filter((category) => filteredIds.has(category._id))
        .map((category) => ({
          ...category,
          children: category.children
            ? rebuildTree(category.children, filteredIds)
            : [],
        }));
    };

    const filteredIds = new Set(filteredFlat.map((cat) => cat._id));
    return rebuildTree(categories, filteredIds);
  };

  const renderCategoryTree = (categories: Category[], level = 0) => {
    return categories.map((category) => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedCategories.has(category._id);
      const isRoot = level === 0;

      return (
        <React.Fragment key={category._id}>
          <TableRow className="hover:bg-muted/30">
            <TableCell className="font-medium">
              <div
                className="flex items-center gap-2"
                style={{ paddingLeft: `${level * 24}px` }}
              >
                {hasChildren ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => toggleCategory(category._id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                ) : (
                  <div className="w-6" />
                )}
                {isRoot ? (
                  <FolderOpen className="h-4 w-4 text-blue-500" />
                ) : (
                  <Folder className="h-4 w-4 text-gray-500" />
                )}
                <span>{category.name}</span>
                {isRoot && (
                  <Badge variant="secondary" className="ml-2">
                    Root
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {category.description}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2 justify-end">
                <Badge variant="outline">
                  {category.defaultReturnPeriod} days
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {permissions.canCreateCategory && (
                      <DropdownMenuItem
                        onClick={() => handleAddChildCategory(category)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Child Category
                      </DropdownMenuItem>
                    )}
                    {permissions.canEditCategory && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleEditItem(category)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Category
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {permissions.canDeleteCategory && (
                      <DropdownMenuItem
                        onClick={() => handleDelete(category)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Category
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
          {hasChildren &&
            isExpanded &&
            renderCategoryTree(category.children!, level + 1)}
        </React.Fragment>
      );
    });
  };

  const filteredCategories = getFilteredCategories();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div
            className="flex gap-2 cursor-pointer items-center mb-4"
            onClick={() => navigate("/inventory")}
          >
            <ArrowLeftToLine className="h-4 w-4" />
            <p className="text-md text-gray-600">Back</p>
          </div>
            <h1 className="text-3xl font-bold text-foreground">
              Category Management
            </h1>
            <p className="text-muted-foreground">
              Manage and organize your library categories hierarchy
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {permissions.canCreateCategory && (
              <Button size="sm" onClick={() => setIsAddCategoryOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Category
              </Button>
            )}
          </div>
        </div>

        {/* Filters + Search */}
        <Card>
          <CardContent className="p-6 flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sort + Clear */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                }
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                {sortOrder === "asc" ? "A-Z" : "Z-A"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSearch("")}>
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Categories Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderCategoryTree(filteredCategories)}
                  {filteredCategories.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-6 text-muted-foreground"
                      >
                        No categories found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedItem && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          onConfirm={confirmDeleteItem}
          itemName={findCategoryById(categories, selectedItem)?.name || ""}
        />
      )}

      {/* Add Top-Level Category Modal */}
      {isAddCategoryOpen && (
        <DialogModal
          isOpen={isAddCategoryOpen}
          onOpenChange={setIsAddCategoryOpen}
          title="Add New Category"
          description="Fill the details for the new top-level category"
          fields={[
            { type: "text", name: "category", label: "Category Name" },
            { type: "text", name: "description", label: "Description" },
            {
              type: "text",
              name: "defaultReturnPeriod",
              label: "Default Return Period (days)",
              renderAdornment: () => (
                <Badge variant="outline" className="mr-2">
                  days
                </Badge>
              ),
            },
          ]}
          defaultValues={{
            category: "",
            description: "",
            defaultReturnPeriod: "20",
          }}
          onSubmit={handleAddSubmit}
        />
      )}

      {/* Add Child Category Modal */}
      {isAddChildOpen && parentCategory && (
        <DialogModal
          isOpen={isAddChildOpen}
          onOpenChange={setIsAddChildOpen}
          title="Add Child Category"
          description={`Add a subcategory under "${parentCategory.name}"`}
          fields={[
            {
              type: "text",
              name: "parentCategory",
              label: "Parent Category",
              renderAdornment: () => (
                <span className="text-muted-foreground mr-2">(Read-only)</span>
              ),
            },
            { type: "text", name: "category", label: "Category Name" },
            { type: "text", name: "description", label: "Description" },
            {
              type: "text",
              name: "defaultReturnPeriod",
              label: "Default Return Period (days)",
              renderAdornment: () => (
                <Badge variant="outline" className="mr-2">
                  days
                </Badge>
              ),
            },
          ]}
          defaultValues={{
            parentCategory: parentCategory.name,
            category: "",
            description: "",
            defaultReturnPeriod: "20",
          }}
          onSubmit={handleAddSubmit}
        />
      )}

      {/* Edit Category Modal */}
      {isEditModalOpen && currentItem && (
        <DialogModal
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          title="Edit Category"
          description="Update the category details"
          fields={[
            { type: "text", name: "category", label: "Category Name" },
            { type: "text", name: "description", label: "Description" },
            {
              type: "text",
              name: "defaultReturnPeriod",
              label: "Default Return Period (days)",
              renderAdornment: () => (
                <Badge variant="outline" className="mr-2">
                  days
                </Badge>
              ),
            },
          ]}
          defaultValues={{
            category: currentItem.name,
            description: currentItem.description,
            defaultReturnPeriod:
              currentItem.defaultReturnPeriod?.toString() || "20",
          }}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
};

export default CategoryPage;
