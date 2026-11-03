import { cx } from '../utils/cx.js';
import Field from './Field.jsx';
import Icon from './Icon.jsx';

export default function EmploymentEntry({
  entry, index, canRemove, joinError, leaveError, maxDate, autoFocus, onChange, onTouch, onRemove,
}) {
  const { id } = entry;

  const dateProps = (field, key, error) => ({
    id: key,
    name: key,
    type: 'date',
    max: maxDate,
    value: entry[field],
    className: cx('control', !entry[field] && 'is-empty'),
    onChange: (e) => onChange({ [field]: e.target.value }),
    onBlur: (e) => { if (e.target.value) onTouch(key); },
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${key}-error` : undefined,
  });

  const toggleCurrent = (e) => {
    const { checked } = e.target;
    onChange(checked ? { currentlyWorking: true, dateOfLeaving: '' } : { currentlyWorking: false });
  };

  return (
    <div className="employment-entry">
      <div className="entry-head">
        <span className="entry-badge"><Icon name="briefcase" /></span>
        <span className="entry-title">
          {index === 0 ? 'Current / most recent employer' : `Previous employer ${index}`}
        </span>
        {canRemove && (
          <button type="button" className="entry-remove" onClick={onRemove}>
            <Icon name="x" />
            Remove
          </button>
        )}
      </div>

      <div className="grid">
        <Field id={`company-${id}`} label="Company name" className="col-3">
          <input
            className="control"
            id={`company-${id}`}
            type="text"
            autoComplete="organization"
            placeholder="Company name"
            value={entry.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            autoFocus={autoFocus}
          />
        </Field>

        <Field id={`designation-${id}`} label="Designation" className="col-3">
          <input
            className="control"
            id={`designation-${id}`}
            type="text"
            autoComplete="organization-title"
            placeholder="e.g. Senior Accountant"
            value={entry.designation}
            onChange={(e) => onChange({ designation: e.target.value })}
          />
        </Field>

        <Field id={`joining-${id}`} label="Date of joining" error={joinError} className="col-2">
          <input {...dateProps('dateOfJoining', `joining-${id}`, joinError)} />
        </Field>

        <Field id={`leaving-${id}`} label="Date of leaving" error={leaveError} className="col-2">
          <input {...dateProps('dateOfLeaving', `leaving-${id}`, leaveError)} disabled={entry.currentlyWorking} />
        </Field>

        <div className="field col-2 field-check">
          <label className="check">
            <input type="checkbox" checked={entry.currentlyWorking} onChange={toggleCurrent} />
            <span>I currently work here</span>
          </label>
        </div>
      </div>
    </div>
  );
}
