import { type KeyboardEvent, type ReactNode, useId, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  /** Nombre accesible del grupo de pestañas. */
  label: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

/**
 * Pestañas con patrón ARIA "tabs" y tabindex itinerante:
 * ←/→ cambian de pestaña, Inicio/Fin van a los extremos.
 */
export function Tabs({ items, label, defaultValue, value, onValueChange, className }: TabsProps) {
  const baseId = useId();
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.id);
  const selected = value ?? internal;
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const select = (id: string) => {
    if (value === undefined) setInternal(id);
    onValueChange?.(id);
  };

  const enabled = items.filter((item) => !item.disabled);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = enabled.findIndex((item) => item.id === selected);
    let next: number | undefined;
    if (event.key === 'ArrowRight') next = (currentIndex + 1) % enabled.length;
    if (event.key === 'ArrowLeft') next = (currentIndex - 1 + enabled.length) % enabled.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = enabled.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    const target = enabled[next];
    if (!target) return;
    select(target.id);
    tabRefs.current[items.indexOf(target)]?.focus();
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="flex gap-1 overflow-x-auto border-b border-border"
      >
        {items.map((item, index) => {
          const isSelected = item.id === selected;
          return (
            <button
              key={item.id}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={isSelected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={isSelected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => select(item.id)}
              className={cn(
                '-mb-px border-b-2 px-4 py-2.5 text-label font-medium whitespace-nowrap transition-interactive focus-ring',
                isSelected
                  ? 'border-primary text-primary-hover'
                  : 'border-transparent text-muted hover:border-border hover:text-text',
                'disabled:cursor-not-allowed disabled:opacity-60',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={item.id !== selected}
          tabIndex={0}
          className="pt-4 focus-ring"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
