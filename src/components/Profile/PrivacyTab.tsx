"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Download, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { PrivacySettings } from "@/types";

interface PrivacyTabProps {
  userId: string;
  privacySettings: PrivacySettings;
  onPrivacyUpdate: (data: { privacySettings: PrivacySettings }) => Promise<void>;
}

export default function PrivacyTab({
  userId,
  privacySettings,
  onPrivacyUpdate,
}: PrivacyTabProps) {
  const [settings, setSettings] = useState<PrivacySettings>({
    showEmail: privacySettings?.showEmail ?? false,
    showActivity: privacySettings?.showActivity ?? true,
    allowFollowers: privacySettings?.allowFollowers ?? true,
    allowMessages: privacySettings?.allowMessages ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleToggle = (setting: keyof PrivacySettings) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      await onPrivacyUpdate({ privacySettings: settings });
      toast.success("Privacy settings updated successfully");
    } catch (error) {
      toast.error("Failed to update privacy settings");
      console.error("Privacy settings update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const res = await fetch(`/api/profile/${userId}/export`, {
        method: "POST",
      });
      
      if (!res.ok) {
        throw new Error("Failed to export data");
      }
      
      const data = await res.json();
      
      // Create a downloadable file
      const blob = new Blob([JSON.stringify(data.data, null, 2)], {
        type: "application/json",
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chattersphere-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Data exported successfully");
    } catch (error) {
      toast.error("Failed to export data");
      console.error("Data export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Privacy Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showEmail" className="font-medium">
                Show Email Address
              </Label>
              <p className="text-sm text-gray-500">
                Allow other users to see your email address
              </p>
            </div>
            <Switch
              id="showEmail"
              checked={settings.showEmail}
              onCheckedChange={() => handleToggle("showEmail")}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showActivity" className="font-medium">
                Show Activity
              </Label>
              <p className="text-sm text-gray-500">
                Allow other users to see your posts and comments
              </p>
            </div>
            <Switch
              id="showActivity"
              checked={settings.showActivity}
              onCheckedChange={() => handleToggle("showActivity")}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allowFollowers" className="font-medium">
                Allow Followers
              </Label>
              <p className="text-sm text-gray-500">
                Allow other users to follow your profile
              </p>
            </div>
            <Switch
              id="allowFollowers"
              checked={settings.allowFollowers}
              onCheckedChange={() => handleToggle("allowFollowers")}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allowMessages" className="font-medium">
                Allow Direct Messages
              </Label>
              <p className="text-sm text-gray-500">
                Allow other users to send you direct messages
              </p>
            </div>
            <Switch
              id="allowMessages"
              checked={settings.allowMessages}
              onCheckedChange={() => handleToggle("allowMessages")}
            />
          </div>
        </div>
        
        <Button 
          onClick={handleSave}
          disabled={isSubmitting}
          className="mt-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
        >
          {isSubmitting ? (
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>
      
      <div className="border-t border-gray-100 pt-6">
        <h2 className="text-xl font-semibold mb-4">Data & Privacy</h2>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800">Data Export</h3>
              <p className="text-sm text-amber-700 mt-1">
                This will export all your personal data, including profile information, posts, and comments.
                The export may take a few moments to generate.
              </p>
            </div>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={handleExportData}
          disabled={isExporting}
          className="gap-2"
        >
          {isExporting ? (
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export My Data
        </Button>
      </div>
    </div>
  );
}
