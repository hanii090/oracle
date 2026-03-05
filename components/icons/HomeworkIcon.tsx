import { IconProps } from './types';

export function HomeworkIcon({ size = 24, strokeWidth = 1.5, className, ...props }: IconProps) {
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
      {/* Open journal/notebook with organic curves */}
      <path d="M4 19.5c0-1.4 1.1-2.5 2.5-2.5H12" />
      <path d="M4 4.5C4 3.1 5.1 2 6.5 2H12v15H6.5C5.1 17 4 18.1 4 19.5V4.5z" />
      <path d="M12 2h5.5C18.9 2 20 3.1 20 4.5v15c0-1.4-1.1-2.5-2.5-2.5H12" />
      {/* Pen/quill suggesting writing/reflection */}
      <path d="M15 7l3-3" strokeOpacity="0.7" />
      <path d="M18 4l1.5 1.5" strokeOpacity="0.7" />
      {/* Gentle checkmarks for progress */}
      <path d="M7 10l1 1 2-2" strokeOpacity="0.6" />
      <path d="M7 14l1 1 2-2" strokeOpacity="0.6" />
    </svg>
  );
}
