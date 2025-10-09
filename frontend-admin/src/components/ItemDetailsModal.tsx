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
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-gray-800 text-base">{value || "N/A"}</span>
    </div>
  );

  console.log(itemData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8 p-6 space-y-8">
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
              <section>
                <h2 className="text-lg font-bold text-gray-700 mb-4">
                  Item Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  <Field label="Title" value={itemData.title} />
                  <Field
                    label="Category"
                    value={itemData.categoryId?.name || "N/A"}
                  />
                  <Field
                    label="Subcategory"
                    value={itemData.subcategoryId?.name || "N/A"}
                  />
                  <Field label="ISBN" value={itemData.isbnOrIdentifier} />
                  <Field
                    label="Publisher"
                    value={itemData.publisherOrManufacturer}
                  />
                  <Field
                    label="Publication Year"
                    value={itemData.publicationYear}
                  />
                  <Field label="Description" value={itemData.description} />
                  <Field
                    label="Duration"
                    value={
                      itemData.defaultReturnPeriod
                        ? `${itemData.defaultReturnPeriod} Days`
                        : "N/A"
                    }
                  />
                  <Field label="Status" value={itemData.status} />
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
              <section>
                <h2 className="text-lg font-bold text-gray-700 mb-4">
                  Availability
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-sm">Total Copies</span>
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
