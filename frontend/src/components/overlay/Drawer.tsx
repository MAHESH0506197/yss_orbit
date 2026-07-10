// src/components/overlay/Drawer.tsx
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DrawerSide = 'right' | 'left' | 'top' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Which edge to slide from */
  side?: DrawerSide;
  size?: DrawerSize;
  /** Drawer title shown in the header */
  title?: string;
  /** Subtitle / description */
  description?: string;
  /** Footer slot (e.g. action buttons) */
  footer?: React.ReactNode;
  /** Close on backdrop click */
  closeOnBackdrop?: boolean;
  className?: string;
  children: React.ReactNode;
}

// ─── Tokens ──────────────────────────────────────────────────────────────────

const SLIDE: Record<DrawerSide, { closed: string; open: string; dimension: string }> = {
  right:  { closed: 'translate-x-full',   open: 'translate-x-0', dimension: 'inset-y-0 right-0' },
  left:   { closed: '-translate-x-full',  open: 'translate-x-0', dimension: 'inset-y-0 left-0' },
  top:    { closed: '-translate-y-full',  open: 'translate-y-0', dimension: 'inset-x-0 top-0' },
  bottom: { closed: 'translate-y-full',   open: 'translate-y-0', dimension: 'inset-x-0 bottom-0' },
};

const SIZES: Record<DrawerSize, Record<DrawerSide, string>> = {
  sm:   { right: 'w-80',   left: 'w-80',   top: 'h-64',  bottom: 'h-64' },
  md:   { right: 'w-96',   left: 'w-96',   top: 'h-80',  bottom: 'h-80' },
  lg:   { right: 'w-[480px]', left: 'w-[480px]', top: 'h-[380px]', bottom: 'h-[380px]' },
  xl:   { right: 'w-[600px]', left: 'w-[600px]', top: 'h-[480px]', bottom: 'h-[480px]' },
  full: { right: 'w-screen', left: 'w-screen', top: 'h-screen', bottom: 'h-screen' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  side = 'right',
  size = 'md',
  title,
  description,
  footer,
  closeOnBackdrop = true,
  className,
  children,
}) => {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Keyboard close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const { closed, open, dimension } = SLIDE[side];
  const sizeCls = SIZES[size][side];

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Drawer'}
        className={cn(
          'fixed z-50 flex flex-col bg-background shadow-2xl',
          'transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          dimension,
          sizeCls,
          isOpen ? open : closed,
          className,
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
            <div>
              {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 border-t border-border px-5 py-4 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </>,
    document.body,
  );
};

export default Drawer;
