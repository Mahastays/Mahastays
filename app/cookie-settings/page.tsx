import type { Metadata } from "next";
import CookieSettingsClient from "./CookieSettingsClient";

export const metadata: Metadata = {
  title: "Cookie Settings & Privacy Controls",
  description:
    "Manage your cookie preferences and tracking consent on Mahastays. Customize essential, performance, and functional preferences.",
  alternates: {
    canonical: "/cookie-settings",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function CookieSettingsPage() {
  return <CookieSettingsClient />;
}
