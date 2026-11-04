import techSymbol from '../../assets/brand/midas-tech-symbol.png';
import { cn } from '../../utils/cn';

export interface MidasTechLogoProps {
  /**
   * `inline`: símbolo + "Midas Tech" para superficies oscuras (navy).
   * `badge`: el mismo conjunto dentro de una pastilla oscura, para fondos claros.
   *
   * El logotipo de MIDAS TECH está diseñado sobre negro: su dorado pierde
   * contraste sobre fondos claros, por eso allí se usa siempre la pastilla.
   */
  variant?: 'inline' | 'badge';
  size?: 'sm' | 'md';
  className?: string;
}

const symbolSizes = { sm: 'h-5', md: 'h-7' } as const;
const textSizes = { sm: 'text-label', md: 'text-body' } as const;

/** Firma corporativa de MIDAS TECH (ecosistema al que pertenece MIDAS CARE). */
export function MidasTechLogo({ variant = 'inline', size = 'sm', className }: MidasTechLogoProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2',
        variant === 'badge' && 'rounded-control bg-navy-deep px-3 py-2 shadow-card',
        className,
      )}
    >
      <img
        src={techSymbol}
        width={160}
        height={135}
        alt=""
        aria-hidden="true"
        decoding="async"
        draggable={false}
        className={cn('w-auto shrink-0 object-contain select-none', symbolSizes[size])}
      />
      <span className={cn('font-medium tracking-wide text-white/85', textSizes[size])}>
        Midas Tech
      </span>
    </span>
  );
}
