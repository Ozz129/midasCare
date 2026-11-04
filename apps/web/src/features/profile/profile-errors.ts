import { ApiError } from '../../services/api/client';
import { ImageValidationError } from '../../utils/image';

/** Mensaje para el usuario ante un error al subir o guardar el perfil. */
export function profileErrorMessage(error: unknown): string {
  if (error instanceof ImageValidationError) return error.message;
  if (error instanceof ApiError) {
    if (error.status === 413) return 'La imagen supera el tamaño máximo permitido.';
    if (error.status === 400) return error.message || 'Revisa los datos ingresados.';
    if (error.status === 0) return 'No se pudo conectar con el servidor. Inténtalo de nuevo.';
  }
  return 'No se pudieron guardar los cambios. Inténtalo de nuevo.';
}
