import type { Metadata } from "next";
import PackagesClient from "./PackagesClient";

export const metadata: Metadata = {
  title: "Exclusive Holiday & Stay Packages in Mahabaleshwar",
  description:
    "Discover all-inclusive holiday packages, romantic couples retreats, family getaway deals, and wellness specials in Mahabaleshwar and Panchgani.",
  alternates: {
    canonical: "/packages",
  },
};

export default function PackagesPage() {
  return <PackagesClient />;
}
