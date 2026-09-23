'use client';

import React from 'react';

interface TimerRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  accentColor: string;
  children?: React.ReactNode;
}

export const TimerRing: React.FC<TimerRingProps> = ({
  progress,
  size = 340,
  strokeWidth = 6,
  accentColor,
  children,
}) => {
  const radius = Math.round(((size - strokeWidth) / 2) * 100) / 100;
  const circumference = Math.round((2 * Math.PI * radius) * 100) / 100;
  // progress 1 means 100% full, 0 means empty
  const strokeDashoffset = Math.round((circumference - progress * circumference) * 100) / 100;

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90 origin-center transition-all duration-300"
      >
        <defs>
          <filter id="subtle-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
        />

        {/* Progress indicator */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={accentColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          filter="url(#subtle-glow)"
          style={{
            transition: 'stroke-dashoffset 0.85s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease',
          }}
        />

        {/* Small subtle tick marks along perimeter for luxury watch / instrument feel */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const innerR = radius - strokeWidth - 8;
          const outerR = radius - strokeWidth - 4;
          const x1 = Math.round((size / 2 + innerR * Math.cos(angle)) * 100) / 100;
          const y1 = Math.round((size / 2 + innerR * Math.sin(angle)) * 100) / 100;
          const x2 = Math.round((size / 2 + outerR * Math.cos(angle)) * 100) / 100;
          const y2 = Math.round((size / 2 + outerR * Math.sin(angle)) * 100) / 100;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255, 255, 255, 0.18)"
              strokeWidth={i % 3 === 0 ? 1.5 : 0.75}
            />
          );
        })}
      </svg>

      {/* Centered content inside the dial */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto">
        {children}
      </div>
    </div>
  );
};
