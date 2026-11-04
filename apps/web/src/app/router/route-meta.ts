import { useMatches } from 'react-router';

export interface Breadcrumb {
  label: string;
  to?: string;
}

/** Metadatos declarados en `handle` de cada ruta. */
export interface RouteHandle {
  title: string;
  breadcrumbs?: Breadcrumb[];
}

function isRouteHandle(value: unknown): value is RouteHandle {
  return typeof value === 'object' && value !== null && 'title' in value;
}

/** Título y migas de la ruta activa más profunda. */
export function useRouteMeta(): RouteHandle {
  const matches = useMatches();
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const handle = matches[index]?.handle;
    if (isRouteHandle(handle)) return handle;
  }
  return { title: 'MIDAS CARE' };
}
