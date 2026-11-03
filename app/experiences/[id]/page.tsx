import type { Metadata } from "next";
import ExperienceDetailClient from "./ExperienceDetailClient";
import { getExperienceDetail } from "@/app/data/sampleActivities";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const exp = getExperienceDetail(id);

  if (!exp) {
    return {
      title: "Hill-Station Experience Details | Mahastays",
      description: "Discover curated activities and adventures in Mahabaleshwar with Mahastays.",
    };
  }

  const title = `${exp.title} – ${exp.city || "Mahabaleshwar"}`;
  const description =
    exp.description ||
    exp.overview ||
    `Experience ${exp.title} in Mahabaleshwar. Book verified slots, guided tours, and adventures with Mahastays concierge.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/experiences/${id}`,
    },
    openGraph: {
      title: `${title} | Mahastays`,
      description,
      images: exp.gallery && exp.gallery.length > 0 ? [exp.gallery[0]] : exp.image ? [exp.image] : ["/hero-resort.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Mahastays`,
      description,
      images: exp.gallery && exp.gallery.length > 0 ? [exp.gallery[0]] : exp.image ? [exp.image] : ["/hero-resort.jpg"],
    },
  };
}

export default async function ExperienceDetailsPage({ params }: PageProps) {
  return <ExperienceDetailClient />;
}
