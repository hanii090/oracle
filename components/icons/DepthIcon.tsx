import { IconProps } from './types';

export function DepthIcon({ size = 24, strokeWidth = 1.5, className, ...props }: IconProps) {
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
      <rect x="3" y="3" width="18" height="18" rx="2" opacity="0.3" />
      <rect x="6" y="6" width="12" height="12" rx="1" opacity="0.5" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}
