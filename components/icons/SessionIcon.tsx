import { IconProps } from './types';

export function SessionIcon({ size = 24, strokeWidth = 1.5, className, ...props }: IconProps) {
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
      {/* Organic spiral representing inner journey/descent */}
      <path d="M12 4c-4.4 0-8 3.6-8 8s3.6 8 8 8" strokeOpacity="0.3" />
      <path d="M12 7c-2.8 0-5 2.2-5 5s2.2 5 5 5" strokeOpacity="0.5" />
      <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2" strokeOpacity="0.7" />
      {/* Center point - the core truth */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      {/* Gentle wave suggesting breath/flow */}
      <path d="M15 12c1.5-1 3-1 4.5 0" strokeOpacity="0.6" />
      <path d="M15 12c1.5 1 3 1 4.5 0" strokeOpacity="0.6" />
    </svg>
  );
}
