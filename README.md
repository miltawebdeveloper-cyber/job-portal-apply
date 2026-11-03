# Milta Careers — Job Application Landing Page

React + Vite landing page with the Milta job application form.

## Getting started

```bash
npm install
npm run dev       # start the dev server at http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the production build locally
```

## Saving applications to Google Sheets

Applications are stored in a Google Sheet (one row each) with resumes saved to Google Drive.
Follow [google-apps-script/SETUP.md](google-apps-script/SETUP.md), then put the web app URL in
`.env` as `VITE_APPLICATION_ENDPOINT`. While it's empty, submissions are simulated and logged
to the browser console.

## Configuration

- **Openings, education levels, “how did you hear about us” sources, countries** — `src/config.js`.
- **Resume size limit, minimum age, default country, max employers** — `CONFIG` in `src/config.js`.

## Structure

```
src/
  App.jsx                    page layout
  config.js                  options and settings
  styles.css                 all styles
  components/
    Header, Hero, About, Footer
    ApplyPopup.jsx           "Apply now" popup shown once per visit
    ApplicationForm.jsx      form state, validation display, submit
    EmploymentEntry.jsx      one employer block (add / remove)
    ResumeUpload.jsx         drag & drop upload
    ProgressCard.jsx         sticky progress tracker
    SuccessPanel.jsx         confirmation screen
    Field.jsx, Icon.jsx, Reveal.jsx
  utils/
    validation.js            field rules
    submit.js                builds the JSON payload and posts it
google-apps-script/
  Code.gs                    Google Sheets backend (paste into Apps Script)
  SETUP.md                   step-by-step deployment guide
```
