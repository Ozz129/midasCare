import { createBrowserRouter, type RouteObject } from 'react-router';
import { Spinner } from '../../components/ui/Spinner';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { RegisterPage } from '../../features/auth/pages/RegisterPage';
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';
import { ProfilePage } from '../../features/profile/pages/ProfilePage';
import { SettingsPage } from '../../features/settings/pages/SettingsPage';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { NotFoundPage } from './NotFoundPage';
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute';
import { type RouteHandle } from './route-meta';
import { RouteErrorBoundary } from './RouteErrorBoundary';

const home = { label: 'Inicio', to: '/' };

/** Rutas solo de desarrollo (no se incluyen en el build de producción). */
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: '/design-system',
        handle: { title: 'Guía de componentes', breadcrumbs: [home] } satisfies RouteHandle,
        hydrateFallbackElement: (
          <div className="flex justify-center p-12 text-primary">
            <Spinner size="lg" label="Cargando guía de componentes" />
          </div>
        ),
        lazy: async () => ({
          Component: (await import('../../features/design-system/pages/DesignSystemPage'))
            .DesignSystemPage,
        }),
      },
    ]
  : [];

/**
 * Mapa de rutas.
 * - /login y /register: solo sin sesión (con sesión redirigen al panel).
 * - Todo el área de la aplicación (AppLayout) exige sesión (ProtectedRoute).
 * - Las secciones clínicas (pacientes, historias, atenciones) aún no tienen ruta.
 */
export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <PublicOnlyRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: '/login', element: <LoginPage /> },
              { path: '/register', element: <RegisterPage /> },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                index: true,
                element: <DashboardPage />,
                handle: { title: 'Panel principal' } satisfies RouteHandle,
              },
              {
                path: '/profile',
                element: <ProfilePage />,
                handle: { title: 'Mi perfil', breadcrumbs: [home] } satisfies RouteHandle,
              },
              {
                path: '/settings',
                element: <SettingsPage />,
                handle: { title: 'Configuración', breadcrumbs: [home] } satisfies RouteHandle,
              },
              ...devRoutes,
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
