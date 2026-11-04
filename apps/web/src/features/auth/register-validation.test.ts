import { describe, expect, it } from 'vitest';
import {
  passwordStrength,
  type RegisterFormValues,
  validateRegisterForm,
  validateRegisterStep,
} from './register-validation';

const valid: RegisterFormValues = {
  givenName: 'Ana',
  familyName: 'Pérez',
  email: 'ana@consulta.com',
  password: 'una-clave-larga-2026',
  confirmPassword: 'una-clave-larga-2026',
  specialty: 'PSYCHOLOGY',
  licenseNumber: '',
  workspaceName: '',
};

describe('validateRegisterForm', () => {
  it('acepta un formulario válido (registro y consulta son opcionales)', () => {
    expect(validateRegisterForm(valid)).toEqual({});
  });

  it('exige una especialidad válida', () => {
    expect(validateRegisterForm({ ...valid, specialty: '' }).specialty).toBeDefined();
    expect(validateRegisterForm({ ...valid, specialty: 'MAGIA' }).specialty).toBeDefined();
  });

  it('valida cada paso por separado', () => {
    const empty = { ...valid, givenName: '', specialty: '' };
    expect(Object.keys(validateRegisterStep('account', empty))).toEqual(['givenName']);
    expect(Object.keys(validateRegisterStep('practice', empty))).toEqual(['specialty']);
  });

  it('exige nombre, apellidos, correo y contraseña', () => {
    const errors = validateRegisterForm({
      ...valid,
      givenName: ' ',
      familyName: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    expect(Object.keys(errors).sort()).toEqual(
      ['confirmPassword', 'email', 'familyName', 'givenName', 'password'].sort(),
    );
  });

  it('exige al menos 12 caracteres de contraseña', () => {
    const errors = validateRegisterForm({ ...valid, password: 'corta', confirmPassword: 'corta' });
    expect(errors.password).toMatch(/12/);
  });

  it('detecta contraseñas que no coinciden', () => {
    expect(
      validateRegisterForm({ ...valid, confirmPassword: 'otra-clave-larga' }).confirmPassword,
    ).toBe('Las contraseñas no coinciden.');
  });

  it('rechaza correos con formato inválido', () => {
    expect(validateRegisterForm({ ...valid, email: 'ana@consulta' }).email).toBeDefined();
  });
});

describe('passwordStrength', () => {
  it.each([
    ['', 'empty'],
    ['corta', 'short'],
    ['solominusculas', 'fair'],
    ['Mezcla-de-tipos1', 'strong'],
    ['una frase larga y fácil de recordar', 'strong'],
  ] as const)('%p -> %s', (password, expected) => {
    expect(passwordStrength(password)).toBe(expected);
  });
});
