import type { CSSProperties } from 'react';

/** Same Unsplash + overlay as `/about` — keep in sync for a unified campus look */
export const LANDING_HERO_BG_IMAGE =
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=2000&q=70';

export function landingHeroBackgroundStyle(): CSSProperties {
  return {
    backgroundImage: `linear-gradient(165deg, rgba(26,32,44,0.97) 0%, rgba(26,32,44,0.92) 45%, rgba(26,32,44,0.96) 100%), url(${LANDING_HERO_BG_IMAGE})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
}
