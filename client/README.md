# nimbkids.al — Project Estimate

One-page, fully static Next.js + shadcn/ui estimate builder. Clients tick features
(Core Package pre-ticked as suggested), edit any price or the total, and press **Finish**.

## How you see what the client picked (no server)
Finish creates a link that contains the whole selection (`/?s=...`). The client copies
it or sends it to you with the WhatsApp button. Open the link to see a read-only summary:
every ticked item, edited prices (with the original crossed out), what was left out,
and the final total. You can print it or save it as a PDF.

Nothing is stored anywhere. The link itself is the record, so keep the message.

## Develop
```bash
npm install
npm run dev
```

## Deploy on Vercel
Import the repo and set **Root Directory** to `client`. No environment variables needed.
Edit features/prices in `lib/proposal.ts`.
