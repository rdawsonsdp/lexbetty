'use client';

import { useState, useMemo } from 'react';
import ProgressBar from '@/components/ui/ProgressBar';
import RecommendationCard, { type RecommendationStatus } from './RecommendationCard';
import type { Recommendation } from '@/lib/menu-engineering';
import { saveMenuConfig, clearMenuConfig, type MenuConfig } from '@/lib/menu-config';

interface RecommendedUpdatesProps {
  recommendations: Recommendation[];
}

interface RecState {
  status: RecommendationStatus;
  modifyNote: string;
}

export default function RecommendedUpdates({ recommendations }: RecommendedUpdatesProps) {
  const [states, setStates] = useState<Record<string, RecState>>(() => {
    const initial: Record<string, RecState> = {};
    for (const rec of recommendations) {
      initial[rec.id] = { status: 'pending', modifyNote: '' };
    }
    return initial;
  });

  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [appliedAt, setAppliedAt] = useState<string | null>(null);

  const updateState = (id: string, update: Partial<RecState>) => {
    setStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...update },
    }));
  };

  const reviewed = Object.values(states).filter((s) => s.status !== 'pending').length;
  const total = recommendations.length;
  const accepted = Object.values(states).filter((s) => s.status === 'accepted').length;
  const rejected = Object.values(states).filter((s) => s.status === 'rejected').length;
  const modified = Object.values(states).filter((s) => s.status === 'modified').length;

  const filteredRecs = useMemo(() => {
    return recommendations.filter((rec) => {
      const state = states[rec.id];
      if (filterPriority !== 'all' && rec.priority !== filterPriority) return false;
      if (filterStatus !== 'all' && state?.status !== filterStatus) return false;
      return true;
    });
  }, [recommendations, states, filterPriority, filterStatus]);

  const handleAcceptAllHighPriority = () => {
    setStates((prev) => {
      const next = { ...prev };
      for (const rec of recommendations) {
        if (rec.priority === 'high' && next[rec.id].status === 'pending') {
          next[rec.id] = { ...next[rec.id], status: 'accepted' };
        }
      }
      return next;
    });
  };

  const totalImpact = recommendations
    .filter((r) => states[r.id]?.status === 'accepted' || states[r.id]?.status === 'modified')
    .reduce((sum, r) => sum + r.impactAmount, 0);

  // Accepted / modified recs that will be applied
  const actionableRecs = recommendations.filter(
    (r) => states[r.id]?.status === 'accepted' || states[r.id]?.status === 'modified',
  );

  const featureRecs = actionableRecs.filter((r) => r.type === 'feature');
  const promoteRecs = actionableRecs.filter((r) => r.type === 'promote');
  const removeRecs = actionableRecs.filter((r) => r.type === 'remove');
  const seasonalRecs = actionableRecs.filter((r) => r.type === 'seasonal');
  const bundleRecs = actionableRecs.filter((r) => r.type === 'bundle');
  const repriceRecs = actionableRecs.filter((r) => r.type === 'reprice');

  const handleApplyToMenu = () => {
    const config: MenuConfig = {
      featuredProductIds: featureRecs.flatMap((r) => r.productIds),
      chefsPickIds: promoteRecs.flatMap((r) => r.productIds),
      removedItemIds: removeRecs.flatMap((r) => r.productIds),
      seasonalItemIds: seasonalRecs.flatMap((r) => r.productIds),
      bundles: bundleRecs.map((r) => ({
        name: r.title,
        productIds: r.productIds,
      })),
      appliedRecommendationIds: actionableRecs.map((r) => r.id),
      appliedAt: new Date().toISOString(),
    };
    saveMenuConfig(config);
    setAppliedAt(config.appliedAt);
  };

  const handleResetMenu = () => {
    clearMenuConfig();
    setAppliedAt(null);
  };

  return (
    <section className="mb-8">
      <h2 className="text-xl sm:text-2xl font-oswald font-semibold text-[#363333] mb-4">
        Recommended Updates
      </h2>

      {/* Progress & Summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <span className="text-sm text-gray-600">
              <span className="font-bold text-[#363333]">{reviewed}</span> of{' '}
              <span className="font-bold text-[#363333]">{total}</span> recommendations reviewed
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {accepted} Accepted
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              {rejected} Rejected
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {modified} Modified
            </span>
          </div>
        </div>

        <ProgressBar
          value={reviewed}
          max={total}
          showPercentage
          variant={reviewed === total ? 'success' : 'default'}
        />

        {/* Impact Summary */}
        {totalImpact > 0 && (
          <div className="mt-3 flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-sm text-green-800">
              Estimated monthly impact from accepted changes:{' '}
              <span className="font-bold">
                +${totalImpact >= 1000 ? `${(totalImpact / 1000).toFixed(1)}K` : totalImpact.toLocaleString()}
              </span>
              /month
            </span>
          </div>
        )}
      </div>

      {/* Filters & Batch Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#dabb64]"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#dabb64]"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="modified">Modified</option>
          </select>
        </div>

        <button
          onClick={handleAcceptAllHighPriority}
          className="px-4 py-2 bg-[#363333] text-white rounded-lg text-sm font-semibold hover:bg-[#4a4747] transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Accept All High Priority
        </button>
      </div>

      {/* Recommendation Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredRecs.map((rec) => (
          <RecommendationCard
            key={rec.id}
            recommendation={rec}
            status={states[rec.id]?.status || 'pending'}
            modifyNote={states[rec.id]?.modifyNote || ''}
            onAccept={() => updateState(rec.id, { status: 'accepted' })}
            onReject={() => updateState(rec.id, { status: 'rejected' })}
            onModify={(note) => updateState(rec.id, { status: 'modified', modifyNote: note })}
            onUndo={() => updateState(rec.id, { status: 'pending', modifyNote: '' })}
          />
        ))}
      </div>

      {filteredRecs.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No recommendations match your filters.
        </div>
      )}

      {/* Implement Changes Panel */}
      {actionableRecs.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border-2 border-[#dabb64] shadow-sm p-4 sm:p-6">
          <h3 className="font-oswald text-lg font-semibold text-[#363333] mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#dabb64]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Implement Changes
          </h3>

          {/* Categorized Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {featureRecs.length > 0 && (
              <div className="bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                <span className="text-xs font-bold text-amber-800 uppercase">Featured Items</span>
                <p className="text-xs text-amber-700 mt-0.5">
                  {featureRecs.flatMap((r) => r.productIds).length} products will be featured
                </p>
              </div>
            )}
            {promoteRecs.length > 0 && (
              <div className="bg-purple-50 rounded-lg px-3 py-2 border border-purple-200">
                <span className="text-xs font-bold text-purple-800 uppercase">Chef&apos;s Picks</span>
                <p className="text-xs text-purple-700 mt-0.5">
                  {promoteRecs.flatMap((r) => r.productIds).length} products added to Chef&apos;s Picks
                </p>
              </div>
            )}
            {removeRecs.length > 0 && (
              <div className="bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                <span className="text-xs font-bold text-red-800 uppercase">Removed Items</span>
                <p className="text-xs text-red-700 mt-0.5">
                  {removeRecs.flatMap((r) => r.productIds).length} products will be hidden
                </p>
              </div>
            )}
            {seasonalRecs.length > 0 && (
              <div className="bg-teal-50 rounded-lg px-3 py-2 border border-teal-200">
                <span className="text-xs font-bold text-teal-800 uppercase">Seasonal Items</span>
                <p className="text-xs text-teal-700 mt-0.5">
                  {seasonalRecs.flatMap((r) => r.productIds).length} products marked as limited-time
                </p>
              </div>
            )}
            {bundleRecs.length > 0 && (
              <div className="bg-indigo-50 rounded-lg px-3 py-2 border border-indigo-200">
                <span className="text-xs font-bold text-indigo-800 uppercase">Bundles</span>
                <p className="text-xs text-indigo-700 mt-0.5">
                  {bundleRecs.length} bundle{bundleRecs.length > 1 ? 's' : ''} will be created
                </p>
              </div>
            )}
            {repriceRecs.length > 0 && (
              <div className="bg-blue-50 rounded-lg px-3 py-2 border border-blue-200">
                <span className="text-xs font-bold text-blue-800 uppercase">Repricing</span>
                <p className="text-xs text-blue-700 mt-0.5">
                  {repriceRecs.length} price change{repriceRecs.length > 1 ? 's' : ''} tracked (applied manually)
                </p>
              </div>
            )}
          </div>

          {/* Actions / Success */}
          {appliedAt ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-green-50 rounded-lg px-4 py-3 border border-green-200">
              <div className="flex items-center gap-2 flex-1">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-green-800">
                  Changes applied{' '}
                  <span className="font-semibold">
                    {new Date(appliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetMenu}
                  className="px-4 py-2 bg-white text-gray-600 rounded-lg text-sm font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Reset Menu
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleApplyToMenu}
              className="w-full sm:w-auto px-6 py-3 bg-[#dabb64] text-[#363333] rounded-lg font-oswald font-bold text-base hover:bg-[#c5a855] transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Apply to Menu
            </button>
          )}
        </div>
      )}
    </section>
  );
}
