import { Clock, FilePenLine, ShieldCheck } from 'lucide-react';
import { Badge, type BadgeTone } from './Badge';

/**
 * Estados de un registro clínico (preparado para los módulos clínicos futuros).
 * Cada estado combina color semántico + icono + texto: nunca solo color.
 */
export type RecordStatus = 'draft' | 'pending_signature' | 'signed';

const config: Record<RecordStatus, { label: string; tone: BadgeTone; Icon: typeof Clock }> = {
  draft: { label: 'Borrador', tone: 'neutral', Icon: FilePenLine },
  pending_signature: { label: 'Pendiente de firma', tone: 'warning', Icon: Clock },
  signed: { label: 'Firmado', tone: 'success', Icon: ShieldCheck },
};

export function RecordStatusBadge({ status }: { status: RecordStatus }) {
  const { label, tone, Icon } = config[status];
  return (
    <Badge tone={tone} icon={<Icon />}>
      {label}
    </Badge>
  );
}
