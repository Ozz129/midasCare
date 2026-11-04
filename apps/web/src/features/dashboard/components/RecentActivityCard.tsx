import { Activity } from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';

/** Actividad reciente. Mostrará eventos reales cuando existan los módulos clínicos. */
export function RecentActivityCard() {
  return (
    <Card className="h-full">
      <CardHeader
        icon={<Activity />}
        title="Actividad reciente"
        description="Últimos movimientos en tu espacio de trabajo"
      />
      <EmptyState
        icon={Activity}
        title="No hay actividad para mostrar"
        description="Aquí verás las últimas atenciones, registros y firmas cuando se conecten los módulos clínicos."
      />
    </Card>
  );
}
