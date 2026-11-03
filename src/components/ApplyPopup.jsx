import { useCallback, useEffect, useRef, useState } from 'react';
import { OPENINGS } from '../config.js';
import { cx } from '../utils/cx.js';
import Icon from './Icon.jsx';

const STORAGE_KEY = 'milta:apply-popup-seen';
const OPEN_DELAY_MS = 900;
const CLOSE_MS = 260;
const ROLES = OPENINGS.filter((role) => role !== 'Other');
const VISIBLE_ROLES = 3;

// Shown once per browser session, so a refresh doesn't bring it back.
function alreadySeen() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Storage unavailable (private mode etc.) — the popup may show again next visit.
  }
}

// Animated version of the logo mark: an arc with an arrow around rising bars.
function Emblem() {
  return (
    <svg className="emblem" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <linearGradient id="emblemArc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A2D657" stopOpacity=".25" />
          <stop offset="1" stopColor="#8CC63F" />
        </linearGradient>
        <linearGradient id="emblemBar" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#3A6B19" />
          <stop offset="1" stopColor="#A2D657" />
        </linearGradient>
      </defs>
      <circle className="emblem-glow" cx="60" cy="60" r="40" />
      <path className="emblem-arc" d="M84 18.4A48 48 0 1 0 96.8 90.9" pathLength="1" />
      <polygon className="emblem-head" points="101.9,84.8 100.1,96.3 90.9,88.5" />
      <g>
        <rect className="emblem-bar" x="38" y="66" width="8" height="14" rx="1.5" />
        <rect className="emblem-bar" x="50" y="58" width="8" height="22" rx="1.5" />
        <rect className="emblem-bar" x="62" y="50" width="8" height="30" rx="1.5" />
        <rect className="emblem-bar" x="74" y="40" width="8" height="40" rx="1.5" />
      </g>
      <polyline className="emblem-line" points="42,60 54,52 66,44 78,34" pathLength="1" />
      {[[42, 60], [54, 52], [66, 44], [78, 34]].map(([cx, cy]) => (
        <circle key={cx} className="emblem-dot" cx={cx} cy={cy} r="2.6" />
      ))}
    </svg>
  );
}

export default function ApplyPopup() {
  const [state, setState] = useState('hidden'); // hidden | open | closing
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    // Skip it when the link already points at the form.
    if (alreadySeen() || window.location.hash === '#apply') return undefined;
    const timer = setTimeout(() => {
      returnFocusRef.current = document.activeElement;
      setState('open');
    }, OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const close = useCallback((afterClose) => {
    markSeen();
    document.documentElement.classList.remove('has-popup');
    setState('closing');
    setTimeout(() => {
      setState('hidden');
      afterClose?.();
    }, CLOSE_MS);
  }, []);

  const dismiss = useCallback(() => {
    close(() => returnFocusRef.current?.focus?.());
  }, [close]);

  const apply = () => {
    close(() => document.getElementById('fullName')?.focus({ preventScroll: true }));
    document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Lock page scroll, close on Escape and keep Tab focus inside the dialog while open.
  useEffect(() => {
    if (state !== 'open') return undefined;
    const root = document.documentElement;
    root.classList.add('has-popup');

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        dismiss();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = dialogRef.current.querySelectorAll('button, a[href]');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!dialogRef.current.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      root.classList.remove('has-popup');
    };
  }, [state, dismiss]);

  if (state === 'hidden') return null;

  const extraRoles = ROLES.length - VISIBLE_ROLES;

  return (
    <div
      className={cx('popup-backdrop', state === 'closing' && 'is-closing')}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div
        className="popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-title"
        aria-describedby="popup-desc"
        ref={dialogRef}
      >
        <button type="button" className="popup-close" aria-label="Close" onClick={dismiss}>
          <Icon name="x" />
        </button>

        <Emblem />

        <span className="eyebrow"><span className="pulse" /> We're hiring</span>
        <h2 id="popup-title">Your next chapter starts <em>here.</em></h2>
        <p id="popup-desc" className="popup-text">
          Grow your career with Milta. Explore our open roles and apply in just a few minutes.
        </p>

        <ul className="popup-roles" aria-label="Open roles">
          {ROLES.slice(0, VISIBLE_ROLES).map((role, i) => (
            <li key={role} style={{ '--i': i }}>{role}</li>
          ))}
          {extraRoles > 0 && (
            <li className="popup-roles-more" style={{ '--i': VISIBLE_ROLES }}>+{extraRoles} more</li>
          )}
        </ul>

        <button type="button" className="btn btn-primary btn-lg popup-apply" onClick={apply} autoFocus>
          Apply now
          <Icon name="arrow" />
        </button>
        <button type="button" className="popup-later" onClick={dismiss}>Maybe later</button>

        <p className="popup-note">
          <Icon name="clock" />
          Takes about 5 minutes
        </p>
      </div>
    </div>
  );
}
