import { FolderOpen, Plus, Search, Trash2 } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import appIcon from '../../../assets/brand/midas-care-app-icon.png';
import techLogo from '../../../assets/brand/midas-tech-logo.png';
import { BrandLogo } from '../../../components/brand/BrandLogo';
import { MidasTechLogo } from '../../../components/brand/MidasTechLogo';
import { PageHeader } from '../../../components/layout/PageHeader';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Dialog,
  DropdownMenu,
  EmptyState,
  Input,
  RecordStatusBadge,
  SaveIndicator,
  Select,
  Skeleton,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tabs,
  Textarea,
  Tooltip,
} from '../../../components/ui';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

/*
 * Guía viva del Design System. SOLO se registra en desarrollo (import.meta.env.DEV)
 * y se carga de forma diferida: no forma parte del build de producción.
 * Los textos son de ejemplo y no representan datos clínicos.
 */

const swatches: Array<{ token: string; className: string; hex: string }> = [
  { token: 'primary', className: 'bg-primary', hex: '#137C78' },
  { token: 'primary-hover', className: 'bg-primary-hover', hex: '#0D625F' },
  { token: 'primary-soft', className: 'bg-primary-soft', hex: '#E8F5F1' },
  { token: 'navy', className: 'bg-navy', hex: '#18334A' },
  { token: 'gold', className: 'bg-gold', hex: '#C6A052' },
  { token: 'gold-dark', className: 'bg-gold-dark', hex: '#A47B30' },
  { token: 'gold-soft', className: 'bg-gold-soft', hex: '#F8F1E3' },
  { token: 'background', className: 'bg-background', hex: '#F7F9FA' },
  { token: 'surface', className: 'bg-surface', hex: '#FFFFFF' },
  { token: 'border', className: 'bg-border', hex: '#E2E8ED' },
  { token: 'text', className: 'bg-text', hex: '#263746' },
  { token: 'muted', className: 'bg-muted', hex: '#64748B' },
  { token: 'success', className: 'bg-success', hex: '#16805D' },
  { token: 'warning', className: 'bg-warning', hex: '#996000' },
  { token: 'danger', className: 'bg-danger', hex: '#B42332' },
  { token: 'info', className: 'bg-info', hex: '#2563A6' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-section-title font-semibold text-navy">{title}</h2>
      {children}
    </section>
  );
}

