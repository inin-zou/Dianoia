// === Shared Primitives ===
export interface Vec2 {
  x: number;
  z: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// === Case ===
export interface Case {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'closed' | 'archived';
  marbleWorldId: string | null;
  blueprintData: BlueprintData | null;
  roomDescription: RoomDescription | null;
  scaleFactor: number;
  createdAt: string;
  updatedAt: string;
}

// RoomDescription is flexible JSONB from VLM
export type RoomDescription = Record<string, unknown>;

// === Blueprint ===
export interface BlueprintData {
  dimensions: { width: number; depth: number; height: number };
  walls: Wall[];
  doors: Door[];
  windows: BlueprintWindow[];
  furniture: Furniture[];
}

export interface Wall {
  start: Vec2;
  end: Vec2;
  height: number;
  hasWindow: boolean;
  hasDoor: boolean;
}

export interface Door {
  position: Vec2;
  width: number;
  label: string;
}

// Renamed to avoid collision with DOM Window
export interface BlueprintWindow {
  position: Vec2;
  width: number;
  height: number;
  wallIndex: number;
}

export interface Furniture {
  type: string;
  position: Vec3;
  dimensions: { w: number; d: number; h: number };
  label?: string;
}

// === Evidence ===
export type EvidenceType = 'physical' | 'forensic' | 'document' | 'image';

export type EvidenceAssetType =
  | 'knife'
  | 'body_outline'
  | 'blood_marker'
  | 'fingerprint_marker'
  | 'generic_marker'
  | 'gun'
  | 'clothing'
  | 'document_marker';

export interface Evidence {
  id: string;
  caseId: string;
  type: EvidenceType;
  subtype: string;
  title: string;
  description: string;
  credibilityScore: number;
  credibilityReason: string;
  position: Vec3 | null;
  rotation: Vec3 | null;
  assetType: EvidenceAssetType | null;
  imageUrl: string | null;
  vlmAnnotation: VLMAnnotation | null;
  metadata: Record<string, unknown>;
  stageOrder: number;
  createdAt: string;
}

export interface VLMAnnotation {
  description: string;
  significance: string;
  suggestedPosition: Vec3 | null;
  relatedEvidence: string[];
  confidence: number;
}

// === Witness ===
export interface Witness {
  id: string;
  caseId: string;
  name: string;
  role: 'witness' | 'victim_relative' | 'suspect' | 'officer';
  statement: string;
  credibilityScore: number;
  credibilityReason: string;
  positionDuringEvent: Vec3 | null;
  observationAngle: number | null;
  corroboratedBy: string[];
  contradictedBy: string[];
  stageOrder: number;
  createdAt: string;
}

// === Hypothesis ===
export interface Hypothesis {
  id: string;
  caseId: string;
  rank: number;
  probability: number;
  title: string;
  reasoning: string;
  supportingEvidence: string[];
  contradictingEvidence: string[];
  timeline: TimelineEvent[];
  stageSnapshot: number;
  createdAt: string;
}

export interface TimelineEvent {
  timestamp: string; // "HH:mm" format
  actor: string; // actor identifier
  action: TimelineAction;
  position: Vec3;
  description: string;
  evidenceRefs: string[]; // evidence/witness IDs
  confidence: number;
}

export type TimelineAction =
  | 'enters_room'
  | 'exits_room'
  | 'moves_to'
  | 'interacts_with'
  | 'attacks'
  | 'picks_up'
  | 'drops'
  | 'waits'
  | 'flees';

// === Suspect Profile ===
export interface SuspectProfile {
  id: string;
  caseId: string;
  name: string;
  description: string;
  currentImageUrl: string | null;
  revisionHistory: ProfileRevision[];
  sourceWitnessId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileRevision {
  instruction: string;
  imageUrl: string;
  timestamp: string;
}

// === Marble Scan ===
export interface MarbleScan {
  id: string;
  caseId: string;
  worldId: string | null;
  status: 'processing' | 'ready' | 'failed';
  embedUrl: string | null;
  meshExportUrl: string | null;
  splatExportUrl: string | null;
  renderedViews: RenderedView[];
  createdAt: string;
}

export interface RenderedView {
  angle: string;
  imageUrl: string;
}

// === Actor (for timeline playback) ===
export interface Actor {
  id: string;
  label: string;
  role: 'suspect' | 'victim' | 'witness' | 'officer';
  color: string;
}
