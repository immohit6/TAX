# BAS Quarter

A small, installable web app for working out your quarterly BAS as a sole trader or rideshare driver. Enter income and expenses for each month, set your business-use %, and it gives you G1, 1A, G11, 1B and the GST you owe (or get back).

- Works on a phone like a real app: add it to your home screen and it opens full-screen, offline.
- Private by design. Everything you type is saved in your own browser on your own device. There is no server, no account and no tracking.
- Shareable. Anyone who opens the link gets a clean, empty copy with their own data. Nothing of yours travels with the link.
- Plain HTML, CSS and JavaScript. No build step, no dependencies.

This is a worksheet, not tax advice. Check figures against ato.gov.au or with a registered tax agent before lodging.

## Use it

1. Open the app and create your first quarter. It starts with rideshare-style lines (all zero). Rename, add or remove lines to suit you.
2. Add your name and ABN under **Settings** (optional, only shown on your own screen and in summaries you copy).
3. Fill in each month. Tick **× business %** on shared costs like the car and phone.
4. Copy or share the BAS figures at the top.

Next quarter, tap **New quarter**. You can copy your lines across with amounts reset to zero.

## Install on your phone

- **iPhone (Safari):** Share, then **Add to Home Screen**.
- **Android (Chrome):** menu, then **Install app** or **Add to Home screen**.

## Back up and move devices

Data lives in one browser on one device. To move it or keep a copy, use **Settings, Export backup**, then **Import backup** on the other device. Clearing your browser data deletes your quarters, so export first.

## Host it

It is a static site, so any static host works.

- **GitHub Pages:** repo Settings, Pages, deploy from the `main` branch, root folder.
- **Netlify:** drag the folder in, or connect the repo. No build command, publish directory `/`.

Note that this repo is public. Never commit a real backup file or your ABN here. The `.gitignore` blocks common backup file names as a safety net.

## Changing the code

If you edit any file, bump `VERSION` in `sw.js` so installed copies pick up the update.

## What the numbers mean

- **G1** total sales (GST-inclusive), **1A** GST on sales = G1 ÷ 11.
- **G11** purchases with GST, after business-use %, **1B** GST credits = G11 ÷ 11.
- **GST to pay** = 1A − 1B. A negative result is a refund.
- No-GST expenses are shown separately. They are not part of the BAS but reduce income tax in your return.

It assumes you are registered for GST and account on the basis your amounts reflect. If you are unsure about your situation, ask a tax agent.
