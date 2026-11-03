import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CONFIG, COUNTRIES, EDUCATION_OPTIONS, EXPERIENCE_OPTIONS, GENDER_OPTIONS, OPENINGS, SOURCE_OPTIONS,
} from '../config.js';
import { PERSONAL_FIELDS, resumeFileError, startOfToday, toISO, validateApplication } from '../utils/validation.js';
import { buildPayload, submitApplication } from '../utils/submit.js';
import { cx } from '../utils/cx.js';
import EmploymentEntry from './EmploymentEntry.jsx';
import Field from './Field.jsx';
import Icon from './Icon.jsx';
import ProgressCard from './ProgressCard.jsx';
import ResumeUpload from './ResumeUpload.jsx';
import Reveal from './Reveal.jsx';
import SuccessPanel from './SuccessPanel.jsx';

const STEPS = [
  { id: 'personal', title: 'Personal information', desc: 'Name, address & contact', fields: PERSONAL_FIELDS },
  { id: 'experience', title: 'Experience', desc: 'Experience & employment', fields: ['experience'] },
  { id: 'position', title: 'Position', desc: "Role you're applying for", fields: ['position'] },
  { id: 'resume', title: 'Resume', desc: 'Upload your latest CV', fields: ['resume'] },
];
const REQUIRED_FIELDS = STEPS.flatMap((step) => step.fields);

const INITIAL_VALUES = {
  fullName: '',
  dob: '',
  education: '',
  gender: '',
  street: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: CONFIG.defaultCountry,
  phone: '',
  email: '',
  linkedin: '',
  experience: '',
  position: '',
  heardFrom: '',
  referredBy: '',
  heardFromOther: '',
};

let nextEmploymentId = 0;
const newEmployment = () => ({
  id: nextEmploymentId++,
  companyName: '',
  designation: '',
  dateOfJoining: '',
  dateOfLeaving: '',
  currentlyWorking: false,
});

function SectionHead({ num, id, title, desc }) {
  return (
    <header className="form-section-head">
      <span className="section-num">{num}</span>
      <div>
        <h3 id={id}>{title}</h3>
        <p>{desc}</p>
      </div>
    </header>
  );
}

