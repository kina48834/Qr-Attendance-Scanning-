import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { landingHeroBackgroundStyle } from '@/constants/landingHeroBackground';

type AuthPageLayoutProps = {
  children: ReactNode;
  tall?: boolean;
  authMode: 'login' | 'register';
};

export function AuthPageLayout({ children, tall, authMode }: AuthPageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-landing-navy font-sans text-white">
      <header className="sticky top-0 z-50 shrink-0 border-b border-white/10 bg-landing-navy/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:py-4">
          <BrandLogo
            variant="light"
            size="md"
            to="/"
            className="min-w-0 [&_img]:ring-2 [&_img]:ring-white/20"
            titleClassName="!text-white text-xl"
            subtitle="Connect • Organize • Engage"
          />
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-[1.25rem] border border-white/35 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Home
            </Link>
            {authMode === 'login' ? (
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 rounded-[1.25rem] bg-landing-sky px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-all hover:brightness-110"
              >
                Register
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-[1.25rem] bg-landing-sky px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-all hover:brightness-110"
              >
                Sign in
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
          </div>
        </div>
      </header>

      <div
        className="relative flex min-h-0 flex-1 flex-col"
        style={landingHeroBackgroundStyle()}
      >
        <div
          className={`relative mx-auto w-full max-w-3xl flex-1 px-4 ${tall ? 'py-6 sm:py-10 pb-12' : 'py-6 sm:py-8'}`}
        >
          <div className={`mx-auto w-full ${tall ? 'max-w-lg' : 'max-w-[26rem]'}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
