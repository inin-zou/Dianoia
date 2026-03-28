import { useState } from 'react';
import { User, Send, Plus } from 'lucide-react';
import { useCaseContext } from '@/lib/CaseContext';
import { useProfiles } from '@/hooks/useProfiles';
import { apiPost } from '@/lib/api';
import type { SuspectProfile } from '@/types';

// Local chat messages (not persisted in DB — only the refinement instructions are)
interface ChatMessage {
  id: string;
  role: 'user' | 'system';
  content: string;
}

export function ProfilingModule() {
  const { caseId } = useCaseContext();
  const { data: profiles, loading } = useProfiles(caseId);
  const [selectedId, setSelectedId] = useState<string>('');
  const [messageInput, setMessageInput] = useState('');
  const [localMessages, setLocalMessages] = useState<Record<string, ChatMessage[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const selected = profiles.find((p) => p.id === selectedId) || profiles[0] || null;

  // Build chat messages from revision history + local messages
  const getChatMessages = (profile: SuspectProfile): ChatMessage[] => {
    const fromRevisions: ChatMessage[] = (profile.revisionHistory || []).flatMap((rev, i) => [
      { id: `rev-user-${i}`, role: 'user' as const, content: rev.instruction },
      { id: `rev-sys-${i}`, role: 'system' as const, content: `Profile updated. Revision ${i + 1} generated.` },
    ]);
    const local = localMessages[profile.id] || [];
    return [...fromRevisions, ...local];
  };

  const handleSend = async () => {
    if (!messageInput.trim() || !selected) return;
    const instruction = messageInput.trim();
    setMessageInput('');

    // Add user message locally
    const userMsg: ChatMessage = { id: `m${Date.now()}`, role: 'user', content: instruction };
    setLocalMessages((prev) => ({
      ...prev,
      [selected.id]: [...(prev[selected.id] || []), userMsg],
    }));

    setSubmitting(true);
    try {
      await apiPost(`/api/profiles/${selected.id}/refine`, { instruction });
      // Real-time subscription will update the profile with new revision
      const sysMsg: ChatMessage = { id: `m${Date.now() + 1}`, role: 'system', content: 'Profile refinement applied. Image updated.' };
      setLocalMessages((prev) => ({
        ...prev,
        [selected.id]: [...(prev[selected.id] || []), sysMsg],
      }));
    } catch (err) {
      console.error('Failed to refine profile:', err);
      const errMsg: ChatMessage = { id: `m${Date.now() + 1}`, role: 'system', content: 'Refinement failed. Backend may be offline.' };
      setLocalMessages((prev) => ({
        ...prev,
        [selected.id]: [...(prev[selected.id] || []), errMsg],
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewProfile = async () => {
    setSubmitting(true);
    try {
      const result = await apiPost<SuspectProfile>(`/api/cases/${caseId}/profiles`, {
        name: 'Unknown Suspect',
        description: 'New suspect profile',
      });
      setSelectedId(result.id);
    } catch (err) {
      console.error('Failed to create profile:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const messages = selected ? getChatMessages(selected) : [];

  return (
    <div className="flex flex-1 min-h-0">
      {/* Left: Profile list (40%) */}
      <div className="w-[40%] glass flex flex-col">
        <div className="panel-header">
          <span>// SUSPECT_PROFILES</span>
          <button
            onClick={handleNewProfile}
            disabled={submitting}
            className="flex items-center gap-1 text-[10px] font-mono font-bold text-primary interactive focus-ring px-2 py-0.5 rounded-sm hover:bg-white/10 uppercase tracking-wider"
          >
            <Plus size={10} /> New
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {loading && profiles.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider">Loading...</span>
            </div>
          )}
          {!loading && profiles.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider">No profiles yet</span>
            </div>
          )}
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`w-full text-left p-3 rounded-md interactive focus-ring flex items-start gap-3 ${
                (selected?.id === p.id) ? 'bg-white/10 border border-primary/30' : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="w-12 h-12 rounded-md bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                {p.currentImageUrl ? (
                  <img src={p.currentImageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={18} className="text-muted-foreground/30" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-foreground/85">{p.name}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{p.description}</p>
                <p className="text-[9px] font-mono text-muted-foreground/40 mt-1 font-bold tracking-wider">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Active profile (60%) */}
      {selected ? (
        <div className="w-[60%] flex min-h-0 border-l border-white/5">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Image */}
            <div className="p-4 flex justify-center shrink-0">
              <div className="w-40 h-40 lg:w-52 lg:h-52 rounded-lg border border-white/10 flex items-center justify-center viewport-frosted overflow-hidden">
                {selected.currentImageUrl ? (
                  <img src={selected.currentImageUrl} alt={selected.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-muted-foreground/15" />
                )}
              </div>
            </div>

            {/* Chat */}
            <div className="flex-1 flex flex-col min-h-0 px-4 pb-4">
              <div className="panel-header rounded-t-md mb-0">
                <span>// REFINEMENT_LOG</span>
                <span>{messages.length} MSG</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 py-3 border-x border-white/5 px-3">
                {messages.length === 0 && (
                  <div className="flex items-center justify-center py-4">
                    <span className="text-[10px] font-mono text-muted-foreground/30">No refinements yet</span>
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-2 text-[12px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary/20 text-foreground border border-primary/30 rounded-lg rounded-br-sm'
                        : 'bg-white/5 text-foreground/70 border border-white/10 rounded-lg rounded-bl-sm font-mono'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="REFINE_PROFILE..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-[12px] font-mono text-foreground placeholder:text-muted-foreground/30 focus-ring"
                />
                <button
                  onClick={handleSend}
                  disabled={submitting}
                  className="w-8 h-8 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center interactive focus-ring hover:bg-primary/30"
                >
                  <Send size={13} className="text-primary" />
                </button>
              </div>
            </div>
          </div>

          {/* Revision strip */}
          <div className="w-16 glass border-l border-white/5 flex flex-col shrink-0">
            <div className="py-2 px-1 text-center">
              <span className="text-[8px] font-mono font-bold text-muted-foreground tracking-wider">REV</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {(selected.revisionHistory || []).map((rev, i) => (
                <div key={`rev-${i}`} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-md bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                    {rev.imageUrl ? (
                      <img src={rev.imageUrl} alt={`v${i + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <User size={12} className="text-muted-foreground/20" />
                    )}
                  </div>
                  <span className="text-[7px] font-mono font-bold text-muted-foreground/30 text-center">v{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-[60%] flex items-center justify-center text-muted-foreground/20 text-[11px] font-mono font-bold uppercase tracking-widest">
          Select Profile
        </div>
      )}
    </div>
  );
}
