# Hackthone Backend

**External forms only.** This server is **not** part of Zoho Creator widgets.

When a mooring master submits an OPS-OFD or QHSE form:

1. External Next.js app proxies the submission here
2. Backend generates a PDF
3. Backend uploads PDF to the Zoho Creator **STS_Operation** record (matched by `Reference_Number`)

Widgets (`Hackthone/widget/`) **never call this API**. They read/write Creator via the in-app JS SDK.

See **[../ARCHITECTURE.md](../ARCHITECTURE.md)**.

---

## Who connects here?

| Client | Route prefix |
|--------|----------------|
| `operations-sts-checklist` | `/api/sts-checklist/*` |
| `QHSE-FORMS` | `/api/qhse/*` |
| Optional direct | `/api/forms/:slug/submit` |

---

## Setup

```bash
cd Hackthone/backend
cp .env.example .env
# Fill Zoho OAuth + Creator app details
npm install
npm run dev
```

Default port **4000**. Production: Render (`hack-backend-h3eq.onrender.com`).

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default 4000) |
| `ZOHO_CLIENT_ID` / `ZOHO_CLIENT_SECRET` / `ZOHO_REFRESH_TOKEN` | Zoho OAuth (India: `ZOHO_ACCOUNTS_URL=https://accounts.zoho.in`) |
| `ZOHO_CREATOR_OWNER` | e.g. `gaurav.khurana468` |
| `ZOHO_CREATOR_APP` | e.g. `ocean-marine` |
| `ZOHO_CREATOR_REPORT` | e.g. `STS_Operation_Report` |
| `ZOHO_REFERENCE_FIELD` | default `Reference_Number` |
| `API_KEY` | Optional — must match `HACKTHONE_API_KEY` on form apps |

---

## Main endpoints

```
GET  /health
POST /api/sts-checklist/ops-ofd-029/create   ← OPS-OFD forms (legacy path)
POST /api/qhse/near-miss-form/create        ← QHSE forms
POST /api/forms/OPS-OFD-029/submit          ← direct submit
GET  /api/operations/2026-001               ← lookup by Reference_Number
GET  /oauth/start                           ← generate refresh token (dev)
```

Example submit body:

```json
{
  "operationRef": "2026-001",
  "data": { "...": "form fields" }
}
```

---

## Folder structure

```
backend/
├── src/
│   ├── index.js
│   ├── config/forms.js          ← OPS-OFD slug → Creator field
│   ├── routes/
│   │   ├── stsChecklist.js      ← operations-sts-checklist proxy target
│   │   ├── qhse.js              ← QHSE-FORMS proxy target
│   │   ├── forms.js
│   │   └── operations.js
│   └── services/
│       ├── pdfGenerator.js
│       ├── zohoCreator.js
│       └── submissionStore.js   ← JSON cache for update-mode prefill
└── data/                        ← local submission store (gitignored)
```

---

## Not in scope

- Widget static files (use `zet pack` → Creator)
- Creator page UI (widgets handle that inside Creator)
- Mooring master form UI (separate Next.js apps)