export function DesignSystemPage() {
  useDocumentTitle('Guía de componentes');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [note, setNote] = useState('');

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Solo desarrollo"
        title="Guía de componentes"
        description="Clinical Calm + MIDAS Gold. Tokens y componentes base del frontend de MIDAS CARE."
      />

      <Section title="Marca">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="flex flex-col items-start gap-3">
            <p className="text-caption font-semibold text-muted">full · dark</p>
            <BrandLogo size="lg" />
          </Card>
          <div className="flex flex-col items-start gap-3 rounded-card bg-navy p-5 shadow-card sm:p-6">
            <p className="text-caption font-semibold text-white/70">full · light</p>
            <BrandLogo tone="light" size="lg" />
          </div>
          <Card className="flex flex-col items-start gap-3">
            <p className="text-caption font-semibold text-muted">vertical · dark</p>
            <BrandLogo variant="vertical" size="md" />
          </Card>
          <Card className="flex flex-wrap items-end gap-6">
            <div className="flex flex-col gap-3">
              <p className="text-caption font-semibold text-muted">compact · dark</p>
              <BrandLogo variant="compact" size="lg" />
            </div>
            <div className="flex flex-col gap-3 rounded-control bg-navy p-3">
              <p className="text-caption font-semibold text-white/70">compact · light</p>
              <BrandLogo variant="compact" tone="light" size="lg" />
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-caption font-semibold text-muted">app icon</p>
              <img src={appIcon} alt="Icono de app MIDAS CARE" className="size-16 rounded-[22%]" />
            </div>
          </Card>
          <div className="flex flex-wrap items-center gap-8 rounded-card bg-navy-deep p-5 shadow-card sm:p-6 md:col-span-2">
            <img
              src={techLogo}
              alt="MIDAS TECH"
              className="h-32 w-auto object-contain"
              width={640}
              height={559}
            />
            <div className="flex flex-col gap-4">
              <p className="text-caption font-semibold text-white/70">
                MIDAS TECH · solo sobre fondos oscuros
              </p>
              <MidasTechLogo size="md" />
              <MidasTechLogo />
            </div>
          </div>
          <Card className="flex flex-col items-start gap-3 md:col-span-2">
            <p className="text-caption font-semibold text-muted">
              MIDAS TECH · badge (fondos claros)
            </p>
            <MidasTechLogo variant="badge" />
          </Card>
        </div>
      </Section>

      <Section title="Color">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          {swatches.map((swatch) => (
            <div
              key={swatch.token}
              className="overflow-hidden rounded-card border border-border bg-surface"
            >
              <div className={`h-14 ${swatch.className}`} />
              <div className="p-2">
                <p className="text-caption font-semibold text-text">{swatch.token}</p>
                <p className="text-caption text-muted uppercase">{swatch.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tipografía">
        <Card className="space-y-3">
          <p className="text-page-title font-semibold text-navy">Título de página · 28px</p>
          <p className="text-section-title font-semibold text-navy">Título de sección · 20px</p>
          <p className="text-card-title font-semibold text-navy">Título de tarjeta · 17px</p>
          <p className="text-body-lg">Cuerpo amplio · 16px (notas extensas)</p>
          <p className="text-body">Cuerpo · 15px</p>
          <p className="text-label font-medium">Etiqueta · 14px</p>
          <p className="text-helper text-muted">Texto de ayuda · 13px</p>
          <p className="text-caption text-muted">Leyenda · 12px</p>
        </Card>
      </Section>

      <Section title="Botones">
        <Card className="flex flex-wrap items-center gap-3">
          <Button>Principal</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="ghost">Fantasma</Button>
          <Button
            variant="destructive"
            leadingIcon={<Trash2 className="size-4" aria-hidden="true" />}
          >
            Eliminar
          </Button>
          <Button loading>Guardando</Button>
          <Button disabled>Deshabilitado</Button>
          <Button size="sm" leadingIcon={<Plus className="size-4" aria-hidden="true" />}>
            Pequeño
          </Button>
        </Card>
      </Section>

      <Section title="Formularios">
        <Card className="grid gap-5 md:grid-cols-2">
          <Input label="Nombre completo" required hint="Tal como aparece en el documento." />
          <Input label="Correo" error="Ingresa un correo válido." defaultValue="ana@" />
          <Input label="Buscar" leadingIcon={<Search />} placeholder="Buscar…" />
          <Input label="Campo deshabilitado" disabled defaultValue="No editable" />
          <Select
            label="Especialidad"
            placeholder="Selecciona una opción"
            options={[
              { value: 'psychology', label: 'Psicología' },
              { value: 'other', label: 'Otra (próximamente)', disabled: true },
            ]}
          />
          <div className="flex flex-col gap-3 pt-6">
            <Checkbox label="Acepto los términos" description="Texto descriptivo opcional." />
            <Checkbox label="Opción deshabilitada" disabled />
          </div>
          <div className="md:col-span-2">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <RecordStatusBadge status="draft" />
              <SaveIndicator status={note ? 'unsaved' : 'saved'} savedAt="10:42" />
            </div>
            <Textarea
              label="Nota de evolución (ejemplo)"
              hint="Área amplia para notas extensas."
              maxLength={2000}
              showCount
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        </Card>
      </Section>

      <Section title="Estados y badges">
        <Card className="flex flex-wrap items-center gap-3">
          <RecordStatusBadge status="draft" />
          <RecordStatusBadge status="pending_signature" />
          <RecordStatusBadge status="signed" />
          <Badge>Neutro</Badge>
          <Badge tone="primary">Primario</Badge>
          <Badge tone="info">Información</Badge>
          <Badge tone="danger">Error</Badge>
          <Badge tone="brand">Marca MIDAS</Badge>
          <SaveIndicator status="saving" />
          <SaveIndicator status="error" />
        </Card>
      </Section>

      <Section title="Alertas">
        <div className="grid gap-3 md:grid-cols-2">
          <Alert tone="info" title="Información">
            Mensaje informativo.
          </Alert>
          <Alert tone="success" title="Correcto">
            Operación completada.
          </Alert>
          <Alert tone="warning" title="Aviso">
            Revisa los datos antes de continuar.
          </Alert>
          <Alert tone="danger" title="Error">
            No se pudo completar la acción.
          </Alert>
        </div>
      </Section>

      <Section title="Navegación y superposiciones">
        <Card className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="secondary" onClick={() => setDialogOpen(true)}>
              Abrir diálogo
            </Button>
            <DropdownMenu
              label="Acciones de ejemplo"
              align="start"
              trigger={
                <span className="inline-flex h-control items-center rounded-control border border-border px-4 text-label font-medium">
                  Menú
                </span>
              }
              items={[
                { id: 'a', label: 'Acción disponible', onSelect: () => undefined },
                { id: 'b', label: 'Acción deshabilitada', disabled: true, description: 'Motivo' },
              ]}
            />
            <Tooltip content="Información adicional">
              <Button variant="ghost">Con tooltip</Button>
            </Tooltip>
            <Avatar name="Ana Pérez" />
            <Avatar />
            <Spinner />
          </div>
          <Tabs
            label="Ejemplo de pestañas"
            items={[
              {
                id: 'one',
                label: 'Resumen',
                content: <p className="text-body">Contenido de la primera pestaña.</p>,
              },
              {
                id: 'two',
                label: 'Detalles',
                content: <p className="text-body">Contenido de la segunda pestaña.</p>,
              },
              { id: 'three', label: 'Deshabilitada', content: null, disabled: true },
            ]}
          />
        </Card>
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Confirmar acción"
          description="Ejemplo de diálogo modal accesible."
          footer={
            <>
              <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setDialogOpen(false)}>Confirmar</Button>
            </>
          }
        >
          <p className="text-body">El foco queda atrapado en el diálogo y Escape lo cierra.</p>
        </Dialog>
      </Section>

      <Section title="Tabla, carga y estados vacíos">
        <Table caption="Tokens de radio del sistema">
          <TableHead>
            <tr>
              <TableHeaderCell>Token</TableHeaderCell>
              <TableHeaderCell>Valor</TableHeaderCell>
              <TableHeaderCell>Uso</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">radius-control</TableCell>
              <TableCell>8px</TableCell>
              <TableCell>Botones e inputs</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">radius-card</TableCell>
              <TableCell>12px</TableCell>
              <TableCell>Tarjetas</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">radius-dialog</TableCell>
              <TableCell>16px</TableCell>
              <TableCell>Modales</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="space-y-3">
            <CardHeader title="Cargando" as="h3" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </Card>
          <Card>
            <EmptyState
              icon={FolderOpen}
              size="compact"
              title="Sin resultados"
              description="Ajusta los filtros o crea un nuevo elemento."
            />
          </Card>
        </div>
      </Section>
    </div>
  );
}
