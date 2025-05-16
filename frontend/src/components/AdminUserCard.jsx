import React from 'react';

export default function AdminUserCard({ name, email, isAdmin, onToggle, onReject }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-lg font-medium text-white">{name}</div>
          <div className="text-sm text-gray-400">{email}</div>
          {isAdmin && (
            <span className="inline-block mt-1 text-xs font-medium text-green-300 bg-green-700 bg-opacity-20 px-2 py-0.5 rounded">
              Admin
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggle}
            className={`text-sm px-4 py-2 rounded-md font-medium transition duration-150 ${
              isAdmin
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isAdmin ? 'Remove' : 'Make Admin'}
          </button>
          {!isAdmin && (
            <button
              onClick={onReject}
              className="text-sm px-4 py-2 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white font-medium transition duration-150"
            >
              Reject
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
