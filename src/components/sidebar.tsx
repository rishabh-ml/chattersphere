"use client"

import { Home, Compass, TrendingUp, Settings, HelpCircle, Bell, Bookmark, PlusCircle, User } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import {
    Sidebar as ShadcnSidebar,
    SidebarContent,
    SidebarHeader,
    SidebarFooter,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarProvider,
    SidebarTrigger,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function Sidebar() {
    const pathname = usePathname()
    const { user, isSignedIn } = useUser()

    const isActive = (path: string) => {
        return pathname === path
    }

    return (
        <SidebarProvider defaultOpen={true}>
            <ShadcnSidebar className="border-r border-gray-100 shadow-sm">
                <SidebarHeader className="p-4">
                    <motion.div
                        className="flex items-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#00AEEF] to-[#EC4899] flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-sm">CS</span>
                        </div>
                        <span className="font-semibold text-lg text-gray-800">ChatterSphere</span>
                    </motion.div>
                </SidebarHeader>

                <SidebarContent>
                    <div className="px-4 mb-2">
                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Main</h3>
                    </div>

                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                className={cn(
                                    "hover:bg-blue-50 hover:text-[#00AEEF] transition-colors",
                                    isActive("/home") && "bg-blue-50 text-[#00AEEF] font-medium"
                                )}
                                onClick={() => window.location.href = "/home"}
                            >
                                <Home className="h-5 w-5 mr-3" />
                                <span>Home</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton
                                className={cn(
                                    "hover:bg-blue-50 hover:text-[#00AEEF] transition-colors",
                                    isActive("/popular") && "bg-blue-50 text-[#00AEEF] font-medium"
                                )}
                                onClick={() => window.location.href = "/popular"}
                            >
                                <TrendingUp className="h-5 w-5 mr-3" />
                                <span>Popular</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton
                                className={cn(
                                    "hover:bg-blue-50 hover:text-[#00AEEF] transition-colors",
                                    isActive("/explore") && "bg-blue-50 text-[#00AEEF] font-medium"
                                )}
                                onClick={() => window.location.href = "/explore"}
                            >
                                <Compass className="h-5 w-5 mr-3" />
                                <span>Explore</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton
                                className={cn(
                                    "hover:bg-blue-50 hover:text-[#00AEEF] transition-colors",
                                    isActive("/notifications") && "bg-blue-50 text-[#00AEEF] font-medium"
                                )}
                                onClick={() => window.location.href = "/notifications"}
                            >
                                <Bell className="h-5 w-5 mr-3" />
                                <span>Notifications</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton
                                className={cn(
                                    "hover:bg-blue-50 hover:text-[#00AEEF] transition-colors",
                                    isActive("/saved") && "bg-blue-50 text-[#00AEEF] font-medium"
                                )}
                                onClick={() => window.location.href = "/saved"}
                            >
                                <Bookmark className="h-5 w-5 mr-3" />
                                <span>Saved</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        {isSignedIn && user && (
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    className={cn(
                                        "hover:bg-blue-50 hover:text-[#00AEEF] transition-colors",
                                        pathname?.startsWith('/profile') && "bg-blue-50 text-[#00AEEF] font-medium"
                                    )}
                                    onClick={() => {
                                        // Fetch the MongoDB user ID using the Clerk ID
                                        fetch(`/api/users?clerkId=${user.id}`)
                                            .then(res => res.json())
                                            .then(data => {
                                                if (data.user && data.user.id) {
                                                    window.location.href = `/profile/${data.user.id}`;
                                                } else {
                                                    console.error('Could not find user profile');
                                                    // Show an error message to the user
                                                    alert('Could not find your profile. Please try again later.');
                                                }
                                            })
                                            .catch(err => console.error('Error fetching user profile:', err));
                                    }}
                                >
                                    <User className="h-5 w-5 mr-3" />
                                    <span>My Profile</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}
                    </SidebarMenu>

                    <SidebarSeparator className="my-4" />

                    <div className="px-4 mb-2 flex items-center justify-between">
                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">My Communities</h3>
                        <button className="text-[#00AEEF] hover:text-[#00AEEF]/80 transition-colors">
                            <PlusCircle className="h-4 w-4" />
                        </button>
                    </div>

                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton className="hover:bg-blue-50 hover:text-[#00AEEF] transition-colors">
                                <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center mr-3">
                                    <span className="text-white text-xs font-bold">W</span>
                                </div>
                                <span>WebDev</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton className="hover:bg-blue-50 hover:text-[#00AEEF] transition-colors">
                                <div className="h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center mr-3">
                                    <span className="text-white text-xs font-bold">T</span>
                                </div>
                                <span>TechTalk</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton className="hover:bg-blue-50 hover:text-[#00AEEF] transition-colors">
                                <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center mr-3">
                                    <span className="text-white text-xs font-bold">R</span>
                                </div>
                                <span>RemoteWork</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>

                <SidebarFooter className="p-4">
                    <SidebarSeparator className="mb-4" />
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                className={cn(
                                    "hover:bg-blue-50 hover:text-[#00AEEF] transition-colors",
                                    isActive("/admin") && "bg-blue-50 text-[#00AEEF] font-medium"
                                )}
                                onClick={() => window.location.href = "/admin"}
                            >
                                <Settings className="h-5 w-5 mr-3" />
                                <span>Admin</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton className="hover:bg-blue-50 hover:text-[#00AEEF] transition-colors">
                                <HelpCircle className="h-5 w-5 mr-3" />
                                <span>Help</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>

                <SidebarTrigger className="absolute top-4 right-[-12px] z-50 bg-white border border-gray-100 rounded-full shadow-sm" />
            </ShadcnSidebar>
        </SidebarProvider>
    )
}
