// Editable club content: contact details, FAQs and news posts.
// Dates are ISO calendar days (YYYY-MM-DD). Bump `updated` whenever a post changes.

export const contact = {
  email: "hello@baseline.ph",
  phone: "+63 917 000 0000",
  address: "Baseline Pickle Club, Cebu City",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Baseline+Pickle+Club+Cebu+City",
} as const;

export type Faq = {
  id: string;
  question: string;
  answer: string;
  /** Extra words people search with that the text itself doesn't use. */
  keywords?: string;
};

export const faqs: Faq[] = [
  {
    id: "faq-cancellation",
    keywords: "refund reschedule cancel policy",
    question: "What is the cancellation policy?",
    answer:
      "You can cancel or reschedule for free up to 12 hours before your session starts. Inside 12 hours the court fee is non-refundable, but you can still hand the booking to a friend.",
  },
  {
    id: "faq-pricing",
    keywords: "price cost fee rate peso",
    question: "How much does a court cost?",
    answer:
      "Every court is ₱450 per hour, whether you play at 6 AM or in the evening peak. The price covers the whole court, not each player.",
  },
  {
    id: "faq-players",
    keywords: "capacity cap friends group",
    question: "How many players can join a booking?",
    answer:
      "When you book, you set a player cap of 2, 4, 6 or 8. Friends can join until the session is full, and the booking board shows the joined and maximum count.",
  },
  {
    id: "faq-open-play",
    keywords: "queue rotation social drop-in",
    question: "How does Open Play work?",
    answer:
      "A host runs the session and the queue puts players with fewer games and longer rest first, so everyone gets fair court time. Four players go on court at a time.",
  },
  {
    id: "faq-equipment",
    keywords: "paddle racket rental balls gear",
    question: "Do I need my own paddle?",
    answer:
      "No. Paddles and balls are available at the front desk, so you can walk in empty-handed and still play.",
  },
  {
    id: "faq-hours",
    keywords: "hours opening times schedule open close",
    question: "When is the club open?",
    answer:
      "We are open every day from 06:00 to 22:00. The busiest stretch is 6–9 PM on weekdays, so book early for evening games.",
  },
];

export type Post = {
  id: string;
  title: string;
  excerpt: string;
  body: string[];
  author: string;
  published: string;
  updated: string;
};

export const posts: Post[] = [
  {
    id: "post-friday-open-play",
    title: "A second Friday open play session",
    excerpt:
      "Friday evenings fill up fast, so we are adding another hosted open play block.",
    body: [
      "Courts run at 94% between 6 and 8 PM on Fridays. To give more people a game, we are adding a second hosted open play session on Court 03 straight after the first.",
      "The fair rotation queue works the same way: fewer games played moves you up, and longer rest breaks ties. Add the session to your calendar from the Open Play page.",
    ],
    author: "Club ops",
    published: "2026-09-02",
    updated: "2026-09-29",
  },
  {
    id: "post-player-caps",
    title: "Player caps are now on every booking",
    excerpt:
      "Set how many people can join your court, and see at a glance when it is full.",
    body: [
      "When you book a court you can now choose a cap of 2, 4, 6 or 8 players. Friends who join count toward the cap, and the session shows as full once every spot is taken.",
      "Hosts see the same counter in Open Play, so nobody turns up to a court that has no room.",
    ],
    author: "Club ops",
    published: "2026-08-14",
    updated: "2026-09-10",
  },
  {
    id: "post-court-resurfacing",
    title: "Courts 01 and 02 resurfaced",
    excerpt:
      "Fresh tournament surface and brighter lines on our two green-lane courts.",
    body: [
      "Courts 01 and 02 have new tournament-grade surfacing and repainted lines. Expect a truer bounce and better grip on quick lateral moves.",
      "Thanks for your patience during the two maintenance mornings. Both courts are back on the booking board.",
    ],
    author: "Facilities team",
    published: "2026-07-21",
    updated: "2026-07-23",
  },
];
