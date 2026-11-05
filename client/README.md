# nimbkids.al — Project Estimate

One-page, fully static Next.js + shadcn/ui estimate builder. Clients tick features
(Core Package pre-ticked as suggested), edit any price or the total, and press **Finish**.

## How you see what the client picked (no server)
Pressing Finish opens the finished page. Its link (`/?s=...`) contains the whole
selection. At the top: **Copy link**, **Print**, **Download PDF** (generated in the
browser) and a WhatsApp share button. Open the link to see the same read-only summary:
every ticked item, edited prices (original crossed out), what was left out, and the total.

Nothing is stored anywhere. The link itself is the record, so keep the message.

## Develop
```bash
npm install
npm run dev
```

## Deploy on Vercel
Import the repo and set **Root Directory** to `client`. No environment variables needed.
Edit features/prices in `lib/proposal.ts`.
