import logo from '../assets/milta-logo.webp';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <a href="#top" className="brand" aria-label="Back to top">
          <img src={logo} alt="Milta" width="500" height="259" />
        </a>
        <nav className="footer-nav" aria-label="Footer">
          <a href="#about">About Milta</a>
          <a href="#why">Why join us</a>
          <a href="#apply">Apply now</a>
        </nav>
        <p className="copyright">© {new Date().getFullYear()} Milta. All rights reserved.</p>
      </div>
    </footer>
  );
}
