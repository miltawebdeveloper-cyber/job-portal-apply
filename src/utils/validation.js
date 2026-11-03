import { CONFIG } from '../config.js';

const RESUME_EXT = /\.(pdf|docx?)$/i;

const pad = (n) => String(n).padStart(2, '0');
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getMonth() === m - 1 ? date : null;
}

function ageOn(dob, today) {
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

const required = (message) => (value) => (value ? '' : message);

const FIELD_RULES = {
  fullName(value) {
    if (!value) return 'Please enter your full name.';
    if (value.length < 2) return 'Your name looks too short.';
    if (!/^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u.test(value)) {
      return 'Please use letters only (spaces, dots, hyphens and apostrophes are fine).';
    }
    return '';
  },
  dob(value) {
    if (!value) return 'Please enter your date of birth.';
    const date = parseDate(value);
    if (!date || date.getFullYear() < 1900) return 'Please enter a valid date.';
    const today = startOfToday();
    if (date > today) return 'Date of birth can’t be in the future.';
    if (ageOn(date, today) < CONFIG.minAge) return `You must be at least ${CONFIG.minAge} years old to apply.`;
    return '';
  },
  education: required('Please select your highest qualification.'),
  gender: required('Please select your gender.'),
  street: required('Please enter your street address.'),
  city: required('Please enter your city.'),
  state: required('Please enter your state or province.'),
  postalCode(value) {
    if (!value) return 'Please enter your postal code.';
    return /^[A-Za-z0-9][A-Za-z0-9\s-]{1,9}$/.test(value) ? '' : 'Please enter a valid postal code.';
  },
  country: required('Please select your country.'),
  phone(value) {
    if (!value) return 'Please enter your phone number.';
    const digits = value.replace(/\D/g, '');
    if (!/^\+?[\d\s()-]+$/.test(value) || digits.length < 7 || digits.length > 15) {
      return 'Please enter a valid phone number.';
    }
    return '';
  },
  email(value) {
    if (!value) return 'Please enter your email address.';
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) ? '' : 'Please enter a valid email address.';
  },
  linkedin(value) {
    if (!value) return 'Please enter your LinkedIn profile URL.';
    return /^(https?:\/\/)?([\w-]+\.)?linkedin\.com\/\S+$/i.test(value)
      ? ''
      : 'Please enter a valid LinkedIn URL, e.g. linkedin.com/in/your-name.';
  },
  experience: required('Please select your total experience.'),
  position: required('Please select the position you’re applying for.'),
};

export const PERSONAL_FIELDS = [
  'fullName', 'dob', 'education', 'gender',
  'street', 'city', 'state', 'postalCode', 'country',
  'phone', 'email', 'linkedin',
];

export function validateEmployment(entry) {
  const today = startOfToday();
  const errors = {};
  const joined = parseDate(entry.dateOfJoining);

  if (entry.dateOfJoining) {
    if (!joined) errors.dateOfJoining = 'Please enter a valid date.';
    else if (joined > today) errors.dateOfJoining = 'Joining date can’t be in the future.';
  }
  if (entry.dateOfLeaving && !entry.currentlyWorking) {
    const left = parseDate(entry.dateOfLeaving);
    if (!left) errors.dateOfLeaving = 'Please enter a valid date.';
    else if (left > today) errors.dateOfLeaving = 'Leaving date can’t be in the future.';
    else if (joined && left < joined) errors.dateOfLeaving = 'Leaving date must be after the joining date.';
  }
  return errors;
}

export function resumeFileError(file) {
  if (!RESUME_EXT.test(file.name)) return 'Please upload a PDF, DOC or DOCX file.';
  if (file.size > CONFIG.maxResumeMB * 1024 * 1024) return `File is too large. Maximum size is ${CONFIG.maxResumeMB} MB.`;
  if (file.size === 0) return 'This file appears to be empty.';
  return '';
}

/**
 * Returns { [elementId]: message } for every invalid field, in on-screen order,
 * so the first key is the first field the applicant needs to fix.
 */
export function validateApplication({ values, employments, resume, isFresher }) {
  const errors = {};
  const check = (name) => {
    const message = FIELD_RULES[name](values[name].trim());
    if (message) errors[name] = message;
  };

  PERSONAL_FIELDS.forEach(check);
  check('experience');
  if (!isFresher) {
    employments.forEach((entry) => {
      const entryErrors = validateEmployment(entry);
      if (entryErrors.dateOfJoining) errors[`joining-${entry.id}`] = entryErrors.dateOfJoining;
      if (entryErrors.dateOfLeaving) errors[`leaving-${entry.id}`] = entryErrors.dateOfLeaving;
    });
  }
  check('position');
  if (!resume) errors.resume = 'Please upload your resume.';
  return errors;
}
