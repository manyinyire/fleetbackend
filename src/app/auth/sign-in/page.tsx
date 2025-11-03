import type { Metadata } from "next";
import { SignInPageLayout } from "@/components/Auth/SignInPageLayout";

export const metadata: Metadata = {
  title: "Sign In - Azaire Fleet Manager",
};

export default function SignIn() {
  return <SignInPageLayout />;
}
