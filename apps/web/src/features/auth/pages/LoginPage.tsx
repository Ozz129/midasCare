import { Mail } from 'lucide-react';
import { type FormEvent, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { SocialAuthButtons } from '../../../components/auth/SocialAuthButtons';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { Tooltip } from '../../../components/ui/Tooltip';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { ApiError } from '../../../services/api/client';
import { loginErrorMessage } from '../login-errors';
import {
  hasErrors,
  type LoginFormErrors,
  type LoginFormValues,
  validateLoginForm,
} from '../login-validation';
import { signIn } from '../session-store';

export function LoginPage() {
  useDocumentTitle('Iniciar sesión');
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [values, setValues] = useState<LoginFormValues>({ email: '', password: '' });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const update = (field: keyof LoginFormValues, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    setServerError(null);
    if (attempted) setErrors(validateLoginForm(next));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setAttempted(true);

    const nextErrors = validateLoginForm(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      (nextErrors.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      await signIn(values.email.trim(), values.password);
      navigate(from ?? '/', { replace: true });
    } catch (error) {
      setServerError(loginErrorMessage(error));
      setSubmitting(false);
      if (error instanceof ApiError && error.status === 401) {
        setValues((current) => ({ ...current, password: '' }));
        // Espera a que el campo se rehabilite antes de enfocarlo.
        requestAnimationFrame(() => passwordRef.current?.focus());
      }
    }
  };

  return (
    <div>
      <h1 className="text-page-title font-semibold text-navy">Bienvenido a MIDAS CARE</h1>
      <p className="mt-2 text-body text-muted">
        Tu espacio para brindar una atención más organizada, segura y humana.
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        {serverError && <Alert tone="danger" title={serverError} live />}

        <Input
          ref={emailRef}
          label="Correo electrónico"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="nombre@consulta.com"
          required
          disabled={submitting}
          leadingIcon={<Mail />}
          value={values.email}
          error={errors.email}
          onChange={(event) => update('email', event.target.value)}
        />

        <PasswordInput
          ref={passwordRef}
          label="Contraseña"
          name="password"
          autoComplete="current-password"
          required
          disabled={submitting}
          value={values.password}
          error={errors.password}
          onChange={(event) => update('password', event.target.value)}
        />

        <div className="flex justify-end">
          <Tooltip
            content="La recuperación de contraseña estará disponible próximamente"
            align="end"
          >
            <button
              type="button"
              aria-disabled="true"
              className="cursor-not-allowed rounded text-label font-medium text-muted focus-ring"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </Tooltip>
        </div>

        <Button type="submit" size="lg" fullWidth loading={submitting}>
          {submitting ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>

      <div className="mt-8">
        <SocialAuthButtons mode="login" />
      </div>

      <p className="mt-8 text-center text-label text-muted">
        ¿Aún no tienes cuenta?{' '}
        <Link
          to="/register"
          className="rounded font-semibold text-primary hover:text-primary-hover focus-ring"
        >
          Crea una cuenta
        </Link>
      </p>
    </div>
  );
}
