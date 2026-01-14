import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?:
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'success'
    | 'ghost'
    | 'outline'
    | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: Props) {
  const base =
    'inline-flex items-center justify-center rounded-lg font-bold transition-all active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-8 py-3.5 text-base rounded-xl',
  };

  const variants: Record<NonNullable<Props['variant']>, string> = {
    primary:
      'border border-primary bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-90 hover:shadow-primary/30 dark:border-primary/50 dark:bg-primary/20 dark:text-primary dark:shadow-primary/10 dark:hover:bg-primary/30',
    secondary:
      'border border-border bg-surface text-text hover:bg-bg dark:hover:bg-bg/50',
    accent:
      'border border-accent bg-accent text-white shadow-lg shadow-accent/20 hover:opacity-90 hover:shadow-accent/30 dark:border-accent/50 dark:bg-accent/20 dark:text-accent dark:shadow-accent/10 dark:hover:bg-accent/30',
    success:
      'border border-success bg-success text-white shadow-lg shadow-success/20 hover:opacity-90 hover:shadow-success/30 dark:border-success/50 dark:bg-success/20 dark:text-success dark:shadow-success/10 dark:hover:bg-success/30',
    danger:
      'border border-danger bg-danger text-white shadow-lg shadow-danger/20 hover:opacity-90 hover:shadow-danger/30 dark:border-danger/50 dark:bg-danger/20 dark:text-danger dark:shadow-danger/10 dark:hover:bg-danger/30',
    ghost:
      'bg-transparent text-text border border-transparent hover:bg-surface hover:border-border',
    outline: 'border border-border bg-transparent text-text hover:bg-surface',
  };

  return (
    <button
      {...rest}
      className={[base, sizes[size], variants[variant], className]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
