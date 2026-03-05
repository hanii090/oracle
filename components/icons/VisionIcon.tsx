import { IconProps } from './types';

export function VisionIcon({ size = 24, strokeWidth = 1.5, className, ...props }: IconProps) {
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
      {/* Radiating lines representing visual breakthrough/clarity */}
      <path d="M12 2v2" opacity="0.5" />
      <path d="M12 20v2" opacity="0.5" />
      <path d="M4.93 4.93l1.41 1.41" opacity="0.5" />
      <path d="M17.66 17.66l1.41 1.41" opacity="0.5" />
      <path d="M2 12h2" opacity="0.5" />
      <path d="M20 12h2" opacity="0.5" />
      <path d="M4.93 19.07l1.41-1.41" opacity="0.5" />
      <path d="M17.66 6.34l1.41-1.41" opacity="0.5" />
      {/* Inner diamond representing moment of clarity */}
      <path d="M12 8l4 4-4 4-4-4z" opacity="0.8" />
      {/* Center dot representing insight */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
