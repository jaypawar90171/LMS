import React, { useState, FormEvent } from "react";
import axios from "axios";
import { toast } from "sonner";

interface Category {
  _id: any;
  name: string;
  description: string;
  parentCategoryId: any | null;
}

interface IssuedInfo {
  issuedDate: string;
  dueDate: string | null;
  issuedBy: any;
  userId: any;
  returnedTo: any | null;
  returnDate: string | null;
  status: "Issued" | "Returned";
  extensionCount: number;
  maxExtensionAllowed: number;
  fineId: any | null;
  isOverdue: boolean;
}

interface FoundItem {
  _id: string;
  title: string;
  categoryId: Category;
  barcode: string;
  quantity: number;
  availableCopies: number;
  description?: string;
  status?: "Available" | "Issued" | "Lost" | "Damaged";
}

interface ApiResponse {
  item: FoundItem;
  issuedInfo: IssuedInfo | null;
}

interface ApiError {
  error: string;
  message?: string;
}

interface ReturnItemRequest {
  condition: "Good" | "Lost" | "Damaged";
}

const BarcodeScannerPage: React.FC = () => {
  const [scannedCode, setScannedCode] = useState<string>("");
  const [foundItem, setFoundItem] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReturning, setIsReturning] = useState<boolean>(false);
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);

  const handleScanSubmit = async (
    e: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    if (!scannedCode.trim()) {
      setError("Please enter a barcode");
      return;
    }

    setIsLoading(true);
    setError("");
    setFoundItem(null);

    try {
      const accessToken = localStorage.getItem("accessToken");

      const response = await axios.get<ApiResponse>(
        `http://localhost:3000/api/admin/barcode/lookup/${scannedCode}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setFoundItem(response.data);
    } catch (err: unknown) {
      console.error("Error looking up barcode:", err);
      if (axios.isAxiosError(err) && err.response?.data) {
        const errorData = err.response.data as ApiError;
        setError(errorData.error || errorData.message || "Item not found");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
      setScannedCode("");
    }
  };

  const handleReturnItem = async (condition: "Good" | "Lost" | "Damaged") => {
    if (!foundItem?.issuedInfo) return;

    setIsReturning(true);
    try {
      const accessToken = localStorage.getItem("accessToken");

      await axios.post(
        `http://localhost:3000/api/admin/issued-items/mark-as-return/${foundItem.item._id}`,
        { condition },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const response = await axios.get<ApiResponse>(
        `http://localhost:3000/api/admin/barcode/lookup/${foundItem.item.barcode}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setFoundItem(response.data);
      setShowReturnModal(false);

      setError("");
      toast.success("Item marked as return successfully");
    } catch (err: unknown) {
      console.error("Error returning item:", err);
      if (axios.isAxiosError(err) && err.response?.data) {
        const errorData = err.response.data as ApiError;
        setError(errorData.message || "Failed to return item");
      } else {
        setError("An unexpected error occurred while returning the item");
      }
    } finally {
      setIsReturning(false);
    }
  };

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case "Available":
        return "#10b981";
      case "Issued":
        return "#f59e0b";
      case "Damaged":
        return "#f97316";
      case "Lost":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Item Lookup by Barcode
          </h2>
          <p className="text-gray-600">
            Scan or enter a barcode to find item details
          </p>
        </div>

        {/* Scanner Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleScanSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="barcode"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Barcode
              </label>
              <input
                id="barcode"
                type="text"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                placeholder="Click here and scan barcode, or type manually..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                autoFocus
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !scannedCode.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Searching...
                </div>
              ) : (
                "Lookup Item"
              )}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-400 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <h3 className="text-red-800 font-medium">Error</h3>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {foundItem && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-green-50 px-6 py-4 border-b border-green-200">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-green-800">
                  Item Found!
                </h3>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Item Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Item Details
                  </h4>

                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Title
                    </label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {foundItem.item.title}
                    </p>
                  </div>

                  {foundItem.item.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Description
                      </label>
                      <p className="mt-1 text-gray-700">
                        {foundItem.item.description}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Category
                    </label>
                    <p className="mt-1 text-gray-700">
                      {foundItem.item.categoryId.name}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Barcode
                    </label>
                    <p className="mt-1 font-mono text-gray-900 bg-gray-100 px-3 py-2 rounded">
                      {foundItem.item.barcode}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-blue-600">
                        Total Quantity
                      </label>
                      <p className="text-2xl font-bold text-blue-700">
                        {foundItem.item.quantity}
                      </p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-green-600">
                        Available Copies
                      </label>
                      <p className="text-2xl font-bold text-green-700">
                        {foundItem.item.availableCopies}
                      </p>
                    </div>
                  </div>

                  {foundItem.item.status && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Item Status
                      </label>
                      <div className="mt-1 flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{
                            backgroundColor: getStatusColor(
                              foundItem.item.status
                            ),
                          }}
                        ></div>
                        <span
                          className="font-medium"
                          style={{
                            color: getStatusColor(foundItem.item.status),
                          }}
                        >
                          {foundItem.item.status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Issued Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Issuance Details
                  </h4>

                  {foundItem.issuedInfo ? (
                    <>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                          <span className="font-semibold text-yellow-800">
                            Currently Issued
                          </span>
                        </div>
                        {foundItem.issuedInfo.isOverdue && (
                          <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                            <span className="text-red-700 font-medium text-sm">
                              ⚠ Overdue Item
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Issued Date
                          </label>
                          <p className="mt-1 text-gray-700">
                            {formatDate(foundItem.issuedInfo.issuedDate)}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Due Date
                          </label>
                          <p className="mt-1 text-gray-700">
                            {formatDate(foundItem.issuedInfo.dueDate)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Extensions Used
                        </label>
                        <p className="mt-1 text-gray-700">
                          {foundItem.issuedInfo.extensionCount} /{" "}
                          {foundItem.issuedInfo.maxExtensionAllowed}
                        </p>
                      </div>

                      {foundItem.issuedInfo.fineId && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <label className="text-sm font-medium text-red-600">
                            Fine Applied
                          </label>
                          <p className="text-red-700 text-sm mt-1">
                            This item has an associated fine
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span className="font-semibold text-green-800">
                          Not Currently Issued
                        </span>
                      </div>
                      <p className="text-green-700 text-sm">
                        This item is available for issuance
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-6 border-t border-gray-200 flex space-x-3">
                <button
                  onClick={() => setScannedCode(foundItem.item.barcode)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Rescan This Item
                </button>
                <button
                  onClick={() => {
                    setFoundItem(null);
                    setScannedCode("");
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Scan New Item
                </button>
                {foundItem.issuedInfo && (
                  <button
                    onClick={() => setShowReturnModal(true)}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Mark as Return
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Mark Item as Returned
              </h3>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Please select the condition of the returned item:
              </p>

              <div className="space-y-3">
                {(["Good", "Damaged", "Lost"] as const).map((condition) => (
                  <button
                    key={condition}
                    onClick={() => handleReturnItem(condition)}
                    disabled={isReturning}
                    className="w-full text-left p-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{condition}</span>
                      {condition === "Good" && (
                        <span className="text-green-600 text-sm">
                          ✓ Restocks item
                        </span>
                      )}
                      {condition === "Damaged" && (
                        <span className="text-orange-600 text-sm">
                          ⚠ No restock
                        </span>
                      )}
                      {condition === "Lost" && (
                        <span className="text-red-600 text-sm">
                          ✗ No restock
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowReturnModal(false)}
                disabled={isReturning}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeScannerPage;
