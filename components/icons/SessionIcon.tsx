import { IconProps } from './types';

export function SessionIcon({ size = 24, strokeWidth = 1.5, className, ...props }: IconProps) {
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
      <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9" />
      <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5" />
      <path d="M12 11c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" fill="currentColor" stroke="none" />
      <path d="M21 12h-6" />
      <path d="M18 9l3 3-3 3" />
    </svg>
  );
}
