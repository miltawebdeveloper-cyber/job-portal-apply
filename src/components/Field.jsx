import { cx } from '../utils/cx.js';
import Icon from './Icon.jsx';

// Label + control + error message. The control itself is passed as children.
export default function Field({ id, label, required, optional, icon, error, className, children }) {
  return (
    <div className={cx('field', className, error && 'is-invalid')}>
      <label htmlFor={id}>
        {label}
        {required && <> <span className="req" aria-hidden="true">*</span></>}
        {optional && <> <span className="optional">Optional</span></>}
      </label>
      {icon ? (
        <div className="control-wrap has-icon">
          <Icon name={icon} className="field-icon" />
          {children}
        </div>
      ) : children}
      {error && <p className="error" id={`${id}-error`}>{error}</p>}
    </div>
  );
}
