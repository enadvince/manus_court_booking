// Editable club content: contact details, FAQs and news posts.
// Dates are ISO calendar days (YYYY-MM-DD). Bump `updated` whenever a post changes.

export const contact = {
  email: "hello@baseline.ph",
  phone: "+63 917 000 0000",
  // Placeholder until the club's Messenger page is set up.
  messengerUrl: "https://m.me/baselinepickleclub",
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
    id: "faq-booking",
    keywords: "how to book reserve online slot time court assign",
    question: "How do I book a court?",
    answer:
      "Pick a day, how long you want to play, and a start time. We assign the best free court automatically, or you can choose a specific one. Sessions start on the hour from 6:00 AM, and the last one ends at 10:00 PM.",
  },
  {
    id: "faq-pricing",
    keywords: "price cost fee rate peso peak off-peak weekend",
    question: "How much does a court cost?",
    answer:
      "Off-peak is ₱450 per hour. Peak is ₱600 per hour: weekdays from 6:00 PM to 9:00 PM, and all day on Saturdays and Sundays. A booking that crosses into peak is charged per half hour, and the price always covers the whole court.",
  },
  {
    id: "faq-payment",
    keywords: "pay payment cash gcash maya qr screenshot verify",
    question: "How do I pay?",
    answer:
      "Pay cash at the front desk when you arrive, or pay by QR (GCash or Maya) and upload a screenshot when you book. The host checks QR payments and marks them verified.",
  },
  {
    id: "faq-players",
    keywords: "capacity cap friends group how many players",
    question: "How many players can I bring?",
    answer:
      "Court bookings have no player cap: the court is yours for the session. Open Play is different. The host sets a player limit based on how long the session runs.",
  },
  {
    id: "faq-changeover",
    keywords: "buffer changeover late start early finish",
    question: "Is there a gap between sessions?",
    answer:
      "Sessions run on the hour. Expect a 5 minute changeover buffer at the start while the previous group clears the court.",
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
    id: "faq-parking",
    keywords: "parking car park motorcycle bike drive",
    question: "Is there parking?",
    answer:
      "Yes. Free parking for cars and motorcycles is right outside the club, with bike racks by the entrance. On busy weekend evenings, arrive 10 minutes early to find a spot.",
  },
  {
    id: "faq-hours",
    keywords: "hours opening times schedule open close",
    question: "When is the club open?",
    answer:
      "We are open every day from 6:00 AM to 10:00 PM. The busiest stretch is 6:00 to 9:00 PM on weekdays, so book early for evening games.",
  },
];

/** Bump whenever an FAQ answer changes. */
export const FAQ_UPDATED = "2026-10-09";

export type Policy = {
  id: string;
  title: string;
  updated: string;
  body: string[];
};

export const policies: Policy[] = [
  {
    id: "policy-cancellation",
    title: "Cancellation and rescheduling",
    updated: "2026-10-09",
    body: [
      "Cancel or reschedule for free up to 12 hours before your session starts. You can do both from your booking confirmation or from My bookings.",
      "Inside 12 hours the court fee is non-refundable, but you can still hand the booking to a friend. Moving a booking keeps your payment; any price difference is settled at the front desk.",
    ],
  },
  {
    id: "policy-payment",
    title: "Payments",
    updated: "2026-10-09",
    body: [
      "Pay cash at the front desk when you arrive, or pay by QR (GCash or Maya) and upload your screenshot when you book. The host checks every QR payment and marks it verified.",
      "If a screenshot can't be verified, we will ask you to pay at the desk before play.",
    ],
  },
  {
    id: "policy-house-rules",
    title: "House rules",
    updated: "2026-10-09",
    body: [
      "Sessions start on the hour. Expect a 5 minute changeover buffer at the start while the previous group clears the court, and please clear the court on time at the end of yours.",
      "Non-marking indoor shoes only. Paddles and balls can be borrowed from the front desk.",
    ],
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
