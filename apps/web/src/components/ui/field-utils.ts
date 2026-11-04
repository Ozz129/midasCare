import { type ReactNode, useId } from 'react';
import { cn } from '../../utils/cn';

export function useFieldIds(id?: string) {
  const generated = useId();
  const controlId = id ?? generated;
  return { controlId, hintId: `${controlId}-hint`, errorId: `${controlId}-error` };
}

export function describedBy(
  ids: { hintId: string; errorId: string },
  { hint, error }: { hint?: ReactNode; error?: ReactNode },
  extra?: string,
): string | undefined {
  const value = [extra, error ? ids.errorId : hint ? ids.hintId : undefined]
    .filter(Boolean)
    .join(' ');
  return value || undefined;
}

/** Clases compartidas por Input, Textarea y Select. */
export function controlClassName(hasError: boolean, className?: string): string {
  return cn(
    'w-full rounded-control border bg-surface text-body text-text placeholder:text-muted transition-interactive',
    'outline-none focus:ring-[3px]',
    hasError
      ? 'border-danger focus:border-danger focus:ring-danger/20'
      : 'border-input-border hover:border-text focus:border-primary focus:ring-primary/20',
    'disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-muted disabled:text-muted',
    'read-only:bg-surface-muted',
    className,
  );
}
