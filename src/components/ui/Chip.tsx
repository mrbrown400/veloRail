import type { HTMLAttributes, ReactNode } from 'react';

type ChipTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'future';

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
  icon?: ReactNode;
}

function joinClasses(classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function Chip({
  tone = 'neutral',
  icon,
  className,
  children,
  ...props
}: ChipProps) {
  return (
    <span
      {...props}
      className={joinClasses(['vr-chip', `vr-chip--${tone}`, className])}
    >
      {icon}
      {children}
    </span>
  );
}
