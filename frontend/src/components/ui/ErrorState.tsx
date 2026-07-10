// yss_orbit/frontend/src/components/ui/ErrorState.tsx
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface ErrorStateProps {
  error: Error;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry, className, compact = false }) => {
  const { t } = useTranslation();
  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 text-center text-destructive",
      compact ? "p-4 gap-2" : "p-8 gap-4",
      className
    )}>
      <AlertTriangle className={cn(compact ? "h-6 w-6" : "h-10 w-10", "opacity-80")} />
      <div className="flex flex-col gap-1">
        <h3 className={cn("font-semibold", compact ? "text-sm" : "text-lg")}>
          {t('error.something_went_wrong', 'Something went wrong')}
        </h3>
        <p className={cn("text-destructive/80 max-w-[400px]", compact ? "text-xs" : "text-sm")}>
          {error.message || t('error.unexpected', 'An unexpected error occurred.')}
        </p>
      </div>
      {onRetry && (
        <Button 
          variant="outline" 
          size={compact ? "sm" : "md"}
          onClick={onRetry} 
          className="mt-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          iconLeft={<RefreshCw className="h-4 w-4" />}
        >
          {t('error.try_again', 'Try Again')}
        </Button>
      )}
    </div>
  );
};
