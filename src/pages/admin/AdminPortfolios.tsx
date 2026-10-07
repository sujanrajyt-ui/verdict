import React, { useState } from 'react';
import { Portfolio, Committee, FullRegistrationDetail } from '../../types';
import { dataService } from '../../services/dataService';
import { 
  Briefcase, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Check, 
  Users, 
  Layers
} from 'lucide-react';

interface AdminPortfoliosProps {
  portfolios: Portfolio[];
  committees: Committee[];
  registrations: FullRegistrationDetail[];
  onRefresh: () => void;
}

export const AdminPortfolios: React.FC<AdminPortfoliosProps> = ({
  portfolios,
  committees,
  registrations,
  onRefresh,
}) => {
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string>(
    committees[0]?.id || ''
  );

  const [editingPort, setEditingPort] = useState<Portfolio | null>(null);
  const [showAddPort, setShowAddPort] = useState(false);
  const [newPortData, setNewPortData] = useState<{
    name: string;
    shortDescription: string;
    description: string;
    capacity: number;
  }>({
    name: '',
    shortDescription: '',
    description: '',
    capacity: 10,
  });

  const activeCommittee = committees.find((c) => c.id === selectedCommitteeId) || committees[0];
  const committeePortfolios = portfolios.filter(
    (p) => p.committee_id === selectedCommitteeId
  );

  const handleSavePort = async () => {
    if (!editingPort) return;
    try {
      await dataService.updatePortfolio(editingPort);
      setEditingPort(null);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePort = async () => {
    try {
      await dataService.createPortfolio({
        committee_id: selectedCommitteeId,
        name: newPortData.name,
        short_description: newPortData.shortDescription,
        description: newPortData.description,
        capacity: Number(newPortData.capacity),
        is_active: true,
        display_order: committeePortfolios.length + 1,
      });
      setShowAddPort(false);
      setNewPortData({ name: '', shortDescription: '', description: '', capacity: 10 });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleActive = async (p: Portfolio) => {
    try {
      await dataService.updatePortfolio({
        id: p.id,
        is_active: !p.is_active,
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-cinzel text-2xl font-extrabold text-white uppercase tracking-wider">
            PORTFOLIO ROSTER MANAGEMENT
          </h2>
          <p className="font-mono-code text-xs text-zinc-400 mt-0.5">
            Configure roles, quota limits, and capacity balance per arena.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddPort(true)}
          className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-mono-code text-xs font-bold uppercase tracking-wider flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Portfolio</span>
        </button>
      </div>

      {/* Committee Selector Pill */}
      <div className="flex rounded-lg bg-zinc-950 p-1 border border-white/10 font-mono-code text-xs overflow-x-auto">
        {committees.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedCommitteeId(c.id)}
            className={`px-4 py-2 rounded-md uppercase whitespace-nowrap transition-colors ${
              selectedCommitteeId === c.id
                ? 'bg-red-950 text-white font-bold border border-red-700/80'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Table of Portfolios */}
      <div className="rounded-xl border border-white/10 bg-zinc-950/80 overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-xs font-mono-code">
          <thead className="border-b border-white/10 bg-black/40 text-zinc-500 uppercase">
            <tr>
              <th className="py-3 px-4">ROLE NAME</th>
              <th className="py-3 px-4">DESIGNATION</th>
              <th className="py-3 px-4">CAPACITY</th>
              <th className="py-3 px-4">ASSIGNED</th>
              <th className="py-3 px-4">REMAINING</th>
              <th className="py-3 px-4">STATUS</th>
              <th className="py-3 px-4 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06] text-zinc-300">
            {committeePortfolios.map((port) => {
              const assignedCount = registrations.filter(
                (r) => r.assignment?.portfolio_id === port.id
              ).length;
              const remaining = Math.max(0, port.capacity - assignedCount);

              return (
                <tr key={port.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-bold text-white font-cinzel text-sm">
                    {port.name}
                  </td>

                  <td className="py-3 px-4 text-zinc-400">
                    {port.short_description}
                  </td>

                  <td className="py-3 px-4 font-bold text-white">
                    {port.capacity}
                  </td>

                  <td className="py-3 px-4 font-bold text-sky-400">
                    {assignedCount}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`font-bold ${
                        remaining === 0 ? 'text-red-500' : 'text-emerald-400'
                      }`}
                    >
                      {remaining}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(port)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        port.is_active
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-zinc-900 text-zinc-500 border border-zinc-700'
                      }`}
                    >
                      {port.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setEditingPort(port)}
                      className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white"
                    >
                      Configure
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* EDIT PORTFOLIO MODAL */}
      {editingPort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-zinc-950 p-6 space-y-4 text-left">
            <h3 className="font-cinzel text-lg font-bold text-white uppercase">
              EDIT ROLE: {editingPort.name}
            </h3>

            <div className="space-y-3 text-xs font-mono-code">
              <div>
                <label className="block text-zinc-400 uppercase mb-1">Role Name</label>
                <input
                  type="text"
                  value={editingPort.name}
                  onChange={(e) => setEditingPort({ ...editingPort, name: e.target.value })}
                  className="w-full bg-black/70 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase mb-1">Short Description</label>
                <input
                  type="text"
                  value={editingPort.short_description}
                  onChange={(e) =>
                    setEditingPort({ ...editingPort, short_description: e.target.value })
                  }
                  className="w-full bg-black/70 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase mb-1">Full Mandate Description</label>
                <textarea
                  rows={3}
                  value={editingPort.description}
                  onChange={(e) =>
                    setEditingPort({ ...editingPort, description: e.target.value })
                  }
                  className="w-full bg-black/70 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase mb-1">Capacity Quota</label>
                <input
                  type="number"
                  value={editingPort.capacity}
                  onChange={(e) =>
                    setEditingPort({ ...editingPort, capacity: Number(e.target.value) })
                  }
                  className="w-full bg-black/70 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingPort(null)}
                className="px-4 py-2 rounded border border-white/10 text-xs font-mono-code text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePort}
                className="px-6 py-2 rounded bg-red-700 hover:bg-red-600 text-white text-xs font-mono-code font-bold uppercase"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PORTFOLIO MODAL */}
      {showAddPort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-zinc-950 p-6 space-y-4 text-left">
            <h3 className="font-cinzel text-lg font-bold text-white uppercase">
              ADD NEW PORTFOLIO TO {activeCommittee.name}
            </h3>

            <div className="space-y-3 text-xs font-mono-code">
              <div>
                <label className="block text-zinc-400 uppercase mb-1">Role Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chief Production Mogul"
                  value={newPortData.name}
                  onChange={(e) => setNewPortData({ ...newPortData, name: e.target.value })}
                  className="w-full bg-black/70 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase mb-1">Short Description</label>
                <input
                  type="text"
                  placeholder="e.g. Executive Studio Lead"
                  value={newPortData.shortDescription}
                  onChange={(e) =>
                    setNewPortData({ ...newPortData, shortDescription: e.target.value })
                  }
                  className="w-full bg-black/70 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Detailed portfolio description..."
                  value={newPortData.description}
                  onChange={(e) =>
                    setNewPortData({ ...newPortData, description: e.target.value })
                  }
                  className="w-full bg-black/70 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase mb-1">Capacity Quota</label>
                <input
                  type="number"
                  value={newPortData.capacity}
                  onChange={(e) =>
                    setNewPortData({ ...newPortData, capacity: Number(e.target.value) })
                  }
                  className="w-full bg-black/70 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddPort(false)}
                className="px-4 py-2 rounded border border-white/10 text-xs font-mono-code text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePort}
                className="px-6 py-2 rounded bg-red-700 hover:bg-red-600 text-white text-xs font-mono-code font-bold uppercase"
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
