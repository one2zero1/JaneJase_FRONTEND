import type { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
}>;

export function Modal({ open, onClose, title, size = 'md', children }: Props) {
  if (!open) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${sizes[size]} rounded-2xl border border-border bg-surface p-8 shadow-soft`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-bg hover:text-text"
          aria-label="닫기"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Title */}
        {title && (
          <h2 className="mb-6 text-center text-2xl font-bold text-text">
            {title}
          </h2>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
