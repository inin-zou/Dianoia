export type EvidenceType = 'physical' | 'forensic' | 'document' | 'image';

export interface Evidence {
  id: string;
  title: string;
  type: EvidenceType;
  credibility: number;
  description: string;
  thumbnail?: string;
  position?: { x: number; y: number; z: number };
}

export interface Hypothesis {
  id: string;
  rank: number;
  title: string;
  probability: number;
  reasoning: string;
  supporting: string[];
  contradicting: string[];
  timelineEvents: number;
}

export interface TimelineActor {
  id: string;
  name: string;
  color: string;
  type: 'suspect' | 'victim' | 'witness' | 'officer';
  visible: boolean;
  locked: boolean;
  actions: { start: number; end: number; label: string }[];
}

export interface SuspectProfile {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  revisions: { id: string; timestamp: string; thumbnail?: string }[];
  messages: { id: string; role: 'user' | 'system'; content: string }[];
}

export const mockEvidence: Evidence[] = [
  { id: 'e1', title: 'Kitchen Knife', type: 'physical', credibility: 0.9, description: '8-inch serrated kitchen knife found near the victim. Handle shows partial fingerprint.', position: { x: 120, y: 80, z: 0 } },
  { id: 'e2', title: 'Blood Spatter Analysis', type: 'forensic', credibility: 0.85, description: 'Medium velocity spatter pattern consistent with blunt force, directional analysis points to east wall origin.', position: { x: 200, y: 150, z: 0 } },
  { id: 'e3', title: 'Security Camera Still', type: 'image', credibility: 0.75, description: 'Frame capture from parking lot camera at 22:47. Shows figure matching suspect description.', position: { x: 50, y: 200, z: 0 } },
  { id: 'e4', title: 'Anonymous Tip Note', type: 'document', credibility: 0.6, description: 'Handwritten note left at precinct. References domestic conflict and mentions a third party.', position: { x: 300, y: 100, z: 0 } },
];

export const mockHypotheses: Hypothesis[] = [
  { id: 'h1', rank: 1, title: 'Domestic dispute escalation', probability: 65, reasoning: 'Evidence suggests an ongoing domestic conflict that escalated to violence. The weapon was a household item, and witness testimony supports a history of altercations between the victim and suspect.', supporting: ['Kitchen Knife', 'Anonymous Tip Note', 'Maria Chen Testimony'], contradicting: ['Security Camera Timeline Gap'], timelineEvents: 5 },
  { id: 'h2', rank: 2, title: 'Robbery gone wrong', probability: 25, reasoning: 'Some indicators point to a failed robbery attempt. Missing valuables and forced entry at rear window suggest an external perpetrator, though evidence is inconclusive.', supporting: ['Security Camera Still', 'Forced Entry Marks'], contradicting: ['Kitchen Knife (household)', 'No stolen items confirmed'], timelineEvents: 3 },
  { id: 'h3', rank: 3, title: 'Premeditated attack', probability: 10, reasoning: 'Limited evidence for premeditation. No prior threats documented, but the anonymous tip references a "planned confrontation."', supporting: ['Anonymous Tip Note'], contradicting: ['Kitchen Knife (improvised)', 'Blood Spatter (reactive pattern)', 'No prior threats'], timelineEvents: 2 },
];

export const mockActors: TimelineActor[] = [
  { id: 'a1', name: 'Suspect Alpha', color: '#EF4444', type: 'suspect', visible: true, locked: false, actions: [{ start: 19, end: 20.5, label: 'Arrived at scene' }, { start: 21.5, end: 22, label: 'Left via back exit' }, { start: 22.5, end: 23, label: 'Seen on camera' }] },
  { id: 'a2', name: 'Victim', color: '#64748B', type: 'victim', visible: true, locked: false, actions: [{ start: 18, end: 20, label: 'Home alone' }, { start: 20, end: 21, label: 'Altercation' }, { start: 21, end: 21.5, label: 'Unresponsive' }] },
  { id: 'a3', name: 'Maria Chen', color: '#3B82F6', type: 'witness', visible: true, locked: false, actions: [{ start: 20.5, end: 21, label: 'Heard shouting' }] },
  { id: 'a4', name: 'Officer Davis', color: '#22C55E', type: 'officer', visible: true, locked: false, actions: [{ start: 22, end: 23.5, label: 'On scene' }] },
];

export const mockProfiles: SuspectProfile[] = [
  {
    id: 'p1',
    name: 'Suspect Alpha',
    description: 'Male, 35-40, approximately 5\'11". Known associate of victim. Prior record includes misdemeanor assault (2019).',
    createdAt: '2024-03-15',
    revisions: [
      { id: 'r1', timestamp: '2024-03-15 09:00' },
      { id: 'r2', timestamp: '2024-03-15 14:30' },
      { id: 'r3', timestamp: '2024-03-16 10:15' },
    ],
    messages: [
      { id: 'm1', role: 'user', content: 'Generate profile based on witness descriptions and camera footage' },
      { id: 'm2', role: 'system', content: 'Initial profile generated. Male subject, estimated 35-40 years old, medium build, approximately 5\'11". Dark clothing visible in security footage. Facial features partially obscured.' },
      { id: 'm3', role: 'user', content: 'Refine with Maria Chen\'s description — she mentioned a scar on left cheek' },
      { id: 'm4', role: 'system', content: 'Profile updated with distinguishing mark: linear scar approximately 2 inches on left cheek. This narrows identification significantly. Cross-referencing with known associates database.' },
    ],
  },
];
