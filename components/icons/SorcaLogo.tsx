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
      {/* Rounded container */}
      <rect x="2" y="2" width="20" height="20" rx="5" opacity="0.2" />
      {/* S lettermark */}
      <path
        d="M15 9.5C15 7.8 13.7 6.5 12 6.5C10 6.5 8.5 7.8 8.5 9.5C8.5 11.5 10 12.3 12 13C14 13.7 15.5 14.5 15.5 16.5C15.5 18.2 14 19.5 12 19.5C10 19.5 8.8 18.2 9 16.5"
      />
    </svg>
  );
}
