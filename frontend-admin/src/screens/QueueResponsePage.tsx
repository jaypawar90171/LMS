// for user site
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftToLine, CheckCircle, XCircle } from "lucide-react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const QueueResponsePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [itemDetails, setItemDetails] = useState<any>(null);

  const itemId = searchParams.get('itemId');
  const accept = searchParams.get('accept') === 'true';

  useEffect(() => {
    if (itemId) {
      fetchItemDetails();
    }
  }, [itemId]);

  const fetchItemDetails = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        `http://localhost:3000/api/inventory/items/${itemId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setItemDetails(response.data.data);
    } catch (error) {
      console.error("Error fetching item details:", error);
    }
  };

  const handleResponse = async () => {
    if (!itemId) {
      toast.error("Item ID not found.");
      return;
    }

    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast.error("No access token found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `http://localhost:3000/api/queue/${itemId}/respond`,
        { accept },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      toast.success(response.data.message);
      navigate('/inventory');
    } catch (error: any) {
      console.error("Error responding to queue:", error);
      toast.error(error.response?.data?.message || "Failed to process response.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/inventory')}
            >
              <ArrowLeftToLine className="h-4 w-4" />
            </Button>
            <CardTitle className="text-xl">
              {accept ? 'Confirm Borrow' : 'Skip Item'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {itemDetails && (
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{itemDetails.title}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {accept 
                  ? 'Are you sure you want to borrow this item?'
                  : 'Are you sure you want to skip this item?'
                }
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant={accept ? "default" : "outline"}
              onClick={handleResponse}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                'Processing...'
              ) : (
                <>
                  {accept ? <CheckCircle className="h-4 w-4 mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                  {accept ? 'Yes, Borrow' : 'Yes, Skip'}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/inventory')}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>

          {accept && (
            <div className="text-xs text-gray-500 text-center">
              By confirming, you agree to return the item by the due date.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QueueResponsePage;