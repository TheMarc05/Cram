import { Link } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar";
import { useAuthStore } from "../store/authStore";

export const Profile: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <Navbar />

      <div className="max-w-4xl mx-auto pt-6 pb-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profile Picture"
                    className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover ring-4 ring-gray-100 shadow-md"
                  />
                ) : (
                  <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-gray-200 flex items-center justify-center ring-4 ring-gray-100 shadow-md">
                    <span className="text-gray-600 text-3xl sm:text-4xl font-semibold">
                      {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">
                  {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-base text-gray-600 mb-3">{user?.email}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                      user?.emailVerified
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user?.emailVerified ? (
                      <>
                        <svg
                          className="w-3 h-3 mr-1.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Email Verified
                      </>
                    ) : (
                      "Email Not Verified"
                    )}
                  </span>
                </div>
              </div>

              <Link
                to={"/edit-profile"}
                className="inline-flex items-center px-5 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Profile
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white shadow-sm rounded-lg p-6 hover:shadow-md transition-shadow duration-200 border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="bg-gray-100 rounded-lg p-3 mr-3">
                  <svg
                    className="w-6 h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Personal Information
                </h2>
              </div>
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Full Name
                  </dt>
                  <dd className="mt-1 text-base text-gray-900 font-medium">
                    {user?.firstName} {user?.lastName}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Email
                  </dt>
                  <dd className="mt-1 text-base text-gray-900 break-words">
                    {user?.email}
                  </dd>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6 hover:shadow-md transition-shadow duration-200 border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="bg-gray-100 rounded-lg p-3 mr-3">
                  <svg
                    className="w-6 h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Account Details
                </h2>
              </div>
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Role
                  </dt>
                  <dd className="mt-1 text-base text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {user?.role}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Account Type
                  </dt>
                  <dd className="mt-1 text-base text-gray-900">
                    {user?.googleId ? (
                      <span className="inline-flex items-center">
                        <svg
                          className="w-4 h-4 mr-1.5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                        Google Account
                      </span>
                    ) : (
                      "Email Account"
                    )}
                  </dd>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6 hover:shadow-md transition-shadow duration-200 border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="bg-gray-100 rounded-lg p-3 mr-3">
                  <svg
                    className="w-6 h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Account Activity
                </h2>
              </div>
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Member Since
                  </dt>
                  <dd className="mt-1 text-base text-gray-900">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Last Updated
                  </dt>
                  <dd className="mt-1 text-base text-gray-900">
                    {user?.updatedAt
                      ? new Date(user.updatedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
