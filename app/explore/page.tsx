import type { Metadata } from "next";
import ExploreClient from "./ExploreClient";

export const metadata: Metadata = {
  title: "Explore Verified Luxury Stays, Villas & Resorts",
  description:
    "Browse handpicked private pool villas, boutique hillside resorts, and luxury stays in Mahabaleshwar and Panchgani. Filter by location, price, rating, and amenities.",
  alternates: {
    canonical: "/explore",
  },
};

export default function ExplorePage() {
  return <ExploreClient />;
}
