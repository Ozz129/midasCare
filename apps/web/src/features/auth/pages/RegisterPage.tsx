import { PASSWORD_MIN_LENGTH, SPECIALTIES } from '@care/api-contracts';
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, Mail, UserRound } from 'lucide-react';
import { type FormEvent, type RefObject, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { SocialAuthButtons } from '../../../components/auth/SocialAuthButtons';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { Select } from '../../../components/ui/Select';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { ApiError } from '../../../services/api/client';
import { cn } from '../../../utils/cn';
import { registerErrorMessage } from '../login-errors';
import {
  passwordStrength,
  REGISTER_STEPS,
  type RegisterFormErrors,
  type RegisterFormValues,
  type RegisterStep,
  validateRegisterForm,
  validateRegisterStep,
} from '../register-validation';
import { signUp } from '../session-store';

const EMPTY: RegisterFormValues = {
  givenName: '',
  familyName: '',
  email: '',
  password: '',
  confirmPassword: '',
  specialty: '',
  licenseNumber: '',
  workspaceName: '',
};

const STEPS: Array<{ id: RegisterStep; title: string; description: string }> = [
  { id: 'account', title: 'Tu cuenta', description: 'Datos de acceso' },
  { id: 'practice', title: 'Tu práctica', description: 'Perfil profesional' },
];

const specialtyOptions = SPECIALTIES.map(({ code, label }) => ({ value: code, label }));

const strengthConfig = {
  empty: { label: '', filled: 0, bar: '', text: '' },
  short: { label: 'Muy corta', filled: 1, bar: 'bg-danger', text: 'text-danger' },
  fair: { label: 'Aceptable', filled: 2, bar: 'bg-warning', text: 'text-warning' },
  strong: { label: 'Segura', filled: 3, bar: 'bg-success', text: 'text-success-strong' },
} as const;

/** Indicador de seguridad: barra + texto (no depende solo del color). */
function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = passwordStrength(password);
  const config = strengthConfig[strength];
  if (strength === 'empty') return null;

  return (
    <div className="-mt-3 flex items-center gap-3" aria-live="polite">
      <div className="flex flex-1 gap-1" aria-hidden="true">
        {[1, 2, 3].map((segment) => (
          <span
            key={segment}
            className={cn(
              'h-1 flex-1 rounded-pill transition-interactive',
              segment <= config.filled ? config.bar : 'bg-border',
            )}
          />
        ))}
      </div>
      <span className={cn('text-caption font-medium', config.text)}>Seguridad: {config.label}</span>
    </div>
  );
}

