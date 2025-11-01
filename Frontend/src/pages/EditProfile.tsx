import { Navbar } from "../components/layout/Navbar";
import { EditProfileForm } from "../components/profile/EditProfileForm";
import { useAuthStore } from "../store/authStore";

export const EditProfile: React.FC = () => {
  const { deleteMyAccount, isDeletingAccount } = useAuthStore();

  const handleDeleteAccount = async () => {
    const ok = confirm("Are you sure you want to delete your account?");
    if (!ok) {
      return;
    }

    try {
      await deleteMyAccount();
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <Navbar />

      <div className="max-w-4xl mx-auto pt-6 pb-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Edit Profile
            </h1>
            <EditProfileForm />

            <div className="mt-8 bg-red-50 border-2 border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Delete Account
              </h3>
              <p className="text-sm text-red-700 mb-4">
                This action is irreversible and will permanently delete your
                account.
              </p>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 font-medium"
              >
                {isDeletingAccount ? "Deleting..." : "Delete My Account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
