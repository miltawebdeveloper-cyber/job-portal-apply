/**
 * Milta Careers — Google Apps Script backend.
 *
 * Receives job applications from the landing page and adds one row per
 * application to a single spreadsheet tab. Resumes are saved to a Google Drive
 * folder next to the spreadsheet and linked from each row.
 * See SETUP.md for deployment steps.
 */

const SETTINGS = {
  // The spreadsheet that holds every application — the ID from its URL:
  // https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit
  SPREADSHEET_ID: '1UN05T51AfMe8fBS0sgD3lVsFwn3WsmxaOLFqGnGPOrU',
  // The tab to write to — the "gid=" number in the URL. 0 is the first tab.
  SHEET_GID: 0,
  RESUME_FOLDER_NAME: 'Milta Job Applications - Resumes',
  MAX_RESUME_MB: 5,
};

const RESUME_TYPES = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const COLUMNS = [
  'Submitted at',
  'Full name',
  'Date of birth',
  'Gender',
  'Education',
  'Street address',
  'Address line 2',
  'City',
  'State / Province',
  'Postal code',
  'Country',
  'Phone',
  'Email',
  'LinkedIn',
  'Experience',
  'Employment history',
  'Position applied for',
  'Heard about us',
  'Referred by / details',
  'Resume',
];

/** Opening the web app URL in a browser shows this — handy to check the deployment. */
function doGet() {
  return ContentService.createTextOutput('Milta application endpoint is running.');
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const data = JSON.parse(e.postData.contents);

    // Hidden "website" field is only filled in by bots: report success, store nothing.
    if (data.website) return respond({ ok: true });

    validate(data);
    const resumeUrl = saveResume(data.resume, data.fullName);
    const record = toRecord(data, resumeUrl);

    lock.waitLock(30000); // one writer at a time so rows never collide
    const sheet = getSheet();
    const headers = getHeaders(sheet);
    sheet.appendRow(headers.map(function (header) {
      return Object.prototype.hasOwnProperty.call(record, header) ? record[header] : '';
    }));
    return respond({ ok: true });
  } catch (err) {
    console.error(err);
    return respond({ ok: false, error: String((err && err.message) || err) });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

/** Run once from the Apps Script editor: checks access, adds the headers, creates the resume folder. */
function setup() {
  getHeaders(getSheet());
  getResumeFolder();
}

/* ---------- Sheet ---------- */

function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(SETTINGS.SPREADSHEET_ID);
  const sheet = spreadsheet.getSheets().filter(function (s) {
    return s.getSheetId() === SETTINGS.SHEET_GID;
  })[0];
  if (!sheet) throw new Error('No tab with gid=' + SETTINGS.SHEET_GID + ' in the spreadsheet.');
  return sheet;
}

/**
 * Returns the header row. Writes it on first use; if the tab already has headers,
 * keeps them and only appends any of COLUMNS that are missing, so rows are always
 * written under the matching column names.
 */
function getHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
    formatSheet(sheet);
    return COLUMNS.slice();
  }

  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].map(clean);
  const missing = COLUMNS.filter(function (column) { return headers.indexOf(column) === -1; });
  if (missing.length) {
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
    return headers.concat(missing);
  }
  return headers;
}

function formatSheet(sheet) {
  sheet.getRange(1, 1, 1, COLUMNS.length)
    .setFontWeight('bold')
    .setBackground('#0E1210')
    .setFontColor('#FFFFFF')
    .setVerticalAlignment('middle');
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 36);
  sheet.setColumnWidths(1, COLUMNS.length, 160);

  const rows = sheet.getMaxRows() - 1;
  const column = function (name) { return COLUMNS.indexOf(name) + 1; };
  sheet.setColumnWidth(column('Employment history'), 380);
  sheet.getRange(2, column('Employment history'), rows, 1).setWrap(true);
  sheet.getRange(2, column('Submitted at'), rows, 1).setNumberFormat('dd mmm yyyy, hh:mm');
  sheet.getRange(2, column('Date of birth'), rows, 1).setNumberFormat('dd mmm yyyy');
}

