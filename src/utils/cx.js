// Joins truthy class names: cx('a', false && 'b', 'c') -> 'a c'
export const cx = (...classes) => classes.filter(Boolean).join(' ');
