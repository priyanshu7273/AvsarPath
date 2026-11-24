<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Content drafting rules

Follow these whenever you draft or edit AvsarPath listings (opportunities, posts, exam events), in any session.

- **Official sources only.** Use the recruiting body's own website and PDFs (upsc.gov.in, ssc.gov.in, bpsc.bihar.gov.in, bssc.bihar.gov.in, rrbapply.gov.in and similar). Never take numbers or text from job or aggregator sites. If you can't reach the official notification, say so and ask the user to download the PDF.
- **Access politely.** Respect robots.txt and site terms. Never bypass CAPTCHAs, logins or bot protection.
- **Own words, official link.** Write descriptions in your own words; don't copy the notification. Link to the official PDF (`notification_url`) and the official source page.
- **Draft only.** Save listings as drafts. Never publish, unpublish or delete published content; the user verifies each draft against the PDF and publishes it.
- **Leave unknowns empty.** If the notification doesn't state a fact, leave the field empty (the page then shows "Not specified in the available official notification"). Never guess or fill from memory. Mark tentative dates as tentative.
- **Report with page numbers.** After each draft, list the key facts entered with the PDF page each comes from, and flag anything unsure (conflicting dates, totals that don't add up, documents you couldn't read).
- **Confirm it saved.** After saving, re-read every changed field from the server (reload the edit page, don't trust the form you just filled) and confirm it matches. In the admin form, browser-tool "fill" on a textarea that already has text can silently revert on save: type into it with real keystrokes (select all, then type) and check what the form actually submitted.
