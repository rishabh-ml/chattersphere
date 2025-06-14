"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  BarChart3,
  Flag,
  Settings as SettingsIcon,
  Shield,
  Layers,
  Search,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data for admin dashboard
const mockUsers = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    role: "User",
    status: "Active",
    joinDate: "2023-05-15",
  },
  {
    id: 2,
    name: "Alex Chen",
    email: "alex.c@example.com",
    role: "Moderator",
    status: "Active",
    joinDate: "2023-04-22",
  },
  {
    id: 3,
    name: "Maya Patel",
    email: "maya.p@example.com",
    role: "Admin",
    status: "Active",
    joinDate: "2023-03-10",
  },
  {
    id: 4,
    name: "James Wilson",
    email: "james.w@example.com",
    role: "User",
    status: "Inactive",
    joinDate: "2023-06-05",
  },
  {
    id: 5,
    name: "Emma Thompson",
    email: "emma.t@example.com",
    role: "User",
    status: "Active",
    joinDate: "2023-05-30",
  },
];

const mockReports = [
  {
    id: 1,
    type: "Post",
    reportedBy: "User123",
    reason: "Inappropriate content",
    status: "Pending",
    date: "2023-06-10",
  },
  {
    id: 2,
    type: "Comment",
    reportedBy: "User456",
    reason: "Harassment",
    status: "Resolved",
    date: "2023-06-08",
  },
  {
    id: 3,
    type: "User",
    reportedBy: "User789",
    reason: "Spam",
    status: "Pending",
    date: "2023-06-09",
  },
];

const mockStats = [
  {
    label: "Total Users",
    value: "5,234",
    icon: <Users className="h-5 w-5" />,
    color: "bg-blue-500",
  },
  {
    label: "Active Today",
    value: "1,432",
    icon: <BarChart3 className="h-5 w-5" />,
    color: "bg-green-500",
  },
  {
    label: "New Posts",
    value: "287",
    icon: <Layers className="h-5 w-5" />,
    color: "bg-purple-500",
  },
  {
    label: "Reports",
    value: "12",
    icon: <Flag className="h-5 w-5" />,
    color: "bg-red-500",
  },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "reports" | "settings">(
    "overview"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <motion.h1
          className="text-2xl font-semibold text-gray-800"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Admin Dashboard
        </motion.h1>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="text-sm">
            <Shield className="mr-2 h-4 w-4" />
            Moderation Tools
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
            <SettingsIcon className="h-4 w-4" />
            <span className="sr-only">Admin Settings</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "overview" | "users" | "reports" | "settings")
        }
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 md:w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Overview Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -2, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`h-10 w-10 rounded-full ${stat.color} flex items-center justify-center text-white`}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-semibold text-gray-800">{stat.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-800">Recent Activity</h2>
              <Button variant="ghost" size="sm" className="text-xs text-[#00AEEF]">
                View All
              </Button>
            </div>

            <div className="space-y-3">
              {[
                { action: "New user registered", time: "5 minutes ago" },
                { action: "Post reported for inappropriate content", time: "1 hour ago" },
                { action: "Comment removed by moderator", time: "3 hours ago" },
                { action: "User account suspended", time: "Yesterday" },
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <p className="text-sm text-gray-800">{activity.action}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab Content */}
      {activeTab === "users" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-lg font-medium text-gray-800">User Management</h2>

              <div className="flex items-center gap-3">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    className="pl-10 bg-gray-50 border-gray-200"
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="outline" size="sm" className="text-gray-600">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Filter By</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>All Users</DropdownMenuItem>
                    <DropdownMenuItem>Admins</DropdownMenuItem>
                    <DropdownMenuItem>Moderators</DropdownMenuItem>
                    <DropdownMenuItem>Active Users</DropdownMenuItem>
                    <DropdownMenuItem>Inactive Users</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      Name
                      <button
                        onClick={toggleSortDirection}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Join Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mockUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: user.id * 0.05 }}
                  >
                    <td className="px-4 py-3 text-sm text-gray-800">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "Admin"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "Moderator"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.joinDate}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <Button variant="ghost" size="sm" className="text-[#00AEEF]">
                        Edit
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-600">Showing 5 of 5,234 users</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab Content */}
      {activeTab === "reports" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-lg font-medium text-gray-800">Content Reports</h2>
              ```tsx
              {/* Filter Button */}
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="outline" size="sm" className="text-gray-600">
                      <Filter className="h-4 w-4 mr-2" />
                      Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Filter By Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>All Reports</DropdownMenuItem>
                    <DropdownMenuItem>Pending</DropdownMenuItem>
                    <DropdownMenuItem>Resolved</DropdownMenuItem>
                    <DropdownMenuItem>Dismissed</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reported By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mockReports.map((report) => (
                  <motion.tr
                    key={report.id}
                    className="hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: report.id * 0.1 }}
                  >
                    <td className="px-4 py-3 text-sm text-gray-800">{report.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{report.reportedBy}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{report.reason}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{report.date}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <Button variant="ghost" size="sm" className="text-[#00AEEF]">
                        Review
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings Tab Content */}
      {activeTab === "settings" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Admin Settings</h2>

          <div className="space-y-6">
            {/* Site Configuration */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Site Configuration</h3>
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-sm text-gray-600 mb-4">
                  Configure global site settings and features
                </p>
                <Button variant="outline" size="sm">
                  Edit Configuration
                </Button>
              </div>
            </div>

            {/* User Permissions */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">User Permissions</h3>
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-sm text-gray-600 mb-4">
                  Manage role-based permissions and access controls
                </p>
                <Button variant="outline" size="sm">
                  Manage Permissions
                </Button>
              </div>
            </div>

            {/* Content Moderation */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Content Moderation</h3>
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-sm text-gray-600 mb-4">
                  Configure automated content filters and moderation rules
                </p>
                <Button variant="outline" size="sm">
                  Edit Moderation Rules
                </Button>
              </div>
            </div>

            {/* API Access */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">API Access</h3>
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-sm text-gray-600 mb-4">
                  Manage API keys and external integrations
                </p>
                <Button variant="outline" size="sm">
                  Manage API Keys
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
