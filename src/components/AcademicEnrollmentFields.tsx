import type { AcademicTrack } from '@/types';
import type { AcademicEnrollmentValue } from '@/constants/academicEnrollment';
import {
  ACADEMIC_TRACK_OPTIONS,
  COLLEGE_PROGRAMS,
  COLLEGE_YEAR_OPTIONS,
  juniorHighSectionsForYear,
  JUNIOR_HIGH_YEAR_OPTIONS,
  SENIOR_HIGH_STRANDS,
  SENIOR_HIGH_YEAR_OPTIONS,
} from '@/constants/academicEnrollment';
import { landingAuthLabelClass } from '@/components/auth/authClasses';

type Props = {
  idPrefix: string;
  value: AcademicEnrollmentValue;
  onChange: (next: AcademicEnrollmentValue) => void;
  variant: 'landing' | 'light';
  disabled?: boolean;
};

/** Shared pill / chip styling — track, grades, years, programs */
function choiceButtonClass(
  selected: boolean,
  variant: 'landing' | 'light',
  opts?: { multiline?: boolean }
) {
  const multiline = opts?.multiline ?? false;
  const size = multiline
    ? 'min-h-[4rem] px-3 py-2.5 text-center text-xs sm:text-sm leading-snug'
    : 'min-h-[2.875rem] px-3 py-2.5 text-center text-sm';
  const base = `inline-flex w-full items-center justify-center rounded-xl border font-medium shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 hover:-translate-y-[1px] ${size}`;
  if (variant === 'landing') {
    return `${base} focus-visible:ring-landing-sky/70 focus-visible:ring-offset-transparent ${
      selected
        ? 'border-landing-sky/95 bg-gradient-to-b from-landing-sky/40 to-landing-sky/20 text-white ring-2 ring-landing-sky/65 shadow-md shadow-black/20'
        : 'border-white/25 bg-white/[0.08] text-white/90 hover:border-white/45 hover:bg-white/[0.14] hover:shadow-md hover:shadow-black/10'
    }`;
  }
  return `${base} focus-visible:ring-campus-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
    selected
      ? 'border-campus-primary bg-gradient-to-b from-campus-light to-blue-50/90 text-campus-primary ring-2 ring-campus-primary/35 shadow-md shadow-blue-900/5'
      : 'border-slate-200/95 bg-white text-slate-800 hover:border-campus-primary/40 hover:bg-slate-50/95 hover:shadow-md hover:shadow-slate-900/5'
  }`;
}

export function AcademicEnrollmentFields({ idPrefix, value, onChange, variant, disabled }: Props) {
  const labelClass = variant === 'landing' ? landingAuthLabelClass : 'mb-1 block text-sm font-medium text-slate-700';

  const setTrack = (track: AcademicTrack) => {
    onChange({ track, year: '', program: '' });
  };

  const setYear = (year: string) => {
    const next = { ...value, year };
    if (value.track === 'junior_high') {
      const valid = juniorHighSectionsForYear(year);
      if (!valid.includes(value.program)) next.program = '';
    }
    onChange(next);
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
    value.track === 'senior_high' ? 'grid grid-cols-2 gap-2.5' : 'grid grid-cols-2 gap-2.5 sm:grid-cols-4';
  const programOptions =
    value.track === 'junior_high'
      ? juniorHighSectionsForYear(value.year)
      : value.track === 'senior_high'
        ? SENIOR_HIGH_STRANDS
        : value.track === 'college'
          ? COLLEGE_PROGRAMS
          : [];
  const programLabel =
    value.track === 'junior_high'
      ? 'Section'
      : value.track === 'senior_high'
        ? 'Strand / track'
        : 'College program';
  const programGridClass =
    value.track === 'junior_high'
      ? 'grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3'
      : value.track === 'senior_high'
        ? 'grid grid-cols-1 gap-2.5 sm:grid-cols-2'
        : 'grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3';

  const selectedYearLabel = yearOptions.find((o) => o.value === value.year)?.label ?? '';
  const helperText =
    value.track === 'junior_high'
      ? value.year
        ? `${selectedYearLabel} sections - tap one section button.`
        : 'Select a grade level first to unlock section buttons.'
      : value.track === 'senior_high'
        ? `${selectedYearLabel || 'Grade 11/12'} strand/track buttons - choose one.`
        : 'Select one college program button.';

  const sectionBadgeClass =
    variant === 'landing'
      ? 'rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/70'
      : 'rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500';

  return (
    <div className="space-y-5">
      <div role="group" aria-labelledby={`${idPrefix}-track-label`}>
        <p id={`${idPrefix}-track-label`} className={labelClass}>
          Track
        </p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
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

      {value.track && (
        <div role="group" aria-labelledby={`${idPrefix}-program-label`}>
          <p id={`${idPrefix}-program-label`} className={labelClass}>
            {programLabel}
          </p>
          <p className={variant === 'landing' ? 'mb-2 text-xs text-white/65' : 'mb-2 text-xs text-slate-500'}>
            {helperText}
          </p>
          <div className={programGridClass}>
            {programOptions.map((p, idx) => {
              const selected = value.program === p;
              const strandCode = value.track === 'senior_high' ? (p.match(/\(([^)]+)\)/)?.[1] ?? '') : '';
              return (
                <button
                  key={p}
                  type="button"
                  id={`${idPrefix}-program-${idx}`}
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => setProgram(p)}
                  className={choiceButtonClass(selected, variant, { multiline: true })}
                >
                  <span className="flex w-full flex-col items-center gap-1.5 text-center">
                    <span className="max-w-full text-pretty leading-snug">{p}</span>
                    {value.track === 'junior_high' && value.year && (
                      <span className={sectionBadgeClass}>{selectedYearLabel || 'Grade'} section</span>
                    )}
                    {value.track === 'senior_high' && strandCode && (
                      <span className={sectionBadgeClass}>{strandCode}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
