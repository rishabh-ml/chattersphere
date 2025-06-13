"use client";

import { useAuthManager } from "../hooks/useAuthManager";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import { Switch } from "@/shared/ui/switch";
import { Label } from "@/shared/ui/label";
import { Loader2, ShieldAlert, LogOut, Clock, Smartphone, Globe } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

export default function SecuritySettings() {
  const { 
    sessions, 
    isLoadingSessions, 
    terminateSession,
    enableTwoFactor,
    disableTwoFactor
  } = useAuthManager();
  
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [isLoadingTerminate, setIsLoadingTerminate] = useState<string | null>(null);
  
  // Handler for toggling 2FA
  const handleToggleTwoFactor = async (enabled: boolean) => {
    if (enabled) {
      setIsEnabling2FA(true);
      try {
        await enableTwoFactor();
        setIsTwoFactorEnabled(true);
        toast.success("Two-factor authentication enabled");
      } catch (error) {
        console.error("Error enabling 2FA:", error);
        toast.error("Failed to enable two-factor authentication");
      } finally {
        setIsEnabling2FA(false);
      }
    } else {
      setIsDisabling2FA(true);
      try {
        await disableTwoFactor();
        setIsTwoFactorEnabled(false);
        toast.success("Two-factor authentication disabled");
      } catch (error) {
        console.error("Error disabling 2FA:", error);
        toast.error("Failed to disable two-factor authentication");
      } finally {
        setIsDisabling2FA(false);
      }
    }
  };
  
  // Handler for terminating a session
  const handleTerminateSession = async (sessionId: string, isCurrent: boolean) => {
    if (isCurrent) {
      toast.info("You cannot terminate your current session");
      return;
    }
    
    setIsLoadingTerminate(sessionId);
    try {
      await terminateSession(sessionId);
      toast.success("Session terminated successfully");
    } catch (error) {
      console.error("Error terminating session:", error);
      toast.error("Failed to terminate session");
    } finally {
      setIsLoadingTerminate(null);
    }
  };
  
  // Get device name from user agent
  const getDeviceName = (userAgent?: string): string => {
    if (!userAgent) return "Unknown device";
    
    if (userAgent.includes("iPhone")) return "iPhone";
    if (userAgent.includes("iPad")) return "iPad";
    if (userAgent.includes("Android")) return "Android device";
    if (userAgent.includes("Windows")) return "Windows computer";
    if (userAgent.includes("Mac")) return "Mac computer";
    if (userAgent.includes("Linux")) return "Linux computer";
    
    return "Unknown device";
  };
  
  // Get browser name from user agent
  const getBrowserName = (userAgent?: string): string => {
    if (!userAgent) return "Unknown browser";
    
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    if (userAgent.includes("Opera")) return "Opera";
    
    return "Unknown browser";
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShieldAlert className="mr-2 h-5 w-5" /> Security Settings
          </CardTitle>
          <CardDescription>
            Manage your account's security and active sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="two-factor" className="text-base font-medium">
                  Two-factor authentication
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch
                id="two-factor"
                checked={isTwoFactorEnabled}
                onCheckedChange={handleToggleTwoFactor}
                disabled={isEnabling2FA || isDisabling2FA}
              />
            </div>
            
            {(isEnabling2FA || isDisabling2FA) && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400 mr-2" />
                <span className="text-sm text-gray-500">
                  {isEnabling2FA ? "Enabling" : "Disabling"} two-factor authentication...
                </span>
              </div>
            )}
          </div>
          
          <Separator className="my-4" />
          
          <div>
            <h3 className="text-base font-medium mb-2">Active sessions</h3>
            <p className="text-sm text-gray-500 mb-4">
              These are the devices that are currently logged into your account
            </p>
            
            {isLoadingSessions ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => {
                  const isCurrent = session.isActive;
                  const deviceName = getDeviceName(session.userAgent);
                  const browserName = getBrowserName(session.userAgent);
                  
                  return (
                    <div
                      key={session.sessionId}
                      className="border rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                          {deviceName.includes("phone") || deviceName.includes("iPhone") || deviceName.includes("Android") ? (
                            <Smartphone className="h-5 w-5 text-gray-500" />
                          ) : (
                            <Globe className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {deviceName}
                            {isCurrent && (
                              <span className="ml-2 text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                                Current
                              </span>
                            )}
                          </p>
                          <div className="flex items-center text-sm text-gray-500">
                            <span>{browserName}</span>
                            <span className="mx-1">•</span>
                            <span>
                              {session.ipAddress || "Unknown location"}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-gray-400 mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>
                              {session.lastActiveAt
                                ? `Last active ${formatDistanceToNow(new Date(session.lastActiveAt), { addSuffix: true })}`
                                : "Unknown activity"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleTerminateSession(session.sessionId, isCurrent)}
                        disabled={isCurrent || isLoadingTerminate === session.sessionId}
                      >
                        {isLoadingTerminate === session.sessionId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <LogOut className="h-4 w-4 mr-1" />
                            Logout
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
                
                {sessions.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No active sessions found</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="text-xs text-gray-500">
          For security reasons, some actions may require you to re-enter your password.
        </CardFooter>
      </Card>
    </div>
  );
}
