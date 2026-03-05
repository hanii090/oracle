import { IconProps } from './types';

export function SafeIcon({ size = 24, strokeWidth = 1.5, className, ...props }: IconProps) {
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
      {/* Protective embrace/hands cupping */}
      <path d="M4 14c0-4 3-7 8-10" strokeOpacity="0.6" />
      <path d="M20 14c0-4-3-7-8-10" strokeOpacity="0.6" />
      {/* Warm glow center - safety */}
      <circle cx="12" cy="14" r="4" strokeOpacity="0.8" />
      <circle cx="12" cy="14" r="2" fill="currentColor" stroke="none" opacity="0.4" />
      {/* Gentle support from below */}
      <path d="M8 18c1.5 1.5 2.5 2 4 2s2.5-.5 4-2" />
      <path d="M6 20c2 1 4 1.5 6 1.5s4-.5 6-1.5" strokeOpacity="0.4" />
      {/* Small heart - compassion */}
      <path d="M12 10c-.5-.5-1-.5-1.5 0s0 1 1.5 1.5c1.5-.5 2-1 1.5-1.5s-1-.5-1.5 0z" fill="currentColor" stroke="none" opacity="0.5" />
    </svg>
  );
}
