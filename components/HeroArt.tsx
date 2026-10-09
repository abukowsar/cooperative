/** Illustrated farm scene for the home hero: sun, hills, a dairy cow and a milk can. */
export default function HeroArt() {
  return (
    <svg viewBox="0 0 360 300" role="img" aria-label="সবুজ মাঠে একটি দুধের গাভী ও দুধের ক্যান">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF4D6" />
          <stop offset="1" stopColor="#FFE3A3" />
        </linearGradient>
        <linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7CC46A" />
          <stop offset="1" stopColor="#3E8E3A" />
        </linearGradient>
        <linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A6D98A" />
          <stop offset="1" stopColor="#5FAE4E" />
        </linearGradient>
        <linearGradient id="can" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#C9D3D6" />
          <stop offset=".5" stopColor="#F4F7F8" />
          <stop offset="1" stopColor="#AEB9BD" />
        </linearGradient>
        <clipPath id="frame"><rect x="10" y="10" width="340" height="280" rx="34" /></clipPath>
      </defs>
      <g clipPath="url(#frame)">
        <rect x="0" y="0" width="360" height="300" fill="url(#sky)" />
        <circle cx="270" cy="78" r="34" fill="#FFC94A" />
        <circle cx="270" cy="78" r="48" fill="#FFC94A" opacity=".25" />
        <g fill="#fff" opacity=".9">
          <ellipse cx="90" cy="62" rx="30" ry="11" />
          <ellipse cx="112" cy="55" rx="20" ry="11" />
          <ellipse cx="190" cy="40" rx="18" ry="7" />
        </g>
        <path d="M0 190 Q90 130 190 175 T360 160 V300 H0Z" fill="url(#hill2)" />
        <path d="M0 225 Q120 180 230 215 T360 205 V300 H0Z" fill="url(#hill1)" />
        {/* grass tufts */}
        <g stroke="#2F7A2E" strokeWidth="2.4" strokeLinecap="round">
          <path d="M40 262 l-4 -10 M44 262 l0 -12 M48 262 l4 -10" />
          <path d="M300 250 l-4 -9 M304 250 l0 -11 M308 250 l4 -9" />
          <path d="M210 272 l-3 -8 M213 272 l0 -10 M216 272 l3 -8" />
        </g>
        {/* cow */}
        <g transform="translate(70 150)">
          <ellipse cx="95" cy="104" rx="88" ry="9" fill="#245E26" opacity=".25" />
          <g fill="#3A2A22">
            <rect x="38" y="62" width="13" height="42" rx="5" />
            <rect x="58" y="64" width="13" height="40" rx="5" />
            <rect x="118" y="64" width="13" height="40" rx="5" />
            <rect x="138" y="62" width="13" height="42" rx="5" />
          </g>
          <rect x="28" y="10" width="132" height="66" rx="30" fill="#FFFDF8" />
          <path d="M60 12c14 6 18 24 6 36-10 10-30 6-36-6 4-16 14-28 30-30Z" fill="#3A2A22" />
          <path d="M118 30c10-4 26 0 30 12 2 10-6 20-18 20-12 0-20-8-20-18 0-6 3-11 8-14Z" fill="#3A2A22" />
          <ellipse cx="96" cy="74" rx="16" ry="9" fill="#F6B8B3" />
          <path d="M158 40c6 0 10 6 9 14-1 12-6 20-10 22" stroke="#3A2A22" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* head */}
          <g transform="translate(-6 -6)">
            <path d="M8 6c-6-6-14-6-16-2 4 2 8 6 12 10Z" fill="#E7D6B8" />
            <path d="M44 6c6-6 14-6 16-2-4 2-8 6-12 10Z" fill="#E7D6B8" />
            <ellipse cx="2" cy="20" rx="10" ry="6" fill="#FFFDF8" transform="rotate(-25 2 20)" />
            <ellipse cx="50" cy="20" rx="10" ry="6" fill="#FFFDF8" transform="rotate(25 50 20)" />
            <rect x="6" y="6" width="40" height="52" rx="20" fill="#FFFDF8" />
            <path d="M14 14c6-4 16-4 22 0-2 8-6 12-11 12s-9-4-11-12Z" fill="#3A2A22" />
            <rect x="8" y="38" width="36" height="22" rx="11" fill="#F6B8B3" />
            <circle cx="18" cy="48" r="2.6" fill="#7A4A44" />
            <circle cx="34" cy="48" r="2.6" fill="#7A4A44" />
            <circle cx="16" cy="30" r="3" fill="#1D1A18" />
            <circle cx="36" cy="30" r="3" fill="#1D1A18" />
            <circle cx="17" cy="29" r="1" fill="#fff" />
            <circle cx="37" cy="29" r="1" fill="#fff" />
          </g>
        </g>
        {/* milk can */}
        <g transform="translate(258 168)">
          <ellipse cx="30" cy="96" rx="34" ry="6" fill="#245E26" opacity=".25" />
          <path d="M14 0h32v10l8 14v66a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V24l8-14Z" fill="url(#can)" stroke="#8C989C" strokeWidth="1.5" />
          <rect x="10" y="-6" width="40" height="8" rx="3" fill="#B7C1C5" />
          <rect x="6" y="44" width="48" height="22" rx="3" fill="#0F7F5C" />
          <text x="30" y="60" textAnchor="middle" fontSize="13" fill="#fff" fontFamily="var(--f-display)">দুধ</text>
          <path d="M6 34h48" stroke="#8C989C" strokeWidth="1.5" />
        </g>
        {/* milk drops */}
        <g fill="#fff">
          <path d="M235 120c-5 7-8 11-8 15a8 8 0 0 0 16 0c0-4-3-8-8-15Z" opacity=".95" />
          <path d="M210 92c-3 4-5 7-5 9a5 5 0 0 0 10 0c0-2-2-5-5-9Z" opacity=".8" />
        </g>
      </g>
    </svg>
  );
}
