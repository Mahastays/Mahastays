import type { Metadata } from "next";
import StaysClient from "./StaysClient";

export const metadata: Metadata = {
  title: "Luxury Stays, Villas & Resorts in Mahabaleshwar | Mahastays",
  description:
    "Browse handpicked private pool cliff villas, boutique heritage resorts, and luxury stays across Mahabaleshwar and Panchgani.",
  alternates: {
    canonical: "/stays",
  },
};

export default function StaysPage() {
  return <StaysClient />;
}

