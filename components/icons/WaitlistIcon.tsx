import type { IconProps } from './types';

export function WaitlistIcon({ size = 24, className = '' }: IconProps) {
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
      {/* Hospital/NHS building */}
      <rect x="3" y="7" width="18" height="14" rx="1" />
      <path d="M12 7V3" />
      <path d="M9 3h6" />
      {/* Cross symbol */}
      <path d="M12 11v6" />
      <path d="M9 14h6" />
    </svg>
  );
}
