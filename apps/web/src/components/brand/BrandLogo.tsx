import logoVertical from '../../assets/brand/midas-care-logo-vertical.png';
import logoWhite from '../../assets/brand/midas-care-logo-white.png';
import logo from '../../assets/brand/midas-care-logo.png';
import symbolWhite from '../../assets/brand/midas-care-symbol-white.png';
import symbol from '../../assets/brand/midas-care-symbol.png';
import { cn } from '../../utils/cn';

export const BRAND_NAME = 'MIDAS CARE';
export const BRAND_TAGLINE = 'Tecnología que cuida.';

export type BrandLogoVariant = 'full' | 'compact' | 'vertical';
export type BrandLogoTone = 'dark' | 'light';
export type BrandLogoSize = 'sm' | 'md' | 'lg' | 'xl';

export interface BrandLogoProps {
  /**
   * `full`: logotipo horizontal (isotipo + MIDAS CARE + eslogan).
   * `compact`: isotipo (corona + corazón).
   * `vertical`: logotipo vertical.
   */
  variant?: BrandLogoVariant;
  /**
   * `dark`: versión a color, para fondos claros.
   * `light`: versión monocroma blanca oficial, para fondos oscuros (sidebar, paneles navy).
   */
  tone?: BrandLogoTone;
  size?: BrandLogoSize;
  className?: string;
}

/*
 * Recursos OFICIALES extraídos de la lámina de marca de MIDAS CARE
 * (src/assets/brand). No se recomponen ni se recolorean: cada variante usa
 * la pieza tal como la define la marca.
 *
 * - No existe versión vertical monocroma oficial: `vertical` + `light`
 *   utiliza el logotipo horizontal blanco.
 */
const assets: Record<
  BrandLogoVariant,
  Record<BrandLogoTone, { src: string; width: number; height: number }>
> = {
  full: {
    dark: { src: logo, width: 941, height: 299 },
    light: { src: logoWhite, width: 422, height: 121 },
  },
  compact: {
    dark: { src: symbol, width: 214, height: 299 },
    light: { src: symbolWhite, width: 94, height: 121 },
  },
  vertical: {
    dark: { src: logoVertical, width: 399, height: 260 },
    light: { src: logoWhite, width: 422, height: 121 },
  },
};

const heights: Record<BrandLogoVariant, Record<BrandLogoSize, string>> = {
  full: { sm: 'h-9', md: 'h-11', lg: 'h-16', xl: 'h-20' },
  compact: { sm: 'h-8', md: 'h-10', lg: 'h-14', xl: 'h-20' },
  vertical: { sm: 'h-20', md: 'h-28', lg: 'h-36', xl: 'h-44' },
};

export function BrandLogo({
  variant = 'full',
  tone = 'dark',
  size = 'md',
  className,
}: BrandLogoProps) {
  const asset = assets[variant][tone];
  const resolvedVariant = variant === 'vertical' && tone === 'light' ? 'full' : variant;

  return (
    <img
      src={asset.src}
      width={asset.width}
      height={asset.height}
      alt={variant === 'compact' ? BRAND_NAME : `${BRAND_NAME}. ${BRAND_TAGLINE}`}
      decoding="async"
      draggable={false}
      className={cn(
        // object-contain: nunca deforma el logotipo aunque un contenedor flex lo estire.
        'w-auto max-w-full shrink-0 object-contain select-none',
        heights[resolvedVariant][size],
        className,
      )}
    />
  );
}
