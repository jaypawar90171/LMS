// File: src/components/Dialog.tsx

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// We'll define all possible field types in one union type
type Field =
  | { type: "text"; name: string; label: string }
  | { type: "textarea"; name: string; label: string }
  | {
      type: "select";
      name: string;
      label: string;
      options: { value: string; label: string }[];
    }
  | { type: "file"; name: string; label: string };

interface DialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  fields: Field[];
  defaultValues?: Record<string, any>;
  onSubmit: (formData: Record<string, any>) => void;
}

export const DialogModal: React.FC<DialogProps> = ({
  isOpen,
  onOpenChange,
  title,
  description,
  fields,
  defaultValues = {},
  onSubmit,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(defaultValues);

  useEffect(() => {
    setFormData(defaultValues);
  }, [defaultValues]);

  const handleChange = (name: string, value: string | File) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    handleChange(e.target.name, e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleChange(e.target.name, e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* Added overflow-y-auto to allow scrolling */}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {fields.map((field) => (
            <div key={field.name} className="grid gap-3">
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.type === "text" && (
                <Input
                  id={field.name}
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleTextChange}
                />
              )}
              {field.type === "textarea" && (
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleTextChange}
                />
              )}
              {field.type === "file" && (
                <Input
                  id={field.name}
                  name={field.name}
                  type="file"
                  onChange={handleFileChange}
                />
              )}
              {field.type === "select" && (
                <Select
                  value={formData[field.name] || ""}
                  onValueChange={(value) => handleChange(field.name, value)}
                  name={field.name}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
