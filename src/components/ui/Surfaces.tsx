import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
}

interface PanelProps extends SurfaceProps {
  as?: 'aside' | 'div' | 'section';
  isHidden?: boolean;
}

function joinClasses(classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function Card({
  children,
  className,
  ariaLabel,
  ariaLabelledBy,
  ...props
}: SurfaceProps) {
  return (
    <section
      {...props}
      className={joinClasses(['vr-card', className])}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      {children}
    </section>
  );
}

export const Panel = forwardRef<HTMLElement, PanelProps>(function Panel({
  as: Component = 'section',
  children,
  className,
  ariaLabel,
  ariaLabelledBy,
  isHidden,
  ...props
}, ref) {
  const SurfaceComponent = Component as 'section';

  return (
    <SurfaceComponent
      {...props}
      ref={ref}
      className={joinClasses(['vr-panel', className])}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-hidden={isHidden}
    >
      {children}
    </SurfaceComponent>
  );
});
