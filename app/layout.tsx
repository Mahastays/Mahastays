import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "../store/StoreProvider";
import { ToastContainer } from "../components/ui/Toast";
import SmoothScroll from "./components/SmoothScroll";
import ClientLayout from "./components/ClientLayout";

export const viewport: Viewport = {
  themeColor: "#ea110d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://mahastays.com"),
  title: {
    default: "Mahastays – Luxury Resorts, Premium Villas & Boutique Hotels in Mahabaleshwar",
    template: "%s | Mahastays",
  },
  description:
    "Discover and book handpicked luxury resorts, private pool villas, scenic cottages, curated stay packages, and unforgettable adventures in Mahabaleshwar, Panchgani, and Maharashtra with Mahastays.",
  keywords: [
    "Mahastays",
    "Mahabaleshwar resorts",
    "villas in Mahabaleshwar",
    "luxury private pool villas Mahabaleshwar",
    "Panchgani resort booking",
    "weekend getaways from Mumbai",
    "weekend getaways from Pune",
    "holiday packages Mahabaleshwar",
    "strawberry farm tour Mahabaleshwar",
    "Venna lake stays",
    "boutique hotels Maharashtra",
  ],
  authors: [{ name: "Mahastays Team", url: "https://mahastays.com" }],
  creator: "Mahastays Hospitality",
  publisher: "Mahastays",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://mahastays.com",
    siteName: "Mahastays",
    title: "Mahastays – Luxury Resorts, Premium Villas & Hotels in Mahabaleshwar",
    description:
      "Handpicked luxury resorts, private pool villas, and curated travel experiences in Mahabaleshwar and the Western Ghats.",
    images: [
      {
        url: "/hero-resort.jpg",
        width: 1200,
        height: 630,
        alt: "Mahastays Luxury Stays & Villas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mahastays – Luxury Resorts, Premium Villas & Hotels in Mahabaleshwar",
    description:
      "Handpicked luxury resorts, private pool villas, and curated travel experiences in Mahabaleshwar and the Western Ghats.",
    images: ["/hero-resort.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Roboto:wght@300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-[#ea110d] selection:text-white">
        <StoreProvider>
          <SmoothScroll>
            <ClientLayout>
              {children}
            </ClientLayout>
            <ToastContainer />
          </SmoothScroll>
        </StoreProvider>
      </body>
    </html>
  );
}
