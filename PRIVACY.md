# Privacy Policy — PDF Watermark

_Last updated: 2026-05-03_

## Summary

**PDF Watermark does not collect, store, transmit, or share any of your data. Period.**

Every operation — opening the PDF, rendering the preview, embedding the watermark,
downloading the result — happens entirely in your own browser, on your own device.
No data ever leaves your machine.

## What data we do NOT collect

We do not collect, log, analyze, or transmit any of the following:

- The contents of the PDFs you process
- Filenames or file metadata
- Watermark text you enter
- Configuration choices (opacity, angle, color, layout)
- Usage statistics, click tracking, telemetry, or analytics
- IP addresses, browser fingerprints, device identifiers, or session data
- Personal information of any kind

## How the extension works

When you open the popup and select a PDF:

1. The file is read **into memory in your local browser only**, using the
   standard `File` API. The browser does not upload the file anywhere.
2. The first page is rendered to an on-screen preview using
   [pdf.js](https://mozilla.github.io/pdf.js/), bundled inside the extension.
3. When you click **Download**, the watermark is added using
   [pdf-lib](https://pdf-lib.js.org), also bundled inside the extension.
4. The watermarked PDF is saved to your Downloads folder via Chrome's built-in
   download mechanism.

At no point does the extension make any network request — neither to our servers
(we have none), nor to any third party.

## Permissions

The extension requests **zero Chrome permissions** in its `manifest.json`.
You can verify this yourself by opening the bundled `manifest.json` —
the `permissions` field is an empty array `[]`.

## Third-party libraries

The extension is built with the following open-source libraries, all bundled
inside the extension package and not loaded from any remote source:

- [pdf-lib](https://pdf-lib.js.org) (MIT license) — PDF parsing and writing
- [@pdf-lib/fontkit](https://github.com/Hopding/fontkit) (MIT license) — Custom font support
- [pdf.js](https://mozilla.github.io/pdf.js/) (Apache 2.0) — PDF rendering for preview
- [Noto Sans SC](https://fonts.google.com/noto/specimen/Noto+Sans+SC)
  (SIL Open Font License 1.1) — Embedded subset of simplified Chinese font

None of these libraries make network requests when used inside this extension.

## Children's privacy

Because the extension does not collect any data, it does not knowingly or
unknowingly collect data from children under 13.

## Changes to this policy

If the extension's behavior ever changes — for example, if a future version
adds optional cloud features — this policy will be updated and the version
number will be bumped accordingly. Existing users will see the change in the
extension's update notes on the Chrome Web Store.

## Contact

Questions or concerns about this policy can be raised by opening an issue at:

<https://github.com/tomatosliu/pdf_watermark/issues>

---

_This policy applies to the "PDF Watermark" Chrome extension published by
tomatosliu on the Chrome Web Store._
