import type { IconProps } from './types';

export function ShieldIcon({ size = 24, className = '' }: IconProps) {
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
      {/* Shield shape */}
      <path d="M12 2l8 4v6c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V6l8-4z" />
      {/* Heart inside shield */}
      <path d="M12 9c-.5-1-1.5-1.5-2.5-1.5S7.5 8.5 7.5 10c0 2.5 4.5 5 4.5 5s4.5-2.5 4.5-5c0-1.5-1-2.5-2-2.5S12.5 8 12 9z" />
    </svg>
  );
}
