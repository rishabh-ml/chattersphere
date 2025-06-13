"use client";

import { useState } from "react";
import { format } from "date-fns";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Edit2, Save, X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { profileUpdateSchema } from "@/lib/validations/profile";

interface AboutTabProps {
  user: User;
  isOwner: boolean;
  onProfileUpdate: (data: {
    bio: string;
    pronouns?: string | null;
    location: string;
    website: string;
    interests: string[];
    socialLinks: Array<{ platform: string; url: string }>;
  }) => Promise<void>;
}

export default function AboutTab({ user, isOwner, onProfileUpdate }: AboutTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bio: user.bio || "",
    pronouns: user.pronouns || "",
    location: user.location || "",
    website: user.website || "",
    interests: user.interests || [],
    socialLinks: user.socialLinks || [],
  });
  const [newInterest, setNewInterest] = useState("");
  const [newSocialPlatform, setNewSocialPlatform] = useState("");
  const [newSocialUrl, setNewSocialUrl] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addInterest = () => {
    if (!newInterest.trim()) return;
    if (formData.interests.length >= 10) {
      toast.error("You can add up to 10 interests");
      return;
    }
    if (newInterest.length > 30) {
      toast.error("Interest must be 30 characters or less");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      interests: [...prev.interests, newInterest.trim()],
    }));
    setNewInterest("");
  };

  const removeInterest = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index),
    }));
  };

  const addSocialLink = () => {
    if (!newSocialPlatform.trim() || !newSocialUrl.trim()) return;
    if (formData.socialLinks.length >= 5) {
      toast.error("You can add up to 5 social links");
      return;
    }
    
    try {
      // Basic URL validation
      new URL(newSocialUrl);
      
      setFormData((prev) => ({
        ...prev,
        socialLinks: [
          ...prev.socialLinks,
          { platform: newSocialPlatform.trim(), url: newSocialUrl.trim() },
        ],
      }));
      setNewSocialPlatform("");
      setNewSocialUrl("");
    } catch (err: unknown) {
      toast.error("Please enter a valid URL");
    }
  };

  const removeSocialLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data
      const validatedData = profileUpdateSchema.parse(formData);
      const validatedData = profileUpdateSchema.parse(formData);

      setIsSubmitting(true);
      await onProfileUpdate({
        bio: validatedData.bio || "",
        pronouns: validatedData.pronouns,
        location: validatedData.location || "",
        website: validatedData.website || "",
        interests: validatedData.interests || [],
        socialLinks: validatedData.socialLinks || []
      });
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error: unknown) {
      if (error &&
          typeof error === 'object' &&
          'errors' in error &&
          Array.isArray((error as any).errors) &&
          (error as any).errors.length > 0) {
        // Zod validation error
        toast.error((error as any).errors[0].message);
      } else {
        toast.error("Failed to update profile");
        console.error("Profile update error:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setFormData({
      bio: user.bio || "",
      pronouns: user.pronouns || "",
      location: user.location || "",
      website: user.website || "",
      interests: user.interests || [],
      socialLinks: user.socialLinks || [],
    });
    setIsEditing(false);
  };

  if (isEditing && isOwner) {
    return (
      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Edit Profile</h2>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={cancelEdit}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button 
              type="submit" 
              size="sm" 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
            >
              {isSubmitting ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself"
              className="resize-none"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.bio.length}/500 characters
            </p>
          </div>

          <div>
            <label htmlFor="pronouns" className="block text-sm font-medium text-gray-700 mb-1">
              Pronouns
            </label>
            <Input
              id="pronouns"
              name="pronouns"
              value={formData.pronouns}
              onChange={handleChange}
              placeholder="e.g. she/her, they/them"
              maxLength={30}
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. New York, USA"
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <Input
              id="website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://example.com"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interests
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.interests.map((interest, index) => (
                <Badge key={index} variant="secondary" className="px-3 py-1 gap-1">
                  {interest}
                  <button
                    type="button"
                    onClick={() => removeInterest(index)}
                    className="text-gray-500 hover:text-red-500 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add an interest"
                maxLength={30}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addInterest}
                disabled={!newInterest.trim() || formData.interests.length >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.interests.length}/10 interests
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Social Links
            </label>
            <div className="space-y-2 mb-2">
              {formData.socialLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-gray-50 p-2 rounded-md">
                    <span className="font-medium text-sm">{link.platform}:</span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:underline truncate"
                    >
                      {link.url}
                    </a>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSocialLink(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input
                value={newSocialPlatform}
                onChange={(e) => setNewSocialPlatform(e.target.value)}
                placeholder="Platform"
                className="col-span-1"
              />
              <Input
                value={newSocialUrl}
                onChange={(e) => setNewSocialUrl(e.target.value)}
                placeholder="URL"
                className="col-span-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addSocialLink}
                disabled={!newSocialPlatform.trim() || !newSocialUrl.trim() || formData.socialLinks.length >= 5}
                className="col-span-1"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.socialLinks.length}/5 social links
            </p>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Profile Info</h2>
        {isOwner && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditing(true)}
            className="gap-1"
          >
            <Edit2 className="h-4 w-4" /> Edit
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {user.bio ? (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Bio</h3>
            <p className="mt-1">{user.bio}</p>
          </div>
        ) : isOwner ? (
          <div className="text-gray-500 italic">
            Add a bio to tell people about yourself
          </div>
        ) : (
          <div className="text-gray-500 italic">
            This user hasn&apos;t added a bio yet
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.pronouns && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Pronouns</h3>
              <p className="mt-1">{user.pronouns}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500">Joined</h3>
            <p className="mt-1">{format(new Date(user.createdAt), 'MMMM d, yyyy')}</p>
          </div>

          {user.location && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Location</h3>
              <p className="mt-1">{user.location}</p>
            </div>
          )}

          {user.website && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Website</h3>
              <a
                href={user.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-indigo-600 hover:underline block"
              >
                {user.website}
              </a>
            </div>
          )}
        </div>

        {user.interests && user.interests.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest, index) => (
                <Badge key={index} variant="secondary" className="px-3 py-1">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {user.socialLinks && user.socialLinks.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Social Links</h3>
            <div className="space-y-2">
              {user.socialLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="font-medium">{link.platform}:</span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    {link.url}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
