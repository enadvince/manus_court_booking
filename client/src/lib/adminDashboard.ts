export type DashboardBooking = {
  time: string;
  court: string;
  name: string;
  type: string;
  color: "lime" | "blue" | "yellow" | "muted";
  status: "confirmed" | "open-play" | "available";
};

export type AttentionItem = {
  id: string;
  title: string;
  detail: string;
  tone: "warning" | "info" | "success";
};

export const dashboardBookings: DashboardBooking[] = [
  { time: "08:00", court: "Court 02", name: "Alex dela Cruz", type: "Member booking", color: "lime", status: "confirmed" },
  { time: "09:00", court: "Court 01", name: "Mia Santos", type: "Member booking", color: "blue", status: "confirmed" },
  { time: "10:00", court: "Court 03", name: "Open play session", type: "12 spots · 8 booked", color: "yellow", status: "open-play" },
  { time: "11:00", court: "Court 04", name: "Available", type: "No booking yet", color: "muted", status: "available" },
];

export const dashboardAttention: AttentionItem[] = [
  { id: "payment-1", title: "1 payment to reconcile", detail: "Court 02 · Alex dela Cruz · ₱450", tone: "warning" },
  { id: "maintenance-1", title: "Court 04 needs a quick check", detail: "Last inspection was 3 days ago", tone: "info" },
  { id: "waitlist-1", title: "3 players on the evening waitlist", detail: "Friday · 6:00 PM open play", tone: "success" },
];

export const revenuePulse = [42, 58, 51, 76, 63, 88, 72];

export function getDashboardSummary(bookings: DashboardBooking[]) {
  return {
    confirmed: bookings.filter((booking) => booking.status === "confirmed").length,
    openPlay: bookings.filter((booking) => booking.status === "open-play").length,
    available: bookings.filter((booking) => booking.status === "available").length,
  };
}
