import { ApiError } from '../../services/api/client';

/** Traduce un error de inicio de sesión a un mensaje para el usuario (sin detalles técnicos). */
export function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Correo o contraseña incorrectos.';
    if (error.status === 429) return 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.';
    if (error.status === 0) return 'No se pudo conectar con el servidor. Inténtalo de nuevo.';
    if (error.status === 400) return 'Revisa los datos ingresados.';
  }
  return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
}

/** Traduce un error de registro a un mensaje para el usuario (sin detalles técnicos). */
export function registerErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) return 'Ya existe una cuenta con ese correo. Inicia sesión.';
    if (error.status === 429)
      return 'Demasiados intentos de registro. Espera un minuto y vuelve a intentarlo.';
    if (error.status === 0) return 'No se pudo conectar con el servidor. Inténtalo de nuevo.';
    if (error.status === 400) return 'Revisa los datos ingresados.';
  }
  return 'No se pudo crear la cuenta. Inténtalo de nuevo.';
}
