import { type MyProfileResponse } from '@care/api-contracts';
import { Camera, Trash2 } from 'lucide-react';
import { type ChangeEvent, useRef, useState } from 'react';
import { Alert } from '../../../components/ui/Alert';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader } from '../../../components/ui/Card';
import { ACCEPTED_IMAGE_INPUT, prepareAvatar } from '../../../utils/image';
import { profileErrorMessage } from '../profile-errors';
import { useDeleteProfileImage, useProfileImageUrl, useUploadProfileImage } from '../useProfile';

export function AvatarSection({ profile }: { profile: MyProfileResponse }) {
  const { user } = profile;
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const upload = useUploadProfileImage('avatar');
  const remove = useDeleteProfileImage('avatar');
  const photoUrl = useProfileImageUrl('avatar', user.hasAvatar ? user.avatarUpdatedAt : null);
  const busy = processing || upload.isPending || remove.isPending;

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError(null);
    setProcessing(true);
    try {
      await upload.mutateAsync(await prepareAvatar(file));
    } catch (uploadError) {
      setError(profileErrorMessage(uploadError));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Foto de perfil"
        description="Se muestra en tu cuenta. Se recorta en formato cuadrado."
      />
      <div className="flex flex-col items-center gap-4 text-center">
        <Avatar size="xl" name={`${user.givenName} ${user.familyName}`} src={photoUrl} />
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="secondary"
              loading={processing || upload.isPending}
              disabled={busy}
              leadingIcon={<Camera className="size-4" aria-hidden="true" />}
              onClick={() => inputRef.current?.click()}
            >
              {user.hasAvatar ? 'Cambiar foto' : 'Subir foto'}
            </Button>
            {user.hasAvatar && (
              <Button
                variant="ghost"
                disabled={busy}
                loading={remove.isPending}
                leadingIcon={<Trash2 className="size-4" aria-hidden="true" />}
                onClick={() => {
                  setError(null);
                  remove.mutate(undefined, {
                    onError: (deleteError) => setError(profileErrorMessage(deleteError)),
                  });
                }}
              >
                Eliminar
              </Button>
            )}
          </div>
          <p className="text-helper text-muted">PNG, JPG o WebP. Máximo 15 MB.</p>
        </div>
      </div>
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
    </Card>
  );
}
