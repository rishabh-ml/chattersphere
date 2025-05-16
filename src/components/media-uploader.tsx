"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Image, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MediaUploaderProps {
  onUploadComplete: (url: string) => void;
  type: 'post' | 'comment' | 'message';
  maxSize?: number; // in MB
  className?: string;
}

export default function MediaUploader({
  onUploadComplete,
  type,
  maxSize = 10,
  className = "",
}: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Supported formats: JPEG, PNG, WEBP, GIF");
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSize * 1024 * 1024; // Convert MB to bytes
    if (file.size > maxSizeBytes) {
      toast.error(`File too large. Maximum size is ${maxSize}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload media");
      }
      
      const data = await response.json();
      onUploadComplete(data.url);
      toast.success("Media uploaded successfully");
    } catch (error) {
      console.error("Media upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload media");
      setPreview(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {preview ? (
        <div className="relative rounded-md overflow-hidden">
          <img 
            src={preview} 
            alt="Upload preview" 
            className="w-full h-auto max-h-64 object-contain bg-gray-100"
          />
          <button
            type="button"
            onClick={handleRemovePreview}
            className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full p-1 hover:bg-opacity-100 transition-opacity"
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </button>
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 text-gray-600"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Image className="h-4 w-4" />
          )}
          Add Image
        </Button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>
  );
}
