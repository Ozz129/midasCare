import { type MyProfileResponse } from '@care/api-contracts';
import { PenLine, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { type ChangeEvent, useRef, useState } from 'react';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Dialog } from '../../../components/ui/Dialog';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Skeleton } from '../../../components/ui/Skeleton';
import { ACCEPTED_IMAGE_INPUT, prepareSignature } from '../../../utils/image';
import { profileErrorMessage } from '../profile-errors';
import { useDeleteProfileImage, useProfileImageUrl, useUploadProfileImage } from '../useProfile';

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'long', timeStyle: 'short' });

export function SignatureSection({ profile }: { profile: MyProfileResponse }) {
  const professional = profile.professional;
  const hasSignature = Boolean(professional?.hasSignature);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const upload = useUploadProfileImage('signature');
  const remove = useDeleteProfileImage('signature');
  const signatureUrl = useProfileImageUrl(
    'signature',
    hasSignature ? professional?.signatureUpdatedAt : null,
  );
  const busy = processing || upload.isPending || remove.isPending;

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError(null);
    setProcessing(true);
    try {
      await upload.mutateAsync(await prepareSignature(file));
    } catch (uploadError) {
      setError(profileErrorMessage(uploadError));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader
        icon={<PenLine />}
        title="Firma"
        description="Imagen de tu firma manuscrita para tus registros clínicos."
      />

      <div className="flex min-h-40 items-center justify-center rounded-control border border-dashed border-input-border bg-surface p-4">
        {hasSignature ? (
          signatureUrl ? (
            <img
              src={signatureUrl}
              alt="Tu firma"
              className="max-h-36 w-auto max-w-full object-contain"
              draggable={false}
            />
          ) : (
            <Skeleton className="h-24 w-64" />
          )
        ) : (
          <EmptyState
            icon={PenLine}
            size="compact"
            title="Aún no has subido tu firma"
            description="Firma sobre papel blanco, toma una foto o escanéala y súbela. Si puedes, usa una imagen PNG con fondo transparente."
          />
        )}
      </div>

      {professional?.signatureUpdatedAt && (
        <p className="mt-2 text-caption text-muted">
          Actualizada el {dateFormat.format(new Date(professional.signatureUpdatedAt))}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          loading={processing || upload.isPending}
          disabled={busy}
          leadingIcon={<Upload className="size-4" aria-hidden="true" />}
          onClick={() => inputRef.current?.click()}
        >
          {hasSignature ? 'Reemplazar firma' : 'Subir firma'}
        </Button>
        {hasSignature && (
          <Button
            variant="ghost"
            disabled={busy}
            leadingIcon={<Trash2 className="size-4" aria-hidden="true" />}
            onClick={() => setConfirmOpen(true)}
          >
            Eliminar
          </Button>
        )}
      </div>

      <p className="mt-4 flex items-start gap-2 text-helper text-muted">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        Tu firma se guarda de forma privada: solo tú puedes verla. PNG, JPG o WebP.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_INPUT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={onFile}
      />
      {error && (
        <div className="mt-4">
          <Alert tone="danger" title={error} live />
        </div>
      )}

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="¿Eliminar tu firma?"
        description="Podrás subir una nueva cuando quieras."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              loading={remove.isPending}
              onClick={() =>
                remove.mutate(undefined, {
                  onSuccess: () => setConfirmOpen(false),
                  onError: (deleteError) => {
                    setConfirmOpen(false);
                    setError(profileErrorMessage(deleteError));
                  },
                })
              }
            >
              Eliminar firma
            </Button>
          </>
        }
      />
    </Card>
  );
}
