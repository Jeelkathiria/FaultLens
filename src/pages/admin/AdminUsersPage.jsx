import React, { useState } from 'react';
import { useFaultLens } from '../../context/FaultLensContext';
import { Search, UserCheck, ShieldAlert, Eye, Ban, CheckCircle } from 'lucide-react';

export const AdminUsersPage = () => {
  const { users, toggleUserStatus } = useFaultLens();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role.toLowerCase() !== roleFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = u.name.toLowerCase().includes(q);
      const matchesEmail = u.email.toLowerCase().includes(q);
      if (!matchesName && !matchesEmail) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Platform Users</h1>
          <p className="text-xs text-slate-400 mt-1">Manage user access, security roles, and active tenant workspaces.</p>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Total Users: <span className="text-slate-100 font-bold">{users.length}</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#0F141D] border border-[#1E2633]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#080B12] border border-[#1E2633] text-xs text-slate-100 placeholder:text-slate-500 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="inline-flex items-center p-0.5 rounded-lg bg-[#080B12] border border-[#1E2633]">
          {['ALL', 'Developer', 'Admin'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                roleFilter === role ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-[#1E2633] bg-[#0F141D] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F17] text-slate-400 uppercase tracking-wider border-b border-[#1E2633] font-mono">
              <tr>
                <th className="py-3.5 px-5">User</th>
                <th className="py-3.5 px-5">Role</th>
                <th className="py-3.5 px-5">Websites</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Last Active</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2633]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center font-mono text-xs text-slate-500">
                    N/A - No platform users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isActive = user.status === 'Active';

                  return (
                    <tr key={user.id} className="hover:bg-[#141B26] transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-full border border-[#1E2633] object-cover"
                        />
                        <div>
                          <div className="font-semibold text-slate-100">{user.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-5">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {user.role}
                      </span>
                    </td>

                    <td className="py-3 px-5 font-mono text-slate-200 font-semibold">
                      {user.websitesCount} websites
                    </td>

                    <td className="py-3 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span>{user.status}</span>
                      </span>
                    </td>

                    <td className="py-3 px-5 text-slate-400 font-mono">
                      {user.lastActive}
                    </td>

                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                            isActive
                              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/30'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {isActive ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          <span>{isActive ? 'Disable' : 'Enable'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
