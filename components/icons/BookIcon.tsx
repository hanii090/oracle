import { IconProps } from './types';

export function BookIcon({ size = 24, strokeWidth = 1.5, className, ...props }: IconProps) {
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
      {/* Open book with pages fanning - knowledge spreading */}
      <path d="M12 6c-2 0-4 .5-6 1.5V19c2-.8 4-1 6-1" />
      <path d="M12 6c2 0 4 .5 6 1.5V19c-2-.8-4-1-6-1" />
      <path d="M12 6V18" strokeOpacity="0.4" />
      {/* Light rays suggesting enlightenment */}
      <path d="M12 3v1" strokeOpacity="0.5" />
      <path d="M8 4l.5.8" strokeOpacity="0.4" />
      <path d="M16 4l-.5.8" strokeOpacity="0.4" />
      {/* Gentle bookmark */}
      <path d="M15 8v4l-1.5-1-1.5 1V8" strokeOpacity="0.6" fill="none" />
    </svg>
  );
}
