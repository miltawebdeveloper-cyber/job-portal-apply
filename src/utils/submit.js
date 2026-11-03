import { CONFIG, EXPERIENCE_OPTIONS } from '../config.js';

const isBlank = (entry) =>
  !entry.companyName.trim() && !entry.designation.trim() && !entry.dateOfJoining && !entry.dateOfLeaving;

function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Shape expected by google-apps-script/Code.gs.
export async function buildPayload({ values, employments, resume, isFresher, honeypot }) {
  const v = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()]));
  const experience = EXPERIENCE_OPTIONS.find((option) => option.value === v.experience);

  return {
    website: honeypot,
    fullName: v.fullName,
    dateOfBirth: v.dob,
    gender: v.gender,
    education: v.education,
    address: {
      street: v.street,
      line2: v.addressLine2,
      city: v.city,
      state: v.state,
      postalCode: v.postalCode,
      country: v.country,
    },
    phone: v.phone,
    email: v.email,
    linkedinUrl: v.linkedin,
    experience: experience ? experience.label : v.experience,
    employment: isFresher
      ? []
      : employments.filter((entry) => !isBlank(entry)).map((entry) => ({
        companyName: entry.companyName.trim(),
        designation: entry.designation.trim(),
        dateOfJoining: entry.dateOfJoining,
        dateOfLeaving: entry.currentlyWorking ? '' : entry.dateOfLeaving,
        currentlyWorking: entry.currentlyWorking,
      })),
    position: v.position,
    heardFrom: v.heardFrom,
    referredBy: v.heardFrom === 'Referral' ? v.referredBy : '',
    heardFromOther: v.heardFrom === 'Others' ? v.heardFromOther : '',
    resume: {
      name: resume.name,
      type: resume.type,
      data: await readAsBase64(resume),
    },
  };
}

export async function submitApplication(payload) {
  if (!CONFIG.endpoint) {
    console.info('[Milta] No endpoint configured — simulated submission:', {
      ...payload,
      resume: { ...payload.resume, data: `<${payload.resume.data.length} base64 chars>` },
    });
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return;
  }

  // text/plain keeps this a "simple" CORS request, which Google Apps Script accepts.
  const response = await fetch(CONFIG.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Submission failed with status ${response.status}`);

  const result = await response.json();
  if (!result.ok) throw new Error(result.error || 'Submission was rejected.');
}
