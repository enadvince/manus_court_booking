/** Doubles games average about 15 minutes, four players to a court. */
const GAMES_PER_COURT_HOUR = 4;
const PLAYERS_PER_GAME = 4;

/** Rough games each player gets in a session (rounded down). */
export function gamesPerPlayer(
  players: number,
  hours: number,
  courts = 1
): number {
  if (players <= 0) return 0;
  const seats = GAMES_PER_COURT_HOUR * hours * courts * PLAYERS_PER_GAME;
  return Math.floor(seats / players);
}

/**
 * Suggested player cap: enough people that every game has a fresh four, but
 * few enough that everyone still gets about four games. Never below six, so
 * a short session still has a rotation.
 */
export function recommendedCap(hours: number, courts = 1): number {
  return Math.max(6, hours * courts * GAMES_PER_COURT_HOUR);
}

export const OPEN_PLAY_CAP_OPTIONS = [6, 8, 10, 12, 16, 20, 24] as const;
export const OPEN_PLAY_HOURS = [1, 2, 3, 4] as const;