function toRecord(data, resumeUrl) {
  const address = data.address || {};
  let sourceDetails = '';
  if (data.heardFrom === 'Referral') sourceDetails = data.referredBy;
  if (data.heardFrom === 'Others') sourceDetails = data.heardFromOther;

  return {
    'Submitted at': new Date(),
    'Full name': text(data.fullName),
    'Date of birth': toDate(data.dateOfBirth),
    'Gender': text(data.gender),
    'Education': text(data.education),
    'Street address': text(address.street),
    'Address line 2': text(address.line2),
    'City': text(address.city),
    'State / Province': text(address.state),
    'Postal code': text(address.postalCode),
    'Country': text(address.country),
    'Phone': text(data.phone),
    'Email': text(data.email),
    'LinkedIn': text(data.linkedinUrl),
    'Experience': text(data.experience),
    'Employment history': text(formatEmployment(data.employment), 4000),
    'Position applied for': text(data.position),
    'Heard about us': text(data.heardFrom),
    'Referred by / details': text(sourceDetails),
    'Resume': '=HYPERLINK("' + resumeUrl + '","Open resume")',
  };
}

function formatEmployment(list) {
  if (!Array.isArray(list) || !list.length) return '';
  return list.slice(0, 10).map(function (job) {
    const role = [clean(job.companyName), clean(job.designation)].filter(Boolean).join(' — ') || 'Employer';
    const from = clean(job.dateOfJoining) || '?';
    const to = job.currentlyWorking ? 'Present' : clean(job.dateOfLeaving) || '?';
    return role + ' (' + from + ' to ' + to + ')';
  }).join('\n');
}

/* ---------- Resume ---------- */

function saveResume(resume, fullName) {
  const extension = String(resume.name || '').split('.').pop().toLowerCase();
  const mimeType = RESUME_TYPES[extension];
  if (!mimeType) throw new Error('Resume must be a PDF, DOC or DOCX file.');

  const bytes = Utilities.base64Decode(resume.data);
  if (bytes.length > SETTINGS.MAX_RESUME_MB * 1024 * 1024) {
    throw new Error('Resume is larger than ' + SETTINGS.MAX_RESUME_MB + ' MB.');
  }

  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HHmm');
  const safeName = clean(fullName).replace(/[\\/:*?"<>|]/g, '').slice(0, 60);
  const fileName = stamp + ' - ' + safeName + '.' + extension;

  const file = getResumeFolder().createFile(Utilities.newBlob(bytes, mimeType, fileName));
  return file.getUrl();
}

/** The resume folder lives in the same Drive folder as the spreadsheet. */
function getResumeFolder() {
  const props = PropertiesService.getScriptProperties();
  const folderId = props.getProperty('RESUME_FOLDER_ID');
  if (folderId) {
    try {
      return DriveApp.getFolderById(folderId);
    } catch (err) {
      // Folder was deleted — create a new one below.
    }
  }

  let folder;
  try {
    const parents = DriveApp.getFileById(SETTINGS.SPREADSHEET_ID).getParents();
    const parent = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
    folder = parent.createFolder(SETTINGS.RESUME_FOLDER_NAME);
  } catch (err) {
    folder = DriveApp.createFolder(SETTINGS.RESUME_FOLDER_NAME);
  }
  props.setProperty('RESUME_FOLDER_ID', folder.getId());
  return folder;
}

/* ---------- Validation & helpers ---------- */

function validate(data) {
  const required = {
    fullName: 'Full name',
    dateOfBirth: 'Date of birth',
    gender: 'Gender',
    education: 'Education',
    phone: 'Phone number',
    email: 'Email address',
    linkedinUrl: 'LinkedIn profile URL',
    experience: 'Experience',
    position: 'Position applied for',
  };
  Object.keys(required).forEach(function (key) {
    if (!clean(data[key])) throw new Error(required[key] + ' is required.');
  });

  const address = data.address || {};
  ['street', 'city', 'state', 'postalCode', 'country'].forEach(function (key) {
    if (!clean(address[key])) throw new Error('Address is incomplete.');
  });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean(data.email))) throw new Error('Email address is not valid.');
  if (!data.resume || !data.resume.data) throw new Error('Resume is required.');
}

function clean(value) {
  return value == null ? '' : String(value).trim();
}

/**
 * Cell-safe text: trims, limits length, and prefixes an apostrophe when the value
 * starts with = + - @ so Sheets stores it as text instead of running it as a formula
 * (this also keeps phone numbers like "+91 ..." intact).
 */
function text(value, maxLength) {
  const s = clean(value).slice(0, maxLength || 500);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function toDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clean(value));
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : text(value);
}

function respond(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
