import type { Metadata } from "next";
import ExperiencesClient from "./ExperiencesClient";

export const metadata: Metadata = {
  title: "Curated Hill-Station Experiences & Activities in Mahabaleshwar",
  description:
    "Explore unforgettable adventures, strawberry farm tastings, Venna Lake sunset boating, stargazing, and guided nature walks in Mahabaleshwar with Mahastays.",
  alternates: {
    canonical: "/experiences",
  },
};

export default function ExperiencesPage() {
  return <ExperiencesClient />;
}
