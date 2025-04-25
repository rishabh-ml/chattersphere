"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Heart, MessageSquare, UserPlus, Star, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock notification data
const mockNotifications = [
  {
    id: 1,
    type: "like",
    user: "Sarah Johnson",
    content: "liked your post about React hooks",
    time: "2 minutes ago",
    read: false
  },
  {
    id: 2,
    type: "comment",
    user: "Alex Chen",
    content: "commented on your post: \"This is really helpful, thanks for sharing!\"",
    time: "1 hour ago",
    read: false
  },
  {
    id: 3,
    type: "follow",
    user: "Maya Patel",
    content: "started following you",
    time: "3 hours ago",
    read: true
  },
  {
    id: 4,
    type: "mention",
    user: "James Wilson",
    content: "mentioned you in a comment: \"@user I think you'd find this interesting\"",
    time: "Yesterday",
    read: true
  },
  {
    id: 5,
    type: "like",
    user: "Emma Thompson",
    content: "liked your comment on \"Getting Started with TypeScript\"",
    time: "2 days ago",
    read: true
  }
]

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [notifications, setNotifications] = useState(mockNotifications)
  
  const filteredNotifications = activeTab === "all" 
    ? notifications 
    : activeTab === "unread"
      ? notifications.filter(n => !n.read)
      : notifications.filter(n => n.type === activeTab)
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }
  
  const getIconForType = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-pink-500" />
      case "comment":
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case "follow":
        return <UserPlus className="h-4 w-4 text-green-500" />
      case "mention":
        return <Star className="h-4 w-4 text-amber-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <motion.h1 
          className="text-2xl font-semibold text-gray-800"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Notifications
        </motion.h1>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={markAllAsRead}
            className="text-sm"
          >
            Mark all as read
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 text-gray-500"
          >
            <Settings className="h-4 w-4" />
            <span className="sr-only">Notification Settings</span>
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 md:w-fit">
          <TabsTrigger value="all" aria-selected={activeTab === "all"}>All</TabsTrigger>
          <TabsTrigger value="unread" aria-selected={activeTab === "unread"}>Unread</TabsTrigger>
          <TabsTrigger value="like" aria-selected={activeTab === "like"}>Likes</TabsTrigger>
          <TabsTrigger value="comment" aria-selected={activeTab === "comment"}>Comments</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <AnimatePresence>
          {filteredNotifications.length > 0 ? (
            <motion.div 
              className="divide-y divide-gray-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {filteredNotifications.map((notification, index) => (
                <motion.div 
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/30' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        {getIconForType(notification.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">
                        <span className="font-medium">{notification.user}</span> {notification.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                    
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-[#00AEEF]"></div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="p-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-800 mb-1">No notifications</h3>
              <p className="text-sm text-gray-500">You&#39;re all caught up!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
