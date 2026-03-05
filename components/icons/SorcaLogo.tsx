import { IconProps } from './types';

export function SorcaLogo({ size = 24, strokeWidth = 1.5, className, ...props }: IconProps) {
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
      {/* Outer circle representing wholeness/journey */}
      <circle cx="12" cy="12" r="10" opacity="0.3" />
      {/* Inner spiral representing depth/introspection */}
      <path 
        d="M12 2 C18 2 22 6 22 12 C22 18 18 22 12 22 C6 22 3 18 3 14 C3 10 6 7 10 7 C14 7 16 10 16 12 C16 14 14 16 12 16 C10 16 9 14 9 13 C9 12 10 11 12 11" 
        opacity="0.8"
      />
      {/* Center dot representing self/core truth */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
