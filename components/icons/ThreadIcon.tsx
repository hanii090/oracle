import { IconProps } from './types';

export function ThreadIcon({ size = 24, strokeWidth = 1.5, className, ...props }: IconProps) {
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
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="12" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M8.5 7.5l7 3" />
      <path d="M8.5 16.5l7-3" />
    </svg>
  );
}
