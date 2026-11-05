import { HeartHandshake, Layers, ShieldCheck } from 'lucide-react';
import { Outlet } from 'react-router';
import { BRAND_TAGLINE, BrandLogo } from '../../components/brand/BrandLogo';
import { MidasTechLogo } from '../../components/brand/MidasTechLogo';

const values = [
  {
    icon: ShieldCheck,
    title: 'Seguridad y trazabilidad',
    text: 'Cada registro clínico protegido y con historial de cambios.',
  },
  {
    icon: HeartHandshake,
    title: 'Atención centrada en las personas',
    text: 'Menos tiempo en papeleo, más tiempo con tus pacientes.',
  },
  {
    icon: Layers,
    title: 'Pensado para crecer',
    text: 'Comienza en psicología y se adapta a otras especialidades.',
  },
];

/**
 * Escritorio: dos columnas (identidad de marca + formulario).
 * Móvil: una columna con el logotipo arriba y el formulario centrado.
 */
export function AuthLayout() {
  return (
    <div className="grid min-h-full lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-navy lg:flex lg:flex-col">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,color-mix(in_oklab,var(--color-primary)_40%,transparent),transparent_55%),radial-gradient(circle_at_90%_95%,color-mix(in_oklab,var(--color-gold)_18%,transparent),transparent_45%)]"
          aria-hidden="true"
        />
        <div className="relative flex flex-1 flex-col justify-between p-12 xl:p-16">
          <BrandLogo tone="light" size="xl" className="self-start" />

          <div className="max-w-md">
            <span className="block h-1 w-12 rounded-pill bg-gold" aria-hidden="true" />
            <p className="mt-6 text-display font-semibold text-white">{BRAND_TAGLINE}</p>
            <p className="mt-4 text-body-lg text-white/80">
              Historias clínicas electrónicas seguras, claras y humanas para profesionales de la
              salud.
            </p>

            <ul className="mt-10 space-y-5">
              {values.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-control bg-white/10 text-primary-on-dark"
                    aria-hidden="true"
                  >
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block text-label font-semibold text-white">{title}</span>
                    <span className="block text-helper text-white/70">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <MidasTechLogo variant="badge" className="self-start" />
        </div>
      </aside>

      <main className="flex flex-col justify-center bg-background px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandLogo variant="vertical" size="md" />
          </div>
          <Outlet />
          <div className="mt-10 flex justify-center lg:hidden">
            <MidasTechLogo variant="badge" />
          </div>
        </div>
      </main>
    </div>
  );
}
