import { requireAuth } from "@/lib/auth-helpers";
import { ProfileUpdateForm } from "@/components/account/ProfileUpdateForm";
import { ChangeEmailForm } from "@/components/account/ChangeEmailForm";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { AccountManagement } from "@/components/account/AccountManagement";
import { DeleteAccountSection } from "@/components/account/DeleteAccountSection";

export default async function AccountSettingsPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-5 font-bold text-dark dark:text-white">
          Account Settings
        </h1>
        <p className="text-body-sm text-dark-5 dark:text-dark-6">
          Manage your account information, security, and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Update */}
        <ProfileUpdateForm />

        {/* Change Email */}
        <ChangeEmailForm />

        {/* Change Password */}
        <ChangePasswordForm />

        {/* Account Management */}
        <AccountManagement />

        {/* Delete Account */}
        <DeleteAccountSection />
      </div>
    </div>
  );
}

