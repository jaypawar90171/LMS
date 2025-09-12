import React from "react";

interface NavbarProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isSidebarOpen, onSidebarToggle }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {/* Sidebar toggle button: Hamburger when closed, Close/X when open */}
            <button
              onClick={onSidebarToggle}
              className="p-2 mr-4 text-gray-500 hover:text-gray-900 focus:outline-none"
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {/* Show hamburger when sidebar closed, close/X when open */}
              {isSidebarOpen ? (
                // Close/X icon
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                // Hamburger icon
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              LMS
            </h1>
          </div>
          {/* ... rest of navbar ... */}
          <div className="flex items-center space-x-4">
            {/* (standard right-side buttons remain unchanged) */}
            {/* ... */}
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">
                Admin User
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
