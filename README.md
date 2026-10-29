# BAS Quarter

A small, installable web app for working out your quarterly BAS as a sole trader or rideshare driver. Enter income and expenses for each month, set your business-use %, and it gives you G1, 1A, G11, 1B and the GST you owe (or get back).

- Works on a phone like a real app: add it to your home screen and it opens full-screen, offline.
- Download your BAS as a one-page PDF for your records, with a Save button that shows when your figures were last saved on the device.
- Private by design. Everything you type is saved in your own browser on your own device. There is no server, no account and no tracking.
- Shareable. Anyone who opens the link gets a clean, empty copy with their own data. Nothing of yours travels with the link.
- Plain HTML, CSS and JavaScript. No build step, no dependencies.

This is a worksheet, not tax advice. Check figures against ato.gov.au or with a registered tax agent before lodging.

## Use it

1. Open the app and create your first quarter. It starts with rideshare-style lines (all zero). Rename, add or remove lines to suit you.
2. Add your name and ABN under **Settings** (optional, only shown on your own screen and in summaries you copy).
3. Fill in each month. Tick **× business %** on shared costs like the car and phone. New quarters start at 0% business use on purpose: set your real share, or use **Work it out from kilometres** (business km ÷ total km).
4. Download, copy or share the BAS figures at the top.

Next quarter, tap **New quarter**. You can copy your lines across with amounts reset to zero.

## Install on your phone

- **iPhone (Safari):** Share, then **Add to Home Screen**.
- **Android (Chrome):** menu, then **Install app** or **Add to Home screen**.

## Back up and move devices

Data lives in one browser on one device and is saved every time you type. To move it or keep a copy, use **Settings, Export backup**, then **Import backup** on the other device. Clearing your browser data deletes your quarters, so export first. The app has no "delete everything" button.

## Host it

It is a static site, so any static host works.

- **GitHub Pages:** repo Settings, Pages, deploy from the `main` branch, root folder.
- **Netlify:** drag the folder in, or connect the repo. No build command, publish directory `/`.

Note that this repo is public. Never commit a real backup file or your ABN here. The `.gitignore` blocks common backup file names as a safety net.

## Changing the code

If you edit any file, bump `VERSION` in `sw.js` so installed copies pick up the update.

## What the rules are based on

Checked on 30 October 2026. ATO means the page was read on ato.gov.au; "secondary" means a non-ATO source that you should confirm.

- Ride-sourcing drivers register for GST before the first trip, with no turnover threshold. GST is one eleventh of the full fare, not of what is left after the platform's fee. (ATO, ride-sourcing, updated 20 Aug 2025)
- A GST credit needs GST in the price, a business purpose, and a tax invoice for purchases over $82.50. Shared costs get only the business share. (ATO, updated 14 Sep 2026)
- Platform fees give a credit only if the platform charged GST on them. Uber says its service fee is subject to GST. DiDi's is not confirmed here, so check your tax summary. (ATO, Uber)
- Insurance: GST does not apply to stamp duty, so enter the premium less stamp duty. (ATO, GST and insurance, updated 2019)
- Car credits come from actual costs × business-use share, not the cents-per-km rate. (ATO GST bulletin 2006/1)
- Business travel runs from accepting a job to finishing it. Driving without a job is private. (ATO, ride-sourcing)
- Bank fees and loan interest are financial supplies and carry no GST credit. (ATO on input-taxed financial supplies; secondary source for bank fees)
- Registration and CTP: the VicRoads page does not mention GST, so the app treats them as no-GST. Check your invoice. 
- Quarterly BAS due dates: 28 Oct, 28 Feb, 28 Apr, 28 Jul. Online lodgers may get two extra weeks except for Oct–Dec. (ATO, updated 17 Sep 2026)
- Cents per km for 2025-26 is 88c up to 5,000 km. The app does not use it, but it is the rate people ask about. (secondary, confirm on ato.gov.au)

Not handled: capital purchases at G10 (a car or equipment), GST adjustments, the annual apportionment election, PAYG instalments, and how a specific tip or incentive is treated for GST. Ask a registered tax or BAS agent about those.

## What the numbers mean

- **G1** total sales (GST-inclusive), **1A** GST on sales = G1 ÷ 11.
- **G11** purchases with GST, after business-use %, **1B** GST credits = G11 ÷ 11.
- **GST to pay** = 1A − 1B. A negative result is a refund.
- No-GST expenses are shown separately. They are not part of the BAS but reduce income tax in your return.

It assumes you are registered for GST and account on the basis your amounts reflect. If you are unsure about your situation, ask a tax agent.
