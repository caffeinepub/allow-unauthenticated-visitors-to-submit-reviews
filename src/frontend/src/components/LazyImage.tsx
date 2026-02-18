import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  fallback?: React.ReactNode;
}

export default function LazyImage({ src, alt, className = '', onClick, fallback }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
        rootMargin: '50px', // Start loading 50px before image enters viewport
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={imgRef} className={`relative ${className}`} onClick={onClick}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          {fallback || <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
        </div>
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
        />
      )}
    </div>
  );
}
