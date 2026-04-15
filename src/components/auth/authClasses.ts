/** Light theme (legacy / optional) */
export const authCardClass =
  "relative overflow-hidden w-full rounded-2xl border border-slate-200/85 bg-white p-6 shadow-[0_22px_45px_-16px_rgba(15,23,42,0.14),0_0_0_1px_rgba(255,255,255,0.8)_inset] ring-1 ring-slate-200/50 backdrop-blur-[2px] before:pointer-events-none before:absolute before:left-8 before:right-8 before:top-0 before:z-[2] before:h-[3px] before:rounded-b-full before:bg-gradient-to-r before:from-sky-400 before:via-campus-primary before:to-blue-700 before:content-[''] sm:p-8";

export const authInputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-[box-shadow,border-color] focus:border-campus-primary focus:outline-none focus:ring-2 focus:ring-campus-primary/20';

export const authPasswordInputClass = `${authInputClass} pr-11`;

export const authLabelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

export const authPrimaryButtonClass =
  'w-full inline-flex items-center justify-center gap-2 rounded-xl bg-campus-primary py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-campus-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-campus-primary focus-visible:ring-offset-2';

export const authSecondaryPanelClass =
  'rounded-xl border border-slate-200/90 bg-gradient-to-b from-slate-50/95 to-white p-4 text-left text-xs sm:text-sm text-slate-600';

export const authAlertBase = 'rounded-xl border px-3.5 py-2.5 text-sm flex gap-2.5 items-start';

/** Dark landing theme — matches `/about` (navy overlay, landing-sky accents, glass cards) */
export const landingAuthCardShell =
  'overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/40 backdrop-blur-md';

export const landingAuthInputClass =
  'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white shadow-inner shadow-black/20 placeholder:text-white/40 transition-[border-color,box-shadow] focus:border-landing-sky focus:outline-none focus:ring-2 focus:ring-landing-sky/25';

export const landingAuthPasswordInputClass = `${landingAuthInputClass} pr-10`;

export const landingAuthLabelClass = 'mb-1 block text-sm font-medium text-white/80';

export const landingAuthPrimaryButtonClass =
  'inline-flex w-full items-center justify-center gap-2 rounded-[1.1rem] bg-landing-sky py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/25 transition-all hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-landing-sky focus-visible:ring-offset-2 focus-visible:ring-offset-landing-navy';

export const landingAuthSecondaryPanelClass =
  'rounded-lg border border-white/10 bg-white/[0.06] p-3 text-left text-[13px] leading-snug text-white/80';

export const landingAuthDemoPanelClass =
  'rounded-lg border border-white/10 bg-white/[0.08] p-3 text-left shadow-inner shadow-black/20';

/** Collapsible panels (e.g. register “Before you register”) */
export const landingAuthDetailsShell =
  'rounded-lg border border-white/10 bg-white/[0.05] text-left [&_summary::-webkit-details-marker]:hidden';

export const landingAuthDividerClass = 'border-b border-white/10 pb-2';

export const landingAuthEyebrowClass =
  'text-landing-sky/90 text-xs font-semibold uppercase tracking-[0.2em]';

export const landingAuthLinkClass = 'font-semibold text-landing-sky hover:underline';

export const landingAuthMutedLinkClass = 'font-medium text-white/70 hover:text-white';

export const landingAlertBase = 'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs sm:text-sm';

export const landingAlertInfo = `${landingAlertBase} border-sky-400/35 bg-sky-500/15 text-sky-50`;
export const landingAlertWarn = `${landingAlertBase} border-amber-400/40 bg-amber-500/15 text-amber-50`;
export const landingAlertError = `${landingAlertBase} border-red-400/40 bg-red-500/15 text-red-100`;
