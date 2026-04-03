import type { ReactNode } from 'react';
import { landingAuthCardShell } from '@/components/auth/authClasses';

type LandingAuthFormCardProps = {
  children: ReactNode;
};

export function LandingAuthFormCard({ children }: LandingAuthFormCardProps) {
  return (
    <div className={landingAuthCardShell}>
      <div className="px-4 py-4 sm:px-5 sm:py-5">{children}</div>
    </div>
  );
}
