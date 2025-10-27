import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, RefreshCw, Save } from "lucide-react";
import axios from "axios";
import { access } from "fs";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface BorrowingLimits {
  maxConcurrentIssuedItems: number;
  maxConcurrentQueues: number;
  maxPeriodExtensions: number;
  extensionPeriodDays: number;
}

interface FineRate {
  overdueFineRatePerDay: number;
  lostItemBaseFine: number;
  damagedItemBaseFine: number;
  fineGracePeriodDays: number;
}
interface SystemRestrictionsData {
  libraryName: string;
  operationalHours: any;
  borrowingLimits: BorrowingLimits;
  fineRates: FineRate;
}

interface InputFieldProps {
  label: string;
  id: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  description?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  id,
  value,
  onChange,
  description,
}) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      type="number"
      value={value}
      onChange={onChange}
      className="max-w-sm"
    />
    {description && (
      <p className="text-sm text-muted-foreground">{description}</p>
    )}
  </div>
);

export default function SystemRestrictions() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SystemRestrictionsData | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("Access token not found.");
      }

      const response = await axios.get(
        "https://lms-backend1-q5ah.onrender.com/api/admin/settings/system-restrictions",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setFormData(response.data.data);
      toast.success("Succesfully fetched the data");
    } catch (error: any) {
      console.log("Error in fetching the notification settings");
      toast.error(error.message || "Failed to fetch settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (
    section: keyof SystemRestrictionsData,
    field: string,
    value: string
  ) => {
    const numericValue = value === "" ? 0 : parseInt(value, 10);
    if (isNaN(numericValue)) return;

    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: numericValue,
        },
      };
    });
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    const promise = axios.put(
      "https://lms-backend1-q5ah.onrender.com/api/admin/settings/system-restrictions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }
    );

    toast.promise(promise, {
      loading: "Saving changes...",
      success: "Settings updated successfully!",
      error: "Failed to update settings.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-muted mx-auto"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Loading Report Data
            </h3>
            <p className="text-muted-foreground">
              Fetching your latest records...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <Package className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Error Loading Report
                </h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button onClick={() => {}} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-6">
        {/* header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              System Restrictions
            </h1>
            <p className="text-muted-foreground">
              Configure limitations and constraints within the library system.
            </p>
          </div>
        </div>

        {/* Restrictions */}
        <form onSubmit={handleSaveChanges} className="space-y-8">
          {formData && (
            <>
              {/* Borrowing Limits Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Borrowing Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InputField
                    id="maxConcurrentIssuedItems"
                    label="Maximum Borrowing Limit Per User"
                    value={formData.borrowingLimits.maxConcurrentIssuedItems}
                    onChange={(e) =>
                      handleChange(
                        "borrowingLimits",
                        "maxConcurrentIssuedItems",
                        e.target.value
                      )
                    }
                  />
                  <InputField
                    id="maxConcurrentQueues"
                    label="Item Type Restrictions (Max Queues)"
                    value={formData.borrowingLimits.maxConcurrentQueues}
                    onChange={(e) =>
                      handleChange(
                        "borrowingLimits",
                        "maxConcurrentQueues",
                        e.target.value
                      )
                    }
                  />
                </CardContent>
              </Card>

              {/* Renewal Limits Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Renewal Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InputField
                    id="maxPeriodExtensions"
                    label="Renewal Limit"
                    value={formData.borrowingLimits.maxPeriodExtensions}
                    onChange={(e) =>
                      handleChange(
                        "borrowingLimits",
                        "maxPeriodExtensions",
                        e.target.value
                      )
                    }
                  />
                  <InputField
                    id="extensionPeriodDays"
                    label="Waiting Period Between Renewals (days)"
                    value={formData.borrowingLimits.extensionPeriodDays}
                    onChange={(e) =>
                      handleChange(
                        "borrowingLimits",
                        "extensionPeriodDays",
                        e.target.value
                      )
                    }
                  />
                </CardContent>
              </Card>

              {/* Fine rates */}
              <Card>
                <CardHeader>
                  <CardTitle>Fine Rates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InputField
                    id="overdueFineRatePerDay"
                    label="Late Return Fine Per Day"
                    value={formData.fineRates.overdueFineRatePerDay}
                    onChange={(e) =>
                      handleChange(
                        "fineRates",
                        "overdueFineRatePerDay",
                        e.target.value
                      )
                    }
                  />
                  <InputField
                    id="lostItemBaseFine"
                    label="Lost Item Base Fine"
                    value={formData.fineRates.lostItemBaseFine}
                    onChange={(e) =>
                      handleChange(
                        "fineRates",
                        "lostItemBaseFine",
                        e.target.value
                      )
                    }
                  />
                  <InputField
                    id="damagedItemBaseFine"
                    label="Damaged Item Base Fine"
                    value={formData.fineRates.damagedItemBaseFine}
                    onChange={(e) =>
                      handleChange(
                        "fineRates",
                        "damagedItemBaseFine",
                        e.target.value
                      )
                    }
                  />
                  <InputField
                    id="fineGracePeriodDays"
                    label="Item Extension Period"
                    value={formData.fineRates.fineGracePeriodDays}
                    onChange={(e) =>
                      handleChange(
                        "fineRates",
                        "fineGracePeriodDays",
                        e.target.value
                      )
                    }
                  />
                </CardContent>
              </Card>
            </>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={!formData}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
