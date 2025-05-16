"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends Omit<ImageProps, "onLoad" | "onError"> {
  fallbackSrc?: string;
  loadingClassName?: string;
  errorClassName?: string;
}

/**
 * A performance-optimized image component with loading and error states
 */
export default function OptimizedImage({
  src,
  alt,
  fallbackSrc = "/images/placeholder.png",
  className,
  loadingClassName,
  errorClassName,
  ...props
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    // Reset states when src changes
    setLoading(true);
    setError(false);
    
    // If src is a string, use it directly
    if (typeof src === "string") {
      setImageSrc(src);
    }
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={error ? fallbackSrc : (imageSrc || src)}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          loading ? "opacity-0" : "opacity-100",
          error ? errorClassName : "",
          loading ? loadingClassName : ""
        )}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        {...props}
      />
      
      {loading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
    </div>
  );
}
