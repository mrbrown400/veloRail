import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

interface PanelProps extends CardProps {
  as?: 'aside' | 'div' | 'section';
  isHidden?: boolean;
}

function joinClasses(classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function Card({ children, className, ariaLabel }: CardProps) {
  return (
    <section
      className={joinClasses(['vr-card', className])}
      aria-label={ariaLabel}
    >
      {children}
    </section>
  );
}

export function Panel({
  as: Component = 'section',
  children,
  className,
  ariaLabel,
  isHidden
}: PanelProps) {
  return (
    <Component
      className={joinClasses(['vr-panel', className])}
      aria-label={ariaLabel}
      aria-hidden={isHidden}
    >
      {children}
    </Component>
  );
}
