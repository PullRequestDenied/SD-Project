import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import AdminUserCard from './AdminUserCard';

const AdminManager = () => {
  const [admins, setAdmins] = useState([]);
  const [nonAdmins, setNonAdmins] = useState([]);
  const [adminIds, setAdminIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // const fetchUsersAndAdmins = async () => {
    //   setLoading(true);

    //   // Fetch all authenticated users
    //   const { data: userResponse, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    //   if (userError) {
    //     console.error('Error fetching users:', userError.message);
    //     setLoading(false);
    //     return;
    //   }
    //   const authUsers = userResponse?.users || [];

    //   // Fetch user_roles to identify admins
    //   const { data: roleData, error: roleError } = await supabaseAdmin.from('user_roles').select('*');
    //   if (roleError) {
    //     console.error('Error fetching user_roles:', roleError.message);
    //     setLoading(false);
    //     return;
    //   }

    //   // Build admin ID set
    //   const adminSet = new Set(
    //     (roleData || [])
    //       .filter((r) => r.role === 'admin')
    //       .map((r) => String(r.user_id).trim())
    //   );
    //   setAdminIds(adminSet);

    //   // Separate users into admin and non-admin lists
    //   const adminsList = [];
    //   const nonAdminsList = [];

    //   authUsers.forEach((user) => {
    //     const id = String(user.id).trim();
    //     const userObj = {
    //       id,
    //       name: user.user_metadata?.display_name || 'Unnamed User',
    //       email: user.email || 'No email',
    //       isAdmin: adminSet.has(id),
    //     };

    //     userObj.isAdmin ? adminsList.push(userObj) : nonAdminsList.push(userObj);
    //   });

    //   setAdmins(adminsList);
    //   setNonAdmins(nonAdminsList);
    //   setLoading(false);
    // };

    const fetchUsersAndAdmins = async () => {
      setLoading(true);

      // Fetch all authenticated users
      const { data: userResponse, error: userError } = await supabase.from('applications').select('*');
      if (userError) {
        console.error('Error fetching users:', userError.message);
        setLoading(false);
        return;
      }

      // Build admin ID set
      const applicationUsers = (userResponse || [])
      .filter((r) => r.is_denied === false || r.is_denied === null)
      .map((r) => ({
        user_id: String(r.user_id).trim(),
        user_name: r.user_name || 'Unnamed User',
      }));

      // Fetch user_roles to identify admins
      const { data: roleData, error: roleError } = await supabase.from('user_roles').select('*');
      if (roleError) {
        console.error('Error fetching user_roles:', roleError.message);
        setLoading(false);
        return;
      }

      // Build admin ID set
      const adminSet = new Set(
        (roleData || [])
          .filter((r) => r.role === 'admin')
          .map((r) => String(r.user_id).trim())
      );
      setAdminIds(adminSet);

      // Separate users into admin and non-admin lists
      const adminsList = [];
      const nonAdminsList = [];

      applicationUsers.forEach((user) => {
        const id = String(user.user_id).trim();
        const userObj = {
          id,
          name: user.user_name || 'Unnamed User',
          // email: user.email || 'No email',
          isAdmin: adminSet.has(id),
        };

        userObj.isAdmin ? adminsList.push(userObj) : nonAdminsList.push(userObj);
      });

      setAdmins(adminsList);
      setNonAdmins(nonAdminsList);
      setLoading(false);
    }

    fetchUsersAndAdmins();
  }, []);

  const toggleAdmin = async (userId) => {
    const id = String(userId).trim();
    const isCurrentlyAdmin = adminIds.has(id);

    if (isCurrentlyAdmin) {
      // Remove admin
      const { error: userError } = await supabase.from('applications')
              .update({ is_accepted: false })
              .eq('user_id', id);

      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', id)
        .eq('role', 'admin');

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
      // Add admin
      const { error: userError } = await supabase.from('applications')
              .update({ is_accepted: true })
              .eq('user_id', id);

      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: id, role: 'admin' });

      if (!error) {
        setAdminIds((prev) => new Set(prev).add(id));

        const promoted = nonAdmins.find((u) => u.id === id);
        setNonAdmins((prev) => prev.filter((u) => u.id !== id));
        setAdmins((prev) => [...prev, promoted]);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Page Header */}
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">Admin Manager</h1>
        <p className="text-gray-400 text-sm">
          Manage administrator privileges. Promote or demote users with a single click.
        </p>
      </header>

      {/* Loading */}
      {loading && <div className="text-gray-300">Loading users...</div>}

      {/* No users fallback */}
      {!loading && admins.length + nonAdmins.length === 0 && (
        <div className="text-gray-500 text-center text-sm">No users found.</div>
      )}

      {/* User Lists */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Admins */}
          <section>
            <h2 className="text-xl font-semibold text-white border-b border-gray-700 pb-2 mb-4 sticky top-0 bg-gray-900 z-10">
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
                <p className="text-sm text-gray-500">No administrators yet.</p>
              )}
            </div>
          </section>

          {/* Non-admins */}
          <section>
            <h2 className="text-xl font-semibold text-white border-b border-gray-700 pb-2 mb-4 sticky top-0 bg-gray-900 z-10">
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
                />
              ))}
              {nonAdmins.length === 0 && (
                <p className="text-sm text-gray-500">No standard users found.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminManager;
