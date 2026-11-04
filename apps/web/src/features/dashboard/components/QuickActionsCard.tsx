import { CalendarPlus, FileSearch, UserPlus, Zap } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Card, CardHeader } from '../../../components/ui/Card';

const actions = [
  { id: 'new-patient', label: 'Registrar paciente', icon: UserPlus },
  { id: 'new-encounter', label: 'Nueva atención', icon: CalendarPlus },
  { id: 'search-record', label: 'Buscar historia clínica', icon: FileSearch },
];

/** Accesos rápidos. Se habilitarán cuando cada módulo clínico exista. */
export function QuickActionsCard() {
  return (
    <Card>
      <CardHeader icon={<Zap />} title="Accesos rápidos" />
      <ul className="flex flex-col gap-2">
        {actions.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <span
              aria-disabled="true"
              className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-control border border-border bg-background px-3 text-label text-muted"
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">{label}</span>
              <Badge>Próximamente</Badge>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
