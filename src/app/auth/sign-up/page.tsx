import type { Metadata } from "next";
import { SignUpPageLayout } from "@/components/Auth/SignUpPageLayout";

export const metadata: Metadata = {
  title: "Sign Up - Azaire Fleet Manager",
};

export default function SignUpPage() {
  return <SignUpPageLayout />;
}
