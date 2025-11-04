import { requireSuperAdmin } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdminFeaturePlaceholder } from "@/components/admin/AdminFeaturePlaceholder";
import { Stack } from "@chakra-ui/react";

export const metadata = {
  title: 'Email Templates | Super Admin',
  description: 'Manage email templates for the system'
};

export default async function EmailTemplatesPage() {
  await requireSuperAdmin();

  return (
    <Stack spacing={8}>
      <PageHeader
        title="Email Templates"
        description="Create reusable templates for onboarding, billing, and operational notifications."
      />
      <AdminFeaturePlaceholder
        title="Template builder is being rebuilt"
        description="The WYSIWYG designer, preview, and version history are migrating to Chakra UI. Please check back soon."
      />
    </Stack>
  );
}
