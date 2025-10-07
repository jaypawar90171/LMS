import React from "react";
import { DialogModal } from "@/components/Dialog";
import { IssuedItem } from "@/interfaces/issuedItem";

interface IssuedItemDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: IssuedItem;
}

export const IssuedItemDetailsModal: React.FC<IssuedItemDetailsModalProps> = ({
  isOpen,
  onOpenChange,
  item,
}) => {
  const formatDate = (dateString: string) => {
    if (dateString === "-") return "-";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusDisplay = (item: IssuedItem) => {
    const isOverdue = item.status === "Issued" && new Date(item.dueDate) < new Date();
    return isOverdue ? "Overdue" : item.status;
  };

  const fields = [
    {
      type: "text" as const,
      name: "user",
      label: "Borrower",
    },
    {
      type: "text" as const,
      name: "item",
      label: "Item Title",
    },
    {
      type: "text" as const,
      name: "author",
      label: "Author/Creator",
    },
    {
      type: "text" as const,
      name: "issuedBy",
      label: "Issued By",
    },
    {
      type: "text" as const,
      name: "issuedDate",
      label: "Issued Date",
    },
    {
      type: "text" as const,
      name: "dueDate",
      label: "Due Date",
    },
    {
      type: "text" as const,
      name: "returnDate",
      label: "Return Date",
    },
    {
      type: "text" as const,
      name: "status",
      label: "Status",
    },
    {
      type: "text" as const,
      name: "extensions",
      label: "Extensions Used",
    },
  ];

  const defaultValues = {
    user: `${item.user.fullName}`,
    item: item.item.title,
    author: item.item.authorOrCreator,
    issuedBy: `${item.issuedBy.fullName} (${item.issuedBy.email})`,
    issuedDate: formatDate(item.issuedDate),
    dueDate: formatDate(item.dueDate),
    returnDate: formatDate(item.returnDate),
    status: getStatusDisplay(item),
    extensions: `${item.extensionCount} / ${item.maxExtensionAllowed}`,
  };

  const handleSubmit = (formData: Record<string, any>) => {
    console.log("View details form data:", formData);
    onOpenChange(false);
  };

  return (
    <DialogModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Issued Item Details"
      description="View detailed information about this issued item"
      fields={fields}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
    />
  );
};