import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const tones: Record<AlertTone, { className: string; Icon: typeof Info; srLabel: string }> = {
  info: { className: 'bg-info-soft border-info/25 text-info', Icon: Info, srLabel: 'Información' },
  success: {
    className: 'bg-success-soft border-success/25 text-success-strong',
    Icon: CircleCheck,
    srLabel: 'Correcto',
  },
  warning: {
    className: 'bg-warning-soft border-warning/25 text-warning',
    Icon: TriangleAlert,
    srLabel: 'Aviso',
  },
  danger: {
    className: 'bg-danger-soft border-danger/25 text-danger',
    Icon: CircleAlert,
    srLabel: 'Error',
  },
};

export interface AlertProps {
  tone?: AlertTone;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  /**
   * Anuncia el contenido al aparecer (role="status", o "alert" para errores).
   * Usar solo para mensajes que surgen tras una acción del usuario.
   */
  live?: boolean;
  className?: string;
}

export function Alert({ tone = 'info', title, children, action, live, className }: AlertProps) {
  const { className: toneClass, Icon, srLabel } = tones[tone];
  const role = live ? (tone === 'danger' ? 'alert' : 'status') : undefined;

  return (
    <div role={role} className={cn('flex gap-3 rounded-card border p-4', toneClass, className)}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-label font-semibold">
          <span className="sr-only">{srLabel}: </span>
          {title}
        </p>
        {children && <div className="mt-1 text-label text-text">{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
