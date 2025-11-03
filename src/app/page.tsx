import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { LandingPage } from "@/components/marketing/LandingPage";

export default async function RootPage() {
  const user = await getCurrentUser();

  if (user) {
    if ((user as any).role === "SUPER_ADMIN") {
      redirect("/admin/dashboard");
    }

    redirect("/dashboard");
  }

  return <LandingPage />;
}