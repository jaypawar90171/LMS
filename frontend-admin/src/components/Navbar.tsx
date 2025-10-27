"use client";

import { userAtom } from "@/state/userAtom";
import { useAtom } from "jotai";
import React, { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { unreadNotificationsCountAtom } from "@/state/notificationAtom";

interface NavbarProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isSidebarOpen, onSidebarToggle }) => {
  const [user] = useAtom(userAtom);
  const [unreadCount, setUnreadCount] = useAtom(unreadNotificationsCountAtom);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken || !user) return;

      const response = await axios.get(
        "https://lms-backend1-q5ah.onrender.com/api/admin/notifications",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            read: false,
          },
        }
      );

      if (response.data.success) {
        const allNotifications = response.data.data;
        // Filter notifications for current user and unread status
        const userUnreadNotifications = allNotifications.filter(
          (notification: any) =>
            !notification.read && notification.recipientId?._id === user._id
        );

        setUnreadCount(userUnreadNotifications.length);
      }
    } catch (error: any) {
      console.error("Error fetching notifications count:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();

      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("accessToken");
      navigate("/login");
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side: Sidebar toggle and Title */}
          <div className="flex items-center">
            <button
              onClick={onSidebarToggle}
              className="p-2 mr-4 text-gray-500 hover:text-gray-900 focus:outline-none"
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isSidebarOpen ? (
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
            <h1 className="text-xl font-bold text-slate-800 tracking-tight hidden sm:block">
              Library Management System
            </h1>
          </div>

          {/* Right side: Notifications and User profile */}
          <div className="flex items-center space-x-4">
            {/* Notifications Icon */}
            <button
              className="relative p-2 text-gray-500 hover:text-gray-900 focus:outline-none transition-colors duration-200 rounded-full hover:bg-gray-100"
              onClick={() => navigate("/notifications")}
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white border-2 border-white rounded-full"
                  variant="destructive"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </button>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full p-1">
                  <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {user?.username?.charAt(0).toUpperCase() ||
                      user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <span className="text-sm font-medium text-gray-700 block">
                      {user?.fullName}
                    </span>
                    <span className="text-xs text-gray-500">{user?.email}</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    navigate("/settings/profile");
                  }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                {/* Removed "View Notifications" from here since it's now in navbar */}
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
