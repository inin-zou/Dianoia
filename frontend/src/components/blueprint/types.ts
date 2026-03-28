/**
 * Blueprint 3D types — mirrors interfaces.md definitions.
 * These are the local TS types used by the 3D components.
 */

export interface Vec2 {
  x: number;
  z: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

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

export type EvidenceAssetType =
  | 'knife'
  | 'body_outline'
  | 'blood_marker'
  | 'fingerprint_marker'
  | 'generic_marker'
  | 'gun'
  | 'clothing'
  | 'document_marker';

export interface EvidenceItem {
  id: string;
  title: string;
  position: Vec3 | null;
  assetType: EvidenceAssetType | null;
}

export interface ActorData {
  id: string;
  label: string;
  role: 'suspect' | 'victim' | 'witness' | 'officer';
  color: string;
  position: Vec3;
  waypoints?: Vec3[];
}
