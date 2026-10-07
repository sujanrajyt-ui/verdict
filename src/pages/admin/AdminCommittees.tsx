import React, { useState } from 'react';
import { Committee, PricingRule } from '../../types';
import { dataService } from '../../services/dataService';
import { formatCurrency } from '../../utils/pricing';
import { 
  Layers, 
  Plus, 
  Edit, 
  Save, 
  X, 
  DollarSign, 
  Check, 
  ToggleLeft, 
  ToggleRight,
  ShieldCheck
} from 'lucide-react';

interface AdminCommitteesProps {
  committees: Committee[];
  pricingRules: PricingRule[];
  onRefresh: () => void;
}

export const AdminCommittees: React.FC<AdminCommitteesProps> = ({
  committees,
  pricingRules,
  onRefresh,
}) => {
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [newRuleData, setNewRuleData] = useState<{
    committeeId: string;
    category: 'ISE' | 'NON_ISE' | 'EXTERNAL' | 'SPECIAL';
    amount: number;
  }>({
    committeeId: committees[0]?.id || '',
    category: 'ISE',
    amount: 300,
  });

  const [showAddRule, setShowAddRule] = useState(false);

  const handleSaveCommittee = async () => {
    if (!editingCommittee) return;
    try {
      await dataService.updateCommittee(editingCommittee);
      setEditingCommittee(null);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveRule = async () => {
    if (!editingRule) return;
    try {
      await dataService.updatePricingRule(editingRule);
      setEditingRule(null);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateRule = async () => {
    try {
      await dataService.createPricingRule({
        committee_id: newRuleData.committeeId,
        category: newRuleData.category,
        amount: Number(newRuleData.amount),
        currency: 'INR',
        is_active: true,
      });
      setShowAddRule(false);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleRuleStatus = async (rule: PricingRule) => {
    try {
      await dataService.updatePricingRule({
        id: rule.id,
        is_active: !rule.is_active,
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-12 animate-fadeIn">
      {/* SECTION 1: COMMITTEES CONFIGURATION */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-cinzel text-2xl font-extrabold text-white uppercase tracking-wider">
              SIMULATION COMMITTEES
            </h2>
            <p className="font-mono-code text-xs text-zinc-400 mt-0.5">
              Battlegrounds, capacities, registration gates, and dates.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {committees.map((comm) => (
            <div
              key={comm.id}
              className="rounded-xl border border-white/10 bg-zinc-950/70 p-6 space-y-4 flex flex-col justify-between text-left"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-400 uppercase">
                    {comm.format}
                  </span>
                  <span
                    className={`text-[11px] font-mono-code font-bold ${
                      comm.is_open ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {comm.is_open ? 'OPEN' : 'CLOSED'}
                  </span>
                </div>

                <h3 className="font-cinzel text-lg font-bold text-white">{comm.name}</h3>
                <p className="text-xs font-mono-code text-zinc-400 italic mb-3">"{comm.hook}"</p>

                <div className="space-y-2 text-xs font-mono-code text-zinc-400 pt-2 border-t border-white/[0.06]">
                  <div className="flex justify-between">
                    <span>CAPACITY:</span>
                    <span className="text-white font-bold">{comm.capacity} DELEGATES</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATE:</span>
                    <span className="text-zinc-300">{comm.date_text}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VENUE:</span>
                    <span className="text-zinc-300">{comm.venue_text}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CAPACITY VISIBILITY:</span>
                    <span className="text-zinc-300">{comm.public_capacity_visibility ? 'PUBLIC' : 'HIDDEN'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingCommittee(comm)}
                  className="w-full py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-mono-code text-white uppercase flex items-center justify-center space-x-2 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Configure Committee</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: DEDICATED CATEGORY PRICING RULES (ISE vs NON-ISE) */}
      <div className="space-y-6 pt-6 border-t border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-cinzel text-2xl font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              <span>CATEGORY PRICING ENGINE</span>
            </h2>
            <p className="font-mono-code text-xs text-zinc-400 mt-0.5">
              Institutional pricing rules (ISE subsidized vs Non-ISE standard delegate fees).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddRule(true)}
            className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-mono-code text-xs font-bold uppercase tracking-wider flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Pricing Rule</span>
          </button>
        </div>

        {/* Pricing Rules Table */}
        <div className="rounded-xl border border-white/10 bg-zinc-950/80 overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-code">
            <thead className="border-b border-white/10 bg-black/40 text-zinc-500 uppercase">
              <tr>
                <th className="py-3 px-4">ARENA / COMMITTEE</th>
                <th className="py-3 px-4">PARTICIPANT CATEGORY</th>
                <th className="py-3 px-4">FEE (INR)</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-zinc-300">
              {pricingRules.map((rule) => {
                const comm = committees.find((c) => c.id === rule.committee_id);
                return (
                  <tr key={rule.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-bold text-white">
                      {comm?.name || rule.committee_id}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          rule.category === 'ISE'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {rule.category === 'ISE' ? 'ISE STUDENT' : 'NON-ISE / STANDARD'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-base font-bold text-white">
                      {formatCurrency(rule.amount)}
                    </td>

                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleRuleStatus(rule)}
                        className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          rule.is_active
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                            : 'bg-zinc-900 text-zinc-500 border border-zinc-700'
                        }`}
                      >
                        <span>{rule.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingRule(rule)}
                        className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white"
                      >
                        Edit Fee
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT COMMITTEE MODAL */}
      {editingCommittee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-zinc-950 p-6 space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-cinzel text-lg font-bold text-white uppercase">
                CONFIGURE: {editingCommittee.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCommittee(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono-code">
              <div>
                <label className="block text-zinc-400 uppercase mb-1">Hook</label>
                <input
                  type="text"
                  value={editingCommittee.hook}
                  onChange={(e) =>
                    setEditingCommittee({ ...editingCommittee, hook: e.target.value })
                  }
                  className="w-full bg-black/70 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase mb-1">Capacity</label>
                <input
                  type="number"
                  value={editingCommittee.capacity}
                  onChange={(e) =>
                    setEditingCommittee({ ...editingCommittee, capacity: Number(e.target.value) })
                  }
                  className="w-full bg-black/70 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <label className="flex items-center space-x-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCommittee.is_open}
                    onChange={(e) =>
                      setEditingCommittee({ ...editingCommittee, is_open: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-red-600 bg-black border-white/20"
                  />
                  <span>Registration Open</span>
                </label>

                <label className="flex items-center space-x-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCommittee.public_capacity_visibility}
                    onChange={(e) =>
                      setEditingCommittee({
                        ...editingCommittee,
                        public_capacity_visibility: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-red-600 bg-black border-white/20"
                  />
                  <span>Public Capacity Visibility</span>
                </label>
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingCommittee(null)}
                className="px-4 py-2 rounded border border-white/10 text-xs font-mono-code text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCommittee}
                className="px-6 py-2 rounded bg-red-700 hover:bg-red-600 text-white text-xs font-mono-code font-bold uppercase"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PRICING RULE MODAL */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-zinc-950 p-6 space-y-4 text-left">
            <h3 className="font-cinzel text-lg font-bold text-white uppercase">EDIT PRICING RULE</h3>

            <div className="space-y-3 text-xs font-mono-code">
              <div>
                <label className="block text-zinc-400 uppercase mb-1">Fee Amount (INR)</label>
                <input
                  type="number"
                  value={editingRule.amount}
                  onChange={(e) => setEditingRule({ ...editingRule, amount: Number(e.target.value) })}
                  className="w-full bg-black/70 border border-white/10 rounded px-3 py-2 text-white font-bold text-base"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 rounded border border-white/10 text-xs font-mono-code text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRule}
                className="px-6 py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-mono-code font-bold uppercase"
              >
                Update Fee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PRICING RULE MODAL */}
      {showAddRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-zinc-950 p-6 space-y-4 text-left">
            <h3 className="font-cinzel text-lg font-bold text-white uppercase">ADD NEW PRICING RULE</h3>

            <div className="space-y-3 text-xs font-mono-code">
              <div>
                <label className="block text-zinc-400 uppercase mb-1">Committee Arena</label>
                <select
                  value={newRuleData.committeeId}
                  onChange={(e) => setNewRuleData({ ...newRuleData, committeeId: e.target.value })}
                  className="w-full bg-black/70 border border-white/10 rounded px-3 py-2 text-white"
                >
                  {committees.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase mb-1">Category</label>
                <select
                  value={newRuleData.category}
                  onChange={(e) => setNewRuleData({ ...newRuleData, category: e.target.value as any })}
                  className="w-full bg-black/70 border border-white/10 rounded px-3 py-2 text-white"
                >
                  <option value="ISE">ISE Student (Subsidized)</option>
                  <option value="NON_ISE">Non-ISE / Standard Delegate</option>
                  <option value="EXTERNAL">External Institution</option>
                  <option value="SPECIAL">Special Delegate</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase mb-1">Fee Amount (INR)</label>
                <input
                  type="number"
                  value={newRuleData.amount}
                  onChange={(e) => setNewRuleData({ ...newRuleData, amount: Number(e.target.value) })}
                  className="w-full bg-black/70 border border-white/10 rounded px-3 py-2 text-white text-base font-bold"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddRule(false)}
                className="px-4 py-2 rounded border border-white/10 text-xs font-mono-code text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateRule}
                className="px-6 py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-mono-code font-bold uppercase"
              >
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
