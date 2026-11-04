import { type MyProfileResponse } from '@care/api-contracts';
import { BadgeCheck, Mail, Stethoscope, UserRound } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { SaveIndicator } from '../../../components/ui/SaveIndicator';
import { profileErrorMessage } from '../profile-errors';
import {
  diffProfile,
  type ProfileFormErrors,
  type ProfileFormValues,
  toFormValues,
  validateProfileForm,
} from '../profile-form';
import { useUpdateProfile } from '../useProfile';
import { SpecialtyPicker } from './SpecialtyPicker';

const timeFormat = new Intl.DateTimeFormat('es', { timeStyle: 'short' });

export function ProfileInfoForm({ profile }: { profile: MyProfileResponse }) {
  const [initial, setInitial] = useState<ProfileFormValues>(() => toFormValues(profile));
  const [values, setValues] = useState<ProfileFormValues>(initial);
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const update = useUpdateProfile();

  const changes = useMemo(() => diffProfile(initial, values), [initial, values]);
  const dirty = Object.keys(changes).length > 0;

  const set = <K extends keyof ProfileFormValues>(field: K, value: ProfileFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setSavedAt(null);
    setServerError(null);
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateProfileForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !dirty) return;

    update.mutate(changes, {
      onSuccess: (saved) => {
        const next = toFormValues(saved);
        setInitial(next);
        setValues(next);
        setSavedAt(timeFormat.format(new Date()));
      },
      onError: (error) => setServerError(profileErrorMessage(error)),
    });
  };

  const status = update.isPending ? 'saving' : dirty ? 'unsaved' : savedAt ? 'saved' : 'idle';

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Card>
        <CardHeader icon={<UserRound />} title="Datos personales" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Nombre"
            name="givenName"
            autoComplete="given-name"
            required
            value={values.givenName}
            error={errors.givenName}
            onChange={(event) => set('givenName', event.target.value)}
          />
          <Input
            label="Apellidos"
            name="familyName"
            autoComplete="family-name"
            required
            value={values.familyName}
            error={errors.familyName}
            onChange={(event) => set('familyName', event.target.value)}
          />
          <Input
            label="Correo electrónico"
            name="email"
            leadingIcon={<Mail />}
            value={profile.user.email}
            readOnly
            hint="El correo se usa para iniciar sesión y por ahora no se puede cambiar."
            containerClassName="sm:col-span-2"
          />
        </div>
      </Card>

      <Card>
        <CardHeader icon={<Stethoscope />} title="Perfil profesional" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Nombre profesional"
            name="displayName"
            required
            hint="Así aparecerás en tus registros (p. ej. Ps. Ana Pérez)."
            value={values.displayName}
            error={errors.displayName}
            onChange={(event) => set('displayName', event.target.value)}
          />
          <Input
            label="Número de registro profesional"
            name="licenseNumber"
            leadingIcon={<BadgeCheck />}
            hint="Colegiatura o registro sanitario. Opcional."
            value={values.licenseNumber}
            error={errors.licenseNumber}
            onChange={(event) => set('licenseNumber', event.target.value)}
          />
          <div className="sm:col-span-2">
            <SpecialtyPicker
              value={values.specialties}
              onChange={(next) => set('specialties', next)}
              disabled={update.isPending}
            />
          </div>
        </div>
      </Card>

      {serverError && <Alert tone="danger" title={serverError} live />}

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        <SaveIndicator status={status} savedAt={savedAt ?? undefined} className="sm:mr-auto" />
        <Button
          variant="secondary"
          disabled={!dirty || update.isPending}
          onClick={() => {
            setValues(initial);
            setErrors({});
          }}
        >
          Descartar cambios
        </Button>
        <Button type="submit" disabled={!dirty} loading={update.isPending}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
