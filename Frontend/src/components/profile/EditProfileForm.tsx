import { useForm } from "react-hook-form";
import { useAuthStore } from "../../store/authStore";
import { useEffect, useState } from "react";
import { ImageUpload } from "../ui/ImageUpload";

interface EditProfileData {
  firstName: string;
  lastName: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  avatar: string;
}

export const EditProfileForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "avatar">(
    "profile"
  );
  const [success, setSuccess] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const {
    user,
    updateProfile,
    changePassword,
    uploadAvatar,
    isUpdatingProfile,
    isChangingPassword,
    isUploadingAvatar,
  } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<EditProfileData>({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      avatar: user?.avatar || "",
    },
  });

  const newPassword = watch("newPassword");

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        avatar: user.avatar || "",
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    }
  }, [user, reset]);

  const onSubmitProfile = async (data: EditProfileData) => {
    try {
      const result = await updateProfile(
        data.firstName,
        data.lastName,
        data.email
      );

      if (result.emailChangePending) {
        setSuccess(
          "Profile updated successfully! Please check your email for verification."
        );
      } else {
        setSuccess("Profile updated successfully!");
      }

      setTimeout(() => setSuccess(""), 5000);
    } catch (error) {
      console.error("Profile update failed:", error);
    }
  };

  const onSubmitPassword = async (data: EditProfileData) => {
    try {
      await changePassword(data.currentPassword, data.newPassword);
      setSuccess("Password changed successfully!");
      reset({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Password change failed:", error);
    }
  };

  const handleImageSelect = (file: File | null) => {
    if (file) {
      setSelectedFile(file);
      setValue("avatar", file.name);
    } else {
      setSelectedFile(null);
      setValue("avatar", user?.avatar || "");
    }
  };

  const onSubmitAvatar = async (_data: EditProfileData) => {
    if (!selectedFile) {
      alert("Please select an image first");
      return;
    }

    if (selectedFile && user?.avatar) {
      const currentImageBase64 = user.avatar;
      const selectedImageBase64 = await convertFileToBase64(selectedFile);

      if (currentImageBase64 === selectedImageBase64) {
        alert("Please select a different image");
        return;
      }
    }

    try {
      const base64 = await convertFileToBase64(selectedFile);
      await uploadAvatar(base64);
      setSuccess("Avatar uploaded successfully!");
      setSelectedFile(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Avatar upload failed:", error);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === "profile"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Profile Info
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === "password"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Change Password
        </button>
        <button
          onClick={() => setActiveTab("avatar")}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === "avatar"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Avatar
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      {activeTab === "profile" && (
        <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                {...register("firstName", {
                  required: "First name is required",
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.firstName && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                {...register("lastName", {
                  required: "Last name is required",
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.lastName && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              {...register("email", {
                required: "Email address is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Please enter a valid email address",
                },
              })}
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isUpdatingProfile}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {isUpdatingProfile ? "Updating..." : "Update Profile"}
          </button>
        </form>
      )}

      {activeTab === "password" && (
        <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
          {user?.googleId && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4">
              <p>
                You cannot change your password because you are logged in with
                Google.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                {...register("currentPassword", {
                  required: "Current password is required",
                })}
                type={showCurrentPassword ? "text" : "password"}
                disabled={!!user?.googleId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                title={showCurrentPassword ? "Hide password" : "Show password"}
                disabled={!!user?.googleId}
              >
                {showCurrentPassword ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {errors.currentPassword && (
              <p className="text-red-600 text-sm mt-1">
                {errors.currentPassword.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                {...register("newPassword", {
                  required: !user?.googleId
                    ? "New password is required"
                    : false,
                  minLength: !user?.googleId
                    ? {
                        value: 8,
                        message:
                          "New password must be at least 8 characters long",
                      }
                    : undefined,
                  pattern: !user?.googleId
                    ? {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message:
                          "New password must contain at least one uppercase letter, one lowercase letter, and one number",
                      }
                    : undefined,
                })}
                type={showNewPassword ? "text" : "password"}
                disabled={!!user?.googleId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                title={showNewPassword ? "Hide password" : "Show password"}
                disabled={!!user?.googleId}
              >
                {showNewPassword ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {errors.newPassword && (
              <p className="text-red-600 text-sm mt-1">
                {errors.newPassword.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                {...register("confirmNewPassword", {
                  required: !user?.googleId
                    ? "Confirm new password is required"
                    : false,
                  validate: !user?.googleId
                    ? (value) =>
                        value === newPassword || "Passwords do not match"
                    : undefined,
                })}
                type={showConfirmNewPassword ? "text" : "password"}
                disabled={!!user?.googleId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() =>
                  setShowConfirmNewPassword(!showConfirmNewPassword)
                }
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                title={
                  showConfirmNewPassword ? "Hide password" : "Show password"
                }
                disabled={!!user?.googleId}
              >
                {showConfirmNewPassword ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {errors.confirmNewPassword && (
              <p className="text-red-600 text-sm mt-1">
                {errors.confirmNewPassword.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isChangingPassword || !!user?.googleId}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {isChangingPassword ? "Changing..." : "Change Password"}
          </button>
        </form>
      )}

      {activeTab === "avatar" && (
        <form onSubmit={handleSubmit(onSubmitAvatar)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture
            </label>
            <ImageUpload
              onImageSelect={handleImageSelect}
              currentImage={user?.avatar}
              disabled={isUploadingAvatar}
            />
            {errors.avatar && (
              <p className="text-red-600 text-sm mt-1">
                {errors.avatar.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isUploadingAvatar || !selectedFile}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploadingAvatar ? "Uploading..." : "Upload Avatar"}
          </button>
        </form>
      )}
    </div>
  );
};
