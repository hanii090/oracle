import { IconProps } from './types';

interface ChevronIconProps extends IconProps {
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function ChevronIcon({ size = 24, strokeWidth = 1.5, direction = 'right', className, ...props }: ChevronIconProps) {
  const rotations = {
    up: 'rotate(-90)',
    down: 'rotate(90)',
    left: 'rotate(180)',
    right: 'rotate(0)',
  };

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
      style={{ transform: rotations[direction] }}
      {...props}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
