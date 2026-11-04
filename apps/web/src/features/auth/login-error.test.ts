import { describe, expect, it } from 'vitest';
import { ApiError } from '../../services/api/client';
import { loginErrorMessage, registerErrorMessage } from './login-errors';

describe('loginErrorMessage', () => {
  it.each([
    [401, 'Correo o contraseña incorrectos.'],
    [429, 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.'],
    [0, 'No se pudo conectar con el servidor. Inténtalo de nuevo.'],
    [400, 'Revisa los datos ingresados.'],
    [500, 'No se pudo iniciar sesión. Inténtalo de nuevo.'],
  ])('traduce el estado %i sin exponer detalles técnicos', (status, expected) => {
    expect(loginErrorMessage(new ApiError(status, 'detalle interno'))).toBe(expected);
  });

  it('usa un mensaje genérico para errores desconocidos', () => {
    expect(loginErrorMessage(new Error('boom'))).toBe(
      'No se pudo iniciar sesión. Inténtalo de nuevo.',
    );
  });
});

describe('registerErrorMessage', () => {
  it.each([
    [409, 'Ya existe una cuenta con ese correo. Inicia sesión.'],
    [429, 'Demasiados intentos de registro. Espera un minuto y vuelve a intentarlo.'],
    [0, 'No se pudo conectar con el servidor. Inténtalo de nuevo.'],
    [500, 'No se pudo crear la cuenta. Inténtalo de nuevo.'],
  ])('traduce el estado %i', (status, expected) => {
    expect(registerErrorMessage(new ApiError(status, 'detalle interno'))).toBe(expected);
  });
});
