import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'map-toggle';
type ButtonSize = 'sm' | 'md' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  pressed?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

function joinClasses(classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  pressed,
  leftIcon,
  rightIcon,
  className,
  children,
  type = 'button',
  ...props
}, ref) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      aria-pressed={pressed}
      className={joinClasses([
        'vr-button',
        `vr-button--${variant}`,
        `vr-button--${size}`,
        fullWidth && 'vr-button--full',
        pressed && 'vr-button--pressed',
        className
      ])}
    >
      {leftIcon && <span className="vr-button__icon">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="vr-button__icon">{rightIcon}</span>}
    </button>
  );
});

type IconButtonProps = Omit<ButtonProps, 'variant' | 'size' | 'fullWidth'>;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ className, children, ...props }, ref) {
  return (
    <Button
      {...props}
      ref={ref}
      variant="ghost"
      size="icon"
      className={joinClasses(['vr-icon-button', className])}
    >
      {children}
    </Button>
  );
});
