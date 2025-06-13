"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import DeleteAccountButton from "./DeleteAccountButton";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState<{
    id: string;
    username: string;
    name: string;
    bio: string;
    privacySettings: {
      isPrivate: boolean;
      allowMessages: boolean;
      showActivity: boolean;
    };
  } | null>(null);

  // Redirect to sign-in if not authenticated
  if (isLoaded && !isSignedIn) {
    redirect("/sign-in");
  }

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isSignedIn || !user) return;

      try {
        const response = await fetch(`/api/users/me`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        
        const data = await response.json();
        setUserData(data.user);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load user data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [isSignedIn, user]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userData) return;
    
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userData.name,
          bio: userData.bio,
          privacySettings: userData.privacySettings,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update user data");
      }
      
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error updating user data:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle privacy settings change
  const handlePrivacyChange = (key: keyof typeof userData.privacySettings, value: boolean) => {
    if (!userData) return;
    
    setUserData({
      ...userData,
      privacySettings: {
        ...userData.privacySettings,
        [key]: value,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-10 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00AEEF]" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Manage your public profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={userData?.name || ""}
                    onChange={(e) => setUserData(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={userData?.username || ""}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">
                    Username cannot be changed
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    className="w-full min-h-[100px] p-2 border border-gray-300 rounded-md"
                    value={userData?.bio || ""}
                    onChange={(e) => setUserData(prev => prev ? { ...prev, bio: e.target.value } : null)}
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.location.href = "/profile/me"}
                >
                  View Profile
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="privacy">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>
                  Control who can see your content and interact with you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Private Profile</h3>
                    <p className="text-sm text-gray-500">
                      Only approved followers can see your posts and activity
                    </p>
                  </div>
                  <Switch
                    checked={userData?.privacySettings.isPrivate || false}
                    onCheckedChange={(checked) => handlePrivacyChange("isPrivate", checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Allow Direct Messages</h3>
                    <p className="text-sm text-gray-500">
                      Let other users send you direct messages
                    </p>
                  </div>
                  <Switch
                    checked={userData?.privacySettings.allowMessages || false}
                    onCheckedChange={(checked) => handlePrivacyChange("allowMessages", checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Show Activity Status</h3>
                    <p className="text-sm text-gray-500">
                      Let others see when you're online or recently active
                    </p>
                  </div>
                  <Switch
                    checked={userData?.privacySettings.showActivity || false}
                    onCheckedChange={(checked) => handlePrivacyChange("showActivity", checked)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="ml-auto" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account and connected services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Email Address</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Your email is managed by Clerk authentication
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = "/user/account"}
                >
                  Manage Email
                </Button>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Password</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Change your password or enable two-factor authentication
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = "/user/security"}
                >
                  Security Settings
                </Button>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium text-red-500 mb-2">Danger Zone</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Permanently delete your account and all your data
                </p>
                
                {userData && (
                  <DeleteAccountButton
                    userId={userData.id}
                    username={userData.username}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
