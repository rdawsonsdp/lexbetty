'use client';

import { useState } from 'react';
import QuadrantBadge from './QuadrantBadge';
import type { Recommendation, RecommendationType } from '@/lib/menu-engineering';

export type RecommendationStatus = 'pending' | 'accepted' | 'rejected' | 'modified';

interface RecommendationCardProps {
  recommendation: Recommendation;
  status: RecommendationStatus;
  modifyNote: string;
  onAccept: () => void;
  onReject: () => void;
  onModify: (note: string) => void;
  onUndo: () => void;
}

function TypeBadge({ type }: { type: RecommendationType }) {
  const config: Record<RecommendationType, { bg: string; text: string; label: string }> = {
    feature: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Feature' },
    reprice: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Reprice' },
    promote: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Promote' },
    remove: { bg: 'bg-red-100', text: 'text-red-800', label: 'Remove' },
    seasonal: { bg: 'bg-teal-100', text: 'text-teal-800', label: 'Seasonal' },
    bundle: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Bundle' },
  };

  const c = config[type];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function PriorityIndicator({ priority }: { priority: string }) {
  const dots = priority === 'high' ? 3 : priority === 'medium' ? 2 : 1;
  return (
    <span className="inline-flex items-center gap-0.5" title={`${priority} priority`}>
      {[...Array(3)].map((_, i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i < dots
              ? priority === 'high'
                ? 'bg-red-500'
                : priority === 'medium'
                ? 'bg-yellow-500'
                : 'bg-gray-400'
              : 'bg-gray-200'
          }`}
        />
      ))}
    </span>
  );
}

export default function RecommendationCard({
  recommendation,
  status,
  modifyNote,
  onAccept,
  onReject,
  onModify,
  onUndo,
}: RecommendationCardProps) {
  const [showModifyInput, setShowModifyInput] = useState(false);
  const [noteText, setNoteText] = useState(modifyNote);

  const borderColor =
    status === 'accepted'
      ? 'border-green-400 bg-green-50/30'
      : status === 'rejected'
      ? 'border-gray-300 bg-gray-50/50'
      : status === 'modified'
      ? 'border-blue-400 bg-blue-50/30'
      : 'border-gray-200 bg-white';

  return (
    <div
      className={`rounded-xl border-2 shadow-sm transition-all ${borderColor} ${
        status === 'rejected' ? 'opacity-60' : ''
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <TypeBadge type={recommendation.type} />
          <QuadrantBadge quadrant={recommendation.quadrant} />
          <PriorityIndicator priority={recommendation.priority} />
          {status !== 'pending' && (
            <span
              className={`ml-auto text-xs font-bold uppercase tracking-wide ${
                status === 'accepted'
                  ? 'text-green-600'
                  : status === 'rejected'
                  ? 'text-gray-500'
                  : 'text-blue-600'
              }`}
            >
              {status}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className={`font-oswald font-semibold text-[#383838] text-base sm:text-lg mb-1 ${
            status === 'rejected' ? 'line-through text-gray-400' : ''
          }`}
        >
          {recommendation.title}
        </h3>

        {/* Description */}
        <p className={`text-sm text-gray-600 mb-2 ${status === 'rejected' ? 'line-through text-gray-400' : ''}`}>
          {recommendation.description}
        </p>

        {/* Rationale */}
        <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3">
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-gray-600">Rationale:</span> {recommendation.rationale}
          </p>
        </div>

        {/* Impact */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-100 text-green-800 text-xs font-bold">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            {recommendation.impactLabel}
          </span>
        </div>

        {/* Modified note */}
        {status === 'modified' && modifyNote && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-3">
            <p className="text-xs text-blue-700">
              <span className="font-semibold">Your notes:</span> {modifyNote}
            </p>
          </div>
        )}

        {/* Modify Input */}
        {showModifyInput && status === 'pending' && (
          <div className="mb-3">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add your modifications or notes..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8621A] focus:border-transparent resize-none"
              rows={2}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  onModify(noteText);
                  setShowModifyInput(false);
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                Save Modifications
              </button>
              <button
                onClick={() => setShowModifyInput(false)}
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {status === 'pending' && !showModifyInput && (
          <div className="flex gap-2">
            <button
              onClick={onAccept}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Accept
            </button>
            <button
              onClick={onReject}
              className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </button>
            <button
              onClick={() => setShowModifyInput(true)}
              className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors flex items-center justify-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modify
            </button>
          </div>
        )}

        {/* Undo */}
        {status !== 'pending' && (
          <button
            onClick={onUndo}
            className="text-xs text-gray-500 hover:text-[#383838] transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Undo
          </button>
        )}
      </div>
    </div>
  );
}