export default function ApplicationForm() {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [employments, setEmployments] = useState(() => [newEmployment()]);
  const [focusEntryId, setFocusEntryId] = useState(null);
  const [resume, setResume] = useState(null);
  const [resumeRejection, setResumeRejection] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [touched, setTouched] = useState({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [alert, setAlert] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | success
  const [activeStep, setActiveStep] = useState(STEPS[0].id);

  const formRef = useRef(null);
  const addEmploymentRef = useRef(null);
  const sectionRefs = useRef({});

  const { today, dobMax } = useMemo(() => {
    const now = startOfToday();
    const latestDob = new Date(now);
    latestDob.setFullYear(latestDob.getFullYear() - CONFIG.minAge);
    return { today: toISO(now), dobMax: toISO(latestDob) };
  }, []);

  const isFresher = values.experience === '0';
  const errors = useMemo(
    () => validateApplication({ values, employments, resume, isFresher }),
    [values, employments, resume, isFresher],
  );

  // Errors only appear once a field has been touched, or after a submit attempt.
  const errorFor = (key) => (touched[key] || showAllErrors ? errors[key] || '' : '');
  const touch = (key) => setTouched((t) => (t[key] ? t : { ...t, [key]: true }));

  const setValue = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setAlert('');
  };

  // Shared props for inputs/selects bound to `values`.
  const bind = (name, kind = 'text') => {
    const error = errorFor(name);
    return {
      id: name,
      name,
      value: values[name],
      className: cx('control', kind !== 'text' && !values[name] && 'is-empty'),
      onChange: (e) => {
        setValue(name, e.target.value);
        if (kind === 'select') touch(name);
      },
      onBlur: (e) => {
        if (e.target.value.trim()) touch(name);
      },
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? `${name}-error` : undefined,
    };
  };

  /* ---------- Employment ---------- */
  const updateEmployment = (id, patch) => {
    setEmployments((list) => list.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
    setAlert('');
  };

  const addEmployment = () => {
    const entry = newEmployment();
    setEmployments((list) => [...list, entry]);
    setFocusEntryId(entry.id);
  };

  const removeEmployment = (id) => {
    setEmployments((list) => list.filter((entry) => entry.id !== id));
    requestAnimationFrame(() => addEmploymentRef.current?.focus());
  };

  /* ---------- Resume ---------- */
  const handleResume = (file) => {
    touch('resume');
    setAlert('');
    const rejection = file ? resumeFileError(file) : '';
    setResumeRejection(rejection);
    setResume(file && !rejection ? file : null);
  };

  /* ---------- Active step tracking ---------- */
  const sectionRef = (id) => (el) => {
    sectionRefs.current[id] = el;
  };

  useEffect(() => {
    if (status === 'success' || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveStep(entry.target.dataset.step);
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [status]);

  /* ---------- Progress ---------- */
  const submitted = status === 'success';
  const steps = STEPS.map((step) => ({
    ...step,
    complete: submitted || step.fields.every((field) => !errors[field]),
  }));
  const doneCount = REQUIRED_FIELDS.filter((field) => !errors[field]).length;

  /* ---------- Submit ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const invalid = Object.keys(errors);

    if (invalid.length) {
      setShowAllErrors(true);
      setAlert(invalid.length === 1
        ? 'Please fix the highlighted field before applying.'
        : `Please fix the ${invalid.length} highlighted fields before applying.`);
      const firstInvalid = formRef.current.querySelector(`#${CSS.escape(invalid[0])}`);
      firstInvalid?.closest('.field')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid?.focus({ preventScroll: true });
      return;
    }

    setAlert('');
    setStatus('submitting');
    try {
      await submitApplication(await buildPayload({ values, employments, resume, isFresher, honeypot }));
      setStatus('success');
      document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error(err);
      setAlert('We couldn’t submit your application right now. Please check your connection and try again.');
      setStatus('idle');
    }
  };

  const handleReset = () => {
    setValues(INITIAL_VALUES);
    setEmployments([newEmployment()]);
    setFocusEntryId(null);
    setResume(null);
    setResumeRejection('');
    setHoneypot('');
    setTouched({});
    setShowAllErrors(false);
    setAlert('');
    setActiveStep(STEPS[0].id);
    setStatus('idle');
    requestAnimationFrame(() => {
      document.getElementById('sec-personal')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.getElementById('fullName')?.focus({ preventScroll: true });
    });
  };

  const submitting = status === 'submitting';

  return (
    <section className="apply" id="apply">
      <div className="container">
        <Reveal className="apply-head">
          <span className="section-kicker">Job application form</span>
          <h2 className="section-title">Tell us about <em>yourself.</em></h2>
          <p>Complete the form below to apply. Fields marked with <span className="req">*</span> are required.</p>
        </Reveal>

        <div className="apply-layout">
          <ProgressCard
            steps={steps}
            activeStep={activeStep}
            done={doneCount}
            total={REQUIRED_FIELDS.length}
            submitted={submitted}
          />

          <div className="form-card">
            {submitted ? (
              <SuccessPanel
                name={values.fullName.trim().split(/\s+/)[0]}
                position={values.position}
                email={values.email.trim()}
                onReset={handleReset}
              />
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} noValidate>
                {/* 01 · Personal information */}
                <section
                  className="form-section"
                  id="sec-personal"
                  data-step="personal"
                  ref={sectionRef('personal')}
                  aria-labelledby="h-personal"
                >
                  <SectionHead num="01" id="h-personal" title="Personal information" desc="Tell us who you are and how we can reach you." />

                  <div className="grid">
                    <Field id="fullName" label="Full name" required icon="user" error={errorFor('fullName')} className="col-6">
                      <input {...bind('fullName')} type="text" autoComplete="name" placeholder="As it appears on your official documents" required />
                    </Field>

                    <Field id="dob" label="Date of birth" required error={errorFor('dob')} className="col-2">
                      <input {...bind('dob', 'date')} type="date" autoComplete="bday" min="1900-01-01" max={dobMax} required />
                    </Field>

                    <Field id="education" label="Education" required error={errorFor('education')} className="col-2">
                      <select {...bind('education', 'select')} required>
                        <option value="">Highest qualification</option>
                        {EDUCATION_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                      </select>
                    </Field>

                    <Field id="gender" label="Gender" required error={errorFor('gender')} className="col-2">
                      <select {...bind('gender', 'select')} required>
                        <option value="">Select gender</option>
                        {GENDER_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                      </select>
                    </Field>

                    <div className="subgroup col-6">
                      <span className="subgroup-label">
                        <Icon name="pin" />
                        Current address <span className="req" aria-hidden="true">*</span>
                      </span>
                    </div>

                    <Field id="street" label="Street address" required error={errorFor('street')} className="col-3">
                      <input {...bind('street')} type="text" autoComplete="address-line1" placeholder="House no., building, street" required />
                    </Field>

                    <Field id="addressLine2" label="Address line 2" optional className="col-3">
                      <input {...bind('addressLine2')} type="text" autoComplete="address-line2" placeholder="Area, landmark" />
                    </Field>

                    <Field id="city" label="City" required error={errorFor('city')} className="col-3">
                      <input {...bind('city')} type="text" autoComplete="address-level2" placeholder="City" required />
                    </Field>

                    <Field id="state" label="State / Province" required error={errorFor('state')} className="col-3">
                      <input {...bind('state')} type="text" autoComplete="address-level1" placeholder="State" required />
                    </Field>

                    <Field id="postalCode" label="Postal code" required error={errorFor('postalCode')} className="col-3">
                      <input {...bind('postalCode')} type="text" autoComplete="postal-code" placeholder="e.g. 600001" required />
                    </Field>

                    <Field id="country" label="Country" required error={errorFor('country')} className="col-3">
                      <select {...bind('country', 'select')} autoComplete="country-name" required>
                        <option value="">Select country</option>
                        {COUNTRIES.map((country) => <option key={country}>{country}</option>)}
                      </select>
                    </Field>

                    <div className="subgroup col-6">
                      <span className="subgroup-label">
                        <Icon name="mail" />
                        Contact details
                      </span>
                    </div>

                    <Field id="phone" label="Phone number" required icon="phone" error={errorFor('phone')} className="col-3">
                      <input {...bind('phone')} type="tel" autoComplete="tel" inputMode="tel" placeholder="+91 98765 43210" required />
                    </Field>

                    <Field id="email" label="Email address" required icon="mail" error={errorFor('email')} className="col-3">
                      <input {...bind('email')} type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required />
                    </Field>

                    <Field id="linkedin" label="LinkedIn profile URL" required icon="linkedin" error={errorFor('linkedin')} className="col-6">
                      <input {...bind('linkedin')} type="url" inputMode="url" placeholder="https://www.linkedin.com/in/your-name" required />
                    </Field>
                  </div>
                </section>

                {/* 02 · Experience & employment */}
                <section
                  className="form-section"
                  id="sec-experience"
                  data-step="experience"
                  ref={sectionRef('experience')}
                  aria-labelledby="h-experience"
                >
                  <SectionHead
                    num="02"
                    id="h-experience"
                    title="Experience & employment"
                    desc="Your total experience and your current or previous employment details."
                  />

                  <div className="grid">
                    <Field id="experience" label="Total experience" required icon="briefcase" error={errorFor('experience')} className="col-3">
                      <select {...bind('experience', 'select')} required>
                        <option value="">Select years of experience</option>
                        {EXPERIENCE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  {isFresher ? (
                    <div className="notice">
                      <span className="notice-icon"><Icon name="cap" /></span>
                      <div>
                        <strong>Starting your career? Great!</strong>
                        <p>No employment history is needed — you can skip straight to the next step.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="employment">
                      <div className="employment-head">
                        <h4>Previous / current employment details</h4>
                        <p>Start with your current or most recent role.</p>
                      </div>
                      <div className="employment-list">
                        {employments.map((entry, i) => (
                          <EmploymentEntry
                            key={entry.id}
                            entry={entry}
                            index={i}
                            canRemove={employments.length > 1}
                            joinError={errorFor(`joining-${entry.id}`)}
                            leaveError={errorFor(`leaving-${entry.id}`)}
                            maxDate={today}
                            autoFocus={entry.id === focusEntryId}
                            onChange={(patch) => updateEmployment(entry.id, patch)}
                            onTouch={touch}
                            onRemove={() => removeEmployment(entry.id)}
                          />
                        ))}
                      </div>
                      {employments.length < CONFIG.maxEmployments && (
                        <button type="button" className="btn-add" ref={addEmploymentRef} onClick={addEmployment}>
                          <Icon name="plus" />
                          Add another employer
                        </button>
                      )}
                    </div>
                  )}
                </section>

                {/* 03 · Position */}
                <section
                  className="form-section"
                  id="sec-position"
                  data-step="position"
                  ref={sectionRef('position')}
                  aria-labelledby="h-position"
                >
                  <SectionHead num="03" id="h-position" title="Position details" desc="Choose the role you'd like to be considered for." />

                  <div className="grid">
                    <Field id="position" label="Position applied for" required error={errorFor('position')} className="col-3">
                      <select {...bind('position', 'select')} required>
                        <option value="">Select an opening</option>
                        {OPENINGS.map((opening) => <option key={opening}>{opening}</option>)}
                      </select>
                    </Field>

                    <Field id="heardFrom" label="How did you hear about us?" className="col-3">
                      <select {...bind('heardFrom', 'select')}>
                        <option value="">Please select</option>
                        {SOURCE_OPTIONS.map((source) => <option key={source}>{source}</option>)}
                      </select>
                    </Field>

                    {values.heardFrom === 'Referral' && (
                      <Field id="referredBy" label="Referred by" optional className="col-6 reveal-field">
                        <input {...bind('referredBy')} type="text" placeholder="Name of the person who referred you" />
                      </Field>
                    )}

                    {values.heardFrom === 'Others' && (
                      <Field id="heardFromOther" label="Please specify" optional className="col-6 reveal-field">
                        <input {...bind('heardFromOther')} type="text" placeholder="Where did you hear about us?" />
                      </Field>
                    )}
                  </div>
                </section>

                {/* 04 · Resume */}
                <section
                  className="form-section"
                  id="sec-resume"
                  data-step="resume"
                  ref={sectionRef('resume')}
                  aria-labelledby="h-resume"
                >
                  <SectionHead
                    num="04"
                    id="h-resume"
                    title={<>Upload your resume <span className="req" aria-hidden="true">*</span></>}
                    desc="Share your latest resume so we can learn about your experience."
                  />
                  <ResumeUpload file={resume} error={resumeRejection || errorFor('resume')} onSelect={handleResume} />
                </section>

                {/* Spam trap: invisible to applicants, bots tend to fill it in */}
                <div className="hp-field" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                {/* Submit */}
                <div className="form-footer">
                  {alert && (
                    <div className="form-alert" role="alert">
                      <Icon name="alert" />
                      <span>{alert}</span>
                    </div>
                  )}
                  <p className="consent">
                    <Icon name="lock" />
                    <span>By applying, you agree that Milta may store and process your details for recruitment purposes.</span>
                  </p>
                  <button type="submit" className={cx('btn-apply', submitting && 'is-loading')} disabled={submitting}>
                    <span className="btn-apply-label">{submitting ? 'Submitting…' : 'Apply now'}</span>
                    <span className="btn-apply-icon">
                      <Icon name="arrow" />
                      <span className="spinner" aria-hidden="true" />
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
