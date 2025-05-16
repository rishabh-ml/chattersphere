"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Info, GridIcon, Shield, Activity } from "lucide-react";
import { User } from "@/types";
import AboutTab from "./AboutTab";
import ActivityTab from "./ActivityTab";
import PrivacyTab from "./PrivacyTab";

interface ProfileTabsProps {
  user: User;
  isOwner: boolean;
  onProfileUpdate: (data: any) => Promise<void>;
  onPrivacyUpdate: (data: any) => Promise<void>;
}

export default function ProfileTabs({
  user,
  isOwner,
  onProfileUpdate,
  onPrivacyUpdate,
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState("about");

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ delay: 0.6 }} 
      className="mt-8 px-4 md:px-6"
    >
      <Tabs 
        defaultValue="about" 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value)}
      >
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
          <TabsTrigger 
            value="about" 
            className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
          >
            <Info className="h-4 w-4 mr-2" /> About
          </TabsTrigger>
          <TabsTrigger 
            value="activity" 
            className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
          >
            <Activity className="h-4 w-4 mr-2" /> Activity
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger 
              value="privacy" 
              className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
            >
              <Shield className="h-4 w-4 mr-2" /> Privacy
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="about" className="mt-6">
          <AboutTab user={user} isOwner={isOwner} onProfileUpdate={onProfileUpdate} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <ActivityTab userId={user.id} />
        </TabsContent>

        {isOwner && (
          <TabsContent value="privacy" className="mt-6">
            <PrivacyTab 
              userId={user.id} 
              privacySettings={user.privacySettings} 
              onPrivacyUpdate={onPrivacyUpdate} 
            />
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  );
}
