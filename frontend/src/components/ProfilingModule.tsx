import { useState } from 'react';
import { User, Send, Plus } from 'lucide-react';
import { mockProfiles } from '@/data/mockData';
import type { SuspectProfile } from '@/data/mockData';

export function ProfilingModule() {
  const [profiles, setProfiles] = useState<SuspectProfile[]>(mockProfiles);
  const [selectedId, setSelectedId] = useState<string>(mockProfiles[0]?.id || '');
  const [messageInput, setMessageInput] = useState('');

  const selected = profiles.find((p) => p.id === selectedId);

  const handleSend = () => {
    if (!messageInput.trim() || !selected) return;
    const updated = profiles.map((p) => {
      if (p.id !== selectedId) return p;
      return {
        ...p,
        messages: [
          ...p.messages,
          { id: `m${Date.now()}`, role: 'user' as const, content: messageInput },
          { id: `m${Date.now() + 1}`, role: 'system' as const, content: 'Processing refinement request. Profile analysis updated based on new parameters.' },
        ],
      };
    });
    setProfiles(updated);
    setMessageInput('');
  };

  return (
    <div className="flex flex-1 min-h-0">
      {/* Left: Profile list (40%) */}
      <div className="w-[40%] glass flex flex-col">
        <div className="panel-header">
          <span>// SUSPECT_PROFILES</span>
          <button className="flex items-center gap-1 text-[10px] font-mono font-bold text-primary interactive focus-ring px-2 py-0.5 rounded-sm hover:bg-white/10 uppercase tracking-wider">
            <Plus size={10} /> New
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`w-full text-left p-3 rounded-md interactive focus-ring flex items-start gap-3 ${
                selectedId === p.id ? 'bg-white/10 border border-primary/30' : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="w-12 h-12 rounded-md bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <User size={18} className="text-muted-foreground/30" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-foreground/85">{p.name}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{p.description}</p>
                <p className="text-[9px] font-mono text-muted-foreground/40 mt-1 font-bold tracking-wider">{p.createdAt}</p>
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
                <User size={48} className="text-muted-foreground/15" />
              </div>
            </div>

            {/* Chat */}
            <div className="flex-1 flex flex-col min-h-0 px-4 pb-4">
              <div className="panel-header rounded-t-md mb-0">
                <span>// REFINEMENT_LOG</span>
                <span>{selected.messages.length} MSG</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 py-3 border-x border-white/5 px-3">
                {selected.messages.map((msg) => (
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
              {selected.revisions.map((rev, i) => (
                <div key={rev.id} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-md bg-white/5 border border-white/10 flex items-center justify-center">
                    <User size={12} className="text-muted-foreground/20" />
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
