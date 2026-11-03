import type { Metadata } from "next";
import StayDetailClient from "./StayDetailClient";
import { getStayDetail } from "@/app/data/sampleProperties";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const stay = getStayDetail(id);

  if (!stay) {
    return {
      title: "Luxury Stay Details | Mahastays",
      description: "Discover verified luxury villas and resorts in Mahabaleshwar with Mahastays.",
    };
  }

  const title = `${stay.name} – ${stay.location || "Mahabaleshwar"}`;
  const description =
    stay.description ||
    `Book ${stay.name} at the best guaranteed direct rate with Mahastays. Verified luxury property with 24/7 on-ground concierge.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/explore/${id}`,
    },
    openGraph: {
      title: `${title} | Mahastays`,
      description,
      images: stay.images && stay.images.length > 0 ? [stay.images[0].url] : ["/hero-resort.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Mahastays`,
      description,
      images: stay.images && stay.images.length > 0 ? [stay.images[0].url] : ["/hero-resort.jpg"],
    },
  };
}

export default async function StayBookingDetailsPage({ params }: PageProps) {
  return <StayDetailClient />;
}
