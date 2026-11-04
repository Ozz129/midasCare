import { UserRound } from 'lucide-react';
import { cn } from '../../utils/cn';

const sizes = {
  sm: 'size-8 text-caption [&_svg]:size-4',
  md: 'size-10 text-label [&_svg]:size-5',
  lg: 'size-12 text-body [&_svg]:size-6',
  xl: 'size-24 text-section-title [&_svg]:size-10',
} as const;

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export interface AvatarProps {
  /** Nombre real de la persona. Sin nombre se muestra un icono genérico. */
  name?: string;
  /** URL de la foto. Si falta, se muestran las iniciales. */
  src?: string;
  size?: keyof typeof sizes;
  className?: string;
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const label = name?.trim();
  return (
    <span
      role="img"
      aria-label={label ? label : 'Usuario'}
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill font-semibold select-none',
        label ? 'bg-primary-soft text-primary-hover' : 'bg-surface-muted text-muted',
        sizes[size],
        className,
      )}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" draggable={false} />
      ) : label ? (
        initials(label)
      ) : (
        <UserRound aria-hidden="true" />
      )}
    </span>
  );
}
