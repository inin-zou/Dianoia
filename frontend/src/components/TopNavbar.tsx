import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCaseContext } from '@/lib/CaseContext';

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
  const { caseData, allCases, switchCase } = useCaseContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const title = caseData?.title || 'Loading...';
  const status = caseData?.status || 'active';

  // Position dropdown below the button
  useEffect(() => {
    if (dropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: Math.max(8, rect.left + rect.width / 2 - 150),
      });
    }
  }, [dropdownOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  return (
    <header className="h-12 glass flex items-center px-4 gap-4 shrink-0 relative z-50">
      <span className="font-mono font-extrabold text-sm tracking-wider text-foreground glow-brand whitespace-nowrap">
        DIANOIA
      </span>
      <span className="text-[9px] font-mono text-muted-foreground tracking-wider">v0.1</span>

      <div className="h-4 w-px bg-border/50 mx-1" />

      {/* Case selector */}
      <div className="flex-1 flex items-center justify-center gap-2.5 min-w-0">
        <button
          ref={buttonRef}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="text-[11px] font-mono font-medium text-muted-foreground truncate max-w-md interactive focus-ring rounded-md px-2 py-1 hover:text-foreground hover:bg-white/5 flex items-center gap-1.5"
        >
          // {title.toUpperCase()}
          <ChevronDown size={10} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        <Badge className={`${status === 'active' ? 'bg-success/15 text-success border-success/30' : 'bg-muted/15 text-muted-foreground border-muted/30'} border text-[9px] font-mono uppercase tracking-wider font-bold shrink-0 rounded-sm px-2 py-0.5`}>
          {status === 'active' && <span className="status-dot mr-1.5" />}
          {status}
        </Badge>

        {/* Portal dropdown — renders at document.body level to escape all stacking contexts */}
        {dropdownOpen && createPortal(
          <div
            ref={dropdownRef}
            className="fixed glass-strong rounded-md border border-white/20 shadow-2xl min-w-[300px] max-h-[300px] overflow-y-auto"
            style={{
              top: dropdownPos.top,
              left: dropdownPos.left,
              zIndex: 99999,
            }}
          >
            <div className="panel-header">
              <span>// CASE_SELECTOR</span>
              <span>[{allCases.length}]</span>
            </div>
            {allCases.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  switchCase(c.id);
                  setDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 hover-row border-b border-white/5 ${
                  c.id === caseData?.id ? 'bg-white/10' : ''
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.status === 'active' ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                <span className="text-[11px] font-mono text-foreground/80 truncate flex-1">{c.title}</span>
                <span className="text-[8px] font-mono text-muted-foreground/40">{c.id.slice(0, 8)}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
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
