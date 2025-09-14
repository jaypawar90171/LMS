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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { toast } from "sonner";
import { DialogModal } from "@/components/Dialog";

interface Category {
  _id: string;
  name: string;
  description: string;
}

const CategoryPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedItem, setSelectedItem] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [IsEditModalOpen, setIsEditModalOpen] = useState(false);
  const [item, setItem] = useState<Category | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`/inventory/categories`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        const uniqueCategories = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        setCategories(uniqueCategories);
        setFilteredCategories(uniqueCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    let filtered = [...categories];

    if (search) {
      filtered = filtered.filter((cat) =>
        cat.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      if (a.name < b.name) return sortOrder === "asc" ? -1 : 1;
      if (a.name > b.name) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredCategories(filtered);
  }, [categories, search, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleDelete = (id: string) => {
    setSelectedItem(id);
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

      await axios.delete(
        `http://localhost:3000/api/admin/inventory/categories/${selectedItem}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const deletedCategory = categories.find((c) => c._id === selectedItem);
      toast.success(
        `${deletedCategory?.name || "Category"} has been deleted successfully.`
      );

      setCategories((prev) => prev.filter((c) => c._id !== selectedItem));

      setIsDeleteModalOpen(false);
      setSelectedItem("");
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete the category."
      );
    }
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
    };

    try {
      const response = await axios.post(
        `http://localhost:3000/api/admin/inventory/categories`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const newCategory: Category = response.data.category;

      if (newCategory && newCategory._id && newCategory.name) {
        setCategories((prev) => [...prev, newCategory]);
        toast.success("Category added successfully.");
        setIsAddCategoryOpen(false);
      } else {
        console.error("Unexpected response:", response.data);
        toast.error("Invalid response from server, could not add category.");
      }
    } catch (error: any) {
      console.error("Error adding category:", error);
      toast.error(error.response?.data?.message || "Failed to add category.");
    }
  };

  const handleEditItem = (item: Category) => {
    setItem(item);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (formData: Record<string, any>) => {
    console.log(item?._id);
    if (!item) return;

    const dataToSend = {
      name: formData.category,
      description: formData.description,
    };

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast.error("No access token found. Please log in again.");
        return;
      }

      const response = await axios.put(
        `http://localhost:3000/api/admin/inventory/categories/${item._id}`,
        dataToSend,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const updatedCategory: Category = response.data.category;
      setCategories((prev) =>
        prev.map((c) => (c._id === updatedCategory._id ? updatedCategory : c))
      );
      toast.success(`${updatedCategory.name} updated successfully.`);
      setIsEditModalOpen(false);
      setItem(null);
    } catch (error: any) {
      console.error("Error editing category:", error);
      toast.error(
        error.response?.data?.message || "Failed to update the category."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">
              Category Management
            </h1>
            <p className="text-muted-foreground">
              Manage and organize your library categories
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setIsAddCategoryOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Category
            </Button>
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
              <Button variant="outline" size="sm" onClick={toggleSortOrder}>
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
                  {filteredCategories.map((cat) => (
                    <TableRow key={cat._id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {cat.description}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditItem(cat)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(cat._id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
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

      {isDeleteModalOpen && selectedItem && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          onConfirm={confirmDeleteItem}
          itemName={categories.find((c) => c._id === selectedItem)?.name || ""}
        />
      )}

      {isAddCategoryOpen && (
        <DialogModal
          isOpen={isAddCategoryOpen}
          onOpenChange={setIsAddCategoryOpen}
          title="Add New Category"
          description="Fill the details for the new category"
          fields={[
            { type: "text", name: "category", label: "Category Name" },
            { type: "text", name: "description", label: "Description" },
          ]}
          defaultValues={{
            category: "",
            description: "",
          }}
          onSubmit={handleAddSubmit}
        />
      )}

      {IsEditModalOpen && item && (
        <DialogModal
          isOpen={IsEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          title="Edit Category"
          description="Fill the details for edit category"
          fields={[
            { type: "text", name: "category", label: "Category Name" },
            { type: "text", name: "description", label: "Description" },
          ]}
          defaultValues={{
            category: item.name,
            description: item.description,
          }}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
};

export default CategoryPage;
