import { useEffect } from 'react';

/** Establece el título de la pestaña del navegador para la página actual. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title ? `${title} · MIDAS CARE` : 'MIDAS CARE';
  }, [title]);
}
