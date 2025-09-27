// FineFormModal.tsx
"use client";

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import axios from "axios";
import { Fine, User, Item } from "@/interfaces/fines";

interface FineFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  mode: "add" | "edit";
  fineData: Fine | null;
  allUsers: User[];
  allItems: Item[];
  onSuccess: () => void;
}

export const FineReasons = ["Overdue", "Damaged"] as const;
export const FineStatuses = ["Outstanding", "Paid", "Waived"] as const;
export const PaymentMethods = ["Cash", "Card"] as const;

export type FineReason = (typeof FineReasons)[number];
export type FineStatus = (typeof FineStatuses)[number];
export type PaymentMethod = (typeof PaymentMethods)[number];

const fineFormSchema = z.object({
  userId: z.string().min(1, "A user must be selected."),
  itemId: z.string().min(1, "An item must be selected."),
  reason: z.enum(["Overdue", "Damaged"] as const),
  amountIncurred: z.number().min(0, "Incurred amount cannot be negative."),
  amountPaid: z.number().min(0, "Paid amount cannot be negative.").optional(),
  status: z.enum(FineStatuses),
  paymentMethod: z.enum(PaymentMethods).optional(),
  transactionId: z.string().optional(),
});

type FineFormData = z.infer<typeof fineFormSchema>;

export const FineFormModal = ({
  isOpen,
  onOpenChange,
  mode,
  fineData,
  allUsers,
  allItems,
  onSuccess,
}: FineFormModalProps) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FineFormData>({
    resolver: zodResolver(fineFormSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && fineData) {
        reset({
          userId: fineData.userId._id,
          itemId: fineData.itemId._id,
          reason: fineData.reason,
          amountIncurred: fineData.amountIncurred,
          amountPaid: fineData.amountPaid,
          status: fineData.status,
          paymentMethod:
            fineData.paymentDetails?.paymentMethod === "Cash" ||
            fineData.paymentDetails?.paymentMethod === "Card"
              ? fineData.paymentDetails.paymentMethod
              : undefined,
          transactionId: fineData.paymentDetails?.transactionId,
        });
      } else {
        reset({
          userId: "",
          itemId: "",
          reason: "Overdue",
          amountIncurred: 0,
          amountPaid: 0,
          status: "Outstanding",
          paymentMethod: undefined,
          transactionId: "",
        });
      }
    }
  }, [isOpen, mode, fineData, reset]);

  const onSubmit = async (data: FineFormData) => {
    const payload = {
      ...data,
      paymentDetails: {
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
      },
    };

    const apiEndpoint =
      mode === "add"
        ? `http://localhost:3000/api/admin/fines`
        : `http://localhost:3000/api/admin/fines/${fineData?._id}`;

    const apiMethod = mode === "add" ? axios.post : axios.put;

    toast.promise(
      apiMethod(apiEndpoint, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      {
        loading: `${mode === "add" ? "Creating" : "Updating"} fine...`,
        success: () => {
          onSuccess();
          onOpenChange(false);
          return `Fine ${mode === "add" ? "created" : "updated"} successfully!`;
        },
        error: (err) =>
          err.response?.data?.error ||
          `Failed to ${mode === "add" ? "create" : "update"} fine.`,
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New Fine" : "Edit Fine"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Fill in the details to create a new fine record."
              : `Editing fine record for Item ID: ${fineData?._id}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Fine Details</TabsTrigger>
              <TabsTrigger value="payment">Payment Info</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 py-4">
              <div>
                <Label>User</Label>
                <Controller
                  control={control}
                  name="userId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {allUsers.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.username} ({user._id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.userId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.userId.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Item</Label>
                <Controller
                  control={control}
                  name="itemId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item" />
                      </SelectTrigger>
                      <SelectContent>
                        {allItems.map((item) => (
                          <SelectItem key={item._id} value={item._id}>
                            {item.title} ({item._id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.itemId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.itemId.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Reason</Label>
                <Controller
                  control={control}
                  name="reason"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Overdue">Overdue</SelectItem>
                        <SelectItem value="Damaged">Damaged</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.reason && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.reason.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Status</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Outstanding">Outstanding</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.status.message}
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-4 py-4">
              <div>
                <Label htmlFor="amountIncurred">Amount Incurred (₹)</Label>
                <Input
                  id="amountIncurred"
                  type="number"
                  step="0.01"
                  {...register("amountIncurred")}
                />
                {errors.amountIncurred && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.amountIncurred.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="amountPaid">Amount Paid (₹)</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  step="0.01"
                  {...register("amountPaid", { valueAsNumber: true })}
                />
                {errors.amountPaid && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.amountPaid.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Payment Method</Label>
                <Controller
                  control={control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.paymentMethod && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.paymentMethod.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="transactionId">Transaction ID</Label>
                <Input id="transactionId" {...register("transactionId")} />
                {errors.transactionId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.transactionId.message}
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {mode === "add" ? "Create Fine" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
