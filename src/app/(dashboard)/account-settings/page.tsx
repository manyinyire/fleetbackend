import { requireAuth, getCurrentUser } from "@/lib/auth-helpers";
import { ProfileUpdateForm } from "@/components/account/ProfileUpdateForm";
import { ChangeEmailForm } from "@/components/account/ChangeEmailForm";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { AccountManagement } from "@/components/account/AccountManagement";
import { DeleteAccountSection } from "@/components/account/DeleteAccountSection";
import { getInitials } from "@/lib/utils";
import Image from "next/image";

export default async function AccountSettingsPage() {
  const user = await requireAuth();

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

      {/* User Info Card */}
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-full">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary text-xl font-bold text-white">
                {getInitials(user.name)}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-dark dark:text-white">
              {user.name}
            </h2>
            <p className="text-body-sm text-dark-5 dark:text-dark-6">
              {user.email}
            </p>
            <p className="mt-1 text-body-xs text-dark-5 dark:text-dark-6">
              {(user as any).role?.replace(/_/g, ' ') || 'User'}
            </p>
          </div>
        </div>
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

