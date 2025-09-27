import React from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import axios from "axios";
import z from "zod";

interface Category {
  _id: string;
  name: string;
}

interface InventoryItem {
  _id: string;
  title: string;
  authorOrCreator: string;
  categoryId: {
    _id: string;
    name: string;
  };
  quantity: number;
  availableCopies: number;
  isbnOrIdentifier?: string;
  publicationYear?: number;
  description?: string;
  publisherOrManufacturer?: string;
  defaultReturnPeriod?: number;
  status?: string;
  price?: any;
}

interface ItemFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  mode: "add" | "edit";
  itemData: InventoryItem | null;
  categories?: Category[];
  onSuccess: () => void;
}

type ItemFormData = {
  title: string;
  authorOrCreator?: string;
  description?: string;
  mediaUrl?: FileList;
  isbnOrIdentifier: string;
  publisherOrManufacturer?: string;
  publicationYear?: number;
  categoryId: string;
  price: number;
  quantity: number;
  availableCopies: number;
  defaultReturnPeriod?: number;
  status: "Available" | "Issued" | "Lost" | "Damaged";
};

const safeParsePrice = (price: unknown): number => {
  if (typeof price === "number") return price;
  if (typeof price === "string") {
    const parsed = parseFloat(price);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (
    typeof price === "object" &&
    price !== null &&
    "$numberDecimal" in price &&
    typeof (price as any).$numberDecimal === "string"
  ) {
    const parsed = parseFloat((price as any).$numberDecimal);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const ItemFormModal = ({
  isOpen,
  onOpenChange,
  mode,
  itemData,
  categories = [],
  onSuccess,
}: ItemFormModalProps) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setError,
    clearErrors,
  } = useForm<ItemFormData>({
    defaultValues: {
      title: "",
      authorOrCreator: "",
      description: "",
      isbnOrIdentifier: "",
      publisherOrManufacturer: "",
      publicationYear: undefined,
      categoryId: "",
      price: 0,
      quantity: 1,
      availableCopies: 1,
      defaultReturnPeriod: 30,
      status: "Available",
    },
  });

  React.useEffect(() => {
    if (isOpen && mode === "edit" && itemData) {
      reset({
        title: itemData.title || "",
        authorOrCreator: itemData.authorOrCreator || "",
        description: itemData.description || "",
        isbnOrIdentifier: itemData.isbnOrIdentifier || "",
        publisherOrManufacturer: itemData.publisherOrManufacturer || "",
        publicationYear: itemData.publicationYear,
        categoryId: itemData.categoryId?._id || "",
        price: safeParsePrice(itemData.price),
        quantity: itemData.quantity || 0,
        availableCopies: itemData.availableCopies || 0,
        defaultReturnPeriod: itemData.defaultReturnPeriod || 30,
        status:
          (itemData.status as "Available" | "Issued" | "Lost" | "Damaged") ||
          "Available",
      });
    } else if (isOpen && mode === "add") {
      reset();
    }
  }, [isOpen, mode, itemData, reset]);

  const validateForm = (data: ItemFormData) => {
    let valid = true;
    clearErrors();

    if (data.title.length < 2) {
      setError("title", {
        type: "manual",
        message: "Title must be at least 2 characters.",
      });
      valid = false;
    }
    if (data.isbnOrIdentifier.length < 5) {
      setError("isbnOrIdentifier", {
        type: "manual",
        message: "ISBN or Identifier is required.",
      });
      valid = false;
    }
    if (data.categoryId === "") {
      setError("categoryId", {
        type: "manual",
        message: "A category must be selected.",
      });
      valid = false;
    }
    if (data.price < 0) {
      setError("price", {
        type: "manual",
        message: "Price must be a positive number.",
      });
      valid = false;
    }
    if (data.quantity < 0 || !Number.isInteger(data.quantity)) {
      setError("quantity", {
        type: "manual",
        message: "Quantity must be a whole number.",
      });
      valid = false;
    }
    if (data.availableCopies < 0 || !Number.isInteger(data.availableCopies)) {
      setError("availableCopies", {
        type: "manual",
        message: "Available copies must be a whole number.",
      });
      valid = false;
    }
    if (
      data.defaultReturnPeriod !== undefined &&
      (data.defaultReturnPeriod < 1 ||
        !Number.isInteger(data.defaultReturnPeriod))
    ) {
      setError("defaultReturnPeriod", {
        type: "manual",
        message: "Return period must be at least 1 day.",
      });
      valid = false;
    }
    return valid;
  };

  const onSubmit = async (data: ItemFormData) => {
    if (!validateForm(data)) return;

    const apiEndpoint =
      mode === "add"
        ? `http://localhost:3000/api/admin/inventory/items`
        : `http://localhost:3000/api/admin/inventory/items/${itemData?._id}`;

    try {
      if (mode === "add") {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (
            key === "mediaUrl" &&
            value instanceof FileList &&
            value.length > 0
          ) {
            formData.append(key, value[0]);
          } else if (value !== undefined && value !== null) {
            formData.append(
              key,
              typeof value === "object" ? JSON.stringify(value) : String(value)
            );
          }
        });

        await axios.post(apiEndpoint, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
      } else {
        await axios.put(apiEndpoint, data, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
      }

      toast.success(
        `Item ${mode === "add" ? "created" : "updated"} successfully!`
      );
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          `Failed to ${mode === "add" ? "create" : "update"} item.`
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New Item" : "Edit Item"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Fill in the details to create a new inventory item."
              : `Editing details for ${itemData?.title}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="core" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="core">Core Info</TabsTrigger>
              <TabsTrigger value="publication">Publication & ID</TabsTrigger>
              <TabsTrigger value="stock">Stock & Status</TabsTrigger>
            </TabsList>

            <TabsContent value="core" className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  {...register("title", {
                    required: "Title is required",
                    minLength: 2,
                  })}
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="authorOrCreator">Author / Creator</Label>
                <Input id="authorOrCreator" {...register("authorOrCreator")} />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register("description")} />
              </div>
              <div>
                <Label htmlFor="mediaUrl">Item Image</Label>
                <Input id="mediaUrl" type="file" {...register("mediaUrl")} />
              </div>
            </TabsContent>

            <TabsContent value="publication" className="space-y-4 py-4">
              <div>
                <Label htmlFor="isbnOrIdentifier">ISBN / Identifier</Label>
                <Input
                  id="isbnOrIdentifier"
                  {...register("isbnOrIdentifier", {
                    // required: "ISBN or Identifier is required",
                    minLength: { value: 5, message: "Minimum length is 5" },
                  })}
                />
                {errors.isbnOrIdentifier && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.isbnOrIdentifier.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="publisherOrManufacturer">
                  Publisher / Manufacturer
                </Label>
                <Input
                  id="publisherOrManufacturer"
                  {...register("publisherOrManufacturer")}
                />
              </div>
              <div>
                <Label htmlFor="publicationYear">Publication Year</Label>
                <Controller
                  control={control}
                  name="publicationYear"
                  render={({ field }) => (
                    <Input
                      id="publicationYear"
                      type="number"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="stock" className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2">
                <Label>Category</Label>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.length > 0 ? (
                          categories.map((cat) => (
                            <SelectItem key={cat._id} value={cat._id}>
                              {cat.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            No categories available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoryId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Controller
                  control={control}
                  name="price"
                  render={({ field }) => (
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />
                {errors.price && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.price.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Issued">Issued</SelectItem>
                        <SelectItem value="Damaged">Damaged</SelectItem>
                        <SelectItem value="Lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="quantity">Total Quantity</Label>
                <Controller
                  control={control}
                  name="quantity"
                  render={({ field }) => (
                    <Input
                      id="quantity"
                      type="number"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />
                {errors.quantity && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.quantity.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="availableCopies">Available Copies</Label>
                <Controller
                  control={control}
                  name="availableCopies"
                  render={({ field }) => (
                    <Input
                      id="availableCopies"
                      type="number"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />
                {errors.availableCopies && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.availableCopies.message}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <Label htmlFor="defaultReturnPeriod">
                  Default Return Period (Days)
                </Label>
                <Controller
                  control={control}
                  name="defaultReturnPeriod"
                  render={({ field }) => (
                    <Input
                      id="defaultReturnPeriod"
                      type="number"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {mode === "add" ? "Create Item" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
