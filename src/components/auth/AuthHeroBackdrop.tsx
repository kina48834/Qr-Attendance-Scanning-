import registerLoginPhoto from '../../../image/register_login.jpeg';
import { AUTH_HERO_GRADIENT_OVERLAY } from '@/constants/authHeroBackground';

/**
 * Full-bleed campus photo with a subtle blur + navy gradient (login/register only).
 */
export function AuthHeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div
        className="absolute -inset-[8%] bg-cover bg-center bg-no-repeat blur-lg sm:blur-xl"
        style={{ backgroundImage: `url(${registerLoginPhoto})` }}
      />
      <div className="absolute inset-0" style={{ background: AUTH_HERO_GRADIENT_OVERLAY }} />
    </div>
  );
}
