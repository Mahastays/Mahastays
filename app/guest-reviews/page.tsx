import type { Metadata } from "next";
import GuestReviewsClient from "./GuestReviewsClient";

export const metadata: Metadata = {
  title: "Guest Reviews & Verified Traveler Stories",
  description:
    "Read 100% verified traveler reviews and authentic guest feedback on Mahabaleshwar villas, cliffside resorts, family retreats, and concierge services on Mahastays.",
  alternates: {
    canonical: "/guest-reviews",
  },
};

export default function GuestReviewsPage() {
  return <GuestReviewsClient />;
}
