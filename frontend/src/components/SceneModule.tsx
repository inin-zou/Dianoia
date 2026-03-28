import { useState, useMemo } from 'react';
import { Box, Plus, Upload, ScanLine, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Evidence, EvidenceType } from '@/types';
import { useCaseContext } from '@/lib/CaseContext';
import { useEvidence } from '@/hooks/useEvidence';
import { useHypotheses } from '@/hooks/useHypotheses';
import { useMarbleScan } from '@/hooks/useMarbleScan';
import { useTimeline } from '@/lib/TimelineContext';
import { getActorPositionsAtTime } from '@/lib/timelineAnimation';
import { apiPost } from '@/lib/api';
import { BlueprintView3D, FloorPlanSVG, MarbleEmbed, seedBlueprint } from '@/components/blueprint';
import type { EvidenceItem, ActorData } from '@/components/blueprint';
import { useCase } from '@/hooks/useCase';

const typeColors: Record<EvidenceType, { bg: string; text: string; border: string; label: string }> = {
  physical: { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/30', label: 'PHYS' },
  forensic: { bg: 'bg-purple/10', text: 'text-purple', border: 'border-purple/30', label: 'FRNSC' },
  document: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30', label: 'DOC' },
  image: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30', label: 'IMG' },
};

const stageColors: Record<number, { bg: string; text: string; border: string }> = {
  0: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  1: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  2: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
};

const credColor = (c: number) => {
  if (c >= 0.8) return 'bg-success';
  if (c >= 0.6) return 'bg-warning';
  if (c >= 0.4) return 'bg-orange-500';
  return 'bg-danger';
};

const views = ['Blueprint 3D', 'Realistic 3D', 'Floor Plan 2D'] as const;

export function SceneModule() {
  const { caseId } = useCaseContext();
  const { data: evidence, loading } = useEvidence(caseId);
  const { data: hypotheses } = useHypotheses(caseId);
  const { caseData } = useCase(caseId);
  const { scan } = useMarbleScan(caseId);
  const { currentTime, selectedHypothesisId } = useTimeline();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<string>(views[0]);

  // Map evidence to 3D marker data
  const evidenceItems: EvidenceItem[] = useMemo(() =>
    evidence.filter(e => e.position).map(e => ({
      id: e.id,
      title: e.title,
      position: e.position as { x: number; y: number; z: number },
      assetType: (e.assetType || 'generic_marker') as EvidenceItem['assetType'],
    })),
    [evidence]
  );

  // Compute actor positions from the selected hypothesis + current timeline time
  const selectedHypothesis = useMemo(
    () => hypotheses.find((h) => h.id === selectedHypothesisId) || null,
    [hypotheses, selectedHypothesisId]
  );

  const actorPositions: ActorData[] = useMemo(() => {
    if (!selectedHypothesis) return [];
    return getActorPositionsAtTime(selectedHypothesis, currentTime);
  }, [selectedHypothesis, currentTime]);

  // Use case blueprint or fallback to seed data
  const blueprint = (caseData?.blueprintData || seedBlueprint) as import('@/components/blueprint').BlueprintData;
  const [addOpen, setAddOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [newEvidence, setNewEvidence] = useState({ title: '', type: 'physical' as EvidenceType, description: '', x: 0, y: 0, z: 0 });
  const [scanUrl, setScanUrl] = useState('');
  const [recentIds, setRecentIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [scanSubmitting, setScanSubmitting] = useState(false);

  // Determine embed URL and scan status from marble scan data
  const embedUrl = scan?.embedUrl ?? null;
  const scanStatus = scan?.status ?? null;

  const handleAdd = async () => {
    setSubmitting(true);
    try {
      const result = await apiPost<Evidence>(`/api/cases/${caseId}/evidence`, {
        type: newEvidence.type,
        subtype: '',
        title: newEvidence.title || 'Untitled',
        description: newEvidence.description,
        position: { x: newEvidence.x, y: newEvidence.y, z: newEvidence.z },
      });
      // Mark as recent for pulse animation
      const id = result.id;
      setRecentIds(new Set([...recentIds, id]));
      setTimeout(() => setRecentIds((prev) => { const n = new Set(prev); n.delete(id); return n; }), 3000);
    } catch (err) {
      console.error('Failed to add evidence:', err);
    } finally {
      setSubmitting(false);
      setAddOpen(false);
      setNewEvidence({ title: '', type: 'physical', description: '', x: 0, y: 0, z: 0 });
    }
  };

  const handleStartScan = async () => {
    if (!scanUrl.trim()) return;
    setScanSubmitting(true);
    try {
      await apiPost(`/api/cases/${caseId}/scan`, {
        imageUrl: scanUrl.trim(),
      });
      setScanOpen(false);
      setScanUrl('');
    } catch (err) {
      console.error('Failed to start scan:', err);
    } finally {
      setScanSubmitting(false);
    }
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
                <Button onClick={handleAdd} disabled={submitting} className="w-full focus-ring bg-primary hover:bg-primary/80 rounded-md h-9 font-mono font-bold text-[11px] uppercase tracking-wider">
                  {submitting ? 'Submitting...' : 'Confirm Evidence'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2 pt-1 space-y-0.5">
          {loading && evidence.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider">Loading...</span>
            </div>
          )}
          {!loading && evidence.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider">No evidence yet</span>
            </div>
          )}
          {evidence.map((e) => {
            const tc = typeColors[e.type];
            const sc = stageColors[e.stageOrder] || stageColors[0];
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
                      <Badge className={`${sc.bg} ${sc.text} border ${sc.border} text-[8px] font-mono font-bold rounded-sm px-1.5 py-0`}>
                        S{e.stageOrder}
                      </Badge>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${credColor(e.credibilityScore)}`} title={`Credibility: ${e.credibilityScore}`} />
                      <span className="text-[9px] font-mono text-muted-foreground">{(e.credibilityScore * 100).toFixed(0)}%</span>
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
          <div className="flex items-center gap-3">
            {/* Scan Upload Button */}
            <Dialog open={scanOpen} onOpenChange={setScanOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-primary interactive focus-ring px-2 py-1 rounded-sm hover:bg-white/10 uppercase tracking-wider">
                  {scanStatus === 'processing' ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <ScanLine size={10} />
                  )}
                  {scanStatus === 'processing' ? 'Scanning...' : 'Scan'}
                </button>
              </DialogTrigger>
              <DialogContent className="glass-strong rounded-lg border-white/15">
                <DialogHeader>
                  <DialogTitle className="text-foreground font-mono text-sm tracking-wider">// 3D_SCENE_SCAN</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-label mb-1.5 block">Scene Image URL</Label>
                    <Input
                      value={scanUrl}
                      onChange={(e) => setScanUrl(e.target.value)}
                      placeholder="https://..."
                      className="bg-white/5 border-white/10 focus-ring rounded-md h-9 font-mono text-sm"
                    />
                    <p className="text-[9px] font-mono text-muted-foreground/50 mt-1.5">
                      Provide a URL to a crime scene photograph. Marble will generate an interactive 3D world (~30-45s).
                    </p>
                  </div>
                  {scanStatus === 'processing' && (
                    <div className="flex items-center gap-2 text-warning">
                      <Loader2 size={12} className="animate-spin" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Scan in progress...</span>
                    </div>
                  )}
                  {scanStatus === 'ready' && (
                    <div className="flex items-center gap-2 text-success">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Scan ready - view in Realistic 3D tab</span>
                    </div>
                  )}
                  {scanStatus === 'failed' && (
                    <div className="flex items-center gap-2 text-danger">
                      <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Previous scan failed - try again</span>
                    </div>
                  )}
                  <Button
                    onClick={handleStartScan}
                    disabled={scanSubmitting || !scanUrl.trim() || scanStatus === 'processing'}
                    className="w-full focus-ring bg-primary hover:bg-primary/80 rounded-md h-9 font-mono font-bold text-[11px] uppercase tracking-wider"
                  >
                    {scanSubmitting ? 'Starting Scan...' : 'Start 3D Scan'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* View Switcher */}
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
        </div>
        <div className="flex-1 viewport-frosted relative overflow-hidden" style={{ cursor: 'crosshair' }}>
          {activeView === 'Blueprint 3D' ? (
            <div className="absolute inset-0 z-10">
              <BlueprintView3D
                blueprintData={blueprint}
                evidence={evidenceItems}
                actors={actorPositions}
              />
            </div>
          ) : activeView === 'Realistic 3D' ? (
            <div className="absolute inset-0 z-10">
              <MarbleEmbed embedUrl={embedUrl} />
            </div>
          ) : activeView === 'Floor Plan 2D' ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
              <FloorPlanSVG
                blueprint={blueprint}
                evidence={evidenceItems}
                className="max-w-full max-h-full"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3 text-muted-foreground relative z-10">
                <Box size={40} strokeWidth={1} className="opacity-15" />
                <span className="text-[11px] font-mono font-bold opacity-30 uppercase tracking-widest">{activeView}</span>
              </div>
            </div>
          )}
          {/* Actor count overlay when actors are visible */}
          {actorPositions.length > 0 && (
            <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
              <span className="text-[9px] font-mono font-bold text-primary/80 bg-primary/10 border border-primary/20 rounded-sm px-1.5 py-0.5">
                {actorPositions.length} ACTOR{actorPositions.length !== 1 ? 'S' : ''} VISIBLE
              </span>
            </div>
          )}
          {/* Corner status */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 z-20">
            <span className="status-dot" />
            <span className="text-[9px] font-mono font-bold text-muted-foreground tracking-wider">VIEWPORT_ACTIVE</span>
          </div>
          <div className="absolute bottom-3 right-3 z-20">
            <span className="text-[9px] font-mono text-muted-foreground/50">SCALE: 1u = 1m</span>
          </div>
        </div>
      </div>
    </div>
  );
}
