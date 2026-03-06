import type { IconProps } from './types';

export function NhsAppIcon({ size = 24, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Phone outline */}
      <rect x="6" y="2" width="12" height="20" rx="2" />
      {/* Screen */}
      <rect x="8" y="5" width="8" height="11" rx="0.5" />
      {/* NHS cross on screen */}
      <path d="M12 7v7" />
      <path d="M9 10.5h6" />
      {/* Home button */}
      <circle cx="12" cy="19" r="0.5" fill="currentColor" />
    </svg>
  );
}
