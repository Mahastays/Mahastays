import type { Metadata } from "next";
import FaqsClient from "./FaqsClient";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQs)",
  description:
    "Find answers to common questions about booking villas, luxury resorts, cancellation rules, private pool amenities, food preferences, and payments on Mahastays.",
  alternates: {
    canonical: "/faqs",
  },
};

export default function FaqsPage() {
  return <FaqsClient />;
}
