import { useEffect, useRef } from 'react';

export default function SuccessPanel({ name, position, email, onReset }) {
  const ref = useRef(null);

  useEffect(() => {
    ref.current.focus({ preventScroll: true });
  }, []);

  return (
    <div className="success" ref={ref} tabIndex={-1}>
      <div className="success-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
      </div>
      <h3>Application submitted</h3>
      <p>
        Thank you, <strong>{name}</strong>. We've received your application for <strong>{position}</strong>.
        Our hiring team will review your profile and reach out to you at <strong>{email}</strong>.
      </p>
      <button type="button" className="btn btn-outline btn-lg" onClick={onReset}>
        Submit another application
      </button>
    </div>
  );
}
