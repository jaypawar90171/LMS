import React, { useState } from "react";
import { DialogModal } from "@/components/Dialog";
import { toast } from "sonner";
import axios from "axios";
import { IssuedItem } from "@/interfaces/issuedItem";

interface ExtendPeriodModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: IssuedItem;
  onSuccess: (updatedItem: IssuedItem) => void;
}

export const ExtendPeriodModal: React.FC<ExtendPeriodModalProps> = ({
  isOpen,
  onOpenChange,
  item,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString: string) => {
    if (dateString === "-") return "-";
    return new Date(dateString).toLocaleDateString();
  };

  const calculateNewDueDate = (extensionDays: number) => {
    const currentDueDate = new Date(item.dueDate);
    const newDueDate = new Date(currentDueDate);
    newDueDate.setDate(newDueDate.getDate() + extensionDays);
    return newDueDate.toISOString().split('T')[0];
  };

  const fields = [
    {
      type: "text" as const,
      name: "item",
      label: "Item",
    },
    {
      type: "text" as const,
      name: "borrower",
      label: "Borrower",
    },
    {
      type: "text" as const,
      name: "currentDueDate",
      label: "Current Due Date",
    },
    {
      type: "text" as const,
      name: "extensionsUsed",
      label: "Extensions Used",
    },
    {
      type: "select" as const,
      name: "extensionDays",
      label: "Extension Period",
      options: [
        { value: "7", label: "7 days" },
        { value: "14", label: "14 days" },
        { value: "21", label: "21 days" },
        { value: "30", label: "30 days" },
      ],
    },
    {
      type: "text" as const,
      name: "newDueDate",
      label: "New Due Date",
    },
  ];

  const defaultValues = {
    item: item.item.title,
    borrower: item.user.fullName,
    currentDueDate: formatDate(item.dueDate),
    extensionsUsed: `${item.extensionCount} / ${item.maxExtensionAllowed}`,
    extensionDays: "7",
    newDueDate: calculateNewDueDate(7),
  };

  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      
      const response = await axios.post(
        `https://lms-backend1-q5ah.onrender.com/api/admin/issued-items/${item.id}/extend`,
        {
          extensionDays: parseInt(formData.extensionDays),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onSuccess(response.data.updatedItem);
      toast.success("Due date extended successfully!");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to extend due date"
      );
    } finally {
      setLoading(false);
    }
  };

  // Update new due date when extension days change
  const handleFormDataChange = (formData: Record<string, any>, setFormData: any) => {
    if (formData.extensionDays) {
      const newDueDate = calculateNewDueDate(parseInt(formData.extensionDays));
      setFormData((prev: any) => ({ ...prev, newDueDate }));
    }
  };

  const enhancedFields = fields.map(field => 
    field.name === "extensionDays" 
      ? {
          ...field,
          renderAdornment: (formData: Record<string, any>, setFormData: any) => (
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-700"
              onClick={() => handleFormDataChange(formData, setFormData)}
            >
              Update
            </button>
          )
        }
      : field
  );

  return (
    <DialogModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Extend Due Date"
      description={`Extend the due date for "${item.item.title}" issued to ${item.user.fullName}`}
      fields={enhancedFields}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
    />
  );
};