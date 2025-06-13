"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { X, Upload, Image, Video, File } from 'lucide-react';
import { toast } from 'sonner';

interface MediaFile {
  id: string;
  file: File;
  url: string;
  type: 'image' | 'video' | 'document';
}

interface MediaUploaderProps {
  onMediaChange: (files: MediaFile[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  onMediaChange,
  maxFiles = 5,
  acceptedTypes = ['image/*', 'video/*', '.pdf', '.doc', '.docx'],
  className = '',
}) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const getFileType = (file: File): 'image' | 'video' | 'document' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  };

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      
      if (files.length === 0) return;

      if (mediaFiles.length + files.length > maxFiles) {
        toast.error(`You can only upload up to ${maxFiles} files`);
        return;
      }

      setUploading(true);

      try {
        const newMediaFiles: MediaFile[] = [];

        for (const file of files) {
          // Validate file size (10MB limit)
          if (file.size > 10 * 1024 * 1024) {
            toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
            continue;
          }

          const mediaFile: MediaFile = {
            id: `${Date.now()}-${Math.random()}`,
            file,
            url: URL.createObjectURL(file),
            type: getFileType(file),
          };

          newMediaFiles.push(mediaFile);
        }

        const updatedFiles = [...mediaFiles, ...newMediaFiles];
        setMediaFiles(updatedFiles);
        onMediaChange(updatedFiles);
      } catch (error) {
        console.error('Error processing files:', error);
        toast.error('Error processing files');
      } finally {
        setUploading(false);
      }

      // Reset input
      event.target.value = '';
    },
    [mediaFiles, maxFiles, onMediaChange]
  );

  const removeFile = useCallback(
    (id: string) => {
      const updatedFiles = mediaFiles.filter((file) => {
        if (file.id === id) {
          URL.revokeObjectURL(file.url);
          return false;
        }
        return true;
      });
      setMediaFiles(updatedFiles);
      onMediaChange(updatedFiles);
    },
    [mediaFiles, onMediaChange]
  );

  const getFileIcon = (type: 'image' | 'video' | 'document') => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Button */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || mediaFiles.length >= maxFiles}
          onClick={() => document.getElementById('media-upload')?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading...' : 'Add Media'}
        </Button>
        <span className="text-sm text-muted-foreground">
          {mediaFiles.length}/{maxFiles} files
        </span>
      </div>

      {/* Hidden File Input */}
      <Input
        id="media-upload"
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Media Preview */}
      {mediaFiles.length > 0 && (
        <div className="grid gap-2">
          {mediaFiles.map((mediaFile) => (
            <div
              key={mediaFile.id}
              className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50"
            >
              {/* File Icon/Preview */}
              <div className="flex-shrink-0">
                {mediaFile.type === 'image' ? (
                  <img
                    src={mediaFile.url}
                    alt={mediaFile.file.name}
                    className="h-12 w-12 object-cover rounded"
                  />
                ) : (
                  <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                    {getFileIcon(mediaFile.type)}
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {mediaFile.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(mediaFile.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              {/* Remove Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(mediaFile.id)}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
