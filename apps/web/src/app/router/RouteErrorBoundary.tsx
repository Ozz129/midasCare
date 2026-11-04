import { TriangleAlert } from 'lucide-react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { Button } from '../../components/ui/Button';
import { buttonClassName } from '../../components/ui/button-styles';

/** Error inesperado durante el renderizado o la navegación. No muestra detalles técnicos. */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : undefined;

  if (import.meta.env.DEV) {
    console.error(error);
  }

  return (
    <main className="flex min-h-full items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-pill bg-danger-soft text-danger">
          <TriangleAlert className="size-6" aria-hidden="true" />
        </span>
        <p className="mt-6 text-label font-semibold text-danger">
          {status ? `Error ${status}` : 'Error inesperado'}
        </p>
        <h1 className="mt-2 text-page-title font-semibold text-navy">Algo salió mal</h1>
        <p className="mt-3 text-body text-muted">
          Se produjo un error inesperado. Intenta recargar la página.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Recargar
          </Button>
          <Link to="/" className={buttonClassName()}>
            Ir al panel
          </Link>
        </div>
      </div>
    </main>
  );
}
