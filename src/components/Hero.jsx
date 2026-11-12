import Icon from './Icon.jsx';

const CHECKLIST = [
  { icon: 'file', title: 'Your latest resume', desc: 'PDF, DOC or DOCX · up to 5 MB' },
  { icon: 'linkedin', title: 'LinkedIn profile URL', desc: 'Helps us know your professional story' },
  { icon: 'briefcase', title: 'Employment details', desc: 'Your current or most recent role' },
];

export default function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-layout">
          <div className="hero-copy">
            <span className="eyebrow"><span className="pulse" /> We're hiring · Careers at Milta</span>
            <h1>Build a career that <em>adds&nbsp;up.</em></h1>
            <p className="lead">
              Join a team that turns numbers into confident decisions. Tell us about yourself, your experience
              and the role you're excited about — it only takes a few minutes.
            </p>
            <div className="hero-actions">
              <a href="#apply" className="btn btn-accent btn-lg">
                Start your application
                <Icon name="arrow" />
              </a>
              <a href="#about" className="btn btn-outline-light btn-lg">Discover Milta</a>
            </div>
          </div>

          {/* Styled like an accounts statement: numbered entries summed to a double-underlined total. */}
          <aside className="hero-card" aria-label="What you'll need">
            <div className="ledger-head">
              <p className="hero-card-kicker">Before you begin</p>
              <h2>Keep these handy</h2>
            </div>
            <ol className="ledger">
              {CHECKLIST.map((item, i) => (
                <li key={item.title}>
                  <span className="ledger-num">{String(i + 1).padStart(2, '0')}</span>
                  <div className="ledger-item">
                    <strong>{item.title}</strong>
                    <span>{item.desc}</span>
                  </div>
                  <span className="ledger-icon"><Icon name={item.icon} /></span>
                </li>
              ))}
            </ol>
            <div className="ledger-total">
              <span>Total time to apply</span>
              <strong>≈ 5 min</strong>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
