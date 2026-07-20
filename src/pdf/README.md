# Document templates (Oceane-Marine parity)

Ported from `Oceane-Marine/src/jobs/services/pdf/`.

```
src/pdf/
  documentLogo.js
  normalizeChecklist.js      ← STS form JSON → Oceane shape
  normalizeQhseRecord.js     ← QHSE form JSON → Oceane shape
  registry.js                ← OPS-OFD slug → DOCX generator
  qhseRegistry.js            ← QAF-OFD / slug → jsPDF generator
  templates/
    OPS-OFD-001.js … 029.js  ← STS DOCX (Agenda parity)
    qhse/                    ← QHSE jsPDF (+ some DOCX)
      NearMissPdfReport.js
      HseInductionChecklistReport.js
      …
    shared/
      headerBuilder.js
      loadSignatureImage.js
      qhseRepeatingHeaderPdf.js
      qhseDocxHeader.js
      pdfSafeText.js
```

| Form family | Format | Library |
|-------------|--------|---------|
| OPS-OFD-*   | `.docx` | `docx` |
| QAF-OFD-* / QHSE | `.pdf` | `jspdf` + `jspdf-autotable` |

Logo: `backend/public/image/image.png`
