"use client";

import React from "react";
import { X, Edit, Trash2, Printer, Loader2 } from "lucide-react";
import { Button } from "./Button";
import axios from "axios";

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`rounded-lg bg-white border border-gray-200 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
};

const CardContent = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

interface ItemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemData: any;
  loading: boolean;
  error: string | null;
}

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  isOpen,
  onClose,
  itemData,
  loading,
  error,
}) => {
  if (!isOpen) return null;

  const handlePrintBarcode = async (e: any) => {
    e.preventDefault();
    if (!itemData?._id) {
      console.error("Invalid item id");
      return;
    }
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        console.error("No access token found.");
        return;
      }
      const response = await axios.get(
        `http://localhost:3000/api/admin/barcode/download/${itemData._id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${itemData.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error downloading the barcode:", error);
    }
  };

  const Field = ({
    label,
    value,
    className = "",
  }: {
    label: string;
    value: React.ReactNode;
    className?: string;
  }) => (
    <div className={`flex flex-col ${className}`}>
      <span className="text-gray-500 text-sm font-medium">{label}</span>{" "}
      {/* Added font-medium */}
      <span className="text-gray-800 text-base mt-1">
        {value || "N/A"}
      </span>{" "}
      {/* Added mt-1 */}
    </div>
  );

  // Helper function to get category-specific fields
  const getCategorySpecificFields = () => {
    if (!itemData?.categoryId?.name) return null;

    const categoryName = itemData.categoryId.name;
    const fields = [];

    // Common fields for all categories
    if (itemData.size) {
      fields.push(<Field key="size" label="Size" value={itemData.size} />);
    }
    if (itemData.color) {
      fields.push(<Field key="color" label="Color" value={itemData.color} />);
    }
    if (itemData.genderType) {
      fields.push(
        <Field
          key="genderType"
          label="Gender Type"
          value={itemData.genderType}
        />
      );
    }
    if (itemData.ageGroup) {
      fields.push(
        <Field key="ageGroup" label="Age Group" value={itemData.ageGroup} />
      );
    }
    if (itemData.dimensions) {
      fields.push(
        <Field
          key="dimensions"
          label="Dimensions"
          value={itemData.dimensions}
        />
      );
    }
    if (itemData.warrantyPeriod) {
      fields.push(
        <Field
          key="warrantyPeriod"
          label="Warranty Period"
          value={itemData.warrantyPeriod}
        />
      );
    }
    if (itemData.powerSource) {
      fields.push(
        <Field
          key="powerSource"
          label="Power Source"
          value={itemData.powerSource}
        />
      );
    }
    if (itemData.usageType) {
      fields.push(
        <Field key="usageType" label="Usage Type" value={itemData.usageType} />
      );
    }
    if (itemData.usage) {
      fields.push(<Field key="usage" label="Usage" value={itemData.usage} />);
    }
    if (
      itemData.features &&
      Array.isArray(itemData.features) &&
      itemData.features.length > 0
    ) {
      fields.push(
        <div key="features" className="flex flex-col">
          <span className="text-gray-500 text-sm">Features</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {itemData.features.map((feature: string, index: number) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      );
    }

    return fields;
  };

  // Helper to format price from Decimal128
  const formatPrice = (price: any) => {
    if (!price) return "N/A";
    if (typeof price === "number") return `$${price.toFixed(2)}`;
    if (price.$numberDecimal)
      return `$${parseFloat(price.$numberDecimal).toFixed(2)}`;
    return "N/A";
  };

  console.log(itemData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm overflow-y-auto scrollbar-hide">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] my-8 p-6 space-y-6 overflow-y-auto scrollbar-hide">
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900">Item Details</h1>
          <Button onClick={onClose} variant="ghost" className="p-2">
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="mt-4 text-sm text-gray-600">Loading details...</p>
          </div>
        ) : error ? (
          <div className="text-center p-12">
            <p className="text-lg text-red-500">Error: {error}</p>
          </div>
        ) : (
          itemData && (
            <>
              {/* Basic Information Section */}
              <section>
                <h2 className="text-lg font-bold text-gray-700 mb-4">
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {" "}
                  {/* Changed gap from gap-y-6 to gap-4 */}
                  <Field label="Title" value={itemData.title} />
                  <Field
                    label="Category"
                    value={itemData.categoryId?.name || "N/A"}
                  />
                  <Field
                    label="Subcategory"
                    value={itemData.subcategoryId?.name || "N/A"}
                  />
                  <Field
                    label="ISBN/Identifier"
                    value={itemData.isbnOrIdentifier}
                  />
                  <Field
                    label="Publisher/Manufacturer"
                    value={itemData.publisherOrManufacturer}
                  />
                  <Field
                    label="Publication Year"
                    value={itemData.publicationYear}
                  />
                  <Field label="Description" value={itemData.description} />
                  <Field
                    label="Default Return Period"
                    value={
                      itemData.defaultReturnPeriod
                        ? `${itemData.defaultReturnPeriod} Days`
                        : "N/A"
                    }
                  />
                  <Field label="Status" value={itemData.status} />
                  <Field label="Price" value={formatPrice(itemData.price)} />
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-sm">Barcode</span>
                    <a
                      href="#"
                      onClick={(e) => handlePrintBarcode(e)}
                      className="text-blue-600 hover:underline text-base"
                    >
                      Print Barcode
                    </a>
                  </div>
                </div>
              </section>

              {/* Category Specific Fields Section */}
              {getCategorySpecificFields() &&
                getCategorySpecificFields()!.length > 0 && (
                  <section>
                    <h2 className="text-lg font-bold text-gray-700 mb-4">
                      Category Specific Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {" "}
                      {/* Changed to 3 columns and smaller gap */}
                      {getCategorySpecificFields()}
                    </div>
                  </section>
                )}

              {/* Availability Section */}
              <section>
                <h2 className="text-lg font-bold text-gray-700 mb-4">
                  Availability
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  {" "}
                  {/* Simplified to 3 columns with consistent gap */}
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-sm">
                      Total Quantity
                    </span>
                    <span className="text-gray-800 text-lg font-semibold">
                      {itemData.quantity}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-sm">
                      Available Copies
                    </span>
                    <span className="text-gray-800 text-lg font-semibold">
                      {itemData.availableCopies}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-sm">
                      Currently Issued
                    </span>
                    <span className="text-gray-800 text-lg font-semibold">
                      {itemData.quantity - itemData.availableCopies}
                    </span>
                  </div>
                </div>
              </section>

              {/* Additional Information Section */}
              <section>
                <h2 className="text-lg font-bold text-gray-700 mb-4">
                  Additional Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {itemData.authorOrCreator && (
                    <Field
                      label="Author/Creator"
                      value={itemData.authorOrCreator}
                    />
                  )}
                  {itemData.mediaUrl && (
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-sm">Media</span>
                      <a
                        href={itemData.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-base"
                      >
                        View Image
                      </a>
                    </div>
                  )}
                  {itemData.createdAt && (
                    <Field
                      label="Created At"
                      value={new Date(itemData.createdAt).toLocaleDateString()}
                    />
                  )}
                  {itemData.updatedAt && (
                    <Field
                      label="Last Updated"
                      value={new Date(itemData.updatedAt).toLocaleDateString()}
                    />
                  )}
                </div>
              </section>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default ItemDetailsModal;
