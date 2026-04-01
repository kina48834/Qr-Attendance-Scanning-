import { Link } from 'react-router-dom';
import logoUrl from '../../image/logo.jfif';

type BrandLogoProps = {
  /** Visual size of the mark */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Show “Campus Connect” next to the mark */
  showTitle?: boolean;
  to?: string;
  onClick?: () => void;
  /** Light text on dark sidebar */
  variant?: 'light' | 'dark';
  /** Row (nav) vs column (login card hero) */
  layout?: 'row' | 'column';
  className?: string;
  titleClassName?: string;
};

const sizeClasses = {
  xs: 'h-7 w-auto max-h-7',
  sm: 'h-8 w-auto max-h-8',
  md: 'h-9 w-auto max-h-9',
  lg: 'h-12 w-auto max-h-12',
  xl: 'h-16 w-auto max-h-16 md:h-20 md:max-h-20',
};

export function BrandLogo({
  size = 'md',
  showTitle = true,
  to = '/',
  onClick,
  variant = 'dark',
  layout = 'row',
  className = '',
  titleClassName = '',
}: BrandLogoProps) {
  const titleColor =
    variant === 'light'
      ? 'text-campus-accent font-bold text-lg tracking-tight'
      : 'text-campus-primary font-bold text-xl';

  const flexDir = layout === 'column' ? 'flex-col items-center text-center' : 'flex-row items-center';
  const titleAlign = layout === 'column' ? 'text-center' : 'text-left';

  const inner = (
    <>
      <img
        src={logoUrl}
        alt="Campus Connect"
        className={`object-contain shrink-0 rounded-md ${sizeClasses[size]}`}
        width={160}
        height={160}
        decoding="async"
      />
      {showTitle && (
        <span className={`truncate max-w-full leading-tight ${titleAlign} ${titleColor} ${titleClassName}`}>
          Campus Connect
        </span>
      )}
    </>
  );

  const linkClass = `flex ${flexDir} gap-2.5 min-w-0 ${className}`;

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={linkClass}>
        {inner}
      </Link>
    );
  }

  return (
    <span className={linkClass}>
      {inner}
    </span>
  );
}
