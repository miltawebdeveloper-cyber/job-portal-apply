import { useEffect, useRef, useState } from 'react';
import { cx } from '../utils/cx.js';

// Fades its content in the first time it scrolls into view.
export default function Reveal({ as: Tag = 'div', className, children, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { threshold: 0.15 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={cx('reveal', visible && 'is-visible', className)} {...rest}>
      {children}
    </Tag>
  );
}
