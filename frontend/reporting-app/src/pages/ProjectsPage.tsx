import React, { useState } from 'react';
import { useReports } from '../context/ReportContext';
import { useAuth } from '../context/AuthContext';
import type { ProjectCategory } from '../types';
import { Modal } from '../components/common/Modal';
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  Users,
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { projects, addProject, updateProject, deleteProject, reports } = useReports();
  const { users, currentUser } = useAuth();

  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'admin';

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Completed' | 'On Hold'>('Active');
  const [color, setColor] = useState('#3b82f6');
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>([]);
  const [formError, setFormError] = useState('');

  const openCreateModal = () => {
    setEditingProjectId(null);
    setName('');
    setCode('');
    setDescription('');
    setStatus('Active');
    setColor('#3b82f6');
    setAssignedMemberIds([]);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: ProjectCategory) => {
    setEditingProjectId(p.id);
    setName(p.name);
    setCode(p.code);
    setDescription(p.description);
    setStatus(p.status);
    setColor(p.color);
    setAssignedMemberIds(p.assignedMemberIds || []);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setFormError('Project Name and Code are required.');
      return;
    }

    if (editingProjectId) {
      updateProject(editingProjectId, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        status,
        color,
        assignedMemberIds,
      });
    } else {
      addProject({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        status,
        color,
        assignedMemberIds,
      });
    }
    setIsModalOpen(false);
  };

  const toggleMemberAssignment = (memberId: string) => {
    setAssignedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const teamMembers = users.filter((u) => u.role === 'team_member');

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900">Projects & Categories</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage work classifications attached to weekly report entries (Section 5 & 7 requirement)
          </p>
        </div>

        {isManager && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Project / Category</span>
          </button>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((project) => {
          // Calculate usage stats
          const linkedReportsCount = reports.filter((r) => r.projectId === project.id).length;
          const assignedMembers = users.filter((u) => project.assignedMemberIds?.includes(u.id));

          return (
            <div
              key={project.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{project.name}</h3>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Code: {project.code}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      project.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : project.status === 'On Hold'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {project.description || 'No description provided.'}
                </p>

                {/* Assigned Members */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>Assigned Contributors ({assignedMembers.length})</span>
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {assignedMembers.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">Open to all team members</span>
                    ) : (
                      assignedMembers.map((m) => (
                        <span
                          key={m.id}
                          className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                        >
                          {m.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{linkedReportsCount} weekly report(s)</span>

                {isManager && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(project)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Edit project"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProject(project.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProjectId ? 'Edit Project / Category' : 'Create New Project / Category'}
        subtitle="Manage work streams and team member assignments"
        maxWidth="md"
      >
        <form onSubmit={handleSaveProject} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Project / Category Name</label>
            <input
              type="text"
              placeholder="e.g. Client A Portal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Project Tag Code</label>
              <input
                type="text"
                placeholder="e.g. CLT-A"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 uppercase font-mono focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Active' | 'Completed' | 'On Hold')}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
              >
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Description</label>
            <textarea
              rows={2}
              placeholder="Summary of project goals and objectives..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Color tag picker */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Category Badge Color</label>
            <div className="flex items-center gap-2">
              {['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'opacity-80'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Member Assignment checkboxes */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-xs font-medium text-slate-700 flex items-center justify-between">
              <span>Assign Team Members</span>
              <span className="text-[10px] text-slate-400 font-normal">Optional</span>
            </label>
            <div className="space-y-1 max-h-36 overflow-y-auto p-1">
              {teamMembers.map((member) => {
                const isAssigned = assignedMemberIds.includes(member.id);
                return (
                  <label
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-lg border border-slate-200 text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={() => toggleMemberAssignment(member.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-slate-800">{member.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{member.title}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {formError && <p className="text-xs text-rose-600 font-medium">{formError}</p>}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              {editingProjectId ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
