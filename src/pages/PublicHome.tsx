import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  LogIn,
  Mic2,
  Palette,
  QrCode,
  Sparkles,
  Users,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { authPagesBackgroundStyle } from '@/constants/authHeroBackground';
import { fetchPublicUpcomingEvents } from '@/supabase/dataService';
import type { Event } from '@/types';

const EVENT_ACCENT = [
  { icon: GraduationCap, chip: 'bg-violet-500', soft: 'bg-violet-100 text-violet-700' },
  { icon: Palette, chip: 'bg-pink-500', soft: 'bg-pink-100 text-pink-700' },
  { icon: Mic2, chip: 'bg-orange-500', soft: 'bg-orange-100 text-orange-700' },
  { icon: Sparkles, chip: 'bg-emerald-500', soft: 'bg-emerald-100 text-emerald-700' },
] as const;

function formatEventDayBadge(iso: string) {
  const d = new Date(iso);
  return {
    day: d.getDate(),
    month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
  };
}

export function PublicHome() {
  const upcomingEventsListId = useId();
  const [upcoming, setUpcoming] = useState<Event[]>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventsExpanded, setEventsExpanded] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchPublicUpcomingEvents(8);
        if (!cancelled) {
          setUpcoming(rows);
          setEventsError(null);
        }
      } catch {
        if (!cancelled) {
          setUpcoming([]);
          setEventsError('Unable to load events right now.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-landing-navy font-sans text-white">
      <header className="sticky top-0 z-50 shrink-0 border-b border-white/10 bg-landing-navy/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
          <BrandLogo
            variant="light"
            size="md"
            to="/"
            className="min-w-0 [&_img]:ring-2 [&_img]:ring-white/20"
            titleClassName="!text-white text-xl"
            subtitle="Connect • Organize • Engage"
          />
          <nav className="flex flex-wrap items-center justify-end gap-2 shrink-0">
            <Link
              to="/about"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[1.25rem] text-sm font-semibold text-white border border-white/35 hover:bg-white/10 transition-colors"
            >
              About
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[1.25rem] text-sm font-semibold text-white border-2 border-white/50 hover:bg-white/10 transition-colors"
            >
              Register
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[1.25rem] text-sm font-semibold bg-landing-sky text-white shadow-lg shadow-black/20 hover:brightness-110 transition-all"
            >
              Sign in
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </Link>
          </nav>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col" style={authPagesBackgroundStyle()}>
        <section className="relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 pt-10 pb-16 md:pt-14 md:pb-24 grid lg:grid-cols-[1fr_min(380px,100%)] gap-10 lg:gap-12 items-start">
          <div className="max-w-xl">
            <h1 className="text-4xl sm:text-5xl md:text-[2.75rem] font-bold text-white leading-tight tracking-tight drop-shadow-sm">
              School Event{' '}
              <span className="bg-gradient-to-r from-landing-sky via-white to-blue-200 bg-clip-text text-transparent">
                Management
              </span>
            </h1>
            <p className="mt-3 text-2xl sm:text-3xl md:text-[2rem] font-display text-landing-sky font-semibold drop-shadow-sm">
              Plan. Track. Participate.
            </p>
            <p className="mt-5 text-white/85 text-base sm:text-lg leading-relaxed">
              Campus Connect brings events, attendance, and analytics into one place. Organisers publish activities,
              students check in with a single QR scan, and dashboards keep everyone aligned — all backed by your live
              campus data.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[1.25rem] font-semibold text-white bg-landing-sky shadow-lg shadow-black/25 hover:brightness-110 transition-all text-base"
              >
                Get started — Sign in
                <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[1.25rem] font-semibold text-white border-2 border-white/50 bg-white/10 hover:bg-white/15 backdrop-blur-sm transition-colors"
              >
                About ASCB
              </Link>
            </div>
          </div>

          <div className="w-full lg:justify-self-end">
            <div className="rounded-[1.35rem] bg-white/95 backdrop-blur-md shadow-float border border-white/80 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-campus-light text-campus-primary">
                    <CalendarDays className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-bold text-slate-900 text-lg leading-tight">Upcoming Events</h2>
                    {upcoming.length > 0 && !eventsError && !eventsExpanded && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {upcoming.length} {upcoming.length === 1 ? 'event' : 'events'} — expand to view
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <Link
                    to="/login"
                    className="text-sm font-semibold text-campus-primary hover:text-campus-secondary inline-flex items-center gap-0.5 px-1"
                  >
                    View all
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <span className="w-px h-5 bg-slate-200 hidden sm:block" aria-hidden />
                  <div
                    role="group"
                    aria-label="Expand or collapse upcoming events"
                    className="flex items-center rounded-xl border border-slate-200 bg-slate-50/90 p-0.5 shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setEventsExpanded(true)}
                      disabled={eventsExpanded}
                      aria-label="Expand upcoming events list"
                      aria-controls={upcomingEventsListId}
                      aria-expanded={eventsExpanded}
                      title="Show list"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-campus-primary disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEventsExpanded(false)}
                      disabled={!eventsExpanded}
                      aria-label="Collapse upcoming events list"
                      aria-controls={upcomingEventsListId}
                      aria-expanded={eventsExpanded}
                      title="Hide list"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-campus-primary disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
              {eventsError && (
                <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-3 py-2 mb-3">{eventsError}</p>
              )}
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                  eventsExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden min-h-0">
                  <ul
                    id={upcomingEventsListId}
                    className={`space-y-3 pt-1 ${!eventsExpanded ? 'pointer-events-none select-none' : ''}`}
                    aria-hidden={!eventsExpanded}
                  >
                    {upcoming.length === 0 && !eventsError ? (
                      <li className="text-sm text-slate-500 py-6 text-center rounded-xl bg-slate-50 border border-slate-100">
                        No upcoming published events yet. Sign in to create or browse when organisers go live.
                      </li>
                    ) : (
                      upcoming.map((evt, i) => {
                        const { icon: Icon, chip, soft } = EVENT_ACCENT[i % EVENT_ACCENT.length];
                        const { day, month } = formatEventDayBadge(evt.startDate);
                        const blurb = (evt.description || '').trim() || evt.location || 'Campus event';
                        return (
                          <li
                            key={evt.id}
                            className="flex gap-3 items-stretch rounded-2xl border border-slate-100 bg-slate-50/80 p-3 pr-2 hover:bg-white hover:border-campus-primary/15 hover:shadow-md transition-all"
                          >
                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-inner ${chip}`}
                            >
                              <Icon className="w-6 h-6" strokeWidth={2} />
                            </div>
                            <div className="min-w-0 flex-1 py-0.5">
                              <p className="font-semibold text-slate-900 leading-snug truncate">{evt.title}</p>
                              <p
                                className={`text-xs mt-1 line-clamp-2 rounded-md px-2 py-1 inline-block max-w-full ${soft}`}
                              >
                                {blurb}
                              </p>
                            </div>
                            <div
                              className={`shrink-0 flex flex-col items-center justify-center rounded-xl px-3 py-2 text-white text-center min-w-[3.25rem] ${chip}`}
                            >
                              <span className="text-lg font-bold leading-none">{day}</span>
                              <span className="text-[10px] font-semibold tracking-wider opacity-95">{month}</span>
                            </div>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        </section>

      <main className="max-w-6xl mx-auto px-4 py-14 md:py-20 w-full">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <article className="group rounded-[1.25rem] bg-white p-7 shadow-float border border-slate-100/80 hover:border-campus-primary/20 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-campus-light to-blue-100 flex items-center justify-center mb-5 shadow-inner">
              <Calendar className="w-6 h-6 text-campus-primary" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Event Management</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Create, publish, and manage school events in one workflow. Students browse what matters and register when
              programs open.
            </p>
            <div className="rounded-2xl bg-gradient-to-b from-slate-50 to-campus-light/30 border border-slate-100 h-28 flex items-end justify-center pb-3 overflow-hidden">
              <div className="flex gap-1.5 items-end">
                {[4, 7, 5, 8, 6].map((h, idx) => (
                  <div
                    key={idx}
                    className="w-2 rounded-t bg-gradient-to-t from-campus-primary to-indigo-400 opacity-80"
                    style={{ height: `${h * 8}px` }}
                  />
                ))}
              </div>
            </div>
          </article>

          <article className="group rounded-[1.25rem] bg-white p-7 shadow-float border border-slate-100/80 hover:border-emerald-300/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5 shadow-inner">
              <QrCode className="w-6 h-6 text-emerald-600" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">QR Attendance</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              One secure QR per event. Students scan with their device and attendance is recorded instantly — no paper
              lists.
            </p>
            <div className="relative rounded-2xl bg-slate-900/5 border border-slate-100 h-28 flex items-center justify-center gap-4">
              <div className="w-10 h-16 rounded-lg border-2 border-slate-300 bg-white shadow-md flex flex-col items-center pt-1 gap-0.5">
                <div className="w-6 h-1 rounded bg-slate-200" />
                <div className="w-7 h-7 mt-1 border border-slate-800 grid grid-cols-3 gap-px p-0.5 bg-white">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className={i % 3 === 1 ? 'bg-slate-800' : 'bg-slate-200'} />
                  ))}
                </div>
              </div>
              <QrCode className="w-14 h-14 text-emerald-600" />
            </div>
          </article>

          <article className="group rounded-[1.25rem] bg-white p-7 shadow-float border border-slate-100/80 hover:border-violet-200 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mb-5 shadow-inner">
              <BarChart3 className="w-6 h-6 text-violet-600" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Analytics &amp; Reports</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Participation, trends, and activity by role — so teachers and admins can support students with clear
              numbers.
            </p>
            <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-white border border-violet-100 h-28 flex items-center px-4">
              <svg viewBox="0 0 120 48" className="w-full h-16 text-violet-500" aria-hidden>
                <path
                  d="M4 40 L20 28 L36 32 L52 12 L68 20 L84 8 L100 16 L116 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="116" cy="4" r="3" fill="currentColor" />
              </svg>
            </div>
          </article>
        </section>

        <section className="mt-14 rounded-[1.35rem] bg-white/90 backdrop-blur border border-slate-100 shadow-float p-8 md:p-10">
          <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-campus-primary" />
            Who uses Campus Connect
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {[
              ['Administrator', 'System-wide users, events, and attendance with full analytics.'],
              ['Organiser', 'Run events, show QR codes, and monitor live attendance.'],
              ['Teacher', 'Manage class events and review participation for your groups.'],
              ['Student', 'Browse events, register, and scan QR to record attendance.'],
            ].map(([title, desc]) => (
              <div key={title} className="p-4 rounded-2xl bg-slate-50/90 border border-slate-100 hover:border-campus-primary/20 transition-colors">
                <span className="font-semibold text-slate-900">{title}</span>
                <p className="text-slate-600 mt-2 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-16 text-right font-display text-2xl sm:text-3xl text-white font-semibold pr-1 relative drop-shadow-sm">
          <span className="relative inline-block">
            Your Campus, Your Events, All in One Place.
            <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-landing-sky/70 to-transparent rounded-full" />
          </span>
        </p>

        <div className="mt-10 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-landing-sky font-semibold hover:brightness-110 transition-all"
          >
            <LogIn className="w-4 h-4" />
            Sign in to your account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <footer className="mt-auto border-t border-white/15 bg-black/25 backdrop-blur-md py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
          <BrandLogo variant="light" size="xs" showTitle={false} to="/" className="[&_img]:ring-1 [&_img]:ring-white/20" />
          <p className="text-sm text-white/70 max-w-md leading-relaxed">
            Web-based school event management — events, QR attendance, and analytics for Andres Soriano Colleges of
            Bislig and beyond.
          </p>
        </div>
      </footer>
      </div>
    </div>
  );
}
