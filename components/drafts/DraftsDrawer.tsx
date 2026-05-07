'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDrafts, DraftRecord } from '@/context/DraftsContext';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/pricing';
import { calculateTotalCost } from '@/lib/pricing';

function timeAgo(iso: string): string {
  const ts = new Date(iso).getTime();
  if (!ts) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  const years = Math.floor(months / 12);
  return `${years} yr${years === 1 ? '' : 's'} ago`;
}

function draftItemCount(draft: DraftRecord): number {
  return draft.state?.catering?.selectedItems?.length ?? 0;
}

function draftEstimatedTotal(draft: DraftRecord): number {
  const c = draft.state?.catering;
  if (!c) return 0;
  if (c.selectedPackage) {
    return (c.selectedPackage.pricePerPerson || 0) * (c.headcount || 0);
  }
  if (c.selectedItems?.length) {
    try {
      return calculateTotalCost(c.selectedItems, c.headcount || 0);
    } catch {
      return 0;
    }
  }
  return 0;
}

function MagicLinkSignIn({ onSent }: { onSent: () => void }) {
  const { signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);
    const { error: err } = await signInWithMagicLink(email.trim(), '/');
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    setSent(true);
    onSent();
  };

  if (sent) {
    return (
      <div className="text-sm text-[#1A1A1A]">
        Check <span className="font-semibold">{email}</span> for a sign-in link.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Sign in to sync drafts across devices
      </label>
      <div className="flex gap-2">
        <input
          type="email"
          required
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#E8621A]"
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-[#1A1A1A] text-white font-oswald text-sm tracking-wider px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? '...' : 'Send link'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}

interface DraftRowProps {
  draft: DraftRecord;
  onResume: () => void;
  onDuplicate: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

function DraftRow({ draft, onResume, onDuplicate, onRename, onDelete }: DraftRowProps) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(draft.name);
  const [busy, setBusy] = useState(false);

  const items = draftItemCount(draft);
  const total = draftEstimatedTotal(draft);

  const submitRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === draft.name) {
      setRenaming(false);
      setName(draft.name);
      return;
    }
    onRename(name.trim());
    setRenaming(false);
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 ${draft.is_active ? 'ring-2 ring-[#E8621A]' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        {renaming ? (
          <form onSubmit={submitRename} className="flex-1 flex gap-1">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={submitRename}
              className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#E8621A]"
            />
          </form>
        ) : (
          <button
            onClick={() => setRenaming(true)}
            className="text-left flex-1 font-oswald font-bold text-[#1A1A1A] text-base hover:text-[#E8621A]"
            title="Click to rename"
          >
            {draft.name}
            {draft.is_active && (
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider bg-[#E8621A] text-white px-1.5 py-0.5 rounded">
                Active
              </span>
            )}
          </button>
        )}
      </div>

      <div className="mt-1 text-xs text-gray-500">
        {items > 0 ? `${items} item${items === 1 ? '' : 's'}` : 'Empty'}
        {total > 0 && <> · {formatCurrency(total)}</>}
        <> · Saved {timeAgo(draft.updated_at)}</>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {!draft.is_active && (
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try { await onResume(); } finally { setBusy(false); }
            }}
            className="bg-[#E8621A] text-white font-oswald text-xs tracking-wider px-3 py-1.5 rounded hover:opacity-90 disabled:opacity-50"
          >
            Resume
          </button>
        )}
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try { await onDuplicate(); } finally { setBusy(false); }
          }}
          className="bg-[#F5EDE0] text-[#1A1A1A] font-oswald text-xs tracking-wider px-3 py-1.5 rounded hover:bg-[#E8E0D4] disabled:opacity-50"
        >
          Duplicate
        </button>
        <button
          disabled={busy}
          onClick={() => setRenaming(true)}
          className="text-xs text-gray-500 hover:text-[#1A1A1A] px-2 py-1.5"
        >
          Rename
        </button>
        <button
          disabled={busy}
          onClick={async () => {
            if (!confirm(`Delete "${draft.name}"? This can't be undone.`)) return;
            setBusy(true);
            try { await onDelete(); } finally { setBusy(false); }
          }}
          className="text-xs text-red-500 hover:text-red-700 px-2 py-1.5 ml-auto"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function DraftsDrawer() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const {
    drafts,
    loading,
    drawerOpen,
    closeDrawer,
    refresh,
    startNewDraft,
    resumeDraft,
    duplicateDraft,
    renameDraft,
    deleteDraft,
  } = useDrafts();

  const [showSignIn, setShowSignIn] = useState(false);

  const handleResume = async (id: string) => {
    await resumeDraft(id);
    closeDrawer();
    router.push('/products');
  };

  return (
    <>
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={closeDrawer}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#F5EDE0] z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="bg-white px-6 py-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 className="font-oswald text-2xl font-bold text-[#1A1A1A] tracking-wide">
            Saved Drafts
          </h2>
          <button
            onClick={closeDrawer}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close drafts"
          >
            <svg className="w-6 h-6 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {/* Sign-in / account block */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            {user ? (
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm">
                  <div className="font-semibold text-[#1A1A1A] truncate">{user.email}</div>
                  <div className="text-xs text-gray-500">Drafts sync across your devices.</div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="text-xs text-gray-500 hover:text-[#1A1A1A]"
                >
                  Sign out
                </button>
              </div>
            ) : showSignIn ? (
              <MagicLinkSignIn onSent={() => { /* keep visible until user clicks magic link */ }} />
            ) : (
              <button
                onClick={() => setShowSignIn(true)}
                className="text-sm text-[#1A1A1A] hover:text-[#E8621A] font-medium"
              >
                Sign in to sync drafts across devices →
              </button>
            )}
          </div>

          {/* New draft + refresh */}
          <div className="flex gap-2">
            <button
              onClick={async () => { await startNewDraft(); }}
              className="flex-1 bg-[#1A1A1A] text-white font-oswald text-sm tracking-wider px-4 py-2 rounded hover:opacity-90"
            >
              + Start new draft
            </button>
            <button
              onClick={() => refresh()}
              className="bg-white text-[#1A1A1A] font-oswald text-sm tracking-wider px-3 py-2 rounded hover:bg-gray-50"
              aria-label="Refresh"
            >
              ↻
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-sm text-gray-500">Loading drafts…</div>
          ) : drafts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <p className="font-oswald text-lg text-[#1A1A1A] mb-1">No saved drafts yet</p>
              <p className="text-sm text-[#9B9189]">
                Add items to your cart and we'll save your progress automatically.
              </p>
            </div>
          ) : (
            drafts.map((draft) => (
              <DraftRow
                key={draft.id}
                draft={draft}
                onResume={() => handleResume(draft.id)}
                onDuplicate={() => duplicateDraft(draft.id)}
                onRename={(name) => renameDraft(draft.id, name)}
                onDelete={() => deleteDraft(draft.id)}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
