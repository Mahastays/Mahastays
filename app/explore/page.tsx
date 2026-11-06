import type { Metadata } from "next";
import ExplorePlacesClient from "./ExplorePlacesClient";

export const metadata: Metadata = {
  title: "Explore Famous Places & Scenic Wonders of Mahabaleshwar | Mahastays",
  description:
    "Interactive map and curated guide to Mahabaleshwar's iconic viewpoints, roaring waterfalls, historic forts, and sacred temples. Plan your Western Ghats adventure.",
  alternates: {
    canonical: "/explore",
  },
};

export default function ExplorePage() {
  return <ExplorePlacesClient />;
}
