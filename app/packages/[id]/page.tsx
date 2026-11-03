import type { Metadata } from "next";
import PackageDetailClient from "./PackageDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    const res = await fetch(`${apiUrl}/packages/${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      const pkg = json?.data;
      if (pkg) {
        const title = `${pkg.title || pkg.name} – ${pkg.city || "Mahabaleshwar"}`;
        const description =
          pkg.overview ||
          pkg.shortDesc ||
          `Book ${pkg.title || pkg.name} with Mahastays. Complete luxury stay package with meals, activities, and 24/7 on-ground concierge support.`;
        const imageUrl = pkg.images?.[0] || pkg.thumbnail || "/hero-resort.jpg";

        return {
          title: `${title} | Mahastays`,
          description,
          alternates: {
            canonical: `/packages/${id}`,
          },
          openGraph: {
            title: `${title} | Mahastays`,
            description,
            images: [imageUrl],
          },
          twitter: {
            card: "summary_large_image",
            title: `${title} | Mahastays`,
            description,
            images: [imageUrl],
          },
        };
      }
    }
  } catch (err) {}

  return {
    title: "Holiday Package Details | Mahastays",
    description: "Discover curated holiday packages and luxury getaways in Mahabaleshwar with Mahastays.",
  };
}

export default async function PackageDetailsPage({ params }: PageProps) {
  return <PackageDetailClient />;
}
