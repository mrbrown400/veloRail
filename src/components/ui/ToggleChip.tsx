import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Button } from './Button';

interface ToggleChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> {
  pressed: boolean;
  icon?: ReactNode;
}

export function ToggleChip({
  pressed,
  icon,
  children,
  className,
  ...props
}: ToggleChipProps) {
  return (
    <Button
      {...props}
      variant="map-toggle"
      size="sm"
      pressed={pressed}
      className={className}
      leftIcon={icon}
    >
      {children}
    </Button>
  );
}
