import { MAX_SPECIALTIES, SPECIALTIES } from '@care/api-contracts';
import { Checkbox } from '../../../components/ui/Checkbox';

/** Selección múltiple de especialidades (máximo MAX_SPECIALTIES). */
export function SpecialtyPicker({
  value,
  onChange,
  disabled,
  error,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  error?: string;
}) {
  const limitReached = value.length >= MAX_SPECIALTIES;

  const toggle = (code: string, checked: boolean) => {
    // Mantiene el orden del catálogo.
    const next = new Set(value);
    if (checked) next.add(code);
    else next.delete(code);
    onChange(SPECIALTIES.map((item) => item.code).filter((item) => next.has(item)));
  };

  return (
    <fieldset aria-describedby="specialties-help">
      <legend className="text-label font-medium text-text">Especialidades</legend>
      <p id="specialties-help" className="mt-1 text-helper text-muted">
        Selecciona hasta {MAX_SPECIALTIES}. La primera se considera tu especialidad principal.
        {limitReached && ' Has alcanzado el máximo.'}
      </p>
      <div className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {SPECIALTIES.map(({ code, label }) => {
          const checked = value.includes(code);
          return (
            <Checkbox
              key={code}
              label={label}
              checked={checked}
              disabled={disabled || (!checked && limitReached)}
              onChange={(event) => toggle(code, event.target.checked)}
            />
          );
        })}
      </div>
      {error && <p className="mt-2 text-helper text-danger">{error}</p>}
    </fieldset>
  );
}
