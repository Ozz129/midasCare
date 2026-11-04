import { Link } from 'react-router';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { buttonClassName } from '../../components/ui/button-styles';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Página no encontrada');

  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-background px-4 py-12 text-center">
      <BrandLogo size="lg" />
      <p className="mt-12 text-label font-semibold text-primary">Error 404</p>
      <h1 className="mt-2 text-page-title font-semibold text-navy">Página no encontrada</h1>
      <p className="mt-3 max-w-sm text-body text-muted">
        La dirección que buscas no existe o ha cambiado.
      </p>
      <Link to="/" className={buttonClassName({ className: 'mt-8' })}>
        Volver al panel
      </Link>
    </main>
  );
}
