// src/components/forms/SearchInput.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SearchInputSize = 'sm' | 'md' | 'lg';

export interface SearchInputProps {
  /** Controlled value */
  value?: string;
  /** Default value (uncontrolled) */
  defaultValue?: string;
  /** Fires when the (debounced) value changes */
  onChange?: (value: string) => void;
  /** Fires immediately on every keystroke */
  onChangeImmediate?: (value: string) => void;
  placeholder?: string;
  size?: SearchInputSize;
  /** Debounce delay in ms (default 300) */
  debounce?: number;
  /** Show a loading spinner instead of search icon while debouncing */
  loading?: boolean;
  /** Disable interaction */
  disabled?: boolean;
  /** Show keyboard shortcut hint, e.g. "⌘K" */
  shortcutHint?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  className?: string;
}

// ─── Sizes ────────────────────────────────────────────────────────────────────

const SIZES: Record<SearchInputSize, { wrapper: string; icon: number; input: string; hint: string }> = {
  sm: { wrapper: 'h-8  px-2.5 gap-1.5', icon: 13, input: 'text-xs',   hint: 'text-[10px]' },
  md: { wrapper: 'h-10 px-3   gap-2',   icon: 15, input: 'text-sm',   hint: 'text-xs' },
  lg: { wrapper: 'h-12 px-4   gap-2.5', icon: 17, input: 'text-base', hint: 'text-xs' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export const SearchInput: React.FC<SearchInputProps> = ({
  value: controlledValue,
  defaultValue = '',
  onChange,
  onChangeImmediate,
  placeholder = 'Search…',
  size = 'md',
  debounce = 300,
  loading = false,
  disabled = false,
  shortcutHint,
  autoFocus = false,
  className,
}) => {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = isControlled ? controlledValue : internalValue;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);

  // Auto-focus
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      if (!isControlled) setInternalValue(v);
      onChangeImmediate?.(v);

      if (debounce > 0) {
        setIsDebouncing(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          setIsDebouncing(false);
          onChange?.(v);
        }, debounce);
      } else {
        onChange?.(v);
      }
    },
    [isControlled, debounce, onChange, onChangeImmediate],
  );

  const handleClear = useCallback(() => {
    if (!isControlled) setInternalValue('');
    onChangeImmediate?.('');
    onChange?.('');
    inputRef.current?.focus();
  }, [isControlled, onChange, onChangeImmediate]);

  const { wrapper, icon: iconSize, input: inputCls, hint: hintCls } = SIZES[size];
  const showSpinner  = loading || isDebouncing;
  const showClear    = value.length > 0 && !disabled;
  const showHint     = !value && shortcutHint && !disabled;

  return (
    <div
      className={cn(
        'group relative flex items-center rounded-xl border border-input bg-background',
        'transition-all duration-200',
        'focus-within:border-primary/60 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.10)]',
        disabled ? 'opacity-50 pointer-events-none' : 'hover:border-border-strong',
        wrapper,
        className,
      )}
    >
      {/* Leading icon */}
      <span className="shrink-0 text-muted-foreground transition-colors duration-150 group-focus-within:text-primary">
        {showSpinner
          ? <Loader2 size={iconSize} className="animate-spin" />
          : <Search   size={iconSize} />
        }
      </span>

      {/* Input */}
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        className={cn(
          'flex-1 bg-transparent border-none outline-none',
          'text-foreground placeholder:text-muted-foreground',
          '[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden',
          inputCls,
        )}
      />

      {/* Trailing: shortcut hint OR clear button */}
      {showHint && (
        <span className={cn('shrink-0 px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-mono font-semibold select-none', hintCls)}>
          {shortcutHint}
        </span>
      )}

      {showClear && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
        >
          <X size={10} strokeWidth={3} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
