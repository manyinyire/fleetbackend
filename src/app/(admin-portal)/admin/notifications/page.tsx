import { requireRole } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdminFeaturePlaceholder } from "@/components/admin/AdminFeaturePlaceholder";
import { Stack } from "@chakra-ui/react";

export default async function NotificationsPage() {
  await requireRole("SUPER_ADMIN");

  return (
    <Stack spacing={8}>
      <PageHeader
        title="Notification Settings"
        description="Configure system-wide notifications, digests, and operational alerts."
      />
      <AdminFeaturePlaceholder
        title="Notification management is coming soon"
        description="We are rebuilding advanced delivery rules, templates, and channel routing with Chakra UI components."
      />
    </Stack>
  );
}
