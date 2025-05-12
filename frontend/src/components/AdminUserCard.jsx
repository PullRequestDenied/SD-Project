import React from 'react';

export default function AdminUserCard({ name, email, isAdmin, onToggle }) {
  return (
    <div className="p-4 border rounded bg-gray-800 text-white shadow-md space-y-1">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-lg font-semibold">{name}</div>
          <div className="text-sm text-gray-300">{email}</div>
          {isAdmin && (
            <span className="text-xs text-green-400 font-medium">✔ Admin</span>
          )}
        </div>
        <button
          className={`px-3 py-1 rounded ${
            isAdmin ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          }`}
          onClick={onToggle}
        >
          {isAdmin ? 'Remove Admin' : 'Make Admin'}
        </button>
      </div>
    </div>
  );
}
