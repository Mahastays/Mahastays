import type { Metadata } from "next";
import AuthClient from "./AuthClient";

export const metadata: Metadata = {
  title: "Sign In to Your Account",
  description:
    "Log in to your Mahastays account to access booking history, exclusive Gold Member 8% discounts, saved favorites, and instant check-in vouchers.",
  alternates: {
    canonical: "/login",
  },
};

export default function LoginPage() {
  return <AuthClient initialMode="login" />;
}
