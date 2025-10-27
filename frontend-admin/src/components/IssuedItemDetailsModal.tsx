"use client";

import React from "react";
import { X, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IssuedItem } from "@/interfaces/issuedItem";
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

interface IssuedItemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void; // Changed from onOpenChange to onClose
  item: IssuedItem;
  loading?: boolean;
  error?: string | null;
}

export const IssuedItemDetailsModal: React.FC<IssuedItemDetailsModalProps> = ({
  isOpen,
  onClose, // Changed prop name
  item,
  loading = false,
  error = null,
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    if (dateString === "-" || !dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusDisplay = (item: IssuedItem) => {
    const isOverdue =
      item.status === "Issued" && new Date(item.dueDate) < new Date();
    return isOverdue ? "Overdue" : item.status;
  };

  const handlePrintBarcode = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!item?.item?.id) {
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
        `https://lms-backend1-q5ah.onrender.com/api/admin/barcode/download-batch/${item.item.id}`,
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
      link.setAttribute("download", `${item.item.title}.pdf`);
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
      <span className="text-gray-500 text-sm font-medium">{label}</span>
      <span className="text-gray-800 text-base mt-1">{value || "N/A"}</span>
    </div>
  );

  const getStatusBadgeClass = (item: IssuedItem) => {
    const isOverdue =
      item.status === "Issued" && new Date(item.dueDate) < new Date();

    if (isOverdue) {
      return "bg-red-100 text-red-800 border-red-200";
    }

    switch (item.status) {
      case "Issued":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Returned":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm overflow-y-auto scrollbar-hide">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] my-8 p-6 space-y-6 overflow-y-auto scrollbar-hide">
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900">
            Issued Item Details
          </h1>
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
          item && (
            <>
              {/* Borrower Information Section */}
              <section>
                <h2 className="text-lg font-bold text-gray-700 mb-4">
                  Borrower Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Full Name"
                    value={item.user?.fullName || "N/A"}
                  />
                  <Field label="Email" value={item.user?.email || "N/A"} />
                  <Field
                    label="Roles"
                    value={item.user?.roles?.join(", ") || "N/A"}
                  />
                </div>
              </section>

              {/* Item Information Section */}
              <section>
                <h2 className="text-lg font-bold text-gray-700 mb-4">
                  Item Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Title" value={item.item?.title} />
                  <Field
                    label="Author/Creator"
                    value={item.item?.authorOrCreator}
                  />
                  <Field label="Description" value={item.item?.description} />
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-sm">Barcode</span>
                    <a
                      href="#"
                      onClick={handlePrintBarcode}
                      className="text-blue-600 hover:underline text-base"
                    >
                      Print Barcode
                    </a>
                  </div>
                </div>
              </section>

              {/* Issue Details Section */}
              <section>
                <h2 className="text-lg font-bold text-gray-700 mb-4">
                  Issue Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field
                    label="Issued By"
                    value={`${item.issuedBy?.fullName} (${item.issuedBy?.email})`}
                  />
                  <Field
                    label="Issued Date"
                    value={formatDate(item.issuedDate)}
                  />
                  <Field label="Due Date" value={formatDate(item.dueDate)} />
                  <Field
                    label="Return Date"
                    value={formatDate(item.returnDate)}
                  />
                  <Field
                    label="Returned To"
                    value={
                      item.returnedTo
                        ? `${item.returnedTo.fullName} (${item.returnedTo.email})`
                        : "-"
                    }
                  />
                </div>
              </section>

              {/* Status and Extensions Section */}
              <section>
                <h2 className="text-lg font-bold text-gray-700 mb-4">
                  Status & Extensions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-sm font-medium">
                      Status
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border mt-1 w-fit ${getStatusBadgeClass(
                        item
                      )}`}
                    >
                      {getStatusDisplay(item)}
                    </span>
                  </div>
                  <Field
                    label="Extensions Used"
                    value={`${item.extensionCount} / ${item.maxExtensionAllowed}`}
                  />
                  <Field
                    label="Remaining Extensions"
                    value={item.maxExtensionAllowed - item.extensionCount}
                  />
                </div>
              </section>

              {/* Fine Information Section */}
              {item.fine && (
                <section>
                  <h2 className="text-lg font-bold text-gray-700 mb-4">
                    Fine Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Field label="Reason" value={item.fine.reason} />
                    <Field
                      label="Amount Incurred"
                      value={`$${
                        item.fine.amountIncurred?.toFixed(2) || "0.00"
                      }`}
                    />
                    <Field
                      label="Amount Paid"
                      value={`$${item.fine.amountPaid?.toFixed(2) || "0.00"}`}
                    />
                    <Field
                      label="Outstanding Amount"
                      value={`$${
                        item.fine.outstandingAmount?.toFixed(2) || "0.00"
                      }`}
                    />
                  </div>
                </section>
              )}

              {/* System Information Section */}
              <section>
                <h2 className="text-lg font-bold text-gray-700 mb-4">
                  System Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Created At"
                    value={formatDate(item.createdAt)}
                  />
                  <Field
                    label="Last Updated"
                    value={formatDate(item.updatedAt)}
                  />
                </div>
              </section>
            </>
          )
        )}
      </div>
    </div>
  );
};
