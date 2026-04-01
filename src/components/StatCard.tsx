import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

type StatCardLinkProps = {
  to: string;
  label: string;
  value: number;
  icon: LucideIcon;
  iconClassName: string;
};

export function StatCardLink({ to, label, value, icon: Icon, iconClassName }: StatCardLinkProps) {
  return (
    <Link
      to={to}
      className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-card hover:shadow-card-hover hover:border-campus-primary/20 transition-all duration-200 flex items-center gap-4"
    >
      <div className={`${iconClassName} rounded-xl p-3 text-white shadow-sm`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
        <p className="text-sm text-slate-600">{label}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-campus-primary transition-colors shrink-0" />
    </Link>
  );
}

type StatCardStaticProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  iconClassName: string;
};

export function StatCardStatic({ label, value, icon: Icon, iconClassName }: StatCardStaticProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-card flex items-center gap-4">
      <div className={`${iconClassName} rounded-xl p-3 text-white shadow-sm`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
        <p className="text-sm text-slate-600">{label}</p>
      </div>
    </div>
  );
}
