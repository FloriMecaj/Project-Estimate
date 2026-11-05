export type Item = {
  id: string;
  title: string;
  description: string;
  /** Default price in EUR. 0 = included. */
  price: number;
  /** Shown instead of a price input when the cost is not ours to set. */
  priceLabel?: string;
  /** Pre-ticked when the page loads. */
  suggested?: boolean;
  /** Ticking this item also ticks these. */
  requires?: string[];
  note?: string;
};

export type Section = {
  id: "core" | "addons" | "maintenance" | "running";
  number: number;
  title: string;
  subtitle: string;
  /** How the section's prices add up. */
  billing: "once" | "monthly" | "external";
  items: Item[];
};

export const proposal = {
  client: "Ms. Entela Xhaferaj",
  project: "nimbkids.al Online Shop",
  place: "Tirana, November 2026",
  intro:
    "A bilingual (Albanian / English) online shop built around the way you already work: you upload your existing Excel file and photos, publish a whole set at once, and hide or show older sets whenever you need. Your customers can search, filter and order online from any device.",
};

export const sections: Section[] = [
  {
    id: "core",
    number: 1,
    title: "Core Package",
    subtitle:
      "Recommended. Everything the shop needs to launch, already ticked for you.",
    billing: "once",
    items: [
      {
        id: "design",
        title: "Shop design",
        description:
          "Design of the home, shop, product and cart pages; works on phones, tablets and computers",
        price: 350,
        suggested: true,
      },
      {
        id: "bilingual",
        title: "Albanian + English",
        description: "Whole site, checkout and order emails in both languages",
        price: 200,
        suggested: true,
      },
      {
        id: "filters",
        title: "Filters & bilingual search",
        description:
          "Filters by set, brand, season, category, age, gender, price; search with synonyms (e.g. dress / fustan)",
        price: 250,
        suggested: true,
      },
      {
        id: "checkout",
        title: "Checkout",
        description:
          "Pickup in store or cash on delivery; order confirmation emails",
        price: 150,
        suggested: true,
      },
      {
        id: "stock",
        title: "Stock handling",
        description:
          "Sold items hidden or shown as “sold out” (client’s choice)",
        price: 50,
        suggested: true,
      },
      {
        id: "variants",
        title: "Sizes & variants",
        description:
          "Several sizes or colors per product, each with its own stock",
        price: 100,
        suggested: true,
      },
      {
        id: "sets",
        title: "Sets in admin",
        description:
          "Sets by brand + season (e.g. “Zara Kids Spring 2026”); publish, hide or show a whole set; old products kept as archive",
        price: 250,
        suggested: true,
      },
      {
        id: "excel",
        title: "Product upload from Excel",
        description:
          "Upload your existing Excel file and product photos; photos are matched to products automatically; a check before publishing flags missing photos or duplicate products",
        price: 500,
        suggested: true,
      },
      {
        id: "wishlist",
        title: "Wishlist",
        description: "Customers save products for later",
        price: 30,
        suggested: true,
      },
      {
        id: "discounts",
        title: "Discount codes & set sales",
        description:
          "Coupons, % off a whole set or season (e.g. end-of-season sale)",
        price: 70,
        suggested: true,
      },
      {
        id: "legal",
        title: "Legal pages",
        description:
          "Terms, privacy and returns pages (text provided by the client)",
        price: 30,
        suggested: true,
      },
      {
        id: "seo",
        title: "Google visibility",
        description: "Shop and products set up to be found on Google",
        price: 100,
        suggested: true,
      },
      {
        id: "analytics",
        title: "Sales analytics dashboard",
        description:
          "Sales by set, brand, season, age and gender; best and slowest sellers; stock left per set",
        price: 0,
        suggested: true,
      },
      {
        id: "tracking",
        title: "Visitor tracking",
        description:
          "See how many people visit the shop and which ads bring customers",
        price: 0,
        suggested: true,
      },
      {
        id: "launch",
        title: "Testing & launch",
        description: "Full testing, import of the first set, go-live",
        price: 70,
        suggested: true,
      },
      {
        id: "training",
        title: "Training & guide",
        description: "Staff training session + short written guide",
        price: 50,
        suggested: true,
      },
    ],
  },
  {
    id: "addons",
    number: 2,
    title: "Optional Add-ons",
    subtitle: "Pick any you want, at launch or later.",
    billing: "once",
    items: [
      {
        id: "cards",
        title: "Online card payments",
        description: "Customers pay by card through Raiffeisen Bank",
        price: 400,
        requires: ["card-fees"],
      },
      {
        id: "accounts",
        title: "Customer accounts",
        description: "Login, order history, saved addresses",
        price: 100,
      },
      {
        id: "ai-descriptions",
        title: "AI product descriptions",
        description:
          "Albanian + English descriptions written automatically from the Excel data at import",
        price: 100,
        requires: ["ai-usage"],
      },
      {
        id: "ai-insights",
        title: "AI insights dashboard",
        description:
          "Weekly summary in plain language, restock suggestions, slow movers to discount",
        price: 200,
        requires: ["ai-usage"],
      },
      {
        id: "ai-assistant",
        title: "AI shopping assistant",
        description:
          "On-site chat that finds products from plain requests (e.g. “girls’ dress, age 4, under 2,000 lek”) in both languages",
        price: 300,
        requires: ["ai-usage"],
      },
      {
        id: "email",
        title: "Email marketing",
        description:
          "Newsletter sign-up, new-set announcements, reminder emails for unfinished orders",
        price: 100,
        requires: ["accounts"],
        note: "Requires Customer accounts (added automatically)",
      },
      {
        id: "loyalty",
        title: "Loyalty points",
        description: "Points per purchase, redeemable as discounts",
        price: 100,
      },
    ],
  },
  {
    id: "maintenance",
    number: 3,
    title: "Maintenance",
    subtitle: "Optional, billed monthly.",
    billing: "monthly",
    items: [
      {
        id: "maintenance",
        title: "Standard plan",
        description:
          "Updates, daily backups, security and uptime monitoring, up to 2 hours of changes per month, help with set uploads",
        price: 100,
      },
    ],
  },
  {
    id: "running",
    number: 4,
    title: "Running Costs",
    subtitle:
      "Paid directly by you to the providers. Tick the ones you need help setting up.",
    billing: "external",
    items: [
      {
        id: "hosting",
        title: "Website hosting",
        description: "Where the shop lives online",
        price: 0,
        priceLabel: "€10–20 / month",
        suggested: true,
      },
      {
        id: "domain",
        title: "Domain (nimbkids.al)",
        description: "Your shop’s web address",
        price: 0,
        priceLabel: "€10–25 / year",
        suggested: true,
      },
      {
        id: "ai-usage",
        title: "AI usage",
        description: "Only if AI add-ons are chosen",
        price: 0,
        priceLabel: "€5–30 / month",
      },
      {
        id: "card-fees",
        title: "Card payment fees (Raiffeisen)",
        description: "Only if online card payments are chosen",
        price: 0,
        priceLabel: "Per Raiffeisen terms",
      },
    ],
  },
];

export const timeline = [
  { week: "Week 1", work: "Shop design, Albanian / English versions" },
  {
    week: "Week 2",
    work: "Sets in admin, product upload from Excel, sizes & variants",
  },
  {
    week: "Week 3",
    work: "Filters & search, checkout, sales analytics, Google visibility, legal pages, discounts, wishlist",
  },
  {
    week: "Week 4",
    work: "Full testing, import of the first set, staff training & launch",
  },
];

export const allItems = sections.flatMap((s) =>
  s.items.map((item) => ({ ...item, section: s })),
);

export const eur = (n: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(n);
