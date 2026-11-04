import { describe, expect, it } from 'vitest';
import { hasErrors, validateLoginForm } from './login-validation';

describe('validateLoginForm', () => {
  it('exige correo y contraseña', () => {
    const errors = validateLoginForm({ email: '  ', password: '' });
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
    expect(hasErrors(errors)).toBe(true);
  });

  it('rechaza correos con formato inválido', () => {
    expect(validateLoginForm({ email: 'ana@', password: 'x' }).email).toMatch(/válido/);
    expect(validateLoginForm({ email: 'ana consulta.com', password: 'x' }).email).toBeDefined();
  });

  it('acepta valores con formato correcto (sin validar credenciales)', () => {
    const errors = validateLoginForm({ email: ' ana@consulta.com ', password: 'cualquiera' });
    expect(hasErrors(errors)).toBe(false);
  });
});
