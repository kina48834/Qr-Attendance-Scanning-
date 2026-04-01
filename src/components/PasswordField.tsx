import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  autoComplete?: string;
  id?: string;
};

const inputClass =
  'w-full border border-slate-300 rounded-lg py-2 pl-3 pr-11 focus:outline-none focus:ring-2 focus:ring-campus-primary focus:border-campus-primary';

export function PasswordField({
  label,
  value,
  onChange,
  required,
  minLength,
  placeholder,
  autoComplete = 'current-password',
  id: idProp,
}: PasswordFieldProps) {
  const genId = useId();
  const fieldId = idProp ?? genId;
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          className={inputClass}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-800 rounded-r-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-campus-primary focus-visible:ring-offset-0"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-5 w-5 shrink-0" aria-hidden /> : <Eye className="h-5 w-5 shrink-0" aria-hidden />}
        </button>
      </div>
    </div>
  );
}
