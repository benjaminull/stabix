import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

export function Logo({ className = '', showText = true, size = 40 }: LogoProps) {
  // Calculate height based on whether we show text
  // Logo image has gear + text, so when showText=false, we crop to show only gear
  const height = showText ? size * 1.3 : size * 0.65;

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: height,
        overflow: showText ? 'visible' : 'hidden'
      }}
    >
      <Image
        src="/logo.png"
        alt="STABIX Logo"
        width={size}
        height={showText ? size * 1.3 : size}
        className="object-contain"
        style={{
          objectPosition: showText ? 'center' : 'top'
        }}
        priority
      />
    </div>
  );
}
