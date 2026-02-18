import { useEffect } from 'react';
import ProgressiveImage from './ProgressiveImage';

interface ImagePrefetcherProps {
  urls: string[];
  batchSize?: number;
}

/**
 * Component to prefetch images in batches
 * Useful for gallery navigation to preload upcoming images
 */
export default function ImagePrefetcher({ urls, batchSize = 3 }: ImagePrefetcherProps) {
  return (
    <>
      {urls.slice(0, batchSize).map((url, idx) => (
        <ProgressiveImage
          key={`prefetch-${idx}`}
          src={url}
          alt=""
          prefetch={true}
        />
      ))}
    </>
  );
}
