import React, { useEffect, useState } from "react";
import AdminUserCard from "./AdminUserCard";
import { useDarkMode } from "../context/DarkModeContext";
import { UserAuth } from "../context/AuthContext";

const AdminManager = () => {
  const [admins, setAdmins] = useState([]);
  const [nonAdmins, setNonAdmins] = useState([]);
  const [adminIds, setAdminIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [userId, setUserId] = useState("");
  const { darkMode } = useDarkMode();
  const { session } = UserAuth();

  const hostUrl =
    "https://api-sd-project-fea6akbyhygsh0hk.southafricanorth-01.azurewebsites.net/api/admin";

  useEffect(() => {
    const fetchSessionAndCheck = async () => {
      setToken(session?.access_token);
      setUserId(session?.user?.id);
    };

    fetchSessionAndCheck();
  }, [token]);

  useEffect(() => {
    const fetchUsersAndAdmins = async () => {
      setLoading(true);

      let userResponse = [];
      try {
        const res = await fetch(`${hostUrl}/getAuth`);
        if (!res.ok) throw new Error("Failed to fetch users from API");
        userResponse = await res.json();
      } catch (err) {
        console.error("Error fetching users:", err.message);
        setLoading(false);
        return;
      }

      const applicationUsers = (userResponse || [])
        .filter((r) => r.is_denied === false || r.is_denied === null)
        .map((r) => ({
          user_id: String(r.user_id).trim(),
          user_name: r.user_name || "Unnamed User",
          motivation: r.motivation || "",
        }));

      let roleData = [];
      try {
        const res = await fetch(`${hostUrl}/getRoles`);
        if (!res.ok) throw new Error("Failed to fetch user roles from API");
        roleData = await res.json();
      } catch (err) {
        console.error("Error fetching user_roles:", err.message);
        setLoading(false);
        return;
      }

      const adminSet = new Set(
        (roleData || [])
          .filter((r) => r.role === "admin")
          .map((r) => String(r.user_id).trim())
      );
      setAdminIds(adminSet);

      const adminsList = [];
      const nonAdminsList = [];

      applicationUsers.forEach((user) => {
        const id = String(user.user_id).trim();
        const userObj = {
          id,
          name: user.user_name || "Unnamed User",
          motivation: user.motivation || "",
          isAdmin: adminSet.has(id),
        };

        userObj.isAdmin
          ? adminsList.push(userObj)
          : nonAdminsList.push(userObj);
      });

      setAdmins(adminsList);
      setNonAdmins(nonAdminsList);
      setLoading(false);
    };

    fetchUsersAndAdmins();
  }, []);

  const toggleAdmin = async (userId) => {
    const id = String(userId).trim();
    const isCurrentlyAdmin = adminIds.has(id);

    if (isCurrentlyAdmin) {
      let error = null;
      try {
        const res = await fetch(`${hostUrl}/remove-admin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify({ id: id }),
        });
        if (!res.ok) {
          const data = await res.json();
          error = { message: data?.error || "Failed to remove admin" };
        }
      } catch (err) {
        error = { message: err.message };
      }

      if (!error) {
        setAdminIds((prev) => {
          const updated = new Set(prev);
          updated.delete(id);
          return updated;
        });

        const removed = admins.find((u) => u.id === id);
        setAdmins((prev) => prev.filter((u) => u.id !== id));
        setNonAdmins((prev) => [...prev, removed]);
      }
    } else {
      let error = null;
      try {
        const res = await fetch(`${hostUrl}/add-admin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify({ id: id }),
        });
        if (!res.ok) {
          const data = await res.json();
          error = { message: data?.error || "Failed to add admin" };
        }
      } catch (err) {
        error = { message: err.message };
      }

      if (!error) {
        setAdminIds((prev) => new Set(prev).add(id));

        const promoted = nonAdmins.find((u) => u.id === id);
        setNonAdmins((prev) => prev.filter((u) => u.id !== id));
        setAdmins((prev) => [...prev, promoted]);
      }
    }
  };

  const handleReject = async (userId) => {
    const id = String(userId).trim();

    let error = null;
    try {
      const res = await fetch(`${hostUrl}/reject-user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({ id: id }),
      });
      if (!res.ok) {
        const data = await res.json();
        error = { message: data?.error || "Failed to reject user" };
      }
    } catch (err) {
      error = { message: err.message };
    }

    if (error) {
      console.error("Failed to reject user:", error.message);
      return;
    }

    const rejected = nonAdmins.find((u) => u.id === id);
    setNonAdmins((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <main
      className={`max-w-7xl mx-auto px-6 py-10 transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <header className="mb-10">
        <h1
          className={`text-4xl font-bold mb-2 ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Admin Manager
        </h1>
        <p
          className={`${darkMode ? "text-gray-400" : "text-gray-600"} text-sm`}
        >
          Manage administrator privileges. Promote or demote users with a single
          click.
        </p>
      </header>

      {loading && (
        <p className={`${darkMode ? "text-gray-300" : "text-gray-500"}`}>
          Loading users...
        </p>
      )}

      {!loading && admins.length + nonAdmins.length === 0 && (
        <p
          className={`${
            darkMode ? "text-gray-500" : "text-gray-600"
          } text-center text-sm`}
        >
          No users found.
        </p>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <section aria-labelledby="admin-heading">
            <h2
              id="admin-heading"
              className={`text-xl font-semibold border-b pb-2 mb-4 sticky top-0 z-10 ${
                darkMode
                  ? "text-white border-gray-700 bg-gray-900"
                  : "text-gray-900 border-gray-300 bg-gray-100"
              }`}
            >
              Administrators
            </h2>
            <div className="space-y-4">
              {admins.map((user) => (
                <AdminUserCard
                  key={user.id}
                  name={user.name}
                  email={user.email}
                  isAdmin={true}
                  onToggle={() => toggleAdmin(user.id)}
                />
              ))}
              {admins.length === 0 && (
                <p
                  className={`${
                    darkMode ? "text-gray-500" : "text-gray-600"
                  } text-sm`}
                >
                  No administrators yet.
                </p>
              )}
            </div>
          </section>

          <section aria-labelledby="non-admin-heading">
            <h2
              id="non-admin-heading"
              className={`text-xl font-semibold border-b pb-2 mb-4 sticky top-0 z-10 ${
                darkMode
                  ? "text-white border-gray-700 bg-gray-900"
                  : "text-gray-900 border-gray-300 bg-gray-100"
              }`}
            >
              Standard Users
            </h2>
            <div className="space-y-4">
              {nonAdmins.map((user) => (
                <AdminUserCard
                  key={user.id}
                  name={user.name}
                  email={user.email}
                  isAdmin={false}
                  onToggle={() => toggleAdmin(user.id)}
                  onReject={() => handleReject(user.id)}
                  motivation={user.motivation}
                />
              ))}
              {nonAdmins.length === 0 && (
                <p
                  className={`${
                    darkMode ? "text-gray-500" : "text-gray-600"
                  } text-sm`}
                >
                  No standard users found.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default AdminManager;
