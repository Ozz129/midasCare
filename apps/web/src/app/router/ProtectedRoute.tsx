import { Navigate, Outlet, useLocation } from 'react-router';
import { useSession } from '../../features/auth/session';
import { FullPageLoader } from './FullPageLoader';

/**
 * Exige sesión. Mientras se restaura (cookie de refresh) muestra un indicador;
 * sin sesión redirige a /login conservando la ruta de origen.
 */
export function ProtectedRoute() {
  const session = useSession();
  const location = useLocation();

  if (session.status === 'loading') return <FullPageLoader />;
  if (session.status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

/** Solo para usuarios sin sesión (p. ej. /login). Con sesión, va al destino o al panel. */
export function PublicOnlyRoute() {
  const session = useSession();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  if (session.status === 'loading') return <FullPageLoader />;
  if (session.status === 'authenticated') return <Navigate to={from ?? '/'} replace />;
  return <Outlet />;
}
