import { useState } from 'react';
import { Box, Plus, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Evidence, EvidenceType } from '@/data/mockData';
import { mockEvidence } from '@/data/mockData';

const typeColors: Record<EvidenceType, { bg: string; text: string; border: string; label: string }> = {
  physical: { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/30', label: 'PHYS' },
  forensic: { bg: 'bg-purple/10', text: 'text-purple', border: 'border-purple/30', label: 'FRNSC' },
  document: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30', label: 'DOC' },
  image: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30', label: 'IMG' },
};

const credColor = (c: number) => {
  if (c >= 0.8) return 'bg-success';
  if (c >= 0.6) return 'bg-warning';
  if (c >= 0.4) return 'bg-orange-500';
  return 'bg-danger';
};

const views = ['Blueprint 3D', 'Realistic 3D', 'Floor Plan 2D'] as const;

export function SceneModule() {
  const [evidence, setEvidence] = useState<Evidence[]>(mockEvidence);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<string>(views[0]);
  const [addOpen, setAddOpen] = useState(false);
  const [newEvidence, setNewEvidence] = useState({ title: '', type: 'physical' as EvidenceType, description: '', x: 0, y: 0, z: 0 });
  const [recentIds, setRecentIds] = useState<Set<string>>(new Set());

  const handleAdd = () => {
    const id = `e${Date.now()}`;
    const item: Evidence = {
      id,
      title: newEvidence.title || 'Untitled',
      type: newEvidence.type,
      credibility: 0.5,
      description: newEvidence.description,
      position: { x: newEvidence.x, y: newEvidence.y, z: newEvidence.z },
    };
    setEvidence([...evidence, item]);
    setRecentIds(new Set([...recentIds, id]));
    setTimeout(() => setRecentIds((prev) => { const n = new Set(prev); n.delete(id); return n; }), 3000);
    setAddOpen(false);
    setNewEvidence({ title: '', type: 'physical', description: '', x: 0, y: 0, z: 0 });
  };

  return (
    <div className="flex flex-1 min-h-0">
      {/* Sidebar */}
      <div className="w-72 glass flex flex-col shrink-0">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <span>// EVIDENCE_LOG</span>
            <span className="text-[9px] font-mono font-bold text-foreground bg-white/10 border border-white/10 rounded-sm px-1.5 py-0.5">
              {evidence.length}
            </span>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-1 text-[10px] font-mono font-bold text-primary interactive focus-ring px-2 py-1 rounded-sm hover:bg-white/10 uppercase tracking-wider">
                <Plus size={10} /> Add
              </button>
            </DialogTrigger>
            <DialogContent className="glass-strong rounded-lg border-white/15">
              <DialogHeader>
                <DialogTitle className="text-foreground font-mono text-sm tracking-wider">// ADD_EVIDENCE</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-label mb-1.5 block">Title</Label>
                  <Input value={newEvidence.title} onChange={(e) => setNewEvidence({ ...newEvidence, title: e.target.value })} className="bg-white/5 border-white/10 focus-ring rounded-md h-9 font-mono text-sm" />
                </div>
                <div>
                  <Label className="text-label mb-1.5 block">Type</Label>
                  <Select value={newEvidence.type} onValueChange={(v) => setNewEvidence({ ...newEvidence, type: v as EvidenceType })}>
                    <SelectTrigger className="bg-white/5 border-white/10 focus-ring rounded-md h-9 font-mono text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="glass-strong rounded-lg border-white/15">
                      <SelectItem value="physical">Physical</SelectItem>
                      <SelectItem value="forensic">Forensic</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-label mb-1.5 block">Description</Label>
                  <Textarea value={newEvidence.description} onChange={(e) => setNewEvidence({ ...newEvidence, description: e.target.value })} className="bg-white/5 border-white/10 focus-ring rounded-md font-mono text-sm" rows={3} />
                </div>
                <div>
                  <Label className="text-label mb-1.5 block">Image Upload</Label>
                  <div className="border border-dashed border-white/20 rounded-lg p-5 flex flex-col items-center gap-2 text-muted-foreground interactive hover:border-primary/40 hover:bg-primary/5">
                    <Upload size={20} className="opacity-30" />
                    <span className="text-[10px] font-mono">DROP_FILE_OR_CLICK</span>
                  </div>
                </div>
                <div>
                  <Label className="text-label mb-1.5 block">Position (X / Y / Z)</Label>
                  <div className="flex gap-2">
                    <Input type="number" value={newEvidence.x} onChange={(e) => setNewEvidence({ ...newEvidence, x: +e.target.value })} className="bg-white/5 border-white/10 focus-ring rounded-md h-9 font-mono text-sm" />
                    <Input type="number" value={newEvidence.y} onChange={(e) => setNewEvidence({ ...newEvidence, y: +e.target.value })} className="bg-white/5 border-white/10 focus-ring rounded-md h-9 font-mono text-sm" />
                    <Input type="number" value={newEvidence.z} onChange={(e) => setNewEvidence({ ...newEvidence, z: +e.target.value })} className="bg-white/5 border-white/10 focus-ring rounded-md h-9 font-mono text-sm" />
                  </div>
                </div>
                <Button onClick={handleAdd} className="w-full focus-ring bg-primary hover:bg-primary/80 rounded-md h-9 font-mono font-bold text-[11px] uppercase tracking-wider">
                  Confirm Evidence
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2 pt-1 space-y-0.5">
          {evidence.map((e) => {
            const tc = typeColors[e.type];
            return (
              <button
                key={e.id}
                onClick={() => setSelectedId(e.id)}
                className={`w-full text-left p-2.5 rounded-md interactive focus-ring ${
                  selectedId === e.id ? 'bg-white/10 border border-primary/30' : 'hover:bg-white/5 border border-transparent'
                } ${recentIds.has(e.id) ? 'animate-pulse' : ''}`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-foreground/90 truncate">{e.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge className={`${tc.bg} ${tc.text} border ${tc.border} text-[8px] font-mono font-bold rounded-sm px-1.5 py-0`}>{tc.label}</Badge>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${credColor(e.credibility)}`} title={`Credibility: ${e.credibility}`} />
                      <span className="text-[9px] font-mono text-muted-foreground">{(e.credibility * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  {e.type === 'image' && (
                    <div className="w-9 h-9 rounded-md bg-white/5 border border-white/10 shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-wider">
            /case/viewport/{activeView.toLowerCase().replace(/\s/g, '_')}
          </span>
          <div className="tactical-segmented">
            {views.map((v) => (
              <button
                key={v}
                onClick={() => setActiveView(v)}
                className={activeView === v ? 'tactical-segmented-item-active' : 'tactical-segmented-item hover:text-foreground'}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center viewport-frosted relative overflow-hidden" style={{ cursor: 'crosshair' }}>
          <div className="flex flex-col items-center gap-3 text-muted-foreground relative z-10">
            <Box size={40} strokeWidth={1} className="opacity-15" />
            <span className="text-[11px] font-mono font-bold opacity-30 uppercase tracking-widest">{activeView}</span>
          </div>
          {/* Corner status */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
            <span className="status-dot" />
            <span className="text-[9px] font-mono font-bold text-muted-foreground tracking-wider">VIEWPORT_READY</span>
          </div>
          <div className="absolute bottom-3 right-3 z-10">
            <span className="text-[9px] font-mono text-muted-foreground/50">SCALE: 1u = 1m</span>
          </div>
        </div>
      </div>
    </div>
  );
}
