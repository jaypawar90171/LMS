import React, { useState, FormEvent } from "react";
import axios from "axios";

interface Category {
  _id: any;
  name: string;
  description: string;
  parentCategoryId: any | null;
}
interface FoundItem {
  id: string;
  title: string;
  categoryId: Category;
  barcode: string;
  quantity: number;
  availableCopies: number;
  description?: string;
  location?: string;
  status?: "Available" | "Issued" | "Lost" | "Damaged";
}

interface ApiError {
  error: string;
  message?: string;
}

const BarcodeScannerPage: React.FC = () => {
  const [scannedCode, setScannedCode] = useState<string>("");
  const [foundItem, setFoundItem] = useState<FoundItem | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

      const response = await axios.get<FoundItem>(
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

  const getStatusText = (status?: string): string => {
    switch (status) {
      case "Available":
        return "Available";
      case "checked-out":
        return "Checked Out";
      case "maintenance":
        return "Under Maintenance";
      default:
        return "Unknown Status";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Title
                    </label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {foundItem.title}
                    </p>
                  </div>

                  {foundItem.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Description
                      </label>
                      <p className="mt-1 text-gray-700">
                        {foundItem.description}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Category
                    </label>
                    <p className="mt-1 text-gray-700">
                      {foundItem.categoryId.name}
                    </p>
                  </div>

                  {foundItem.location && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Location
                      </label>
                      <p className="mt-1 text-gray-700">{foundItem.location}</p>
                    </div>
                  )}
                </div>

                {/* Status and Quantities */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Barcode
                    </label>
                    <p className="mt-1 font-mono text-gray-900 bg-gray-100 px-3 py-2 rounded">
                      {foundItem.barcode}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-blue-600">
                        Total Quantity
                      </label>
                      <p className="text-2xl font-bold text-blue-700">
                        {foundItem.quantity}
                      </p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-green-600">
                        Available Copies
                      </label>
                      <p className="text-2xl font-bold text-green-700">
                        {foundItem.availableCopies}
                      </p>
                    </div>
                  </div>

                  {foundItem.status && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Status
                      </label>
                      <div className="mt-1 flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{
                            backgroundColor: getStatusColor(foundItem.status),
                          }}
                        ></div>
                        <span
                          className="font-medium"
                          style={{ color: getStatusColor(foundItem.status) }}
                        >
                          {getStatusText(foundItem.status)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-6 border-t border-gray-200 flex space-x-3">
                <button
                  onClick={() => setScannedCode(foundItem.barcode)}
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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeScannerPage;
