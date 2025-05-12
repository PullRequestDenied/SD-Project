import React, { useEffect, useState } from 'react';
import { supabaseAdmin } from '../supabaseClient';
import AdminUserCard from './AdminUserCard';

const AdminManager = () => {
  const [users, setUsers] = useState([]);
  const [adminIds, setAdminIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsersAndAdmins = async () => {
      setLoading(true);
      console.log('🔍 Fetching users and roles...');

      // ✅ Step 1: Fetch all users
      const { data: userResponse, error: userError } = await supabaseAdmin.auth.admin.listUsers();
      if (userError) {
        console.error('❌ Error fetching users:', userError.message);
        setLoading(false);
        return;
      }

      const authUsers = userResponse?.users || [];
      console.log('✅ Auth Users:', authUsers);

      // ✅ Step 2: Fetch roles using supabaseAdmin to bypass RLS
      const { data: roleData, error: roleError } = await supabaseAdmin.from('user_roles').select('*');
      if (roleError) {
        console.error('❌ Error fetching user_roles:', roleError.message);
        setLoading(false);
        return;
      }

      console.log('✅ user_roles table:', roleData || []);

      // ✅ Step 3: Only include users with role === 'admin'
      const adminSet = new Set(
        (roleData || [])
          .filter(r => r.role === 'admin')
          .map(r => String(r.user_id).trim())
      );
      setAdminIds(adminSet);

      // ✅ Step 4: Merge users
      const allUsers = authUsers.map(user => {
        const id = String(user.id).trim();
        const isAdmin = adminSet.has(id);
        const name = user.user_metadata?.display_name || 'Unnamed User';
        const email = user.email || 'No email';

        return {
          id,
          name,
          email,
          isAdmin
        };
      });

      console.log('✅ Final user list with isAdmin flags:', allUsers);
      setUsers(allUsers);
      setLoading(false);
    };

    fetchUsersAndAdmins();
  }, []);

  const toggleAdmin = async (userId) => {
    const id = String(userId).trim();

    if (adminIds.has(id)) {
      const { error } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', id)
        .eq('role', 'admin');
      if (!error) {
        setAdminIds(prev => {
          const updated = new Set(prev);
          updated.delete(id);
          return updated;
        });
        setUsers(prev => prev.map(u => (u.id === id ? { ...u, isAdmin: false } : u)));
      }
    } else {
      const { error } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: id, role: 'admin' });
      if (!error) {
        setAdminIds(prev => new Set(prev).add(id));
        setUsers(prev => prev.map(u => (u.id === id ? { ...u, isAdmin: true } : u)));
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 space-y-4 px-4">
      <h1 className="text-3xl font-bold mb-6 text-white">Manage Admins</h1>
      {loading && <p className="text-white">Loading users...</p>}
      {!loading && users.length === 0 && <p className="text-white">No users found.</p>}
      {!loading && users.map(user => (
        <AdminUserCard
          key={user.id}
          name={user.name}
          email={user.email}
          isAdmin={user.isAdmin}
          onToggle={() => toggleAdmin(user.id)}
        />
      ))}
    </div>
  );
};

export default AdminManager;
