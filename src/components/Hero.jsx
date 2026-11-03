import Icon from './Icon.jsx';

const HERO_POINTS = ['Quick 5-minute application', 'Freshers & experienced welcome', 'Easy resume upload'];

const CHECKLIST = [
  { icon: 'file', title: 'Your latest resume', desc: 'PDF, DOC or DOCX · up to 5 MB' },
  { icon: 'linkedin', title: 'LinkedIn profile URL', desc: 'Helps us know your professional story' },
  { icon: 'briefcase', title: 'Employment details', desc: 'Your current or most recent role' },
];

export default function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-panel">
          <div className="hero-decor" aria-hidden="true">
            <div className="hero-grid-lines" />
            <svg className="hero-arc" viewBox="0 0 600 600">
              <defs>
                <linearGradient id="arcGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#A6D85E" stopOpacity=".05" />
                  <stop offset=".55" stopColor="#8CC63F" stopOpacity=".55" />
                  <stop offset="1" stopColor="#8CC63F" />
                </linearGradient>
                <marker id="arcArrow" viewBox="0 0 10 10" refX="4" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto">
                  <path d="M0 0 10 5 0 10z" fill="#8CC63F" />
                </marker>
              </defs>
              <path
                d="M420 92 A240 240 0 1 0 484 454"
                fill="none"
                stroke="url(#arcGradient)"
                strokeWidth="9"
                strokeLinecap="round"
                markerEnd="url(#arcArrow)"
              />
            </svg>
          </div>

          <div className="hero-layout">
            <div className="hero-copy">
              <span className="eyebrow"><span className="pulse" /> We're hiring · Careers at Milta</span>
              <h1>Build a career that <em>adds&nbsp;up.</em></h1>
              <p className="lead">
                Join a team that turns numbers into confident decisions. Tell us about yourself, your experience
                and the role you're excited about — it only takes a few minutes.
              </p>
              <div className="hero-actions">
                <a href="#apply" className="btn btn-primary btn-lg">
                  Start your application
                  <Icon name="arrow" />
                </a>
                <a href="#about" className="btn btn-ghost-light btn-lg">Discover Milta</a>
              </div>
              <ul className="hero-points">
                {HERO_POINTS.map((point) => (
                  <li key={point}><Icon name="check" /> {point}</li>
                ))}
              </ul>
            </div>

            <aside className="hero-card" aria-label="What you'll need">
              <p className="hero-card-kicker">Before you begin</p>
              <h2>Keep these handy</h2>
              <ul className="checklist">
                {CHECKLIST.map((item) => (
                  <li key={item.title}>
                    <span className="checklist-icon"><Icon name={item.icon} /></span>
                    <div><strong>{item.title}</strong><span>{item.desc}</span></div>
                  </li>
                ))}
              </ul>
              <div className="hero-card-foot">
                <Icon name="clock" />
                Takes about 5 minutes to complete
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
