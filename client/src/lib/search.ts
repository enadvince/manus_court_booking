import type { SiteTarget } from "./navigation";
import { faqs, policies, posts } from "./siteContent";

export type SearchItem = {
  id: string;
  title: string;
  group: "Pages" | "Courts" | "FAQ" | "Policies" | "News" | "Club ops";
  description: string;
  /** Curated synonyms; weighted above the description. */
  keywords?: string;
  /** Long-form text (post bodies); lowest weight. */
  body?: string;
  target: SiteTarget;
};

const pages: SearchItem[] = [
  {
    id: "page-home",
    title: "Club home",
    group: "Pages",
    description: "Courts, club values and the clubhouse.",
    keywords: "home club about baseline cebu",
    target: { area: "public", view: "home" },
  },
  {
    id: "page-book",
    title: "Book a court",
    group: "Pages",
    description: "See open lanes and reserve a court.",
    keywords: "booking reserve availability schedule slot time",
    target: { area: "public", view: "book" },
  },
  {
    id: "page-account",
    title: "My bookings",
    group: "Pages",
    description: "Upcoming and past bookings, reschedule or cancel.",
    keywords: "account member reschedule cancel history",
    target: { area: "public", view: "account" },
  },
  {
    id: "page-openplay",
    title: "Open Play",
    group: "Pages",
    description: "Hosted sessions with a fair rotation queue.",
    keywords: "open play queue rotation host social",
    target: { area: "public", view: "openplay" },
  },
  {
    id: "page-news",
    title: "Club news",
    group: "Pages",
    description: "Announcements and updates from the club.",
    keywords: "news blog posts updates announcements",
    target: { area: "public", view: "news" },
  },
  {
    id: "page-signin",
    title: "Sign in",
    group: "Pages",
    description: "Sign in to your member account or create one.",
    keywords: "login log in register sign up create account join member",
    target: { area: "public", view: "signin" },
  },
  {
    id: "page-policies",
    title: "Booking policies",
    group: "Pages",
    description: "Cancellation, payments and house rules.",
    keywords: "policy terms rules cancellation refund payment",
    target: { area: "public", view: "policies" },
  },
  {
    id: "page-faq",
    title: "Frequently asked questions",
    group: "Pages",
    description: "Pricing, cancellations, equipment and hours.",
    keywords: "faq help questions",
    target: { area: "public", view: "home", anchor: "faq" },
  },
  {
    id: "page-newsletter",
    title: "Newsletter",
    group: "Pages",
    description: "Get open play dates and club news by email.",
    keywords: "subscribe email updates signup",
    target: { area: "public", view: "home", anchor: "newsletter" },
  },
];

const courtItems: SearchItem[] = ["01", "02", "03", "04"].map(number => ({
  id: `court-${number}`,
  title: `Court ${number}`,
  group: "Courts",
  description: "Indoor · Tournament surface · ₱450 to ₱600 / hour",
  keywords: "court lane indoor price",
  target: { area: "public", view: "book" },
}));

const adminItems: SearchItem[] = [
  [
    "dashboard",
    "Overview",
    "Daily pulse, live schedule and needs-attention queue",
  ],
  ["schedule", "Schedule", "All courts across the day"],
  ["resources", "Resources", "Court inventory"],
  ["customers", "Customers", "Member directory"],
  ["settings", "Settings", "Opening hours, cancellation policy, embed code"],
].map(([view, title, description]) => ({
  id: `admin-${view}`,
  title,
  group: "Club ops" as const,
  description,
  keywords: "admin club ops staff",
  target: { area: "admin", view } as SiteTarget,
}));

export function buildSearchIndex(): SearchItem[] {
  return [
    ...pages,
    ...courtItems,
    ...faqs.map(faq => ({
      id: faq.id,
      title: faq.question,
      group: "FAQ" as const,
      description: faq.answer,
      keywords: faq.keywords,
      target: { area: "public", view: "home", anchor: faq.id } as SiteTarget,
    })),
    ...policies.map(policy => ({
      id: policy.id,
      title: policy.title,
      group: "Policies" as const,
      description: policy.body[0],
      body: policy.body.join(" "),
      target: {
        area: "public",
        view: "policies",
        anchor: policy.id,
      } as SiteTarget,
    })),
    ...posts.map(post => ({
      id: post.id,
      title: post.title,
      group: "News" as const,
      description: post.excerpt,
      body: post.body.join(" "),
      target: { area: "public", view: "news", anchor: post.id } as SiteTarget,
    })),
    ...adminItems,
  ];
}

export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Every query word must appear somewhere in the item. Title matches rank
 * highest, then curated keywords, then the description, then body text.
 */
export function searchSite(
  query: string,
  items: SearchItem[],
  limit = 12
): SearchItem[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const scored: { item: SearchItem; score: number; order: number }[] = [];
  items.forEach((item, order) => {
    const title = normalize(item.title);
    const description = normalize(item.description);
    const keywords = normalize(item.keywords ?? "");
    const body = normalize(item.body ?? "");
    let score = 0;
    for (const word of words) {
      if (title.startsWith(word)) score += 6;
      else if (new RegExp(`\\b${escapeRegExp(word)}`).test(title)) score += 5;
      else if (title.includes(word)) score += 4;
      else if (keywords.includes(word)) score += 3;
      else if (description.includes(word)) score += 2;
      else if (body.includes(word)) score += 1;
      else return;
    }
    scored.push({ item, score, order });
  });
  return scored
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map(entry => entry.item);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
