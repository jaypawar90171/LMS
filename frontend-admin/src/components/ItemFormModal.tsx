import React, { useEffect, useState } from "react";
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

interface Category {
  _id: string;
  name: string;
  isParent?: boolean;
  isChild?: boolean;
  parentCategoryId?:
    | string
    | null
    | { _id: string; name: string; description: string };
}

interface InventoryItem {
  _id: string;
  title: string;
  authorOrCreator: string;
  categoryId: {
    _id: string;
    name: string;
  };
  subcategoryId?: {
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
  subcategoryId?: string;
  price: number;
  quantity: number;
  availableCopies: number;
  defaultReturnPeriod?: number;
  status: "Available" | "Issued" | "Lost" | "Damaged";
  color?: string;
  size?: "XS" | "S" | "M" | "L" | "XL" | "XXL"; // enum for clothes
  genderType?: "Male" | "Female" | "Unisex"; // enum for clothes
  ageGroup?: "0-3" | "4-7" | "8-12" | "13+";

  dimensions?: string; // e.g., "10x5x2 cm"
  warrantyPeriod?: number; // months or years
  features?: string[]; // for electronics
  usageType?: string; // e.g., "Cooking", "Storage" (for kitchen)
  powerSource?: string; // for tools
  usage?: string; // for sports
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

export const categoryFieldConfig: Record<string, string[]> = {
  Books: [
    "title",
    "authorOrCreator",
    "description",
    "mediaUrl",
    "isbnOrIdentifier",
    "publisherOrManufacturer",
    "publicationYear",
    "price",
    "quantity",
    "availableCopies",
    "status",
    "defaultReturnPeriod",
  ],
  Clothes: [
    "title",
    "description",
    "price",
    "quantity",
    "availableCopies",
    "size",
    "color",
    "genderType",
    "publisherOrManufacturer",
    "status",
    "defaultReturnPeriod",
    "mediaUrl"
  ],
  Electronics: [
    "title",
    "description",
    "price",
    "quantity",
    "availableCopies",
    "warrantyPeriod",
    "features",
    "dimensions",
    "publisherOrManufacturer",
    "status",
    "defaultReturnPeriod",
    "mediaUrl"
  ],
  Furniture: [
    "title",
    "description",
    "price",
    "quantity",
    "availableCopies",
    "color",
    "warrantyPeriod",
    "dimensions",
    "publisherOrManufacturer",
    "status",
    "defaultReturnPeriod",
    "mediaUrl"
  ],
  "Kitchen Accessories": [
    "title",
    "description",
    "price",
    "quantity",
    "availableCopies",
    "usageType",
    "dimensions",
    "color",
    "publisherOrManufacturer",
    "status",
    "defaultReturnPeriod",
    "mediaUrl"
  ],
  "Sports Equipment": [
    "title",
    "description",
    "price",
    "quantity",
    "availableCopies",
    "usage",
    "ageGroup",
    "color",
    "publisherOrManufacturer",
    "status",
    "defaultReturnPeriod",
    "mediaUrl"
  ],
  Tools: [
    "title",
    "description",
    "price",
    "quantity",
    "availableCopies",
    "powerSource",
    "dimensions",
    "warrantyPeriod",
    "publisherOrManufacturer",
    "status",
    "defaultReturnPeriod",
    "mediaUrl"
  ],
  Toys: [
    "title",
    "description",
    "price",
    "quantity",
    "availableCopies",
    "color",
    "ageGroup",
    "dimensions",
    "publisherOrManufacturer",
    "status",
    "defaultReturnPeriod",
    "mediaUrl"
  ],
};

export const ItemFormModal = ({
  isOpen,
  onOpenChange,
  mode,
  itemData,
  categories = [],
  onSuccess,
}: ItemFormModalProps) => {
  const [subcategories, setSubcategories] = useState<Category[]>([]);

  const parentCategories = React.useMemo(() => {
    return categories.filter((cat) => cat.isParent);
  }, [categories]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setError,
    clearErrors,
    watch,
    setValue,
  } = useForm<ItemFormData>({
    defaultValues: {
      title: "",
      authorOrCreator: "",
      description: "",
      isbnOrIdentifier: "",
      publisherOrManufacturer: "",
      publicationYear: undefined,
      categoryId: "",
      subcategoryId: "",
      price: 0,
      quantity: 1,
      availableCopies: 1,
      defaultReturnPeriod: 30,
      status: "Available",
    },
  });

  const selectedCategoryId = watch("categoryId");
  const selectedCategory = categories.find(
    (cat) => cat._id === selectedCategoryId
  );
  const fieldsToShow = selectedCategory
    ? categoryFieldConfig[selectedCategory.name] || categoryFieldConfig.Default
    : [];

  // Update subcategories when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      const subs = categories.filter(
        (cat) =>
          cat.isChild &&
          cat.parentCategoryId &&
          (typeof cat.parentCategoryId === "string"
            ? cat.parentCategoryId === selectedCategoryId
            : cat.parentCategoryId._id === selectedCategoryId)
      );
      setSubcategories(subs);
      // Reset subcategory when main category changes
      setValue("subcategoryId", "");
    } else {
      setSubcategories([]);
      setValue("subcategoryId", "");
    }
  }, [selectedCategoryId, categories, setValue]);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && itemData) {
        // For edit mode, set both category and subcategory
        const categoryId = itemData.categoryId?._id || "";
        const subcategoryId = itemData.subcategoryId?._id || "";

        // Get subcategories for the selected category
        if (categoryId) {
          const subs = categories.filter(
            (cat) =>
              cat.isChild &&
              cat.parentCategoryId &&
              (typeof cat.parentCategoryId === "string"
                ? cat.parentCategoryId === categoryId
                : cat.parentCategoryId._id === categoryId)
          );
          setSubcategories(subs);
        }

        reset({
          title: itemData.title || "",
          authorOrCreator: itemData.authorOrCreator || "",
          description: itemData.description || "",
          isbnOrIdentifier: itemData.isbnOrIdentifier || "",
          publisherOrManufacturer: itemData.publisherOrManufacturer || "",
          publicationYear: itemData.publicationYear,
          categoryId: categoryId,
          subcategoryId: subcategoryId || "no-subcategory",
          price: safeParsePrice(itemData.price),
          quantity: itemData.quantity || 0,
          availableCopies: itemData.availableCopies || 0,
          defaultReturnPeriod: itemData.defaultReturnPeriod || 30,
          status:
            (itemData.status as "Available" | "Issued" | "Lost" | "Damaged") ||
            "Available",
        });
      } else {
        reset({
          title: "",
          authorOrCreator: "",
          description: "",
          isbnOrIdentifier: "",
          publisherOrManufacturer: "",
          publicationYear: undefined,
          categoryId: "",
          subcategoryId: "no-subcategory",
          price: 0,
          quantity: 1,
          availableCopies: 1,
          defaultReturnPeriod: 30,
          status: "Available",
        });
        setSubcategories([]);
      }
    }
  }, [isOpen, mode, itemData, reset, categories]);

  const validateForm = (data: ItemFormData) => {
    let valid = true;
    clearErrors();

    if (fieldsToShow.includes("title") && data.title.length < 2) {
      setError("title", {
        type: "manual",
        message: "Title must be at least 2 characters.",
      });
      valid = false;
    }
    if (
      fieldsToShow.includes("isbnOrIdentifier") &&
      data.isbnOrIdentifier.length < 5
    ) {
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

    const processedData = {
      ...data,
      features: data.features
        ? typeof data.features === "string"
          ? (data.features as string)
              .split(",")
              .map((f: string) => f.trim())
              .filter(Boolean)
          : data.features
        : undefined,
      subcategoryId:
        data.subcategoryId === "no-subcategory"
          ? undefined
          : data.subcategoryId,
    };

    const payload: any = {
      categoryId: processedData.categoryId,
      subcategoryId: processedData.subcategoryId,
    };

    fieldsToShow.forEach((field) => {
      if (field === "mediaUrl") return; 
      payload[field] = (processedData as any)[field];
    });

    const apiEndpoint =
      mode === "add"
        ? `https://lms-backend1-q5ah.onrender.com/api/admin/inventory/items`
        : `https://lms-backend1-q5ah.onrender.com/api/admin/inventory/items/${itemData?._id}`;

    try {
      if (mode === "add") {
        const formData = new FormData();

        // Append all fields to FormData
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          }
        });

        // Handle file upload
        if (data.mediaUrl && data.mediaUrl.length > 0) {
          formData.append("mediaUrl", data.mediaUrl[0]);
        }

        await axios.post(apiEndpoint, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
      } else {
        await axios.put(apiEndpoint, payload, {
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
      console.error("API Error:", error.response?.data);
      toast.error(
        error.response?.data?.message ||
          `Failed to ${mode === "add" ? "create" : "update"} item.`
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto scrollbar-hide">
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
          {/* --- CATEGORY SELECTION --- */}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Controller
                control={control}
                name="categoryId"
                rules={{ required: "Please select a category" }}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentCategories?.length > 0 ? (
                        parentCategories.map((cat) => (
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

            {/* --- SUBCATEGORY SELECTION (only show if category has subcategories) --- */}
            {subcategories.length > 0 && (
              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Controller
                  control={control}
                  name="subcategoryId"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subcategory (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-subcategory">
                          No subcategory
                        </SelectItem>
                        {subcategories.map((subcat) => (
                          <SelectItem key={subcat._id} value={subcat._id}>
                            {subcat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </div>

          {/* --- DYNAMIC FORM FIELDS --- */}
          {selectedCategoryId && (
            <Tabs defaultValue="core" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="core">Core Info</TabsTrigger>
                <TabsTrigger value="publication">Publication & ID</TabsTrigger>
                <TabsTrigger value="stock">Stock & Status</TabsTrigger>
              </TabsList>

              {/* -- CORE INFO TAB -- */}
              <TabsContent value="core" className="space-y-4 py-4">
                {fieldsToShow.includes("title") && (
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
                )}
                {fieldsToShow.includes("authorOrCreator") && (
                  <div>
                    <Label htmlFor="authorOrCreator">Author / Creator</Label>
                    <Input
                      id="authorOrCreator"
                      {...register("authorOrCreator")}
                    />
                  </div>
                )}
                {fieldsToShow.includes("description") && (
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" {...register("description")} />
                  </div>
                )}
                {fieldsToShow.includes("mediaUrl") && (
                  <div>
                    <Label htmlFor="mediaUrl">Item Image</Label>
                    <Input
                      id="mediaUrl"
                      type="file"
                      {...register("mediaUrl")}
                    />
                  </div>
                )}
                {fieldsToShow.includes("size") && (
                  <div>
                    <Label htmlFor="size">Size</Label>
                    <Controller
                      control={control}
                      name="size"
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="XS">XS</SelectItem>
                            <SelectItem value="S">S</SelectItem>
                            <SelectItem value="M">M</SelectItem>
                            <SelectItem value="L">L</SelectItem>
                            <SelectItem value="XL">XL</SelectItem>
                            <SelectItem value="XXL">XXL</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                )}

                {fieldsToShow.includes("genderType") && (
                  <div>
                    <Label htmlFor="genderType">Gender Type</Label>
                    <Controller
                      control={control}
                      name="genderType"
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Men">Male</SelectItem>
                            <SelectItem value="Women">Female</SelectItem>
                            <SelectItem value="Unisex">Unisex</SelectItem>
                            <SelectItem value="Kids">Kids</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                )}

                {fieldsToShow.includes("ageGroup") && (
                  <div>
                    <Label htmlFor="ageGroup">Age Group</Label>
                    <Controller
                      control={control}
                      name="ageGroup"
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select age group" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectContent>
                              <SelectItem value="0-3">0-3</SelectItem>
                              <SelectItem value="4-7">4-7</SelectItem>
                              <SelectItem value="8-12">8-12</SelectItem>
                              <SelectItem value="13+">13+</SelectItem>
                            </SelectContent>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                )}

                {fieldsToShow.includes("color") && (
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Input id="color" {...register("color")} />
                  </div>
                )}

                {fieldsToShow.includes("warrantyPeriod") && (
                  <div>
                    <Label htmlFor="warrantyPeriod">
                      Warranty Period (months)
                    </Label>
                    <Input
                      id="warrantyPeriod"
                      type="number"
                      {...register("warrantyPeriod")}
                    />
                  </div>
                )}

                {fieldsToShow.includes("features") && (
                  <div>
                    <Label htmlFor="features">Features (comma separated)</Label>
                    <Input
                      id="features"
                      placeholder="e.g., Waterproof, Bluetooth"
                      {...register("features")}
                    />
                  </div>
                )}

                {fieldsToShow.includes("dimensions") && (
                  <div>
                    <Label htmlFor="dimensions">Dimensions</Label>
                    <Input
                      id="dimensions"
                      placeholder="e.g., 10x15x5 cm"
                      {...register("dimensions")}
                    />
                  </div>
                )}

                {fieldsToShow.includes("usageType") && (
                  <div>
                    <Label htmlFor="usageType">Usage Type</Label>
                    <Input id="usageType" {...register("usageType")} />
                  </div>
                )}

                {fieldsToShow.includes("usage") && (
                  <div>
                    <Label htmlFor="usage">Usage</Label>
                    <Input id="usage" {...register("usage")} />
                  </div>
                )}

                {fieldsToShow.includes("powerSource") && (
                  <div>
                    <Label htmlFor="powerSource">Power Source</Label>
                    <Input
                      id="powerSource"
                      placeholder="e.g., Battery, Electric"
                      {...register("powerSource")}
                    />
                  </div>
                )}
              </TabsContent>

              {/* -- PUBLICATION TAB -- */}
              <TabsContent value="publication" className="space-y-4 py-4">
                {fieldsToShow.includes("isbnOrIdentifier") && (
                  <div>
                    <Label htmlFor="isbnOrIdentifier">ISBN / Identifier</Label>
                    <Input
                      id="isbnOrIdentifier"
                      {...register("isbnOrIdentifier", {
                        minLength: { value: 5, message: "Minimum length is 5" },
                      })}
                    />
                    {errors.isbnOrIdentifier && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.isbnOrIdentifier.message}
                      </p>
                    )}
                  </div>
                )}
                {fieldsToShow.includes("publisherOrManufacturer") && (
                  <div>
                    <Label htmlFor="publisherOrManufacturer">
                      Publisher / Manufacturer
                    </Label>
                    <Input
                      id="publisherOrManufacturer"
                      {...register("publisherOrManufacturer")}
                    />
                  </div>
                )}
                {fieldsToShow.includes("publicationYear") && (
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
                )}
              </TabsContent>

              {/* -- STOCK TAB -- */}
              <TabsContent
                value="stock"
                className="grid grid-cols-2 gap-4 py-4"
              >
                {fieldsToShow.includes("price") && (
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
                )}
                {fieldsToShow.includes("status") && (
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
                )}
                {fieldsToShow.includes("quantity") && (
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
                )}
                {fieldsToShow.includes("availableCopies") && (
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
                )}
                {fieldsToShow.includes("defaultReturnPeriod") && (
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
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedCategoryId}>
              {mode === "add" ? "Create Item" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
