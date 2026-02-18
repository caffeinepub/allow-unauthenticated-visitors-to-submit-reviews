import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  fallback?: React.ReactNode;
  priority?: boolean; // For above-the-fold images
  prefetch?: boolean; // For batch prefetching
}

// Generate lossless WebP URL from original URL
function getWebPUrl(url: string): string {
  // If the URL already has a query parameter, append with &
  const separator = url.includes('?') ? '&' : '?';
  // Explicitly request lossless WebP compression
  return `${url}${separator}format=webp&lossless=1`;
}

// Generate tiny blurred preview URL (10% size)
function getPreviewUrl(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}preview=true&w=40&q=20`;
}

export default function ProgressiveImage({ 
  src, 
  alt, 
  className = '', 
  onClick, 
  fallback,
  priority = false,
  prefetch = false
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Priority images load immediately
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [showPreview, setShowPreview] = useState(true);
  const imgRef = useRef<HTMLDivElement>(null);
  const fullImageRef = useRef<HTMLImageElement | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || prefetch) return; // Skip observer for priority/prefetch images
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Reduced margin for faster loading of visible images
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [priority, prefetch]);

  // Load preview and full image
  useEffect(() => {
    if (!isInView && !prefetch) return;

    // For priority images, skip preview and load full image immediately
    if (priority) {
      // Check WebP support
      const supportsWebP = document.createElement('canvas')
        .toDataURL('image/webp')
        .indexOf('data:image/webp') === 0;

      const fullSrc = supportsWebP ? getWebPUrl(src) : src;
      
      const fullImg = new Image();
      fullImg.src = fullSrc;
      fullImageRef.current = fullImg;
      
      fullImg.onload = () => {
        setCurrentSrc(fullSrc);
        setIsLoaded(true);
        setShowPreview(false);
      };

      fullImg.onerror = () => {
        // Fallback to original format if WebP fails
        if (supportsWebP && fullSrc !== src) {
          const fallbackImg = new Image();
          fallbackImg.src = src;
          fallbackImg.onload = () => {
            setCurrentSrc(src);
            setIsLoaded(true);
            setShowPreview(false);
          };
        }
      };

      return () => {
        if (fullImageRef.current) {
          fullImageRef.current.onload = null;
          fullImageRef.current.onerror = null;
        }
      };
    }

    // Generate URLs for non-priority images
    const webpUrl = getWebPUrl(src);
    const preview = getPreviewUrl(src);

    // Load tiny preview first
    const previewImg = new Image();
    previewImg.src = preview;
    previewImg.onload = () => {
      setPreviewSrc(preview);
    };

    // Check WebP support and load full image
    const supportsWebP = document.createElement('canvas')
      .toDataURL('image/webp')
      .indexOf('data:image/webp') === 0;

    const fullSrc = supportsWebP ? webpUrl : src;
    
    // Prefetch mode: just load the image without displaying
    if (prefetch) {
      const img = new Image();
      img.src = fullSrc;
      return;
    }

    // Load full resolution image
    const fullImg = new Image();
    fullImg.src = fullSrc;
    fullImageRef.current = fullImg;
    
    fullImg.onload = () => {
      setCurrentSrc(fullSrc);
      setIsLoaded(true);
      // Delay hiding preview for smooth transition
      setTimeout(() => setShowPreview(false), 300);
    };

    fullImg.onerror = () => {
      // Fallback to original format if WebP fails
      if (supportsWebP && fullSrc !== src) {
        const fallbackImg = new Image();
        fallbackImg.src = src;
        fallbackImg.onload = () => {
          setCurrentSrc(src);
          setIsLoaded(true);
          setTimeout(() => setShowPreview(false), 300);
        };
      }
    };

    return () => {
      if (fullImageRef.current) {
        fullImageRef.current.onload = null;
        fullImageRef.current.onerror = null;
      }
    };
  }, [src, isInView, prefetch, priority]);

  // For prefetch mode, don't render anything
  if (prefetch) {
    return null;
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} onClick={onClick}>
      {/* Loading state */}
      {!isLoaded && !previewSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          {fallback || <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
        </div>
      )}

      {/* Blurred preview - skip for priority images */}
      {!priority && previewSrc && showPreview && (
        <img
          src={previewSrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover blur-xl scale-110 transition-opacity duration-300 ${
            isLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          aria-hidden="true"
        />
      )}

      {/* Full resolution image */}
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
    </div>
  );
}
