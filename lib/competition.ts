// Friendly chore competition: points, rescues and streaks.
import type { ChoreLog, MemberId } from './types';
import { addDays, monthKey, startOfWeek, todayISO } from './dates';

export type Period = 'week' | 'month' | 'all';

export interface MemberScore {
  points: number;
  done: number;
  rescues: number; // partner's chores they took over
  streak: number; // consecutive days with at least one chore
}

export function periodStart(period: Period, today = todayISO()): string {
  if (period === 'week') return startOfWeek(today);
  if (period === 'month') return `${monthKey(today)}-01`;
  return '0000-00-00';
}

function streakFor(logs: ChoreLog[], member: MemberId, today: string): number {
  const days = new Set(logs.filter((l) => l.doneBy === member).map((l) => l.day));
  let cursor = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(cursor)) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export function scoreboard(logs: ChoreLog[], period: Period, today = todayISO()): Record<MemberId, MemberScore> {
  const from = periodStart(period, today);
  const inPeriod = logs.filter((l) => l.day >= from);
  const make = (m: MemberId): MemberScore => {
    const mine = inPeriod.filter((l) => l.doneBy === m);
    return {
      points: mine.reduce((s, l) => s + l.points + l.bonus, 0),
      done: mine.length,
      rescues: mine.filter((l) => l.bonus > 0).length,
      streak: streakFor(logs, m, today),
    };
  };
  return { a: make('a'), b: make('b') };
}

export function leader(board: Record<MemberId, MemberScore>): MemberId | null {
  if (board.a.points === board.b.points) return null;
  return board.a.points > board.b.points ? 'a' : 'b';
}

/** Winner of last week, for the small "champion" badge. */
export function lastWeekChampion(logs: ChoreLog[], today = todayISO()): MemberId | null {
  const thisWeek = startOfWeek(today);
  const prevWeek = addDays(thisWeek, -7);
  const prev = logs.filter((l) => l.day >= prevWeek && l.day < thisWeek);
  const pts = (m: MemberId) => prev.filter((l) => l.doneBy === m).reduce((s, l) => s + l.points + l.bonus, 0);
  const a = pts('a');
  const b = pts('b');
  if (a === b) return null;
  return a > b ? 'a' : 'b';
}
