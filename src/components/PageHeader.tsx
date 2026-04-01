import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  badge?: ReactNode;
};

export function PageHeader({ title, description, badge }: PageHeaderProps) {
  return (
    <div className="relative">
      <div
        className="absolute -left-1 top-0 h-full w-1 rounded-full bg-gradient-to-b from-campus-primary to-campus-accent sm:-left-2"
        aria-hidden
      />
      <div className="space-y-1.5 pl-3 sm:pl-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  );
}

export function RoleBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-campus-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-campus-primary ring-1 ring-campus-primary/20">
      {children}
    </span>
  );
}
