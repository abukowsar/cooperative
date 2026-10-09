# দুগ্ধ সমবায় পোর্টাল (Dairy Cooperative Portal)

Next.js 15 + MongoDB web app for the Department of Cooperatives' dairy expansion project.

## Features

| Page | What it does |
|---|---|
| `/` হোম | Hero with live stats, daily farm tip, the 10 project activities as cards linking to their tools, latest questions and trainings. |
| `/forum` সমস্যা ও পরামর্শ | Farmers post problems; experts and other farmers answer. Search (Bengali substring), category filter, "awaiting advice" filter, 👍 helpful votes, moderator resolve/delete. |
| `/samity` সমিতির খাতা | Per-cooperative login (code + PIN). Dashboard, member register, morning/evening milk collection with fat-based pricing, printable monthly statement, **savings passbook** (deposit/withdraw, balances), **loan register** (grace period, EMI, repayments, arrears), price rule. Tabs are linkable, e.g. `/samity#loans`. |
| `/tools` খামার টুলস | Calculators: loan with grace period, daily feed ration + concentrate mix, vaccination schedule with next-due dates, dairy products (ghee/doi/chhana) value-add, biogas & vermicompost, fattening profit. Linkable, e.g. `/tools#biogas`. |
| `/training` প্রশিক্ষণ | Moderators announce trainings; anyone registers with name + phone (seat limit, one per phone). Moderators see the registration list. |
| `/learn` জ্ঞানভাণ্ডার | Step-by-step guides: fodder, silage, vermicompost, organic vegetables, clean milking, calf care, heat detection, samity governance. |
| `/samity/breeding` প্রজনন ক্যালেন্ডার | Enter a cow's AI date and it calculates heat check (21 d), pregnancy check (60 d), dry-off (223 d), close-up feeding (262 d), calving (283 d). Shows a 30-day task list across all cows. |
| `/experts` | Expert directory with area/topic filter and tap-to-call. |
| `/about` | Project activities, partners, contact. |

## Setup

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production
```

Test data:

```bash
npm run seed            # replace seed data (forum, experts, trainings, demo samity)
npm run seed -- --clear # remove seed data only
```

Demo samity login: code `demo-samity`, PIN `1234`. Seeded documents are tagged `seed: true`; real user data is never touched.

`.env.local` needs:

```
MONGODB_URI=...          # Atlas connection string
MONGODB_DB=dairy_coop
SESSION_SECRET=...       # long random string, signs login cookies
MODERATOR_KEY=...        # key typed into "মডারেটর প্রবেশ" at the bottom of the forum
```

Atlas: add your server's IP under **Network Access**, or connections fail with a TLS "internal error".

## Notes

- Milk price = base rate + (fat − standard fat) × 10 × adjustment per 0.1%. The rate is stored on each entry, so changing the price later doesn't rewrite history.
- Members are deactivated rather than deleted, so old ledgers stay intact.
- Indexes are created automatically on first request (`lib/db.ts`).
- `legacy/` holds the original single-file HTML portal this was built from.
