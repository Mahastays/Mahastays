import type { Metadata } from "next";
import StayDetailClient from "./StayDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    const res = await fetch(`${apiUrl}/properties/${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      const stay = json?.data;
      if (stay) {
        const title = `${stay.name} – ${stay.location || stay.city || "Mahabaleshwar"}`;
        const description =
          stay.description ||
          `Book ${stay.name} at the best guaranteed direct rate with Mahastays. Verified luxury property with 24/7 on-ground concierge.`;
        const imageUrl =
          typeof stay.images?.[0] === "string"
            ? stay.images[0]
            : stay.images?.[0]?.url || "/hero-resort.jpg";

        return {
          title: `${title} | Mahastays`,
          description,
          alternates: {
            canonical: `/explore/${id}`,
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
    title: "Luxury Stay Details | Mahastays",
    description: "Discover verified luxury villas and resorts in Mahabaleshwar with Mahastays.",
  };
}

export default async function StayBookingDetailsPage({ params }: PageProps) {
  return <StayDetailClient />;
}
