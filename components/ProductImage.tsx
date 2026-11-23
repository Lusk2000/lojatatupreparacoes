import React, { useEffect, useState } from 'react';
import { WrenchIcon } from './Icons';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  iconClassName?: string;
  loading?: 'lazy' | 'eager';
}

const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackClassName = 'w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#1f1f1f] to-[#121212] text-gray-500',
  iconClassName = 'w-8 h-8 mb-2 text-[#E10600]/70',
  loading = 'lazy',
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError || !src) {
    return (
      <div className={fallbackClassName}>
        <WrenchIcon className={iconClassName} />
        <span className="text-xs sm:text-sm text-center font-medium line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
};

export default ProductImage;
