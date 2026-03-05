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
      {/* Grounding roots spreading into earth */}
      <path d="M12 12v8" />
      <path d="M12 20c-2 0-4-1-5-2" strokeOpacity="0.6" />
      <path d="M12 20c2 0 4-1 5-2" strokeOpacity="0.6" />
      <path d="M9 18c-1.5-.5-2.5-1-3-2" strokeOpacity="0.4" />
      <path d="M15 18c1.5-.5 2.5-1 3-2" strokeOpacity="0.4" />
      {/* Heart center - emotional grounding */}
      <path d="M12 12c-2-2-4-1-4 1s2 3 4 4c2-1 4-2 4-4s-2-3-4-1z" fill="none" />
      {/* Breath/presence indicator */}
      <circle cx="12" cy="6" r="2" strokeOpacity="0.5" />
      <path d="M12 4v-1" strokeOpacity="0.3" />
    </svg>
  );
}
