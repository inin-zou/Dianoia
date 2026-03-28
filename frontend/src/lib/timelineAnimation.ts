import type { Hypothesis, TimelineEvent, Vec3 } from '@/types';
import type { ActorData } from '@/components/blueprint/types';

/** Actor role colors matching the design guide */
const ROLE_COLORS: Record<string, string> = {
  suspect: '#EF4444',
  victim: '#64748B',
  witness: '#3B82F6',
  officer: '#22C55E',
};

/** Actions that indicate an actor is leaving / no longer visible */
const EXIT_ACTIONS = new Set(['exits_room', 'flees']);

/** Actions that indicate an actor is appearing */
const ENTER_ACTIONS = new Set(['enters_room']);

/**
 * Parse "HH:mm" timestamp to total minutes from 00:00.
 * Returns NaN for invalid input.
 */
export function parseTimestamp(ts: string): number {
  const parts = ts.split(':');
  if (parts.length !== 2) return NaN;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return NaN;
  return h * 60 + m;
}

/**
 * Format minutes (0-1439) back to "HH:mm".
 */
export function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, '0');
  const m = Math.floor(mins % 60)
    .toString()
    .padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Determine actor role from actor ID string.
 * "suspect_1" -> "suspect", "victim" -> "victim", etc.
 */
export function getActorRole(
  actorId: string
): 'suspect' | 'victim' | 'witness' | 'officer' {
  const lower = actorId.toLowerCase();
  if (lower.includes('victim')) return 'victim';
  if (lower.includes('witness')) return 'witness';
  if (lower.includes('officer')) return 'officer';
  return 'suspect';
}

/**
 * Get the display color for an actor based on their ID.
 */
export function getActorColor(actorId: string): string {
  const role = getActorRole(actorId);
  return ROLE_COLORS[role] || '#F59E0B';
}

/**
 * Linearly interpolate between two Vec3 positions.
 */
function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

interface ParsedEvent {
  minutes: number;
  event: TimelineEvent;
}

/**
 * Given a hypothesis with timeline events and a current time in minutes,
 * compute the interpolated positions for all actors.
 *
 * Rules:
 * - If currentTime is before an actor's first event, actor is not visible (omitted).
 * - If currentTime is after an actor's last event, actor stays at final position.
 * - If the last event is an exit/flee action, actor becomes invisible after it.
 * - Between events, linearly interpolate position.
 */
export function getActorPositionsAtTime(
  hypothesis: Hypothesis,
  timeMinutes: number
): ActorData[] {
  if (!hypothesis.timeline || hypothesis.timeline.length === 0) return [];

  // Group events by actor
  const actorEvents = new Map<string, ParsedEvent[]>();
  for (const event of hypothesis.timeline) {
    const mins = parseTimestamp(event.timestamp);
    if (isNaN(mins)) continue;

    if (!actorEvents.has(event.actor)) {
      actorEvents.set(event.actor, []);
    }
    actorEvents.get(event.actor)!.push({ minutes: mins, event });
  }

  const result: ActorData[] = [];

  for (const [actorId, events] of actorEvents) {
    // Sort by time
    events.sort((a, b) => a.minutes - b.minutes);

    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];

    // Before first event: not visible
    if (timeMinutes < firstEvent.minutes) continue;

    // After last event
    if (timeMinutes >= lastEvent.minutes) {
      // If the last action is exit/flee, actor is no longer visible
      if (EXIT_ACTIONS.has(lastEvent.event.action)) continue;

      // Otherwise, hold at final position
      const role = getActorRole(actorId);
      const color = getActorColor(actorId);

      // Collect all positions as waypoints for path drawing
      const waypoints = events.map((e) => e.event.position);

      result.push({
        id: actorId,
        label: actorId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        role,
        color,
        position: lastEvent.event.position,
        waypoints,
      });
      continue;
    }

    // Between events: find bracketing pair and interpolate
    let prevEvent = events[0];
    let nextEvent = events[0];

    for (let i = 0; i < events.length - 1; i++) {
      if (events[i].minutes <= timeMinutes && events[i + 1].minutes > timeMinutes) {
        prevEvent = events[i];
        nextEvent = events[i + 1];
        break;
      }
    }

    // Check if prev event was an exit — if so, actor left and hasn't re-entered
    if (EXIT_ACTIONS.has(prevEvent.event.action) && !ENTER_ACTIONS.has(nextEvent.event.action)) {
      continue;
    }

    const totalDuration = nextEvent.minutes - prevEvent.minutes;
    const t = totalDuration > 0 ? (timeMinutes - prevEvent.minutes) / totalDuration : 0;
    const interpolated = lerpVec3(prevEvent.event.position, nextEvent.event.position, t);

    const role = getActorRole(actorId);
    const color = getActorColor(actorId);

    // Waypoints: all events up to and including the next event, plus interpolated current
    const waypoints = events
      .filter((e) => e.minutes <= nextEvent.minutes)
      .map((e) => e.event.position);

    result.push({
      id: actorId,
      label: actorId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      role,
      color,
      position: interpolated,
      waypoints,
    });
  }

  return result;
}

/**
 * Compute the time range (in minutes) that a hypothesis's timeline spans.
 * Returns { start, end } in minutes from 00:00.
 */
export function getTimelineRange(hypothesis: Hypothesis): { start: number; end: number } {
  if (!hypothesis.timeline || hypothesis.timeline.length === 0) {
    return { start: 0, end: 1439 };
  }

  let minMins = Infinity;
  let maxMins = -Infinity;

  for (const event of hypothesis.timeline) {
    const mins = parseTimestamp(event.timestamp);
    if (isNaN(mins)) continue;
    minMins = Math.min(minMins, mins);
    maxMins = Math.max(maxMins, mins);
  }

  if (minMins === Infinity) return { start: 0, end: 1439 };

  return { start: minMins, end: maxMins };
}

/**
 * Get a display label for a TimelineAction.
 */
export function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    enters_room: 'Enters',
    exits_room: 'Exits',
    moves_to: 'Moves',
    interacts_with: 'Interacts',
    attacks: 'Attacks',
    picks_up: 'Picks up',
    drops: 'Drops',
    waits: 'Waits',
    flees: 'Flees',
  };
  return labels[action] || action;
}
