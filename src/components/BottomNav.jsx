/**
 * Fixed bottom nav: Home, More, Watchlist, Jump (left to right, per spec).
 * Active tab fills solid #3D6D95 with light icon/label; inactive stays
 * transparent with dark icon/label.
 *
 * Icon notes (see spec §3):
 * - Home: outline house, sourced from icon-icons.com in production.
 * - More / Jump: custom Figma icons — the SVGs below are placeholders only;
 *   swap in the real exported assets before shipping.
 * - Watchlist: Figma library star icon, outline / filled-on-active.
 */
export default function BottomNav({ active, onHome, onMore, onWatchlist, onJump, hasFocusedLot }) {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Primary">
      <NavButton
        label="Home"
        isActive={active === 'home'}
        onClick={onHome}
        icon={<HomeIcon />}
      />
      <NavButton
        label="More"
        isActive={active === 'more'}
        onClick={onMore}
        icon={<MoreIcon />}
        disabled={!hasFocusedLot}
      />
      <NavButton
        label="Watchlist"
        isActive={active === 'watchlist'}
        onClick={onWatchlist}
        icon={<WatchlistIcon filled={active === 'watchlist'} />}
      />
      <NavButton
        label="Jump"
        isActive={active === 'jump'}
        onClick={onJump}
        icon={<JumpIcon />}
      />
    </nav>
  );
}

function NavButton({ label, isActive, onClick, icon, disabled }) {
  return (
    <button
      type="button"
      className={`nav-button${isActive ? ' is-active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="nav-icon">{icon}</span>
      <span className="nav-label">{label}</span>
    </button>
  );
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 11.5L12 4l9 7.5M5.5 10v9a1 1 0 001 1H9.5a1 1 0 001-1v-4a1 1 0 011-1h1a1 1 0 011 1v4a1 1 0 001 1H17.5a1 1 0 001-1v-9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Placeholder — replace with Figma export (frame + numeral "1" + brackets).
function MoreIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 6h2M19 6h2M3 18h2M19 18h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="6.5" y="4.5" width="11" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <text x="12" y="14.5" fontSize="7" textAnchor="middle" fill="currentColor" stroke="none">1</text>
    </svg>
  );
}

function WatchlistIcon({ filled }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.8l7.1-.7L12 2.5z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Placeholder — replace with Figma export (list lines + magnifying glass).
function JumpIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 5h11M3 9h11M3 13h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="16.5" cy="16" r="3.3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M18.8 18.3L21.5 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
