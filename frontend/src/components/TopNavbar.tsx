import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

type ModuleTab = 'scene' | 'analysis' | 'timeline' | 'profiling';

interface TopNavbarProps {
  activeTab: ModuleTab;
  onTabChange: (tab: ModuleTab) => void;
}

const tabs: { id: ModuleTab; label: string }[] = [
  { id: 'scene', label: 'Scene' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'profiling', label: 'Profiling' },
];

export function TopNavbar({ activeTab, onTabChange }: TopNavbarProps) {
  const [caseTitle, setCaseTitle] = useState('Riverside Park Homicide — Case #2024-0847');
  const [editing, setEditing] = useState(false);

  return (
    <header className="h-12 glass flex items-center px-4 gap-4 shrink-0">
      <span className="font-mono font-extrabold text-sm tracking-wider text-foreground glow-brand whitespace-nowrap">
        DIANOIA
      </span>
      <span className="text-[9px] font-mono text-muted-foreground tracking-wider">v0.1</span>

      <div className="h-4 w-px bg-border/50 mx-1" />

      <div className="flex-1 flex items-center justify-center gap-2.5 min-w-0">
        {editing ? (
          <input
            className="bg-white/5 border border-white/10 rounded-md px-3 py-1 text-[12px] font-mono text-foreground focus-ring max-w-md w-full"
            value={caseTitle}
            onChange={(e) => setCaseTitle(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
            autoFocus
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] font-mono font-medium text-muted-foreground truncate max-w-md interactive focus-ring rounded-md px-2 py-1 hover:text-foreground hover:bg-white/5"
          >
            // {caseTitle.toUpperCase()}
          </button>
        )}
        <Badge className="bg-success/15 text-success border border-success/30 text-[9px] font-mono uppercase tracking-wider font-bold shrink-0 rounded-sm px-2 py-0.5">
          <span className="status-dot mr-1.5" />
          Active
        </Badge>
      </div>

      <div className="tactical-segmented shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={activeTab === tab.id ? 'tactical-segmented-item-active' : 'tactical-segmented-item hover:text-foreground'}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}
