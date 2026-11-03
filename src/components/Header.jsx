import { useEffect, useState } from 'react';
import logo from '../assets/milta-logo.webp';
import { cx } from '../utils/cx.js';
import Icon from './Icon.jsx';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={cx('site-header', scrolled && 'is-scrolled')} id="top">
      <div className="container header-inner">
        <a href="#top" className="brand" aria-label="Milta home">
          <img src={logo} alt="Milta" width="500" height="259" />
        </a>
        <nav className="nav" aria-label="Primary">
          <a href="#about">About Milta</a>
          <a href="#why">Why join us</a>
          <a href="#apply">Application</a>
        </nav>
        <a href="#apply" className="btn btn-dark btn-sm">
          Apply now
          <Icon name="arrow" />
        </a>
      </div>
    </header>
  );
}
