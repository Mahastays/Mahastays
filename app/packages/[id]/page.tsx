import type { Metadata } from "next";
import PackageDetailClient from "./PackageDetailClient";
import { getPackageDetail } from "@/app/data/samplePackages";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const pkg = getPackageDetail(id);

  if (!pkg) {
    return {
      title: "Holiday Package Details | Mahastays",
      description: "Discover curated holiday packages and luxury getaways in Mahabaleshwar with Mahastays.",
    };
  }

  const title = `${pkg.title} – ${pkg.city || "Mahabaleshwar"}`;
  const description =
    pkg.overview ||
    `Book ${pkg.title} with Mahastays. Complete luxury stay package with meals, activities, and 24/7 on-ground concierge support.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/packages/${id}`,
    },
    openGraph: {
      title: `${title} | Mahastays`,
      description,
      images: pkg.images && pkg.images.length > 0 ? [pkg.images[0]] : ["/hero-resort.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Mahastays`,
      description,
      images: pkg.images && pkg.images.length > 0 ? [pkg.images[0]] : ["/hero-resort.jpg"],
    },
  };
}

export default async function PackageDetailsPage({ params }: PageProps) {
  return <PackageDetailClient />;
}
