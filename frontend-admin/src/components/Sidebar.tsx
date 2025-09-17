// src/components/Sidebar.tsx
import React from "react";
import { NavLink } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
}

const navItems = [
  {
    name: "Dashboard",
    path: "/",
    icon: (
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
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-10l2 2m0 0l-7 7-7-7M19 10v10a1 1 0 01-1 1h-3"
        />
      </svg>
    ),
  },
  {
    name: "User Management",
    path: "/users",
    icon: (
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
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
  {
    name: "Inventory Management",
    path: "/inventory",
    icon: (
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
          d="M8 7h12m0 0l-3-3m3 3l-3 3m-3 1v5a2 2 0 002 2h4a2 2 0 002-2v-5m-9 0a2 2 0 00-2 2v5a2 2 0 002 2h4a2 2 0 002-2v-5M8 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-4"
        />
      </svg>
    ),
  },
  {
    name: "Borrowing/Returns",
    path: "/borrow",
    icon: (
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
          d="M8 4H4a2 2 0 00-2 2v14a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-4m-6 2l-3 3m0 0l3 3m-3-3h12"
        />
      </svg>
    ),
  },
  {
    name: "Fines & Payments",
    path: "/fines",
    icon: (
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
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
        />
      </svg>
    ),
  },
  {
    name: "Reports & Analytics",
    path: "/reports",
    icon: (
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
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    name: "System Settings",
    path: "/settings",
    icon: (
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
          d="M10.325 4.317c.426-.175.895-.251 1.4-.251h.147c.505 0 .973.076 1.4.251m-2.8 0a2 2 0 112.8 0M7 8h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2v-10a2 2 0 012-2zm2 4a2 2 0 100 4 2 2 0 000-4z"
        />
      </svg>
    ),
  },
  {
    name: "Roles & Permissions",
    path: "/roles",
    icon: (
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
          d="M12 11c0-1.104-.896-2-2-2s-2 .896-2 2m0 0c0 1.104.896 2 2 2s2-.896 2-2zM12 11V3m0 0l2 2m-2-2l-2 2m-6 6h12a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v5a2 2 0 002 2h6"
        />
      </svg>
    ),
  },
  // {
  //   name: "Help/Documentation",
  //   path: "/help",
  //   icon: (
  //     <svg
  //       className="h-6 w-6"
  //       fill="none"
  //       stroke="currentColor"
  //       viewBox="0 0 24 24"
  //     >
  //       <path
  //         strokeLinecap="round"
  //         strokeLinejoin="round"
  //         strokeWidth={2}
  //         d="M8 11V8a4 4 0 018 0v3a4 4 0 01-8 0zm0 0v-3m0 3a4 4 0 004 4h4a4 4 0 004-4v-3m0 0a4 4 0 00-4-4h-4a4 4 0 00-4 4zm0 0a4 4 0 00-4-4h-4a4 4 0 00-4 4"
  //       />
  //     </svg>
  //   ),
  // },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  return (
    // Sidebar appears and transitions between open/closed
    <aside
      className={`fixed top-0 left-0 h-screen w-64 bg-white z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } flex flex-col justify-between p-6 border-r border-gray-200`}
    >
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-8">
          Library Management System
        </h2>
        <nav>
          <ul className="space-y-2">
            {navItems.map((item, index) => (
              <li key={index}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                      isActive
                        ? "bg-blue-100 text-blue-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-100"
                    }`
                  }
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mt-auto pt-6 border-t border-gray-200">
        <button className="flex items-center w-full px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200">
          <svg
            className="h-6 w-6 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
