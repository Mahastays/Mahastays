import type { Metadata } from "next";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "My Profile & Active Bookings",
  description:
    "Manage your personal guest profile, view past and active villa reservations, explore Gold membership benefits, and configure account settings on Mahastays.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfilePage() {
  return <ProfileClient />;
}
