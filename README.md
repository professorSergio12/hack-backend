# Hackthone Backend

API server for the Hackthone Zoho Creator platform.

When a mooring master submits an external form:
1. Backend receives JSON data + `operationRef` (maps to Creator `Reference_Number`)
2. Generates a PDF
3. Uploads PDF to the matching Zoho Creator operation record field (`OPS_OFD_*`)

---

## Setup

```bash
cd Hackthone/backend
cp .env.example .env
# Fill Zoho OAuth + Creator app details
npm install
npm run dev
```

Runs on **port 4000** by default.

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default 4000) |
| `ZOHO_CLIENT_ID` | Zoho API Console client ID |
| `ZOHO_CLIENT_SECRET` | Client secret |
| `ZOHO_REFRESH_TOKEN` | OAuth refresh token with Creator scopes |
| `ZOHO_CREATOR_OWNER` | Zoho username (account owner) |
| `ZOHO_CREATOR_APP` | Creator app link name |
| `ZOHO_CREATOR_REPORT` | Report link name (default `All_Operations`) |
| `ZOHO_REFERENCE_FIELD` | Field for operation key (default `Reference_Number`) |
| `API_KEY` | Optional key for external form requests |

---

## API endpoints

### Health check
```
GET /health
```

### List forms
```
GET /api/forms
```

### Submit form (generate PDF + upload to Creator)
```
POST /api/forms/OPS-OFD-029/submit
Content-Type: application/json
X-API-Key: your-api-key

{
  "operationRef": "2026-001",
  "data": {
    "personalDetails": { "name": "John" },
    "totals": { "grandTotal": 1500 }
  }
}
```

Response:
```json
{
  "success": true,
  "form": "OPS-OFD-029",
  "operationRef": "2026-001",
  "creatorField": "OPS_OFD_029",
  "fileName": "OPS-OFD-029-2026-001.pdf",
  "pdfSize": 12345,
  "uploadSkipped": false
}
```

### Lookup operation in Creator
```
GET /api/operations/2026-001
```

---

## Zoho OAuth scopes required

- `ZohoCreator.report.READ`
- `ZohoCreator.report.UPDATE` (for file upload)

Generate refresh token via Zoho API Console OAuth flow.

---

## Folder structure

```
backend/
├── src/
│   ├── index.js              # Express server
│   ├── config/
│   │   ├── env.js
│   │   └── forms.js          # OPS-OFD slug → Creator field map
│   ├── routes/
│   │   ├── forms.js          # POST /api/forms/:slug/submit
│   │   └── operations.js     # GET /api/operations/:ref
│   └── services/
│       ├── pdfGenerator.js   # PDF from form JSON
│       └── zohoCreator.js    # OAuth + search + upload
├── .env.example
└── package.json
```

---

## Next steps

- Replace simple PDF in `pdfGenerator.js` with proper per-form templates
- Add external-forms Next.js app (separate folder) that proxies to this backend
- Wire `API_KEY` in external forms proxy headers
