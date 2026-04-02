import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { landingAuthCardShell } from '@/components/auth/authClasses';

type LandingAuthFormCardProps = {
  icon: LucideIcon;
  children: ReactNode;
};

export function LandingAuthFormCard({ icon: Icon, children }: LandingAuthFormCardProps) {
  return (
    <div className={landingAuthCardShell}>
      <div className="flex flex-col sm:flex-row">
        <div className="flex w-full shrink-0 items-center justify-center border-b border-white/10 bg-landing-sky py-3 sm:w-[4.5rem] sm:flex-col sm:border-b-0 sm:border-r sm:py-5">
          <Icon className="h-7 w-7 text-white drop-shadow-md sm:h-8 sm:w-8" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0 flex-1 px-4 py-4 sm:px-5 sm:py-5">{children}</div>
      </div>
    </div>
  );
}
