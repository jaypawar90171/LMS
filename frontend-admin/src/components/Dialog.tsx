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
import { Checkbox } from "@/components/ui/checkbox";

// Helper type to allow passing the setFormData function
type SetFormData = React.Dispatch<React.SetStateAction<Record<string, any>>>;

// Defines all possible field types, including the `renderAdornment` for text inputs
type Field =
  | {
      type: "text";
      name: string;
      label: string;
      renderAdornment?: (
        formData: Record<string, any>,
        setFormData: SetFormData
      ) => React.ReactNode;
    }
  | { type: "textarea"; name: string; label: string }
  | {
      type: "select";
      name: string;
      label: string;
      options: { value: string; label: string }[];
    }
  | { type: "file"; name: string; label: string }
  | { type: "checkbox"; name: string; label: string };

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

  // FIX: Added 'isOpen' to dependency array to ensure form resets on open
  useEffect(() => {
    if (isOpen) {
      setFormData(defaultValues);
    }
  }, [defaultValues, isOpen]);

  const handleChange = (name: string, value: string | File | boolean) => {
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
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {fields.map((field) => (
            <div key={field.name}>
              {/* FIX: Conditionally render the top label to avoid one on checkboxes */}
              {field.type !== "checkbox" && (
                <Label htmlFor={field.name} className="mb-2 block">
                  {field.label}
                </Label>
              )}
              <div className="flex items-center gap-2">
                <div className="flex-grow">
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
                  {field.type === "checkbox" && (
                    <div className="flex items-center space-x-2 h-10">
                      <Checkbox
                        id={field.name}
                        name={field.name}
                        checked={!!formData[field.name]}
                        onCheckedChange={(checked) =>
                          handleChange(field.name, !!checked)
                        }
                      />
                      <Label
                        htmlFor={field.name}
                        className="font-normal leading-none"
                      >
                        {field.label}
                      </Label>
                    </div>
                  )}
                </div>
                {/* ADDED: Feature to render a button next to an input */}
                {field.type === "text" && field.renderAdornment && (
                  <div className="flex-shrink-0">
                    {field.renderAdornment(formData, setFormData)}
                  </div>
                )}
              </div>
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
