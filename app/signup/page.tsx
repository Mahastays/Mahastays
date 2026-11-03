import type { Metadata } from "next";
import AuthClient from "../login/AuthClient";

export const metadata: Metadata = {
  title: "Create an Account & Join Mahastays Club",
  description:
    "Sign up for Mahastays to unlock exclusive member privileges, guaranteed 8% savings on every booking, early check-in perks, and personalized villa recommendations.",
  alternates: {
    canonical: "/signup",
  },
};

export default function SignupPage() {
  return <AuthClient initialMode="signup" />;
}
