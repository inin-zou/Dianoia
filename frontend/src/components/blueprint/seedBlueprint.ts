/**
 * Seed blueprint data for demo/development.
 * Represents a ~6x8m room with furniture, doors, and windows.
 */
import type { BlueprintData } from './types';

export const seedBlueprint: BlueprintData = {
  dimensions: { width: 8, depth: 6, height: 2.8 },
  walls: [
    // South wall (z=0, x: 0->8)
    { start: { x: 0, z: 0 }, end: { x: 8, z: 0 }, height: 2.8, hasWindow: false, hasDoor: true },
    // East wall (x=8, z: 0->6)
    { start: { x: 8, z: 0 }, end: { x: 8, z: 6 }, height: 2.8, hasWindow: true, hasDoor: false },
    // North wall (z=6, x: 8->0)
    { start: { x: 8, z: 6 }, end: { x: 0, z: 6 }, height: 2.8, hasWindow: true, hasDoor: false },
    // West wall (x=0, z: 6->0)
    { start: { x: 0, z: 6 }, end: { x: 0, z: 0 }, height: 2.8, hasWindow: false, hasDoor: false },
  ],
  doors: [
    { position: { x: 3, z: 0 }, width: 0.9, label: 'Main Entry' },
  ],
  windows: [
    { position: { x: 8, z: 3 }, width: 1.2, height: 1.0, wallIndex: 1 },
    { position: { x: 4, z: 6 }, width: 1.5, height: 1.0, wallIndex: 2 },
  ],
  furniture: [
    { type: 'desk', position: { x: 6, y: 0, z: 4.5 }, dimensions: { w: 1.5, d: 0.7, h: 0.75 }, label: 'Desk' },
    { type: 'chair', position: { x: 6, y: 0, z: 3.5 }, dimensions: { w: 0.5, d: 0.5, h: 0.45 }, label: 'Chair' },
    { type: 'couch', position: { x: 2, y: 0, z: 4 }, dimensions: { w: 2.0, d: 0.8, h: 0.5 }, label: 'Couch' },
    { type: 'table', position: { x: 2, y: 0, z: 2 }, dimensions: { w: 1.0, d: 1.0, h: 0.45 }, label: 'Coffee Table' },
    { type: 'shelf', position: { x: 0.3, y: 0, z: 3 }, dimensions: { w: 0.4, d: 1.5, h: 1.8 }, label: 'Bookshelf' },
  ],
};