/** Indicador de pasos accesible ("Paso 1 de 2"). */
function StepIndicator({ current }: { current: RegisterStep }) {
  const index = STEPS.findIndex((step) => step.id === current);
  return (
    <nav aria-label="Progreso del registro" className="mt-6">
      <p className="sr-only" aria-live="polite">
        Paso {index + 1} de {STEPS.length}: {STEPS[index]?.title}
      </p>
      <ol className="grid grid-cols-2 gap-3" aria-hidden="true">
        {STEPS.map((step, position) => {
          const done = position < index;
          const active = position === index;
          return (
            <li key={step.id}>
              <span
                className={cn(
                  'block h-1 rounded-pill transition-interactive',
                  done || active ? 'bg-primary' : 'bg-border',
                )}
              />
              <span
                className={cn(
                  'mt-2 block text-caption font-semibold',
                  active ? 'text-primary-hover' : done ? 'text-text' : 'text-muted',
                )}
              >
                {position + 1}. {step.title}
              </span>
              <span className="block text-caption text-muted">{step.description}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function RegisterPage() {
  useDocumentTitle('Crear cuenta');
  const navigate = useNavigate();

  const [step, setStep] = useState<RegisterStep>('account');
  const [values, setValues] = useState<RegisterFormValues>(EMPTY);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [attempted, setAttempted] = useState<Record<RegisterStep, boolean>>({
    account: false,
    practice: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const givenNameRef = useRef<HTMLInputElement>(null);
  const familyNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const specialtyRef = useRef<HTMLSelectElement>(null);
  const licenseNumberRef = useRef<HTMLInputElement>(null);
  const workspaceNameRef = useRef<HTMLInputElement>(null);

  const focusField = (field: keyof RegisterFormValues) => {
    const refs: Record<keyof RegisterFormValues, RefObject<HTMLElement | null>> = {
      givenName: givenNameRef,
      familyName: familyNameRef,
      email: emailRef,
      password: passwordRef,
      confirmPassword: confirmPasswordRef,
      specialty: specialtyRef,
      licenseNumber: licenseNumberRef,
      workspaceName: workspaceNameRef,
    };
    requestAnimationFrame(() => refs[field].current?.focus());
  };

  const focusFirstError = (target: RegisterStep, fieldErrors: RegisterFormErrors) => {
    const first = REGISTER_STEPS[target].find((field) => fieldErrors[field]);
    if (first) focusField(first);
  };

  const update = (field: keyof RegisterFormValues, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    setServerError(null);
    if (attempted[step]) setErrors(validateRegisterStep(step, next));
  };

  const goToPractice = () => {
    setAttempted((current) => ({ ...current, account: true }));
    const stepErrors = validateRegisterStep('account', values);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      focusFirstError('account', stepErrors);
      return;
    }
    setStep('practice');
    focusField('specialty');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    if (step === 'account') {
      goToPractice();
      return;
    }

    setAttempted((current) => ({ ...current, practice: true }));
    const accountErrors = validateRegisterStep('account', values);
    if (Object.keys(accountErrors).length > 0) {
      setStep('account');
      setErrors(accountErrors);
      focusFirstError('account', accountErrors);
      return;
    }
    const allErrors = validateRegisterForm(values);
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      focusFirstError('practice', allErrors);
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      const workspaceName = values.workspaceName.trim();
      const licenseNumber = values.licenseNumber.trim();
      await signUp({
        givenName: values.givenName.trim(),
        familyName: values.familyName.trim(),
        email: values.email.trim(),
        password: values.password,
        specialty: values.specialty,
        ...(licenseNumber ? { licenseNumber } : {}),
        ...(workspaceName ? { workspaceName } : {}),
      });
      navigate('/', { replace: true });
    } catch (error) {
      setSubmitting(false);
      setServerError(registerErrorMessage(error));
      if (error instanceof ApiError && error.status === 409) {
        // El correo pertenece al primer paso: se vuelve a él con el campo marcado.
        setStep('account');
        setErrors({ email: 'Este correo ya está registrado.' });
        focusField('email');
      }
    }
  };

  const duplicateEmail = serverError?.startsWith('Ya existe') ?? false;

  return (
    <div>
      <h1 className="text-page-title font-semibold text-navy">Crea tu cuenta</h1>
      <p className="mt-2 text-body text-muted">
        Empieza a organizar tu práctica clínica en minutos.
      </p>

      <StepIndicator current={step} />

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        {serverError && (
          <Alert
            tone="danger"
            title={serverError}
            live
            action={
              duplicateEmail ? (
                <Link
                  to="/login"
                  className="rounded text-label font-semibold text-danger underline focus-ring"
                >
                  Ir a iniciar sesión
                </Link>
              ) : undefined
            }
          />
        )}

        {step === 'account' ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                ref={givenNameRef}
                label="Nombre"
                name="givenName"
                autoComplete="given-name"
                required
                leadingIcon={<UserRound />}
                value={values.givenName}
                error={errors.givenName}
                onChange={(event) => update('givenName', event.target.value)}
              />
              <Input
                ref={familyNameRef}
                label="Apellidos"
                name="familyName"
                autoComplete="family-name"
                required
                value={values.familyName}
                error={errors.familyName}
                onChange={(event) => update('familyName', event.target.value)}
              />
            </div>

            <Input
              ref={emailRef}
              label="Correo electrónico"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              placeholder="nombre@consulta.com"
              required
              leadingIcon={<Mail />}
              value={values.email}
              error={errors.email}
              onChange={(event) => update('email', event.target.value)}
            />

            <PasswordInput
              ref={passwordRef}
              label="Contraseña"
              name="password"
              autoComplete="new-password"
              required
              hint={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres. Una frase larga es fácil de recordar y segura.`}
              value={values.password}
              error={errors.password}
              onChange={(event) => update('password', event.target.value)}
            />
            <PasswordStrengthMeter password={values.password} />

            <PasswordInput
              ref={confirmPasswordRef}
              label="Confirmar contraseña"
              name="confirmPassword"
              autoComplete="new-password"
              required
              value={values.confirmPassword}
              error={errors.confirmPassword}
              onChange={(event) => update('confirmPassword', event.target.value)}
            />

            <Button type="submit" size="lg" fullWidth>
              Continuar
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </>
        ) : (
          <>
            <Select
              ref={specialtyRef}
              label="Especialidad principal"
              name="specialty"
              required
              placeholder="Selecciona tu especialidad"
              options={specialtyOptions}
              disabled={submitting}
              hint="Podrás añadir más especialidades desde tu perfil."
              value={values.specialty}
              error={errors.specialty}
              onChange={(event) => update('specialty', event.target.value)}
            />

            <Input
              ref={licenseNumberRef}
              label="Número de registro profesional"
              name="licenseNumber"
              disabled={submitting}
              leadingIcon={<BadgeCheck />}
              hint="Colegiatura o registro sanitario. Opcional."
              value={values.licenseNumber}
              error={errors.licenseNumber}
              onChange={(event) => update('licenseNumber', event.target.value)}
            />

            <Input
              ref={workspaceNameRef}
              label="Nombre de tu consulta"
              name="workspaceName"
              autoComplete="organization"
              placeholder={
                `${values.givenName} ${values.familyName}`.trim() || 'Consulta Ana Pérez'
              }
              disabled={submitting}
              leadingIcon={<Building2 />}
              hint="Opcional. Si lo dejas vacío usaremos tu nombre completo."
              value={values.workspaceName}
              error={errors.workspaceName}
              onChange={(event) => update('workspaceName', event.target.value)}
            />

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Button
                variant="secondary"
                size="lg"
                disabled={submitting}
                leadingIcon={<ArrowLeft className="size-4" aria-hidden="true" />}
                onClick={() => {
                  setStep('account');
                  setErrors({});
                  setServerError(null);
                }}
              >
                Atrás
              </Button>
              <Button type="submit" size="lg" className="flex-1" loading={submitting}>
                {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
              </Button>
            </div>
          </>
        )}
      </form>

      {step === 'account' && (
        <div className="mt-8">
          <SocialAuthButtons mode="register" />
        </div>
      )}

      <p className="mt-8 text-center text-label text-muted">
        ¿Ya tienes una cuenta?{' '}
        <Link
          to="/login"
          className="rounded font-semibold text-primary hover:text-primary-hover focus-ring"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
