import { IconProps } from './types';

export function CandleIcon({ size = 24, strokeWidth = 1.5, className, ...props }: IconProps) {
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
      <rect x="9" y="10" width="6" height="12" rx="1" />
      <path d="M12 10V8" />
      <path d="M12 8c-1.5-1.5-1.5-3 0-4 1.5 1 1.5 2.5 0 4z" fill="currentColor" opacity="0.5" />
      <path d="M7 22h10" />
    </svg>
  );
}
