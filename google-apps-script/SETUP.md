# Connect the application form to Google Sheets

Every submitted application is added as a new row to **one spreadsheet**:

<https://docs.google.com/spreadsheets/d/1UN05T51AfMe8fBS0sgD3lVsFwn3WsmxaOLFqGnGPOrU/edit>

Rows go into the **first tab** (`gid=0`). Each applicant's resume is saved in a
Drive folder next to the spreadsheet, and the row links to it ("Open resume").
Setup takes about 10 minutes and is free.

## 1. Open the spreadsheet

Sign in with a Google account that can **edit** the spreadsheet above (ideally
its owner), and open it.

## 2. Add the script

1. In the spreadsheet, open **Extensions → Apps Script**.
2. Delete the sample code in `Code.gs`, then paste in the entire contents of
   [`Code.gs`](./Code.gs) from this folder.
3. Click **Save** (disk icon).

## 3. Run setup once (grants permissions)

1. In the toolbar's function dropdown, choose **setup**, then click **Run**.
2. Google asks for permission. Choose your account → **Advanced** →
   **Go to (project name) (unsafe)** → **Allow**.
   This warning appears for every private script; it only gives the script
   access to your spreadsheet and the resume folder it creates.
3. Back in the spreadsheet, the first tab now has the column headers in row 1,
   and a folder called **Milta Job Applications - Resumes** sits next to the
   spreadsheet in Drive.

If the first tab already had headers, they are kept: rows are written under the
matching column names, and any missing columns are added at the end of row 1.

## 4. Deploy as a web app

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
     (needed so applicants can submit without a Google login — they can only
     send applications, not read the spreadsheet)
4. Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
5. Optional check: open that URL in a browser — it should say
   *"Milta application endpoint is running."*

## 5. Point the website at it

1. In the project folder, copy `.env.example` to a new file named `.env`.
2. Paste the URL:
   ```
   VITE_APPLICATION_ENDPOINT=https://script.google.com/macros/s/XXXXXXXX/exec
   ```
3. Restart `npm run dev` (or run `npm run build` again for production).
4. Submit a test application — a new row should appear in the spreadsheet
   within a few seconds.

## Troubleshooting

The website shows *"We couldn't submit your application right now"* whenever the
web app isn't reachable. Open the `/exec` URL in a private browser window to see why:

| What the URL shows | Cause | Fix |
|---|---|---|
| A Google sign-in page | "Who has access" isn't **Anyone** | Deploy → Manage deployments → Edit → Who has access: **Anyone** → Deploy |
| *Script function not found: doGet* | The deployment was made before the code was pasted and saved, or from a different project | Paste `Code.gs`, press **Ctrl + S**, then Deploy → Manage deployments → Edit → Version: **New version** → Deploy |
| A link like `script.google.com/macros/library/...` | The deployment type is **Library**, not Web app | Deploy → New deployment → gear icon → **Web app** |
| *Milta application endpoint is running.* | Everything is fine | Check that `.env` contains this exact URL, then restart `npm run dev` / rebuild |

Tip: in the Apps Script editor, the function dropdown next to **Run** lists
`setup`, `doGet` and `doPost` only when the code is saved. If it shows just
`myFunction`, the script hasn't been saved in this project.

## Good to know

- **Keep the spreadsheet private.** Share it (and the resumes folder) only with
  the people who review applications — it holds personal data.
- **Moving columns is fine.** Rows are matched to columns by header name, so
  you can reorder columns or add your own (e.g. "Status", "Notes"). Renaming one
  of the script's headers makes it add a fresh column with the original name.
- **Different spreadsheet or tab:** change `SPREADSHEET_ID` / `SHEET_GID` at the
  top of `Code.gs` (both come from the spreadsheet URL), then redeploy.
- **Changing the script later:** after editing, use **Deploy → Manage
  deployments → Edit (pencil) → Version: New version → Deploy**. The URL stays
  the same, so the website doesn't need updating.
- **Download as Excel:** File → Download → Microsoft Excel (.xlsx) at any time.
- **Spam:** the form contains a hidden field that only bots fill in; those
  submissions are silently discarded.
