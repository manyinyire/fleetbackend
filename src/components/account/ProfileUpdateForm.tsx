"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useSession } from "@/lib/auth-client";
import { toast } from "react-hot-toast";
import { PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

export function ProfileUpdateForm() {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    image: "",
  });

  // Update form data when session loads
  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        image: session.user.image || "",
      });
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authClient.updateUser({
        name: formData.name,
        image: formData.image || undefined,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to update profile");
        return;
      }

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      // Session will automatically update via BetterAuth
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: session?.user?.name || "",
      image: session?.user?.image || "",
    });
    setIsEditing(false);
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
      <div className="flex items-center justify-between border-b border-stroke pb-4 dark:border-dark-3">
        <h3 className="text-lg font-bold text-dark dark:text-white">
          Profile Information
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditing}
              required
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-gray px-5.5 py-3 text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
              Profile Image URL
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              disabled={!isEditing}
              placeholder="https://example.com/avatar.jpg"
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-gray px-5.5 py-3 text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end gap-3 border-t border-stroke pt-4 dark:border-dark-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2 disabled:opacity-50"
            >
              <XMarkIcon className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

