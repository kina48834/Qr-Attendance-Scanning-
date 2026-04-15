import type { CSSProperties } from 'react';
import registerLoginPhoto from '../../image/register_login.jpeg';

/** Navy wash over the blurred hero (`AuthHeroBackdrop`). */
export const AUTH_HERO_GRADIENT_OVERLAY =
  'linear-gradient(165deg, rgba(15,23,42,0.42) 0%, rgba(15,23,42,0.58) 100%)';

/**
 * Flat combined background (no blur). Used by the guest-facing `PublicHome`.
 * Kept for one-off panels or tests.
 */
export function authPagesBackgroundStyle(): CSSProperties {
  return {
    backgroundImage: `${AUTH_HERO_GRADIENT_OVERLAY}, url("${registerLoginPhoto}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };
}
