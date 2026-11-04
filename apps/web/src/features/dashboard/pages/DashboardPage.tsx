import { CalendarCheck, FileSignature, History, Users } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { useSession } from '../../auth/session';
import { QuickActionsCard } from '../components/QuickActionsCard';
import { RecentActivityCard } from '../components/RecentActivityCard';
import { StatCard } from '../components/StatCard';
import { SystemStatusCard } from '../components/SystemStatusCard';

const today = new Intl.DateTimeFormat('es', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date());

/** Solo la primera letra en mayúscula ("Miércoles, 4 de noviembre de 2026"). */
const todayLabel = today.charAt(0).toLocaleUpperCase('es') + today.slice(1);

/**
 * Panel principal. Las métricas clínicas usan `value={null}` hasta que existan sus
 * endpoints: se muestran estados vacíos, nunca números ficticios.
 */
export function DashboardPage() {
  useDocumentTitle('Panel');
  const session = useSession();
  const givenName = session.status === 'authenticated' ? session.user.givenName : undefined;

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        eyebrow={todayLabel}
        title={givenName ? `Hola, ${givenName}` : 'Te damos la bienvenida'}
        description="Este es tu panel clínico: aquí verás el resumen de tu actividad."
      />

      <section aria-labelledby="resumen-titulo">
        <h2 id="resumen-titulo" className="sr-only">
          Resumen
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Users}
            label="Pacientes registrados"
            value={null}
            emptyText="Aún no hay pacientes registrados"
          />
          <StatCard
            icon={CalendarCheck}
            label="Atenciones del día"
            value={null}
            emptyText="No hay atenciones para mostrar"
          />
          <StatCard
            icon={FileSignature}
            label="Pendientes de firma"
            value={null}
            emptyText="No hay registros pendientes de firma"
          />
          <StatCard
            icon={History}
            label="Actividad reciente"
            value={null}
            emptyText="Sin actividad registrada"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivityCard />
        </div>
        <div className="flex flex-col gap-6">
          <QuickActionsCard />
          <SystemStatusCard />
        </div>
      </div>
    </div>
  );
}
