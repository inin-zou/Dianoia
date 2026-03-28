import { useState, useEffect } from 'react';
import { User, Send, Plus, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useCaseContext } from '@/lib/CaseContext';
import { useProfiles } from '@/hooks/useProfiles';
import { useWitnesses } from '@/hooks/useWitnesses';
import { apiPost, apiDelete } from '@/lib/api';
import type { SuspectProfile } from '@/types';

// Local chat messages (not persisted in DB -- only the refinement instructions are)
interface ChatMessage {
  id: string;
  role: 'user' | 'system';
  content: string;
}

export function ProfilingModule() {
  const { caseId } = useCaseContext();
  const { data: profiles, loading } = useProfiles(caseId);
  const { data: witnesses } = useWitnesses(caseId);
  const [selectedId, setSelectedId] = useState<string>('');
  const [messageInput, setMessageInput] = useState('');
  const [localMessages, setLocalMessages] = useState<Record<string, ChatMessage[]>>({});
  const [submitting, setSubmitting] = useState(false);

  // New Profile dialog state
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState('Unknown Suspect');
  const [newDescription, setNewDescription] = useState('');
  const [newWitnessId, setNewWitnessId] = useState<string>('none');
  const [creating, setCreating] = useState(false);

  const selected = profiles.find((p) => p.id === selectedId) || profiles[0] || null;

  // When a witness is selected, pre-fill description from their statement
  useEffect(() => {
    if (newWitnessId && newWitnessId !== 'none') {
      const witness = witnesses.find((w) => w.id === newWitnessId);
      if (witness) {
        setNewDescription(witness.statement);
      }
    }
  }, [newWitnessId, witnesses]);

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
    if (!newDescription.trim()) return;
    setCreating(true);
    try {
      const body: { name: string; description: string; sourceWitnessId?: string } = {
        name: newName.trim() || 'Unknown Suspect',
        description: newDescription.trim(),
      };
      if (newWitnessId && newWitnessId !== 'none') {
        body.sourceWitnessId = newWitnessId;
      }
      const result = await apiPost<SuspectProfile>(`/api/cases/${caseId}/profiles`, body);
      setSelectedId(result.id);
      setNewOpen(false);
      setNewName('Unknown Suspect');
      setNewDescription('');
      setNewWitnessId('none');
    } catch (err) {
      console.error('Failed to create profile:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProfile = async (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this suspect profile? This cannot be undone.')) return;
    try {
      await apiDelete(`/api/profiles/${profileId}`);
      // Real-time subscription will remove it; if it was selected, clear selection
      if (selectedId === profileId) {
        setSelectedId('');
      }
    } catch (err) {
      console.error('Failed to delete profile:', err);
    }
  };

  const messages = selected ? getChatMessages(selected) : [];

  return (
    <div className="flex flex-1 min-h-0">
      {/* Left: Profile list (40%) */}
      <div className="w-[40%] glass flex flex-col">
        <div className="panel-header">
          <span>// SUSPECT_PROFILES</span>
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogTrigger asChild>
              <button
                className="flex items-center gap-1 text-[10px] font-mono font-bold text-primary interactive focus-ring px-2 py-0.5 rounded-sm hover:bg-white/10 uppercase tracking-wider"
              >
                <Plus size={10} /> New
              </button>
            </DialogTrigger>
            <DialogContent className="glass-strong rounded-lg border-white/15">
              <DialogHeader>
                <DialogTitle className="text-foreground font-mono text-sm tracking-wider">// NEW_SUSPECT_PROFILE</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-label mb-1.5 block">Suspect Name</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Unknown Suspect"
                    className="bg-white/5 border-white/10 focus-ring rounded-md h-9 font-mono text-sm"
                  />
                </div>
                <div>
                  <Label className="text-label mb-1.5 block">Link Witness (Optional)</Label>
                  <Select value={newWitnessId} onValueChange={setNewWitnessId}>
                    <SelectTrigger className="bg-white/5 border-white/10 focus-ring rounded-md h-9 font-mono text-sm">
                      <SelectValue placeholder="No witness linked" />
                    </SelectTrigger>
                    <SelectContent className="glass-strong rounded-lg border-white/15">
                      <SelectItem value="none">No witness linked</SelectItem>
                      {witnesses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name} ({w.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-label mb-1.5 block">Description</Label>
                  <Textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Physical description of the suspect as described by witnesses..."
                    className="bg-white/5 border-white/10 focus-ring rounded-md font-mono text-sm"
                    rows={4}
                  />
                  <p className="text-[9px] font-mono text-muted-foreground/50 mt-1.5">
                    This description is sent to NanoBanana for composite image generation.
                  </p>
                </div>
                <Button
                  onClick={handleNewProfile}
                  disabled={creating || !newDescription.trim()}
                  className="w-full focus-ring bg-primary hover:bg-primary/80 rounded-md h-9 font-mono font-bold text-[11px] uppercase tracking-wider"
                >
                  {creating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={12} className="animate-spin" />
                      Generating Composite...
                    </span>
                  ) : (
                    'Generate Profile'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
              className={`w-full text-left p-3 rounded-md interactive focus-ring flex items-start gap-3 group ${
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
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-foreground/85">{p.name}</p>
                  <button
                    onClick={(e) => handleDeleteProfile(p.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-sm hover:bg-danger/20 text-muted-foreground/40 hover:text-danger"
                    title="Delete profile"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
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
              <div className="w-40 h-40 lg:w-52 lg:h-52 rounded-lg border border-white/10 flex items-center justify-center viewport-frosted overflow-hidden relative">
                {selected.currentImageUrl ? (
                  <img src={selected.currentImageUrl} alt={selected.name} className="w-full h-full object-cover" />
                ) : submitting || creating ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                      <User size={18} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/60" />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-primary/60 tracking-wider animate-pulse">GENERATING...</span>
                  </div>
                ) : (
                  <User size={48} className="text-muted-foreground/15" />
                )}
                {submitting && selected.currentImageUrl && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span className="text-[8px] font-mono font-bold text-white/70 tracking-wider">REFINING...</span>
                    </div>
                  </div>
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
