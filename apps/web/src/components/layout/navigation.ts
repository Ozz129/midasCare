import {
  CalendarClock,
  FileText,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  UserRound,
  Users,
} from 'lucide-react';

export interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Ruta existente. Sin `to`, la sección se muestra como "Próximamente" y no navega. */
  to?: string;
  end?: boolean;
}

/**
 * Navegación principal. Las secciones clínicas aún no implementadas no tienen
 * ruta: se muestran como no disponibles y nunca llevan a pantallas falsas.
 */
export const primaryNavigation: NavigationItem[] = [
  { id: 'dashboard', label: 'Panel', icon: LayoutDashboard, to: '/', end: true },
  { id: 'patients', label: 'Pacientes', icon: Users },
  { id: 'records', label: 'Historias clínicas', icon: FileText },
  { id: 'encounters', label: 'Atenciones', icon: CalendarClock },
];

export const secondaryNavigation: NavigationItem[] = [
  { id: 'profile', label: 'Mi perfil', icon: UserRound, to: '/profile' },
  { id: 'settings', label: 'Configuración', icon: Settings, to: '/settings' },
];
