import { BrandLogo } from '../../components/brand/BrandLogo';
import { Spinner } from '../../components/ui/Spinner';

/** Pantalla de carga mientras se restaura la sesión. */
export function FullPageLoader() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 bg-background">
      <BrandLogo variant="compact" size="lg" />
      <Spinner size="lg" label="Cargando" className="text-primary" />
    </div>
  );
}
