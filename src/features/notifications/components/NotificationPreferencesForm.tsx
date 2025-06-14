"use client";

import { useEffect, useState } from "react";
import { useNotifications } from "../hooks/useNotifications";
import { Switch } from "@/shared/ui/switch";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import { toast } from "sonner";
import { NotificationPreferences, NotificationType } from "../types";
import { Loader2 } from "lucide-react";

export default function NotificationPreferencesForm() {
  const { preferences, isLoadingPreferences, updatePreferences } = useNotifications();
  const [formValues, setFormValues] = useState<NotificationPreferences | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences
  useEffect(() => {
    if (preferences && !formValues) {
      setFormValues(preferences);
    }
  }, [preferences, formValues]);

  // Handle input changes
  const handleToggleChange = (field: keyof NotificationPreferences, value: boolean) => {
    if (!formValues) return;

    setFormValues({
      ...formValues,
      [field]: value,
    });
  };

  const handleDigestFrequencyChange = (value: "none" | "daily" | "weekly") => {
    if (!formValues) return;

    setFormValues({
      ...formValues,
      emailDigestFrequency: value,
    });
  };

  const handleToggleNotificationType = (type: NotificationType) => {
    if (!formValues) return;

    const mutedTypes = [...formValues.mutedTypes];
    const index = mutedTypes.indexOf(type);

    if (index > -1) {
      // Remove from muted types
      mutedTypes.splice(index, 1);
    } else {
      // Add to muted types
      mutedTypes.push(type);
    }

    setFormValues({
      ...formValues,
      mutedTypes,
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues) return;

    setIsSaving(true);
    try {
      await updatePreferences(formValues);
      toast.success("Notification preferences saved");
    } catch (error) {
      toast.error("Failed to save preferences");
      console.error("Error saving notification preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingPreferences || !formValues) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Notification Preferences</CardTitle>
          <CardDescription>Customize how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Notification Preferences</CardTitle>
          <CardDescription>Customize how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* General Notification Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">General Settings</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications on your device</p>
              </div>
              <Switch
                id="push-notifications"
                checked={formValues.allowPushNotifications}
                onCheckedChange={(checked: boolean) =>
                  handleToggleChange("allowPushNotifications", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <Switch
                id="email-notifications"
                checked={formValues.allowEmailNotifications}
                onCheckedChange={(checked: boolean) =>
                  handleToggleChange("allowEmailNotifications", checked)
                }
              />
            </div>

            {formValues.allowEmailNotifications && (
              <div className="pt-4 pl-3">
                <Label className="mb-3">Email Digest Frequency</Label>
                <RadioGroup
                  value={formValues.emailDigestFrequency}
                  onValueChange={(value: string) => handleDigestFrequencyChange(value as any)}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none" className="cursor-pointer">
                      Individual emails (no digest)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="daily" id="daily" />
                    <Label htmlFor="daily" className="cursor-pointer">
                      Daily digest
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="weekly" id="weekly" />
                    <Label htmlFor="weekly" className="cursor-pointer">
                      Weekly digest
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>

          <Separator />

          {/* Notification Type Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Types</h3>
            <p className="text-sm text-gray-500">
              Toggle which types of notifications you want to receive
            </p>

            <div className="space-y-4 pt-2">
              {Object.values(NotificationType).map((type) => (
                <div key={type} className="flex items-center justify-between">
                  <div>
                    <Label htmlFor={`type-${type}`} className="text-sm font-medium">
                      {type.replace("_", " ").replace(/_/g, " ")}
                    </Label>
                  </div>
                  <Switch
                    id={`type-${type}`}
                    checked={!formValues.mutedTypes.includes(type)}
                    onCheckedChange={() => handleToggleNotificationType(type)}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save Preferences
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
