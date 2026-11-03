import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact Us & 24/7 Concierge Support",
  description:
    "Reach out to the Mahastays concierge team. Available 24/7 for custom villa reservations, event bookings, on-ground support, and travel inquiries in Mahabaleshwar.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
