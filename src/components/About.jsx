import Icon from './Icon.jsx';
import Reveal from './Reveal.jsx';

const VALUES = [
  {
    icon: 'trend',
    title: 'Grow every quarter',
    text: 'Learning, mentorship and clear career paths that help you keep levelling up.',
  },
  {
    icon: 'target',
    title: 'Work that matters',
    text: 'Take ownership of meaningful work and see the real impact of what you deliver.',
  },
  {
    icon: 'users',
    title: 'People-first culture',
    text: 'A collaborative, respectful team where your ideas are heard and your wellbeing counts.',
  },
];

export default function About() {
  return (
    <section className="section about" id="about">
      <div className="container">
        <Reveal className="about-grid">
          <div>
            <span className="section-kicker">Milta introduction</span>
            <h2 className="section-title">Where precision meets <em>possibility.</em></h2>
          </div>
          <div className="about-copy">
            <p>
              At Milta, we believe that when numbers are clear, businesses grow with confidence. Our team brings
              precision, integrity and genuine care to everything we do — and our people are the reason clients
              trust us.
            </p>
            <p>
              Whether you're just starting out or bringing years of experience, we'd love to hear from you.
              Complete the application below and our hiring team will be in touch.
            </p>
          </div>
        </Reveal>

        <div className="values" id="why">
          {VALUES.map((value, i) => (
            <Reveal as="article" className="value-card" key={value.title}>
              <span className="value-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="value-icon"><Icon name={value.icon} /></span>
              <h3>{value.title}</h3>
              <p>{value.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
