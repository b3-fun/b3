import { cn } from "@b3dotfun/sdk/shared/utils";
import React, { useCallback, useMemo, useState } from "react";

interface TokenIconProps {
  src: string;
  alt: string;
  className?: string;
  size?: number;
}

// Create a global image cache to prevent re-loading
const imageCache = new Map<string, boolean>();

export const TokenIcon: React.FC<TokenIconProps> = ({ src, alt, className, size = 40 }) => {
  const [isLoaded, setIsLoaded] = useState(() => imageCache.get(src) || false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    imageCache.set(src, true);
    setIsLoaded(true);
  }, [src]);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  // Memoize the image element to prevent unnecessary re-renders
  const imageElement = useMemo(
    () => (
      <img
        src={src}
        alt={alt}
        className={cn("transition-opacity duration-200", className, {
          "opacity-100": isLoaded && !hasError,
          "opacity-0": !isLoaded || hasError,
        })}
        onLoad={handleLoad}
        onError={handleError}
        loading="eager" // Load immediately since these are critical UI elements
        decoding="async"
        style={{
          width: size,
          height: size,
        }}
      />
    ),
    [src, alt, className, isLoaded, hasError, handleLoad, handleError, size],
  );

  // Show a placeholder while loading or if there's an error
  const placeholder = useMemo(
    () => (
      <div
        className={cn(
          "bg-b3-primary-wash flex items-center justify-center rounded-full transition-opacity duration-200",
          {
            "opacity-0": isLoaded && !hasError,
            "opacity-100": !isLoaded || hasError,
          },
        )}
        style={{
          width: size,
          height: size,
        }}
      >
        <span className="text-b3-grey font-neue-montreal-semibold text-xs">{alt.charAt(0).toUpperCase()}</span>
      </div>
    ),
    [alt, isLoaded, hasError, size],
  );

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      {placeholder}
      <div className="absolute inset-0">{imageElement}</div>
    </div>
  );
};

// Pre-defined token icons for common tokens
export const B3TokenIcon: React.FC<Omit<TokenIconProps, "src" | "alt">> = props => (
  <TokenIcon src="https://cdn.b3.fun/b3-coin-3d.png" alt="B3" {...props} />
);

export const EthereumTokenIcon: React.FC<Omit<TokenIconProps, "src" | "alt">> = props => (
  <TokenIcon src="https://cdn.b3.fun/ethereum.svg" alt="ETH" {...props} />
);
