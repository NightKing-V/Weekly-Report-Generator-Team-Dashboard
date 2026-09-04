import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';
import { Modal } from '../components/common/Modal';
import { formatDate } from '../utils/formatters';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Search,
} from 'lucide-react';

import { useFetch } from '../hooks/useFetch';

export const UserManagementPage: React.FC = () => {
  const { users, currentUser, updateUserRole, removeUser, addUser, fetchUsers } = useAuth();
  const { execute } = useFetch();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('team_member');
  const [newTitle, setNewTitle] = useState('Software Engineer');
  const [newDepartment, setNewDepartment] = useState('Engineering');
  const [errorMessage, setErrorMessage] = useState('');

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.title.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newName.trim() || !newEmail.trim()) {
      setErrorMessage('Name and Email are required.');
      return;
    }

    await execute(
      async () =>
        addUser({
          name: newName.trim(),
          email: newEmail.trim(),
          role: newRole,
          title: newTitle.trim(),
          department: newDepartment.trim(),
        }),
      {
        showSuccessSnackbar: true,
        successMessage: `User ${newName.trim()} invited and added successfully!`,
      }
    );

    setIsInviteModalOpen(false);
    setNewName('');
    setNewEmail('');
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await execute(
      async () => updateUserRole(userId, newRole),
      {
        showSuccessSnackbar: true,
        successMessage: `User role updated to ${newRole.toUpperCase()}.`,
      }
    );
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${userName}?`)) return;
    await execute(
      async () => removeUser(userId),
      {
        showSuccessSnackbar: true,
        successMessage: `User ${userName} has been removed.`,
      }
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900">User & Role Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Administer workspace team members, invite contributors, and configure role-based permissions (Section 1 & 7).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsInviteModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Invite / Add Member</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white"
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="manager">Managers ({users.filter((u) => u.role === 'manager').length})</option>
            <option value="team_member">
              Team Members ({users.filter((u) => u.role === 'team_member').length})
            </option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Department & Title</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 px-4">Role Assignment</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredUsers.map((user) => {
                const isSelf = currentUser?.id === user.id;

                return (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* User Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs text-indigo-700">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name || 'User'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            (user.name || user.email || 'U').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{user.name}</span>
                            {isSelf && (
                              <span className="text-[9px] font-bold uppercase bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block">{user.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Department & Title */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-900 block">{user.title}</span>
                      <span className="text-[11px] text-slate-500">{user.department}</span>
                    </td>

                    {/* Role Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          user.role === 'admin'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : user.role === 'manager'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        <Shield className="h-3 w-3" />
                        {user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Manager' : 'Team Member'}
                      </span>
                    </td>

                    {/* Role Assignment Dropdown */}
                    <td className="py-3.5 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="team_member">Team Member</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(user.id, user.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite / Add Team Member"
        subtitle="Add a new user with role-based permissions"
        maxWidth="md"
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Liam Foster"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Email Address</label>
            <input
              type="email"
              placeholder="liam.foster@team.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
            >
              <option value="team_member">Team Member (can submit weekly reports)</option>
              <option value="manager">Manager (can review reports and view dashboard)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Job Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Department</label>
              <input
                type="text"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
              />
            </div>
          </div>

          {errorMessage && <p className="text-xs text-rose-600 font-medium">{errorMessage}</p>}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              Add Member
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
