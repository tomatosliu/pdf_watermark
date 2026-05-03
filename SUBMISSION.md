# Chrome Web Store Submission Checklist

Step-by-step guide to submit `PDF Watermark` to the CWS.

## 0. Pre-flight

```bash
npm test               # Ensure all 18 unit tests pass
node scripts/smoke-test.mjs   # Ensure all 10 smoke tests pass
npm run package        # Build + zip → marketing/pdf-watermark-v0.1.0.zip
```

Verify:
- [ ] `marketing/pdf-watermark-v0.1.0.zip` exists, size ≈ 4 MB
- [ ] Privacy policy is published at the URL you'll paste in the form
- [ ] Marketing screenshots are present in `marketing/`

## 1. Open the developer dashboard

→ <https://chrome.google.com/webstore/devconsole>

Click **New item** (top-right).

## 2. Upload the package

Upload `marketing/pdf-watermark-v0.1.0.zip`.

After upload, the dashboard reads the manifest and creates a draft item.

## 3. Fill in the listing

Tab: **Store listing**

| Field | Value (copy-paste from `marketing/listing-copy.md`) |
|---|---|
| Product name | `PDF Watermark` |
| Short description | English short description (≤ 132 chars) |
| Detailed description | English detailed description |
| Category | `Productivity` |
| Language | English (default), then add Simplified Chinese |

For **Simplified Chinese (zh_CN)**: open the language selector, add `中文 (中国)`,
paste the Chinese versions of short + detailed description.

### Graphic assets

| Asset | File |
|---|---|
| Store icon (128 × 128) | already inside the zip — auto-detected |
| Small promo tile (440 × 280) | `marketing/icon-440x280.png` |
| Marquee tile (1400 × 560) | _skip_ — only required for Featured candidates |
| Screenshots (1280 × 800, 1–5 required) | upload all three: `marketing/screenshot-1-hero.png`, `screenshot-2-features.png`, `screenshot-3-privacy.png` (in that order) |

## 4. Privacy practices

Tab: **Privacy practices**

- **Single purpose**: paste the short description (English) — _e.g._ "Add text watermarks to PDFs entirely in your browser. Files never upload."
- **Permission justification**: leave empty (we have no permissions to justify).
- **Remote code**: choose **No**, the extension does not load any remote code. All scripts are bundled.
- **Data usage** disclosure: tick **none of the above** — no personal info, no health, no financial, no auth, no location, no web history.
- **Certifications** (3 boxes at the bottom): tick all three:
  - I do not sell or transfer user data to third parties.
  - I do not use or transfer user data for purposes unrelated to the item's single purpose.
  - I do not use or transfer user data to determine creditworthiness or for lending purposes.

### Privacy policy URL

```
https://github.com/tomatosliu/pdf_watermark/blob/main/PRIVACY.md
```

## 5. Distribution

Tab: **Distribution**

- **Visibility**: `Public` (or `Unlisted` if you want to test first)
- **Pricing**: Free
- **Regions**: All regions (or pick a subset; All is the easiest)

## 6. Submit

Click **Submit for review** (top-right).

Review usually takes **a few hours to a few days**. You'll get an email
notification when the item is approved or if changes are needed.

## After approval

- Public listing URL: `https://chrome.google.com/webstore/detail/<extension-id>` —
  you'll get the ID after approval.
- Update the `README.md` install section to point at the CWS URL instead of
  developer-mode instructions.
- Bump `version` in `package.json` and `manifest.json` for any future updates,
  then `npm run package` and re-upload.

## Common rejection reasons (avoid)

- ❌ Mismatched description and behavior — we're fine, the listing accurately
  describes what the extension does.
- ❌ Excessive permissions — we have zero permissions, ✓.
- ❌ Loading remote code — we don't, ✓.
- ❌ Missing or broken privacy policy URL — verify the GitHub URL renders
  before submitting.
- ❌ Misleading metadata — keep claims like "100% local" verifiable
  (manifest with empty permissions + no fetch in code), ✓.
