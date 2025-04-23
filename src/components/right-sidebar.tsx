import { MessageSquare, X, Users, TrendingUp, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export function RightSidebar() {
    return (
        <aside className="hidden lg:block w-80 border-l border-gray-100 bg-white overflow-y-auto p-4 sticky top-16 h-[calc(100vh-4rem)]">
            {/* Trending Topics */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-800">Trending Topics</h3>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-[#00AEEF]">
                        View All
                    </Button>
                </div>

                <div className="space-y-3">
                    {[
                        { topic: "Web Development", posts: 128 },
                        { topic: "AI News", posts: 96 },
                        { topic: "Remote Work", posts: 84 }
                    ].map((item, index) => (
                        <motion.div
                            key={item.topic}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 text-[#00AEEF]">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-800">{item.topic}</p>
                                <p className="text-xs text-gray-500">{item.posts} posts</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Upcoming Events */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-800">Upcoming Events</h3>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-[#00AEEF]">
                        View All
                    </Button>
                </div>

                <motion.div
                    className="bg-gradient-to-r from-[#00AEEF]/10 to-[#EC4899]/10 border border-[#00AEEF]/20 rounded-lg p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-white text-[#00AEEF] shadow-sm">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-800">Community Meetup</p>
                            <p className="text-xs text-gray-500">Tomorrow, 7:00 PM</p>
                        </div>
                    </div>
                    <Button size="sm" className="bg-[#00AEEF] hover:bg-[#0099d6] text-white w-full">
                        RSVP Now
                    </Button>
                </motion.div>
            </div>
            {/* DMs Section */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-800">Direct Messages</h3>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-[#00AEEF]">
                        View All
                    </Button>
                </div>

                <motion.div
                    className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center"
                    whileHover={{ y: -2, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
                    transition={{ duration: 0.2 }}
                >
                    <MessageSquare className="h-8 w-8 text-[#00AEEF] mx-auto mb-2" />
                    <h4 className="text-sm font-medium text-gray-800 mb-1">Direct Messages</h4>
                    <p className="text-xs text-gray-600 mb-3">Chat with other members of your communities</p>
                    <Button size="sm" className="bg-[#00AEEF] hover:bg-[#0099d6] text-white w-full">
                        Coming Soon
                    </Button>
                </motion.div>
            </div>

            {/* Ads Section */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-800">Sponsored</h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-600">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Dismiss</span>
                    </Button>
                </div>

                <motion.div
                    className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-center overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="bg-gradient-to-r from-blue-100 to-purple-100 h-24 rounded-md mb-3 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">Ad Placeholder</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">Sponsored content will appear here</p>
                    <Button variant="outline" size="sm" className="text-xs w-full border-gray-200 hover:bg-gray-100 hover:text-gray-800 transition-colors">
                        Learn More
                    </Button>
                </motion.div>
            </div>

            {/* Communities to Join */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-800">Suggested Communities</h3>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-[#00AEEF]">
                        See More
                    </Button>
                </div>

                <div className="space-y-3">
                    {[
                        { name: "Photography", members: "12.4k", color: "bg-purple-500" },
                        { name: "GameDev", members: "8.7k", color: "bg-green-500" },
                        { name: "BookClub", members: "5.2k", color: "bg-amber-500" }
                    ].map((community, index) => (
                        <motion.div
                            key={community.name}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="flex items-center gap-2">
                                <div className={`h-8 w-8 rounded-full ${community.color} flex items-center justify-center shadow-sm`}>
                                    <Users className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{community.name}</p>
                                    <p className="text-xs text-gray-500">{community.members} members</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs border-[#00AEEF] text-[#00AEEF] hover:bg-blue-50"
                            >
                                Join
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </aside>
    )
}
