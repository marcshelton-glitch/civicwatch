# OCR Pipeline for House Financial Disclosures

Extracts net worth data from scanned (image-only) Congressional financial disclosure PDFs
using Google Cloud Vision `DOCUMENT_TEXT_DETECTION`.

---

## Prerequisites

### System dependencies

```bash
brew install poppler      # provides pdftoppm — preferred PDF-to-image converter
brew install ghostscript  # gs — fallback if poppler unavailable
```

Verify:
```bash
pdftoppm -v   # should print version
gs --version  # should print version
```

### Google Vision API key

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create or select a project
3. Enable **Cloud Vision API** (APIs & Services → Library → search "Vision")
4. Create credentials: APIs & Services → Credentials → **Create credentials → API key**
5. (Recommended) Restrict the key to the Cloud Vision API

### Environment variables

Add to `.env.local`:

```
GOOGLE_VISION_API_KEY=AIzaSy...your_key_here
```

The pipeline also uses the existing Supabase variables already in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Database migration

Run `migrations/006_fd_net_worth_ocr.sql` in the Supabase SQL editor before first use.
This adds `source`, `confidence`, `asset_count`, and `liability_count` columns to `fd_net_worth`.

---

## Workflow

### Step 1 — Discover filings for a year

```bash
mkdir -p data
node --env-file=.env.local scripts/scrape-house-index.js 2024 > data/house-filings-2024.json
```

Outputs a JSON array of Annual Report filings:
```json
[{
  "doc_id": "20005482",
  "last_name": "Pelosi",
  "first_name": "Nancy",
  "state_dst": "CA08",
  "year": 2024,
  "pdf_url": "https://disclosures-clerk.house.gov/public_disc/financial-pdfs/2024/20005482.pdf",
  "bioguide_id": null
}]
```

Add `--verbose` to see progress logs on stderr.

### Step 2 — Run the OCR pipeline

```bash
node --env-file=.env.local scripts/ocr-pipeline.js \
  --year=2024 \
  --input=data/house-filings-2024.json
```

The pipeline will:
- Skip members already in `fd_net_worth` with `source='ocr'` (unless `--force`)
- Download each PDF, convert pages to 200 DPI PNGs, OCR each page
- Parse Schedule A (assets) and Schedule D (liabilities) from the OCR text
- Upsert results into `fd_net_worth` with `source='ocr'`

#### Options

| Flag | Description |
|------|-------------|
| `--year=2024` | Target disclosure year (default: last year) |
| `--input=data/house-filings-2024.json` | JSON file from scrape-house-index.js |
| `--force` | Re-process members already in the DB |
| `--limit=50` | Process at most N filings (for testing) |

#### Without `--input` (query Supabase directly)

If `fd_filings` already has the Annual Report entries (populated by `ingest-disclosures.mjs --phase=index`), you can skip Step 1:

```bash
node --env-file=.env.local scripts/ocr-pipeline.js --year=2024
```

---

## Confidence levels

| Level | Meaning |
|-------|---------|
| `high` | ≥5 asset/liability rows parsed — likely complete |
| `medium` | 1–4 rows parsed — partial extraction |
| `low` | 0 rows parsed — OCR failed or PDF format unrecognized |

Low-confidence rows are still written to the DB (marked accordingly). Review them with:

```sql
SELECT last_name, first_name, state_dst, report_year, net_worth_min, net_worth_max, confidence
FROM fd_net_worth
WHERE source = 'ocr' AND confidence = 'low'
ORDER BY report_year DESC;
```

---

## Rate limits

The pipeline sends at most **5 Vision API requests per second** (one per PDF page).
Google Vision's free tier allows 1,800 requests/minute; this pipeline stays well under that.
For large batches (500+ members), expect ~20–40 minutes.

Pricing: Cloud Vision DOCUMENT_TEXT_DETECTION is $1.50/1,000 pages after the free 1,000/month.
A full year of House disclosures (~435 members, avg 5 pages each) costs roughly $3.

---

## Troubleshooting

**`pdftoppm: command not found`** — install poppler: `brew install poppler`

**`gs: command not found`** — install ghostscript: `brew install ghostscript`

**`Vision API 400: API key not valid`** — check `GOOGLE_VISION_API_KEY` in `.env.local`

**`HTTP 404` downloading a PDF** — the filing may be an amendment without its own PDF,
or the doc_id mapping may have changed. These are automatically skipped.

**Low confidence on many members** — the parser uses Schedule A/D section headers to locate
asset rows. If OCR quality is poor (faded scans), try increasing DPI by editing the `-r 200`
flag in `pdfToImages()` to `-r 300`.
