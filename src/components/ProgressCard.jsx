import { cx } from '../utils/cx.js';
import Icon from './Icon.jsx';

const RING_RADIUS = 28;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

export default function ProgressCard({ steps, activeStep, done, total, submitted }) {
  const ratio = submitted ? 1 : total ? done / total : 0;
  let subtitle = `${done} of ${total} required fields`;
  if (submitted) subtitle = 'Application submitted';
  else if (done === total) subtitle = 'Ready to submit';

  return (
    <aside className="progress-card" aria-label="Application progress">
      <div className="progress-top">
        <div className="ring">
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <circle className="ring-track" cx="32" cy="32" r={RING_RADIUS} />
            <circle
              className="ring-value"
              cx="32"
              cy="32"
              r={RING_RADIUS}
              style={{ strokeDasharray: RING_LENGTH, strokeDashoffset: RING_LENGTH * (1 - ratio) }}
            />
          </svg>
          <span className="ring-label">{Math.round(ratio * 100)}%</span>
        </div>
        <div>
          <p className="progress-title">Your progress</p>
          <p className="progress-sub">{subtitle}</p>
        </div>
      </div>

      <ol className="steps">
        {steps.map((step, i) => (
          <li key={step.id}>
            <a
              className={cx('step', activeStep === step.id && 'is-active', step.complete && 'is-complete')}
              href={`#sec-${step.id}`}
            >
              <span className="step-dot">
                <span className="step-n">{i + 1}</span>
                <Icon name="check" />
              </span>
              <span className="step-text">
                <strong>{step.title}</strong>
                <small>{step.desc}</small>
              </span>
            </a>
          </li>
        ))}
      </ol>

      <p className="secure-note">
        <Icon name="lock" />
        Your details are kept confidential and used only for recruitment.
      </p>
    </aside>
  );
}
