import type { AcademicTrack } from '@/types';
import type { AcademicEnrollmentValue } from '@/constants/academicEnrollment';
import {
  ACADEMIC_TRACK_OPTIONS,
  COLLEGE_PROGRAMS,
  COLLEGE_YEAR_OPTIONS,
  JUNIOR_HIGH_YEAR_OPTIONS,
  SENIOR_HIGH_YEAR_OPTIONS,
} from '@/constants/academicEnrollment';
import { landingAuthInputClass, landingAuthLabelClass } from '@/components/auth/authClasses';

const lightInputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary text-sm text-slate-900 bg-white';

type Props = {
  idPrefix: string;
  value: AcademicEnrollmentValue;
  onChange: (next: AcademicEnrollmentValue) => void;
  variant: 'landing' | 'light';
  disabled?: boolean;
};

function choiceButtonClass(selected: boolean, variant: 'landing' | 'light') {
  const base =
    'inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-lg border px-2.5 py-2 text-center text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-45';
  if (variant === 'landing') {
    return `${base} focus-visible:ring-landing-sky/60 ${
      selected
        ? 'border-landing-sky bg-landing-sky/25 text-white ring-2 ring-landing-sky/55 shadow-inner shadow-black/20'
        : 'border-white/20 bg-white/[0.07] text-white/88 hover:border-white/35 hover:bg-white/12'
    }`;
  }
  return `${base} focus-visible:ring-campus-primary/35 ${
    selected
      ? 'border-campus-primary bg-campus-light text-campus-primary ring-2 ring-campus-primary/30'
      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
  }`;
}

export function AcademicEnrollmentFields({ idPrefix, value, onChange, variant, disabled }: Props) {
  const labelClass = variant === 'landing' ? landingAuthLabelClass : 'mb-1 block text-sm font-medium text-slate-700';
  const selectClass = variant === 'landing' ? landingAuthInputClass : lightInputClass;

  const setTrack = (track: AcademicTrack) => {
    onChange({ track, year: '', program: '' });
  };

  const setYear = (year: string) => {
    onChange({ ...value, year, ...(value.track === 'college' ? {} : { program: '' }) });
  };

  const setProgram = (program: string) => {
    onChange({ ...value, program });
  };

  const yearOptions =
    value.track === 'junior_high'
      ? JUNIOR_HIGH_YEAR_OPTIONS
      : value.track === 'senior_high'
        ? SENIOR_HIGH_YEAR_OPTIONS
        : value.track === 'college'
          ? COLLEGE_YEAR_OPTIONS
          : [];

  const yearGridClass =
    value.track === 'senior_high' ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 gap-2 sm:grid-cols-4';

  return (
    <div className="space-y-4">
      <div role="group" aria-labelledby={`${idPrefix}-track-label`}>
        <p id={`${idPrefix}-track-label`} className={labelClass}>
          School level
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {ACADEMIC_TRACK_OPTIONS.map((o) => {
            const selected = value.track === o.value;
            return (
              <button
                key={o.value}
                type="button"
                id={`${idPrefix}-track-${o.value}`}
                disabled={disabled}
                aria-pressed={selected}
                onClick={() => setTrack(o.value)}
                className={choiceButtonClass(selected, variant)}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      {value.track && (
        <div role="group" aria-labelledby={`${idPrefix}-year-label`}>
          <p id={`${idPrefix}-year-label`} className={labelClass}>
            {value.track === 'senior_high' ? 'Grade level' : value.track === 'college' ? 'Year level' : 'Grade level'}
          </p>
          <div className={yearGridClass}>
            {yearOptions.map((o) => {
              const selected = value.year === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  id={`${idPrefix}-year-${o.value}`}
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => setYear(o.value)}
                  className={choiceButtonClass(selected, variant)}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {value.track === 'college' && (
        <div>
          <label htmlFor={`${idPrefix}-program`} className={labelClass}>
            Program
          </label>
          <select
            id={`${idPrefix}-program`}
            value={value.program}
            onChange={(e) => setProgram(e.target.value)}
            required
            disabled={disabled}
            className={selectClass}
          >
            <option value="">Select program…</option>
            {COLLEGE_PROGRAMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
