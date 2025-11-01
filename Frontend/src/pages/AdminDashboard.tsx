import { useEffect, useState } from "react";
import { Navbar } from "../components/layout/Navbar";
import { useAuthStore } from "../store/authStore";

export const AdminDashboard: React.FC = () => {
  const {
    user: currentUser,
    getAllUsers,
    updateUserRole,
    updateUserStatus,
    deleteUserByAdmin,
  } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const usersData = await getAllUsers();
        setUsers(usersData);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [getAllUsers]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (error) {
      console.error("Failed to update user role:", error);
    }
  };

  const handleStatusChange = async (userId: number, isActive: boolean) => {
    try {
      await updateUserStatus(userId, isActive);
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, isActive: isActive } : user
        )
      );
    } catch (error) {
      console.error("Failed to update user status:", error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    const ok = confirm("Are you sure you want to delete this user?");
    if (!ok) {
      return;
    }

    try {
      await deleteUserByAdmin(userId);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <Navbar />

      <div className="max-w-7xl mx-auto pt-6 pb-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Admin Dashboard
          </h1>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                All Users
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Manage all users
              </p>
            </div>

            <ul className="divide-y divide-gray-200">
              {users.map((userItem) => (
                <li key={userItem.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          {userItem.avatar ? (
                            <img
                              src={userItem.avatar}
                              alt={`${userItem.firstName} ${userItem.lastName}`}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {userItem.firstName?.charAt(0) || "U"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 mr-6">
                        <div className="text-sm font-medium text-gray-900">
                          {userItem.firstName} {userItem.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {userItem.email}
                        </div>
                        <div className="mt-1">
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                              userItem.emailVerified
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {userItem.emailVerified
                              ? "Verified"
                              : "Not Verified"}
                          </span>
                        </div>
                      </div>

                      <div className="ml-auto flex items-center gap-6">
                        <div className="inline-flex rounded-md shadow-sm border border-gray-300 overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              handleRoleChange(userItem.id, "USER")
                            }
                            className={`px-3 py-1 text-sm ${
                              userItem.role === "USER"
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            User
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleRoleChange(userItem.id, "ADMIN")
                            }
                            className={`px-3 py-1 text-sm border-l border-gray-300 ${
                              userItem.role === "ADMIN"
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            Admin
                          </button>
                        </div>

                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={userItem.isActive}
                            onChange={() =>
                              handleStatusChange(
                                userItem.id,
                                !userItem.isActive
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition-colors relative">
                            <span
                              className={`absolute top-[2px] left-[2px] h-5 w-5 bg-white rounded-full transition-transform ${
                                userItem.isActive ? "translate-x-5" : ""
                              }`}
                            />
                          </div>
                          <span className="ml-2 text-sm text-gray-700">
                            {userItem.isActive ? "Active" : "Inactive"}
                          </span>
                        </label>

                        {userItem?.id !== currentUser?.id && (
                          <div className="inline-flex items-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(userItem.id)}
                              className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
