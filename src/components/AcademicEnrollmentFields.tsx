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

export function AcademicEnrollmentFields({ idPrefix, value, onChange, variant, disabled }: Props) {
  const labelClass = variant === 'landing' ? landingAuthLabelClass : 'mb-1 block text-sm font-medium text-slate-700';
  const selectClass = variant === 'landing' ? landingAuthInputClass : lightInputClass;

  const setTrack = (track: AcademicTrack | '') => {
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

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={`${idPrefix}-track`} className={labelClass}>
          School level
        </label>
        <select
          id={`${idPrefix}-track`}
          value={value.track}
          onChange={(e) => setTrack(e.target.value as AcademicTrack | '')}
          required
          disabled={disabled}
          className={selectClass}
        >
          <option value="">Select level…</option>
          {ACADEMIC_TRACK_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {value.track && (
        <div>
          <label htmlFor={`${idPrefix}-year`} className={labelClass}>
            {value.track === 'senior_high' ? 'Grade level' : 'Year level'}
          </label>
          <select
            id={`${idPrefix}-year`}
            value={value.year}
            onChange={(e) => setYear(e.target.value)}
            required
            disabled={disabled}
            className={selectClass}
          >
            <option value="">Select…</option>
            {yearOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
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
