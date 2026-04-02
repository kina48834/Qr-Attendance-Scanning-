import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Gem, Lightbulb, Target } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { landingHeroBackgroundStyle } from '@/constants/landingHeroBackground';

export function PublicAbout() {
  return (
    <div className="flex min-h-screen flex-col bg-landing-navy font-sans text-white">
      <header className="sticky top-0 z-50 shrink-0 border-b border-white/10 bg-landing-navy/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
          <BrandLogo
            variant="light"
            size="md"
            to="/"
            className="min-w-0 [&_img]:ring-2 [&_img]:ring-white/20"
            titleClassName="!text-white text-xl"
            subtitle="Connect • Organize • Engage"
          />
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[1.25rem] text-sm font-semibold text-white border border-white/35 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Home
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[1.25rem] text-sm font-semibold bg-landing-sky text-white hover:brightness-110 transition-all shadow-lg shadow-black/20"
            >
              Sign in
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <div
        className="relative flex min-h-0 flex-1 flex-col"
        style={landingHeroBackgroundStyle()}
      >
        <div className="relative mx-auto w-full max-w-3xl flex-1 px-4 py-12 pb-24 md:py-16">
          <p className="text-landing-sky/90 text-sm font-semibold tracking-[0.2em] uppercase mb-2">
            Andres Soriano Colleges of Bislig
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">About our institution</h1>
          <p className="text-white/75 text-base leading-relaxed max-w-2xl">
            Vision, mission, and values that guide ASCB — the same spirit behind Campus Connect for our campus community.
          </p>

          <div className="mt-12 space-y-0 rounded-2xl overflow-hidden border border-white/10 bg-white/[0.04] backdrop-blur-sm shadow-2xl shadow-black/40">
            <section className="flex flex-col sm:flex-row gap-0 border-b border-white/20">
              <div className="flex sm:flex-col items-center justify-center w-full sm:w-28 shrink-0 bg-landing-sky py-6 sm:py-10">
                <Lightbulb className="w-10 h-10 text-white drop-shadow-md" strokeWidth={1.75} />
              </div>
              <div className="flex-1 px-6 py-8 sm:py-10 sm:pl-8 sm:pr-10">
                <p className="text-white/80 text-xs font-semibold tracking-widest uppercase mb-1">Our</p>
                <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white mb-4">Vision</h2>
                <p className="text-white/90 text-sm sm:text-base leading-relaxed">
                  ASCB envisions itself as a leading private educational institution in the region and beyond, fostering
                  an empowering and transformative education that develops globally competent, values driven and socially
                  engaged individuals.
                </p>
              </div>
            </section>

            <section className="flex flex-col sm:flex-row gap-0 border-b border-white/20">
              <div className="flex sm:flex-col items-center justify-center w-full sm:w-28 shrink-0 bg-landing-sky py-6 sm:py-10">
                <Target className="w-10 h-10 text-white drop-shadow-md" strokeWidth={1.75} />
              </div>
              <div className="flex-1 px-6 py-8 sm:py-10 sm:pl-8 sm:pr-10">
                <p className="text-white/80 text-xs font-semibold tracking-widest uppercase mb-1">Our</p>
                <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white mb-4">Mission</h2>
                <p className="text-white/90 text-sm sm:text-base leading-relaxed">
                  Guided by a commitment to excellence, inclusivity and service, Andres Soriano Colleges of Bislig
                  provides holistic, accessible, and quality basic, technical-vocational, and higher education programs
                  that cultivate lifelong learning, critical thinking and innovation; uphold integrity, social
                  responsibility and cultural heritage; equip graduates with 21st century competencies for local and
                  global relevance; and strengthen linkages with industry, government, and civil society to advance social
                  development.
                </p>
              </div>
            </section>

            <section className="flex flex-col sm:flex-row gap-0">
              <div className="flex sm:flex-col items-center justify-center w-full sm:w-28 shrink-0 bg-landing-sky py-6 sm:py-10">
                <div className="relative flex items-center justify-center">
                  <Gem className="w-9 h-9 text-white drop-shadow-md" strokeWidth={1.75} />
                </div>
              </div>
              <div className="flex-1 px-6 py-8 sm:py-10 sm:pl-8 sm:pr-10">
                <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white mb-4">
                  Values statement
                </h2>
                <p className="text-white/90 text-sm sm:text-base leading-relaxed">
                  Guided by the ideals of Andres Soriano Colleges of Bislig, I shall uphold Accountability, exercise
                  Stewardship, lead with Compassion, and pursue Brilliance in all my endeavors.
                </p>
              </div>
            </section>
          </div>

          <div className="mt-12 flex flex-wrap gap-3 justify-center sm:justify-start">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-6 py-3 rounded-[1.25rem] font-semibold border-2 border-white/40 text-white hover:bg-white/10 transition-colors"
            >
              Register
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[1.25rem] font-semibold bg-landing-sky text-white hover:brightness-110 shadow-lg shadow-black/25"
            >
              Open Campus Connect
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
