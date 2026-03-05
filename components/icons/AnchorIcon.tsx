import { IconProps } from './types';

export function AnchorIcon({ size = 24, strokeWidth = 1.5, className, ...props }: IconProps) {
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
      <circle cx="12" cy="5" r="3" />
      <path d="M12 8v13" />
      <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
      <path d="M12 21a10 10 0 0 1-7-3" opacity="0.5" />
      <path d="M12 21a10 10 0 0 0 7-3" opacity="0.5" />
    </svg>
  );
}
