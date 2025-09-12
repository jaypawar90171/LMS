"use client";

import React from "react";
import { X, Edit, Trash2, Printer } from "lucide-react";
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
}

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  isOpen,
  onClose,
  itemData,
}) => {
  if (!isOpen || !itemData) return null;

  const {
    _id,
    title,
    authorOrCreator,
    categoryId,
    isbnOrIdentifier,
    publisherOrManufacturer,
    publicationYear,
    description,
    defaultReturnPeriod,
    status,
    quantity,
    availableCopies,
    barcode,
  } = itemData || {};

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

  const handlePrintBarcode = async (e: any) => {
    e.preventDefault();
    console.log(_id);
    if (!_id) {
      console.error("Invalid item id");
      return;
    }
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        return;
      }
      const response = await axios.get(
        `http://localhost:3000/api/admin/barcode/download/${_id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          responseType: "blob", // get response as a Blob (PDF file)
        }
      );

      // Create a link to download the file
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log("Barcode PDF downloaded");
    } catch (error: any) {
      console.error("Error downloading the barcode:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8 p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900">Item Details</h1>
          <Button onClick={onClose} variant="ghost" className="p-2">
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        {/* Item Information */}
        <section>
          <h2 className="text-lg font-bold text-gray-700 mb-4">
            Item Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <Field label="Title" value={title} />
            {/* Added a safeguard for categoryId */}
            <Field label="Category" value={categoryId} />
            <Field label="ISBN" value={isbnOrIdentifier} />
            <Field label="Publisher" value={publisherOrManufacturer} />
            <Field label="Publication Year" value={publicationYear} />
            <Field label="Description" value={description} />
            <Field
              label="Duration"
              value={
                defaultReturnPeriod ? `${defaultReturnPeriod} Days` : "N/A"
              }
            />
            <Field label="Status" value={status} />
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

        {/* Availability */}
        <section>
          <h2 className="text-lg font-bold text-gray-700 mb-4">Availability</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="flex flex-col">
              <span className="text-gray-500 text-sm">Total Copies</span>
              <span className="text-gray-800 text-lg font-semibold">
                {quantity}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-sm">Available Copies</span>
              <span className="text-gray-800 text-lg font-semibold">
                {availableCopies}
              </span>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="pt-4 border-t border-gray-200">
          <h2 className="text-lg font-bold text-gray-700 mb-4">Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Button className="flex-1" variant="secondary">
              <Edit className="h-4 w-4 mr-2" />
              Edit Item
            </Button>
            <Button className="flex-1" variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Item
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ItemDetailsModal;
