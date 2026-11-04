import { RefreshCw } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { AvatarSection } from '../components/AvatarSection';
import { ProfileInfoForm } from '../components/ProfileInfoForm';
import { SignatureSection } from '../components/SignatureSection';
import { useMyProfile } from '../useProfile';

export function ProfilePage() {
  useDocumentTitle('Mi perfil');
  const { data: profile, isPending, isError, refetch } = useMyProfile();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi perfil"
        description="Tus datos personales, tu perfil profesional, tu foto y tu firma."
      />

      {isPending ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="space-y-4 lg:col-span-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </Card>
          <Card className="space-y-4">
            <Skeleton className="mx-auto size-24 rounded-pill" />
            <Skeleton className="h-11 w-full" />
          </Card>
          <span className="sr-only" role="status">
            Cargando perfil
          </span>
        </div>
      ) : isError || !profile ? (
        <Alert
          tone="danger"
          title="No se pudo cargar tu perfil."
          action={
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<RefreshCw className="size-4" aria-hidden="true" />}
              onClick={() => void refetch()}
            >
              Reintentar
            </Button>
          }
        />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ProfileInfoForm key={profile.user.id} profile={profile} />
          </div>
          <div className="flex flex-col gap-6">
            <AvatarSection profile={profile} />
            <SignatureSection profile={profile} />
          </div>
        </div>
      )}
    </div>
  );
}
