import type { CSSProperties } from 'react';
import registerLoginPhoto from '../../image/register_login.jpeg';

/**
 * Full-bleed background for `/login`, `/register`, and the public landing (`PublicHome` for guests).
 * Campus building photo from project `image/register_login.jpeg` (not the app logo).
 */
export function authPagesBackgroundStyle(): CSSProperties {
  return {
    backgroundImage: `linear-gradient(165deg, rgba(15,23,42,0.42) 0%, rgba(15,23,42,0.58) 100%), url("${registerLoginPhoto}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };
}
