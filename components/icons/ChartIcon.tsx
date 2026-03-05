import { IconProps } from './types';

export function ChartIcon({ size = 24, strokeWidth = 1.5, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Organic wave line showing progress/journey - not rigid bars */}
      <path d="M3 18c2-3 4-8 6-6s3 5 5 3 4-7 7-5" />
      {/* Gentle dots marking key moments */}
      <circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="14" cy="15" r="1.5" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="20" cy="10" r="1.5" fill="currentColor" stroke="none" opacity="0.6" />
      {/* Subtle baseline */}
      <path d="M3 20h18" strokeOpacity="0.3" />
      {/* Rising trend indicator */}
      <path d="M18 7l2-2" strokeOpacity="0.5" />
      <path d="M20 5l.5 2" strokeOpacity="0.5" />
    </svg>
  );
}
