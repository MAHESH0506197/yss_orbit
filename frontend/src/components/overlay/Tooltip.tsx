// src/components/overlay/Tooltip.tsx
import React, { useRef, useState, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /** Tooltip text or JSX */
  content: React.ReactNode;
  /** Placement relative to the trigger */
  placement?: TooltipPlacement;
  /** Show delay in ms */
  delay?: number;
  /** Max width of the tooltip bubble */
  maxWidth?: string;
  /** Disable the tooltip entirely */
  disabled?: boolean;
  /** The trigger element */
  children: React.ReactElement;
  className?: string;
}

// ─── Arrow / position helpers ─────────────────────────────────────────────────

function getPopoverStyle(
  rect: DOMRect,
  placement: TooltipPlacement,
  scrollX: number,
  scrollY: number,
): React.CSSProperties {
  const GAP = 8;
  switch (placement) {
    case 'top':    return { left: rect.left + rect.width / 2 + scrollX, top: rect.top + scrollY - GAP, transform: 'translate(-50%, -100%)' };
    case 'bottom': return { left: rect.left + rect.width / 2 + scrollX, top: rect.bottom + scrollY + GAP, transform: 'translateX(-50%)' };
    case 'left':   return { left: rect.left + scrollX - GAP, top: rect.top + rect.height / 2 + scrollY, transform: 'translate(-100%, -50%)' };
    case 'right':  return { left: rect.right + scrollX + GAP, top: rect.top + rect.height / 2 + scrollY, transform: 'translateY(-50%)' };
  }
}

const ARROW: Record<TooltipPlacement, string> = {
  top:    'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-gray-900 dark:border-t-gray-700',
  bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-t-transparent border-b-gray-900 dark:border-b-gray-700',
  left:   'right-0 top-1/2 -translate-y-1/2 translate-x-full border-t-transparent border-b-transparent border-r-transparent border-l-gray-900 dark:border-l-gray-700',
  right:  'left-0 top-1/2 -translate-y-1/2 -translate-x-full border-t-transparent border-b-transparent border-l-transparent border-r-gray-900 dark:border-r-gray-700',
};

// ─── Component ───────────────────────────────────────────────────────────────

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  placement = 'top',
  delay = 150,
  maxWidth = '220px',
  disabled = false,
  children,
  className,
}) => {
  const id         = useId();
  const triggerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible, setVisible]   = useState(false);
  const [style, setStyle]       = useState<React.CSSProperties>({});

  const show = useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setStyle(getPopoverStyle(rect, placement, window.scrollX, window.scrollY));
      setVisible(true);
    }, delay);
  }, [disabled, delay, placement]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  // Clone child to inject ref + aria
  const child = React.cloneElement(children, {
    ref:             triggerRef,
    'aria-describedby': visible ? id : undefined,
    onMouseEnter:    show,
    onMouseLeave:    hide,
    onFocus:         show,
    onBlur:          hide,
  } as Record<string, unknown>);

  return (
    <>
      {child}
      {!disabled && visible && createPortal(
        <div
          id={id}
          role="tooltip"
          style={{ ...style, maxWidth, position: 'absolute', zIndex: 9999 }}
          className={cn(
            'pointer-events-none rounded-lg bg-gray-900 dark:bg-gray-700 px-2.5 py-1.5',
            'text-xs font-medium text-white leading-snug shadow-xl',
            'animate-in fade-in zoom-in-95 duration-150',
            className,
          )}
        >
          {content}
          {/* Arrow */}
          <span
            aria-hidden="true"
            className={cn('absolute h-0 w-0 border-4', ARROW[placement])}
          />
        </div>,
        document.body,
      )}
    </>
  );
};

export default Tooltip;
